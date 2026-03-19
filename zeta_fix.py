import os
import re

def zeta_patch():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Injetar redirecionamento no index.html raiz
    root_index = os.path.join(out_dir, 'index.html')
    if os.path.exists(root_index):
        with open(root_index, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Script de redirecionamento
        redir_script = """<script>
        if (window.location.pathname.endsWith('/login') || window.location.pathname.endsWith('/login/')) {
            window.location.replace(window.location.origin + '/login/index.html' + window.location.search);
        }
        </script>"""
        
        if redir_script not in content:
            new_content = content.replace('<head>', '<head>' + redir_script, 1)
            # Remover manifest e icons que dão 403
            new_content = re.sub(r'<link rel="manifest"[^>]*>', '', new_content)
            new_content = re.sub(r'<link rel="icon"[^>]*>', '', new_content)
            
            with open(root_index, 'w', encoding='utf-8') as f:
                f.write(new_content)
        print("Patched root index.html with auto-redirect and 403-purge.")

    # 2. Patch em todos os HTMLs para remover manifest/icons
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = re.sub(r'<link rel="manifest"[^>]*>', '', content)
                    new_content = re.sub(r'<link rel="icon"[^>]*>', '', new_content)
                    
                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except:
                    pass

    print("Zeta patch complete.")

if __name__ == "__main__":
    zeta_patch()
