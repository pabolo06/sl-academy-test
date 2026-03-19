import os
import shutil

def rename_assets():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    old_name = os.path.join(out_dir, '_next')
    new_name = os.path.join(out_dir, 'next_assets')

    if os.path.exists(new_name):
        shutil.rmtree(new_name)
    
    if os.path.exists(old_name):
        os.rename(old_name, new_name)
        print(f"Renamed _next to next_assets")
    else:
        print("_next directory not found in out/")
        return

    # Replace references in all HTML files
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.html') or file.endswith('.js') or file.endswith('.css'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content.replace('/_next/', '/next_assets/').replace('_next/', 'next_assets/')
                    
                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        # print(f"Patched {file}")
                except Exception as e:
                    # Ignore binary files or errors
                    pass
    print("Asset rebranding and patching complete.")

if __name__ == "__main__":
    rename_assets()
