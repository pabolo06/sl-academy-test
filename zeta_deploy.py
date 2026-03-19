import os
import json
import requests

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def deploy_zeta():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    files_payload = []
    
    # Adicionar arquivos patcheados
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith(('.html', '.js', '.css', '.json', '.svg', '.png', '.jpg', '.woff', '.woff2')):
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(filepath, out_dir).replace('\\', '/')
                
                try:
                    # Tentar ler como texto para aplicar patches extras se necessário
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    files_payload.append({"path": rel_path, "content": content})
                except:
                    pass

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None,
                "app_type": "frontend-only",
                "app_name": "SL Academy Omni Final",
                "description": "Academy with SPA Template to bypass routing validation",
                "frontend_template": "react-vite",
                "files": files_payload,
                "model": "gemini-2.5-pro",
                "intent": "fixing production routing and 403 errors"
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json, text/event-stream"
    }
    
    print("Starting Zeta Deployment...")
    response = requests.post(ENDPOINT, json=payload, headers=headers)
    
    with open('zeta_final_result.json', 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    print(f"Status: {response.status_code}")
    print("Result saved to zeta_final_result.json")

if __name__ == "__main__":
    deploy_zeta()
