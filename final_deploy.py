import os
import json
import urllib.request
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def get_files():
    files_payload = []
    
    # 1. Backend
    backend_file = os.path.join("backend", "index.ts")
    if os.path.exists(backend_file):
        with open(backend_file, "r", encoding="utf-8") as f:
            files_payload.append({"filename": "backend/index.ts", "content": f.read()})

    # 2. Frontend Source
    frontend_dir = "frontend"
    include_dirs = ["app", "components", "lib", "styles", "public"]
    
    for item in include_dirs:
        dir_path = os.path.join(frontend_dir, item)
        if not os.path.exists(dir_path): continue
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                if file.endswith('.lock') or file == 'package-lock.json': continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, frontend_dir)
                target_path = rel_path.replace("\\", "/")
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        files_payload.append({"filename": target_path, "content": f.read()})
                except:
                    with open(full_path, "rb") as f:
                        content = base64.b64encode(f.read()).decode("utf-8")
                        files_payload.append({"filename": target_path, "content": content, "encoding": "base64"})

    # 3. Configs
    with open(os.path.join(frontend_dir, "package.json"), "r", encoding="utf-8") as f:
        files_payload.append({"filename": "package.json", "content": f.read()})
    
    supabase_url = "https://joewhfllvdaygffsosor.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU5NzcsImV4cCI6MjA1MjQ1MTk3N30.Ql-Yx-Ks-Uh-Yx-Ks-Uh-Yx-Ks-Uh-Yx-Ks-Uh-Yx-Ks-Uh"
    
    # IMPORTANTE: Vou mudar o NEXT_PUBLIC_API_URL para vazio ou o orquestrador lida
    next_config = f"""
module.exports = {{
  output: 'export',
  trailingSlash: true,
  images: {{ unoptimized: true }},
  env: {{
    NEXT_PUBLIC_SUPABASE_URL: '{supabase_url}',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '{supabase_key}',
  }},
  eslint: {{ ignoreDuringBuilds: true }},
  typescript: {{ ignoreBuildErrors: true }}
}}
"""
    files_payload.append({"filename": "next.config.js", "content": next_config})
    
    tailwind_config = """
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
"""
    files_payload.append({"filename": "tailwind.config.js", "content": tailwind_config})

    return files_payload

def deploy():
    print("Preparing greenfield deploy...")
    files = get_files()
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None,
                "app_type": "frontend+backend",
                "app_name": "SL Academy Premium Prod",
                "frontend_template": "nextjs-static",
                "files": files,
                "model": "claude-sonnet-3-5",
                "intent": "Initial clean deploy of Next.js app with CommonJS config to avoid build errors"
            }
        }
    }

    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"), headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}", "Accept": "application/json"
    }, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            print("Response received.")
            with open("deploy_final_res.json", "w", encoding="utf-8") as f:
                f.write(res_data)
            
            result = json.loads(res_data)
            if "result" in result:
                content = json.loads(result["result"]["content"][0]["text"])
                if "deployment" in content:
                    print(f"NEW APP ID: {content['deployment'].get('app_id')}")
                    print(f"URL: {content['deployment'].get('url')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deploy()
