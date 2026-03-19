import os
import re

def nuclear_inline():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Capturar CSS
    css_content = ""
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.css'):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    css_content += f.read() + "\n"
    
    # 2. Capturar JS Crítico (bundles principais)
    js_content = ""
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            # Pegar arquivos maiores de JS que geralmente contém o framework/app
            if file.endswith('.js') and os.path.getsize(os.path.join(root, file)) > 10000:
                with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                    js_content += "// Source: " + file + "\n" + f.read() + "\n"

    # 3. Processar HTMLs
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Injetar CSS
                    if css_content:
                        content = content.replace("</head>", f"<style>{css_content}</style></head>")
                    
                    # Injetar JS no final do body
                    if js_content:
                        content = content.replace("</body>", f"<script>{js_content}</script></body>")
                    
                    # Remover referências externas
                    content = re.sub(r'<link rel="stylesheet"[^>]*>', '', content)
                    content = re.sub(r'<script src="[^"]*"[^>]*></script>', '', content)
                    content = re.sub(r'<link rel="preload"[^>]*>', '', content)
                    content = re.sub(r'<link rel="manifest"[^>]*>', '', content)
                    content = re.sub(r'<link rel="icon"[^>]*>', '', content)

                    # Patch de Roteamento Físico
                    content = content.replace('href="/login"', 'href="login/index.html"')
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Nuclearly Inlined {file}")
                except Exception as e:
                    print(f"Error: {e}")

if __name__ == "__main__":
    nuclear_inline()
