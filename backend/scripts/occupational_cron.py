"""
SL Academy — Occupational Health Cron Job
Executa semanalmente (0 23 * * 5) via Railway Cron Service.
Varre todos os hospitais activos para burnout e micro-learning.
"""

import asyncio
import logging
import sys
import os

# Garante que o root do backend está no path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [CRON] %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("occupational_cron")


async def main() -> None:
    from core.database import get_db
    from services.burnout_analyzer import burnout_analyzer
    from services.micro_learning_service import micro_learning_service

    db = get_db()

    # 1. Obtém todos os hospitais activos (sem deleted_at)
    resp = db.table("hospitals").select("id, name").is_("deleted_at", "null").execute()
    hospitals = resp.data or []

    if not hospitals:
        logger.warning("Nenhum hospital activo encontrado. Abortando.")
        return

    logger.info(f"Iniciando scan ocupacional para {len(hospitals)} hospitais.")

    total_burnout_alerts = 0
    total_ml_tasks = 0

    for hospital in hospitals:
        h_id = hospital["id"]
        h_name = hospital.get("name", h_id)

        # ── Burnout Scan ──────────────────────────────────────────────
        try:
            results = await burnout_analyzer.analyze_hospital(h_id)
            alerts_created = sum(1 for r in results if r.get("alert_created"))
            total_burnout_alerts += alerts_created
            logger.info(
                f"[{h_name}] Burnout scan: {len(results)} médicos analisados, "
                f"{alerts_created} alertas criados."
            )
        except Exception as exc:
            logger.error(f"[{h_name}] Burnout scan falhou: {exc}", exc_info=True)

        # ── Micro-Learning Scan ───────────────────────────────────────
        try:
            ml_result = await micro_learning_service.generate_tasks(h_id)
            tasks_created = ml_result.get("tasks_created", 0)
            total_ml_tasks += tasks_created
            logger.info(
                f"[{h_name}] Micro-learning scan: {tasks_created} tarefas geradas."
            )
        except Exception as exc:
            logger.error(f"[{h_name}] Micro-learning scan falhou: {exc}", exc_info=True)

    logger.info(
        f"Cron concluído. "
        f"Total alertas burnout: {total_burnout_alerts} | "
        f"Total tarefas ML: {total_ml_tasks}."
    )


if __name__ == "__main__":
    asyncio.run(main())
