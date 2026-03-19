import os
import re
import requests
import json

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def flat_deploy():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Capturar CSS de Dark Mode (necessário para ambos)
    css_content = ""
    # Procurar o CSS compilado do Tailwind
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.css'):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    css_content += f.read() + "\n"

    def get_auto_contained_html(rel_path):
        filepath = os.path.join(out_dir, rel_path)
        if not os.path.exists(filepath): return None
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Injetar CSS
        if css_content:
            content = content.replace("</head>", f"<style>{css_content}</style></head>")
        
        # Injetar script de compatibilidade
        compat_script = """<script>
        // Compatibility patch for Flat routing
        window.next = { router: { push: (url) => window.location.assign(url + (url.includes('.html') ? '' : '.html')) }};
        </script>"""
        content = content.replace("<head>", "<head>" + compat_script, 1)

        # Ajustar links para serem FLAT (root level)
        # /login -> login.html
        content = content.replace('href="/login"', 'href="login.html"')
        content = content.replace('href="/login/"', 'href="login.html"')
        
        # Remover lixo que dá 403
        content = re.sub(r'<link rel="(?:stylesheet|manifest|icon|preload)"[^>]*>', '', content)
        content = re.sub(r'<script src="[^"]*"[^>]*></script>', '', content)
        
        return content

    # Arquivos finais
    index_html = get_auto_contained_html('index.html')
    login_html = get_auto_contained_html('login/index.html')

    if not index_html:
        print("Error: index.html not found.")
        return

    payload_files = [
        {"filename": "index.html", "content": index_html}
    ]
    if login_html:
        payload_files.append({"filename": "login.html", "content": login_html})

    print(f"Submitting {len(payload_files)} flat files...")

    payload = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None,
                "app_type": "frontend-only",
                "app_name": "SL Academy FLAT FINAL",
                "description": "Academy with Flat Architecture for Absolute Stability",
                "frontend_template": "html-static",
                "files": payload_files,
                "model": "gemini-2.5-pro",
                "intent": "final flat deployment"
            }
        }
    }
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}
    response = requests.post(ENDPOINT, json=payload, headers=headers)
    print(response.text)

if __name__ == "__main__":
    flat_deploy()
