import os
import requests
import json
import time

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
HEADERS = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}

def vector_deploy():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    all_files = []
    
    # 1. Mapear arquivos essenciais primeiro (HTMLs)
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, out_dir).replace('\\', '/')
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                all_files.append({"filename": rel_path, "content": content})

    # 2. Usar ID existente (o que o usuario esta vendo)
    app_id = "0a529083a3f84d0189"
    print(f"Update targeting ACTIVE APP_ID: {app_id}")

    # 3. Upload Serial Atômico (1 por 1 para evitar 413)
    for f_data in all_files:
        print(f"Uploading {f_data['filename']}...")
        update_payload = {
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {
                "name": "deploy_app",
                "arguments": {
                    "app_id": app_id,
                    "app_type": "frontend-only",
                    "files": [f_data],
                    "model": "gemini-2.5-pro",
                    "intent": f"patching {f_data['filename']}"
                }
            }
        }
        resp = requests.post(ENDPOINT, json=update_payload, headers=HEADERS)
        if resp.status_code != 200:
            print(f"Failed {f_data['filename']}: {resp.text}")
        time.sleep(1)

    print(f"Phoenix Patch Complete. URL: https://{app_id}.v2.appdeploy.ai/")

if __name__ == "__main__":
    vector_deploy()
