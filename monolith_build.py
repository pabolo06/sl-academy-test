import os
import re

def monolith_build():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Capturar o CSS Premium
    css_content = ""
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.css'):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    css_content += f.read() + "\n"
    
    # 2. Função para criar um arquivo blindado
    def build_shielded_html(source_rel, target_name, is_root=True):
        source_path = os.path.join(out_dir, source_rel)
        if not os.path.exists(source_path): return False
        
        with open(source_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Injetar CSS
        if css_content:
            content = content.replace("</head>", f"<style>{css_content}</style></head>")
        
        # Patch de Roteamento Mono
        # Se for o index, mudar link de login para login.html
        if is_root:
            content = content.replace('href="/login"', 'href="login.html"')
            content = content.replace('href="/login/"', 'href="login.html"')
        
        # Remover lixo externo que causa 403 no console
        content = re.sub(r'<link rel="(?:stylesheet|manifest|icon|preload)"[^>]*>', '', content)
        content = re.sub(r'<script src="[^"]*"[^>]*></script>', '', content)
        
        # Injetar Fallback Script (caso existam botões JS que falhem)
        fallback_js = """<script>
        document.addEventListener('click', function(e) {
            let el = e.target.closest('a');
            if (el && el.getAttribute('href') && el.getAttribute('href').includes('login')) {
                e.preventDefault();
                window.location.assign('login.html');
            }
        });
        </script>"""
        content = content.replace("</body>", f"{fallback_js}</body>")

        with open(os.path.join(out_dir, target_name), 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    # Gerar os dois arquivos pivot
    build_shielded_html('index.html', 'index.html', is_root=True)
    build_shielded_html('login/index.html', 'login.html', is_root=False)
    
    print("Monolith build complete. Root-level files ready.")

if __name__ == "__main__":
    monolith_build()
