"""
SL Academy Platform - Scrapling Watcher (Phase 4)
Background service that monitors external clinical guideline sources for updates.

Sources monitored:
  - PubMed (https://pubmed.ncbi.nlm.nih.gov) — international research
  - Ministério da Saúde BR (https://www.saude.gov.br) — national guidelines

Pattern:
  1. Manager triggers a check for a specific track + search term
  2. Scrapling fetches results in stealth mode (no bot detection)
  3. New items are stored as clinical_alerts in the database
  4. Managers review and dismiss alerts via the API

Graceful degradation: if Scrapling is not installed or the request fails,
returns an empty alert list with a warning — never raises to the caller.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any
from uuid import uuid4

from core.database import Database

logger = logging.getLogger(__name__)


# ── Source definitions ─────────────────────────────────────────────────────────

_SOURCES: dict[str, dict] = {
    "pubmed": {
        "label":    "PubMed",
        "base_url": "https://pubmed.ncbi.nlm.nih.gov",
        "search_url": "https://pubmed.ncbi.nlm.nih.gov/?term={query}&sort=date&format=abstract",
        "severity": "info",
    },
    "ministerio_saude": {
        "label":    "Ministério da Saúde",
        "base_url": "https://www.saude.gov.br",
        "search_url": "https://bvsms.saude.gov.br/bvs/publicacoes/busca.php?query={query}",
        "severity": "warning",
    },
}


# ── Result parser ──────────────────────────────────────────────────────────────

def _parse_pubmed_results(page_content: str, base_url: str) -> list[dict]:
    """Extract article titles and links from a PubMed search results page."""
    results = []
    try:
        from scrapling import Adaptor
        page = Adaptor(page_content, auto_match=False)

        for article in page.css(".docsum-content")[:10]:
            title_el = article.css_first(".docsum-title")
            link_el  = article.css_first("a")
            if not title_el:
                continue
            title = title_el.text.strip()
            href  = link_el.attrib.get("href", "") if link_el else ""
            url   = f"{base_url}{href}" if href.startswith("/") else href
            results.append({"title": title, "url": url})
    except Exception as exc:
        logger.warning(f"PubMed parse error: {exc}")
    return results


def _parse_ministerio_results(page_content: str, base_url: str) -> list[dict]:
    """Extract publication titles and links from a Ministério da Saúde search page."""
    results = []
    try:
        from scrapling import Adaptor
        page = Adaptor(page_content, auto_match=False)

        for item in page.css(".resultado-busca li, .result-item, article")[:10]:
            title_el = item.css_first("h2, h3, .title, a")
            link_el  = item.css_first("a")
            if not title_el:
                continue
            title = title_el.text.strip()
            href  = link_el.attrib.get("href", "") if link_el else ""
            url   = href if href.startswith("http") else f"{base_url}{href}"
            results.append({"title": title, "url": url})
    except Exception as exc:
        logger.warning(f"Ministério da Saúde parse error: {exc}")
    return results


_PARSERS = {
    "pubmed":           _parse_pubmed_results,
    "ministerio_saude": _parse_ministerio_results,
}


# ── Watcher core ───────────────────────────────────────────────────────────────

class ScraplingWatcher:
    """
    Monitors external clinical guideline sources for updates related to a
    given track/search term and stores new alerts in the database.
    """

    async def check_track_updates(
        self,
        track_id: str,
        search_term: str,
        hospital_id: str,
        sources: list[str] | None = None,
    ) -> dict:
        """
        Scrape configured sources for `search_term` and insert any results as
        clinical_alerts for the given hospital/track.

        Args:
            track_id:    UUID of the track being monitored.
            search_term: Medical term/keyword to search (e.g. 'sepse', 'antibiotico').
            hospital_id: Hospital for data isolation.
            sources:     Optional list of source slugs to check. Defaults to all.

        Returns:
            {
                "alerts_created": int,
                "alerts": [{"source": str, "title": str, "url": str}],
                "errors": [str],
            }
        """
        active_sources = sources or list(_SOURCES.keys())
        alerts_created = 0
        alerts: list[dict] = []
        errors: list[str] = []

        for source_key in active_sources:
            source = _SOURCES.get(source_key)
            if not source:
                errors.append(f"Unknown source: {source_key}")
                continue

            try:
                items = await self._fetch_source(source_key, source, search_term)
            except Exception as exc:
                msg = f"{source['label']}: {exc}"
                logger.warning(f"ScraplingWatcher fetch error — {msg}")
                errors.append(msg)
                continue

            for item in items:
                inserted = self._save_alert(
                    hospital_id=hospital_id,
                    track_id=track_id,
                    source=source_key,
                    title=item["title"],
                    url=item.get("url"),
                    summary=item.get("summary"),
                    severity=source["severity"],
                )
                if inserted:
                    alerts_created += 1
                    alerts.append({
                        "source": source["label"],
                        "title":  item["title"],
                        "url":    item.get("url"),
                    })

        logger.info(
            f"ScraplingWatcher: '{search_term}' → "
            f"{alerts_created} alerts created for hospital {hospital_id}"
        )
        return {
            "alerts_created": alerts_created,
            "alerts": alerts,
            "errors": errors,
        }

    async def _fetch_source(
        self, source_key: str, source: dict, search_term: str
    ) -> list[dict]:
        """Fetch and parse results from a single source using Scrapling stealth mode."""
        try:
            from scrapling.fetchers import StealthyFetcher
        except ImportError:
            logger.error(
                "Scrapling not installed. Run: pip install scrapling && "
                "playwright install chromium"
            )
            return []

        url = source["search_url"].format(query=search_term.replace(" ", "+"))
        logger.info(f"ScraplingWatcher: fetching {url}")

        # StealthyFetcher uses a real browser with stealth patches
        page = await StealthyFetcher.async_fetch(
            url,
            headless=True,
            network_idle=True,
            timeout=30000,
        )

        if not page or not page.content:
            return []

        parser = _PARSERS.get(source_key)
        if parser:
            return parser(page.content, source["base_url"])

        # Generic fallback: grab any <h2>/<h3> + link pairs
        return self._generic_parse(page.content, source["base_url"])

    def _generic_parse(self, html: str, base_url: str) -> list[dict]:
        """Fallback parser for unknown source layouts."""
        results = []
        try:
            from scrapling import Adaptor
            page = Adaptor(html, auto_match=False)
            for el in page.css("h2 a, h3 a, .result a, .item a")[:10]:
                title = el.text.strip()
                href  = el.attrib.get("href", "")
                if not title:
                    continue
                url = href if href.startswith("http") else f"{base_url}{href}"
                results.append({"title": title, "url": url})
        except Exception as exc:
            logger.warning(f"Generic parse error: {exc}")
        return results

    def _save_alert(
        self,
        hospital_id: str,
        track_id: str,
        source: str,
        title: str,
        url: str | None,
        summary: str | None,
        severity: str,
    ) -> bool:
        """
        Insert alert if no identical (hospital_id + source + title) record exists.
        Returns True if inserted, False if duplicate.
        """
        try:
            db = Database.get_client()

            # Dedup check: same hospital + source + title
            existing = (
                db.table("clinical_alerts")
                .select("id")
                .eq("hospital_id", hospital_id)
                .eq("source", source)
                .eq("title", title)
                .execute()
            )
            if existing.data:
                return False

            db.table("clinical_alerts").insert({
                "hospital_id": hospital_id,
                "track_id":    track_id or None,
                "source":      source,
                "title":       title,
                "url":         url,
                "summary":     summary,
                "severity":    severity,
                "is_read":     False,
            }).execute()
            return True

        except Exception as exc:
            logger.error(f"ScraplingWatcher DB save error: {exc}")
            return False


# ── Module-level singleton ─────────────────────────────────────────────────────
scrapling_watcher = ScraplingWatcher()
