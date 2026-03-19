import os
import json
import urllib.request
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
APP_ID = "807377d0d681483fb3" # O que deu certo antes como estático

def get_files():
    files_payload = []
    
    # Adicionar apenas o essencial do frontend estático
    # (Estou voltando para estático porque o remoto está dando muita dor de cabeça e o usuário quer a URL funcional)
    out_dir = os.path.join("frontend", "out")
    if not os.path.exists(out_dir):
        print("Static output not found. Please run npm run build in frontend.")
        return []

    for root, dirs, files in os.walk(out_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, out_dir)
            target_path = rel_path.replace("\\", "/")
            
            # AppDeploy serve da raiz
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    files_payload.append({"filename": target_path, "content": f.read()})
            except:
                with open(full_path, "rb") as f:
                    content = base64.b64encode(f.read()).decode("utf-8")
                    files_payload.append({"filename": target_path, "content": content, "encoding": "base64"})

    # Adicionar backend
    backend_file = os.path.join("backend", "index.ts")
    if os.path.exists(backend_file):
        with open(backend_file, "r", encoding="utf-8") as f:
            files_payload.append({"filename": "backend/index.ts", "content": f.read()})

    return files_payload

def deploy():
    print("Gathering static files + backend...")
    files = get_files()
    if not files: return

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
                "frontend_template": "html-static", # Usar html-static para evitar builder remoto
                "files": files,
                "model": "claude-sonnet-3-5",
                "intent": "Deploy static exports to stable ID"
            }
        }
    }

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            res = response.read().decode("utf-8")
            print("Deployment response received.")
            with open("static_final_res.json", "w", encoding="utf-8") as f:
                f.write(res)
    except Exception as e:
        print(f"Deploy Error: {e}")

if __name__ == "__main__":
    deploy()
