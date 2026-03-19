import os
import json
import requests
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
APP_ID = "807377d0d681483fb3"

def get_files():
    files_payload = []
    out_dir = os.path.join("frontend", "out")
    
    binary_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2', '.ttf']

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

    # Backend
    backend_path = 'backend/index.ts'
    if os.path.exists(backend_path):
        with open(backend_path, 'r', encoding='utf-8') as f:
            files_payload.append({"filename": "backend/index.ts", "content": f.read()})

    return files_payload

def deploy():
    print("Packing patched static files...")
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
                "app_name": "SL Academy Premium Prod Final",
                "frontend_template": "html-static", # Servir bruto agora que está patcheado
                "files": files,
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
        print(f"Sending final patched deploy to {APP_ID}...")
        response = requests.post(ENDPOINT, json=payload, headers=headers)
        print(f"Status: {response.status_code}")
        print(response.text)
    except Exception as e:
        print(f"Final deploy failed: {e}")

if __name__ == "__main__":
    deploy()
