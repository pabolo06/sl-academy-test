import os
import json
import urllib.request
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def get_files():
    files_payload = []
    out_dir = os.path.join("frontend", "out")
    
    if not os.path.exists(out_dir):
        print("Error: frontend/out not found.")
        return []

    for root, dirs, files in os.walk(out_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, out_dir)
            target_path = rel_path.replace("\\", "/")
            
            try:
                # Tentar ler como UTF-8
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    files_payload.append({
                        "filename": target_path,
                        "content": content
                    })
            except:
                # Se falhar, é binário
                with open(full_path, "rb") as f:
                    content = base64.b64encode(f.read()).decode("utf-8")
                    files_payload.append({
                        "filename": target_path,
                        "content": content,
                        "encoding": "base64"
                    })
    return files_payload

def deploy():
    files = get_files()
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None,
                "app_type": "frontend-only",
                "app_name": "SL Academy Test Static",
                "description": "Static test of SL Academy",
                "frontend_template": "html-static",
                "files": files,
                "model": "claude-sonnet-3-5",
                "intent": "static test"
            }
        }
    }

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "application/json, text/event-stream"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(json.dumps(result, indent=2))
    except Exception as e:
        if hasattr(e, 'read'):
            print(e.read().decode("utf-8"))
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    deploy()
