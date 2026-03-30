#!/bin/bash

OSLO_PATH="C:\Users\pablo\OneDrive\Documentos\Oslo"
BACKEND_PATH="$OSLO_PATH/backend"
FRONTEND_PATH="$OSLO_PATH/frontend"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🔍 OSLO PROJECT VALIDATION - FULL CHECK                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# ──────────────────────────────────────────────────────────────────
# 1. BACKEND VALIDATION
# ──────────────────────────────────────────────────────────────────
echo "📦 BACKEND VALIDATION"
echo "─────────────────────────────────────────────────────────────────"

# Check Python syntax
echo "  ✓ Checking Python syntax..."
cd "$BACKEND_PATH" 2>/dev/null
SYNTAX_ERRORS=$(python -m py_compile $(find . -name "*.py" -not -path "./.venv/*" -not -path "./tests/*") 2>&1 | grep -c "SyntaxError" || echo "0")
if [ "$SYNTAX_ERRORS" -gt 0 ]; then
  echo "    ✗ Python syntax errors: $SYNTAX_ERRORS"
  ERRORS=$((ERRORS + SYNTAX_ERRORS))
else
  echo "    ✓ No syntax errors"
fi

# Check imports
echo "  ✓ Checking imports..."
IMPORT_ERRORS=$(python -c "from core.config import settings; from api.routes import auth, tracks" 2>&1 | wc -l)
if [ "$IMPORT_ERRORS" -gt 1 ]; then
  echo "    ⚠ Import warnings detected"
  WARNINGS=$((WARNINGS + 1))
else
  echo "    ✓ Imports OK"
fi

# Pytest collection
echo "  ✓ Collecting tests..."
PYTEST_RESULT=$(timeout 10 pytest --co -q 2>&1 | tail -1)
echo "    $PYTEST_RESULT"

echo ""

# ──────────────────────────────────────────────────────────────────
# 2. FRONTEND VALIDATION
# ──────────────────────────────────────────────────────────────────
echo "🎨 FRONTEND VALIDATION"
echo "─────────────────────────────────────────────────────────────────"

cd "$FRONTEND_PATH" 2>/dev/null

# Check TypeScript
if [ -f "tsconfig.json" ]; then
  echo "  ✓ TypeScript config found"
else
  echo "  ✗ TypeScript config missing"
  ERRORS=$((ERRORS + 1))
fi

# Check dependencies
if [ -f "package.json" ]; then
  echo "  ✓ package.json OK"
  
  # Check for missing modules
  if [ ! -d "node_modules" ]; then
    echo "    ⚠ node_modules missing (run: npm install)"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "    ✓ node_modules present"
  fi
else
  echo "  ✗ package.json missing"
  ERRORS=$((ERRORS + 1))
fi

# Check Playwright config
if [ -f "playwright.config.ts" ]; then
  echo "  ✓ Playwright config OK"
else
  echo "  ⚠ Playwright config missing"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ──────────────────────────────────────────────────────────────────
# 3. GIT VALIDATION
# ──────────────────────────────────────────────────────────────────
echo "📚 GIT STATUS"
echo "─────────────────────────────────────────────────────────────────"

cd "$OSLO_PATH"
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l)
echo "  Uncommitted changes: $UNCOMMITTED files"

UNPUSHED=$(git log @{u}.. 2>/dev/null | wc -l)
if [ "$UNPUSHED" -gt 0 ]; then
  echo "  ⚠ Unpushed commits: $UNPUSHED"
else
  echo "  ✓ All commits pushed"
fi

echo ""

# ──────────────────────────────────────────────────────────────────
# 4. CONFIGURATION VALIDATION
# ──────────────────────────────────────────────────────────────────
echo "⚙️  CONFIGURATION"
echo "─────────────────────────────────────────────────────────────────"

# Check .env files
if [ -f "$BACKEND_PATH/.env.local" ] || [ -f "$BACKEND_PATH/.env" ]; then
  echo "  ✓ Backend .env configured"
else
  echo "  ⚠ Backend .env missing (may use env vars)"
  WARNINGS=$((WARNINGS + 1))
fi

if [ -f "$FRONTEND_PATH/.env.local" ] || [ -f "$FRONTEND_PATH/.env" ]; then
  echo "  ✓ Frontend .env configured"
else
  echo "  ⚠ Frontend .env missing (may use env vars)"
fi

# Check Railway/Vercel configs
if [ -f "$OSLO_PATH/railway.json" ]; then
  echo "  ✓ railway.json OK"
else
  echo "  ⚠ railway.json missing"
fi

if [ -f "$OSLO_PATH/vercel.json" ]; then
  echo "  ✓ vercel.json OK"
else
  echo "  ⚠ vercel.json missing"
fi

echo ""

# ──────────────────────────────────────────────────────────────────
# 5. FINAL REPORT
# ──────────────────────────────────────────────────────────────────
echo "╔════════════════════════════════════════════════════════════════╗"
if [ "$ERRORS" -eq 0 ]; then
  echo "║  ✅ PROJECT VALIDATION PASSED - NO CRITICAL ERRORS            ║"
else
  echo "║  ❌ PROJECT VALIDATION FAILED - $ERRORS CRITICAL ERROR(S)     ║"
fi
echo "║                                                                ║"
echo "║  Errors: $ERRORS | Warnings: $WARNINGS                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"

exit $ERRORS
