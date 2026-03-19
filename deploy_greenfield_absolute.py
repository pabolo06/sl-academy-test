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

    # 1. Patched Static Files
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

    # 3. CRITICAL: package.json (required for backend dependencies)
    pkg_path = os.path.join('frontend', 'package.json')
    if os.path.exists(pkg_path):
        with open(pkg_path, 'r', encoding='utf-8') as f:
            files_payload.append({"filename": "package.json", "content": f.read()})

    return files_payload

def deploy():
    print("Gathering absolute final files (with package.json)...")
    files = get_files()
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None, # Forced fresh start
                "app_type": "frontend+backend",
                "app_name": "SL Academy Platinum",
                "description": "Production Ready Academy Platform with static_assets bypass",
                "frontend_template": "html-static",
                "files": files,
                "intent": "Final reliable deploy with all dependencies and static rebranding",
                "model": "claude-sonnet-3-5"
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json, text/event-stream"
    }

    print("Sending Greenfield Absolute Final Deploy (Platinum)...")
    try:
        response = requests.post(ENDPOINT, json=payload, headers=headers, timeout=120)
        print(f"Status: {response.status_code}")
        
        try:
            res_json = response.json()
            if "result" in res_json:
                content = json.loads(res_json["result"]["content"][0]["text"])
                if "deployment" in content:
                    new_id = content['deployment'].get('app_id')
                    print(f"SUCCESS! NEW ID: {new_id}")
                    # Save the ID for verification
                    with open("final_app_id.txt", "w") as f:
                        f.write(new_id)
            else:
                print("Raw Response:", response.text)
        except:
            print("Response text:", response.text)
            
    except Exception as e:
        print(f"Platinum deploy failed: {e}")

if __name__ == "__main__":
    deploy()
