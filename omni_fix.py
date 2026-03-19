import os
import re
import shutil

def omni_lite_fix():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Renomear fisicamente _next para n
    old_dir = os.path.join(out_dir, '_next')
    new_assets_dir = os.path.join(out_dir, 'n')
    
    if os.path.exists(old_dir):
        if os.path.exists(new_assets_dir):
            shutil.rmtree(new_assets_dir)
        os.rename(old_dir, new_assets_dir)
        print(f"Renamed _next -> n")

    # 2. Capturar CSS (Leve e Vital)
    css_content = ""
    for root, dirs, files in os.walk(new_assets_dir):
        for file in files:
            if file.endswith('.css'):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    css_content += f.read() + "\n"

    # 3. HTMLs: SÓ CSS INLINE + JS EXTERNO RELATIVIZADO
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                rel_base_path = os.path.relpath(out_dir, root).replace('\\', '/')
                rel_prefix = "" if rel_base_path == '.' else rel_base_path + "/"
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Injetar CSS
                    if css_content and "</head>" in content:
                        content = content.replace("</head>", f"<style>{css_content}</style></head>")
                    
                    # Relativizar Referências para a pasta 'n/'
                    content = content.replace('/_next/', f'{rel_prefix}n/')
                    content = content.replace('/assets/', f'{rel_prefix}n/')
                    
                    # Corrigir roteamento físico
                    content = content.replace('href="/login"', f'href="{rel_prefix}login/index.html"')
                    
                    # Remover manifestos 403
                    content = re.sub(r'<link rel="(?:manifest|icon)"[^>]*>', '', content)

                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"OMNI-LITE: Patched {file}")
                except:
                    pass

    # 4. JS: Translocação de bytes para 'n/'
    for root, dirs, files in os.walk(new_assets_dir):
        for file in files:
            if any(file.endswith(ext) for ext in ['.js', '.json']):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'rb') as f:
                        data = f.read()
                    new_data = data.replace(b'/_next/', b'n/')
                    new_data = new_data.replace(b'_next/', b'n/')
                    if data != new_data:
                        with open(filepath, 'wb') as f:
                            f.write(new_data)
                except:
                    pass

    print("Omni Lite Fix Complete.")

if __name__ == "__main__":
    omni_lite_fix()
