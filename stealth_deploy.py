import os
import json
import urllib.request
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
APP_ID = "807377d0d681483fb3"

def get_files():
    files_payload = []
    out_dir = os.path.join("frontend", "out")
    if not os.path.exists(out_dir): return []

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

    backend_path = 'backend/index.ts'
    if os.path.exists(backend_path):
        with open(backend_path, 'r', encoding='utf-8') as f:
            files_payload.append({"filename": "backend/index.ts", "content": f.read()})

    return files_payload

def deploy():
    print("Gathering files for stealth deploy...")
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
                "app_name": "SL Academy Premium",
                "frontend_template": "html-static",
                "files": files,
                "model": "claude-sonnet-3-5"
            }
        }
    }

    # Adicionando User-Agent e ajustes de cabeçalho para evitar 406
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
    }

    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            print("Response Code:", response.getcode())
            print(response.read().decode("utf-8"))
    except Exception as e:
        if hasattr(e, 'read'):
            print("Server Response:", e.read().decode("utf-8"))
        print(f"Stealth Deploy Error: {e}")

if __name__ == "__main__":
    deploy()
