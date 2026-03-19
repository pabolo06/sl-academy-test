import os
import json
import requests
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
# APP_ID = "0a529083a3f84d0189"
APP_ID = None # Force NEW deployment to clear edge cache

def get_files():
    files_payload = []
    out_dir = os.path.join("frontend", "out")
    
    binary_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2', '.ttf']

    # 1. Static Files
    if os.path.exists(out_dir):
        for root, dirs, filenames in os.walk(out_dir):
            for filename in filenames:
                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, out_dir).replace('\\', '/')
                
                is_binary = any(filename.lower().endswith(ext) for ext in binary_extensions)
                
                if is_binary:
                    with open(full_path, 'rb') as f:
                        content = base64.b64encode(f.read()).decode("utf-8")
                        files_payload.append({"filename": rel_path, "content": content, "encoding": "base64"})
                else:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        files_payload.append({"filename": rel_path, "content": f.read()})

    # 2. Backend
    backend_path = 'backend/index.ts'
    if os.path.exists(backend_path):
        with open(backend_path, 'r', encoding='utf-8') as f:
            files_payload.append({"filename": "backend/index.ts", "content": f.read()})

    # 3. SCHEMA COMPLIANT package.json
    minimal_pkg = {
        "name": "sl-academy-platinum",
        "version": "1.0.0",
        "scripts": {
            "build": "echo static bundle already provided",
            "start": "echo ready"
        },
        "dependencies": {
            "@supabase/supabase-js": "^2.39.3",
            "@appdeploy/sdk": "latest"
        }
    }
    files_payload.append({"filename": "package.json", "content": json.dumps(minimal_pkg, indent=2)})

    return files_payload

def deploy():
    print(f"Updating Titanium {APP_ID} with schema compliance...")
    files = get_files()
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": APP_ID, 
                "app_type": "frontend+backend",
                "app_name": "SL Academy Platinum FINAL",
                "description": "Schema Compliant Static Optimized Hybrid Platform",
                "frontend_template": "html-static",
                "files": files,
                "intent": "Ensuring schema compliance with build/start scripts while serving static rebranded assets",
                "model": "claude-sonnet-3-5"
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json, text/event-stream"
    }

    try:
        response = requests.post(ENDPOINT, json=payload, headers=headers, timeout=120)
        print(f"Status: {response.status_code}")
        print("Titanium V2 update sent.")
    except Exception as e:
        print(f"Titanium V2 failed: {e}")

if __name__ == "__main__":
    deploy()
