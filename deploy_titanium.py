import os
import json
import requests
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def get_files():
    files_payload = []
    out_dir = os.path.join("frontend", "out")
    
    binary_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2', '.ttf']

    # 1. Static Files from out/ (Renamed to Avoid 403)
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

    # 3. MINIMAL package.json (BACKEND ONLY) - This avoids the Next.js builder requirement
    minimal_pkg = {
        "name": "sl-academy-backend",
        "version": "1.0.0",
        "dependencies": {
            "@supabase/supabase-js": "^2.39.3",
            "@appdeploy/sdk": "latest"
        }
    }
    files_payload.append({"filename": "package.json", "content": json.dumps(minimal_pkg, indent=2)})

    return files_payload

def deploy():
    print("Gathering Titanium Static-Hybrid files...")
    files = get_files()
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None, # Force new resource
                "app_type": "frontend+backend",
                "app_name": "SL Academy Titanium",
                "description": "Static Optimized Hybrid Platform",
                "frontend_template": "html-static",
                "files": files,
                "intent": "Titanium deploy: bypassing Next.js builder by using minimal package.json and serving static-optimized build",
                "model": "claude-sonnet-3-5"
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json, text/event-stream"
    }

    print("Sending Titanium Deploy...")
    try:
        response = requests.post(ENDPOINT, json=payload, headers=headers, timeout=120)
        print(f"Status: {response.status_code}")
        
        try:
            res_json = response.json()
            if "result" in res_json:
                content = json.loads(res_json["result"]["content"][0]["text"])
                if "deployment" in content:
                    new_id = content['deployment'].get('app_id')
                    new_url = content['deployment'].get('url')
                    print(f"TITANIUM SUCCESS! ID: {new_id}")
                    print(f"URL: {new_url}")
                    with open("titanium_res.txt", "w") as f:
                        f.write(f"ID:{new_id}\nURL:{new_url}")
            else:
                print("Raw Response:", response.text)
        except Exception as e:
            print("Response error:", e)
            print("Raw text:", response.text)
            
    except Exception as e:
        print(f"Titanium deploy failed: {e}")

if __name__ == "__main__":
    deploy()
