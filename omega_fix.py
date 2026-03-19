import os
import re

def omega_path_fix():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Rename physical directory if exists
    old_assets = os.path.join(out_dir, 'static_assets')
    new_assets = os.path.join(out_dir, 'public_assets')
    if os.path.exists(old_assets):
        if os.path.exists(new_assets):
            import shutil
            shutil.rmtree(new_assets)
        os.rename(old_assets, new_assets)
        print("Renamed static_assets -> public_assets")

    # 2. Process files
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if any(file.endswith(ext) for ext in ['.html', '.js', '.css', '.json']):
                filepath = os.path.join(root, file)
                rel_dir = os.path.relpath(root, out_dir).replace('\\', '/')
                
                # Calculate depth
                if rel_dir == '.':
                    depth_prefix = ''
                else:
                    depth_prefix = '../' * len(rel_dir.split('/'))
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Global replace static_assets -> public_assets
                    new_content = content.replace('static_assets/', 'public_assets/')
                    new_content = new_content.replace('/static_assets/', 'public_assets/') # remove leading slash
                    
                    # In HTML, use the depth prefix for public_assets
                    if file.endswith('.html'):
                        # Target tags: href="public_assets/", src="public_assets/"
                        new_content = new_content.replace('href="public_assets/', f'href="{depth_prefix}public_assets/')
                        new_content = new_content.replace('src="public_assets/', f'src="{depth_prefix}public_assets/')
                        new_content = new_content.replace('href="/public_assets/', f'href="{depth_prefix}public_assets/')
                        new_content = new_content.replace('src="/public_assets/', f'src="{depth_prefix}public_assets/')
                        
                        # Remove base tag if present to avoid confusion
                        new_content = re.sub(r'<base[^>]*>', '', new_content)
                    
                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                    
                except Exception as e:
                    print(f"Error patching {file}: {e}")

    print("Omega path fix complete.")

if __name__ == "__main__":
    omega_path_fix()
