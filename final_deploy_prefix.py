import os
import json
import requests
import base64

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
APP_ID = "807377d0d681483fb3"

def get_files():
    files_payload = []
    
    # 1. Backend
    backend_file = os.path.join("backend", "index.ts")
    if os.path.exists(backend_file):
        with open(backend_file, "r", encoding="utf-8") as f:
            files_payload.append({"filename": "backend/index.ts", "content": f.read()})

    # 2. Frontend
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

    with open(os.path.join(frontend_dir, "package.json"), "r", encoding="utf-8") as f:
        files_payload.append({"filename": "package.json", "content": f.read()})
    
    supabase_url = "https://joewhfllvdaygffsosor.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NzU5NzcsImV4cCI6MjA1MjQ1MTk3N30.Ql-Yx-Ks-Uh-Yx-Ks-Uh-Yx-Ks-Uh-Yx-Ks-Uh-Yx-Ks-Uh"
    
    # ADICIONANDO assetPrefix para contornar o 403 do _next
    next_config = f"""
module.exports = {{
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: {{ unoptimized: true }},
  assetPrefix: './',
  env: {{
    NEXT_PUBLIC_SUPABASE_URL: '{supabase_url}',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '{supabase_key}',
    NEXT_PUBLIC_API_URL: 'https://{APP_ID}.v2.appdeploy.ai'
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
    print("Packing files with assetPrefix bypass...")
    files = get_files()
    
    delete_paths = ["pages/index.tsx", "pages/_app.tsx", "next.config.ts", "next.config.mjs"]

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": APP_ID,
                "app_type": "frontend+backend",
                "app_name": "SL Academy Premium Fix",
                "frontend_template": "nextjs-static",
                "files": files,
                "deletePaths": delete_paths,
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
        response = requests.post(ENDPOINT, json=payload, headers=headers)
        print(f"Status: {response.status_code}")
        print("Deploy initiated. Testing URL again in 30s.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deploy()
