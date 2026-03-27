#!/usr/bin/env python3
"""Test if the application can start without errors"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    print("Testing application startup...")

    print("1. Importing FastAPI...")
    from fastapi import FastAPI
    print("   [OK] FastAPI imported")

    print("2. Importing config...")
    from core.config import settings
    print(f"   [OK] Config loaded (environment: {settings.environment})")

    print("3. Importing main app...")
    from main import app
    print("   [OK] Main app imported successfully")

    print("4. Checking routes...")
    routes = [route.path for route in app.routes]
    print(f"   [OK] {len(routes)} routes registered")
    print(f"   Available routes: {routes[:5]}...")

    print("\n[SUCCESS] Application startup test PASSED!")
    sys.exit(0)

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
