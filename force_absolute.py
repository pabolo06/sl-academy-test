import os

def force_absolute_paths():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Patch all HTML, JS, CSS, JSON
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if any(file.endswith(ext) for ext in ['.html', '.js', '.css', '.json']):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Ensure static_assets starts with /
                    new_content = content.replace('"static_assets/', '"/static_assets/')
                    new_content = new_content.replace("'static_assets/", "'/static_assets/")
                    new_content = new_content.replace('href="static_assets/', 'href="/static_assets/')
                    new_content = new_content.replace('src="static_assets/', 'src="/static_assets/')
                    
                    # Fix possible double slashes
                    new_content = new_content.replace('//static_assets/', '/static_assets/')
                    
                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        # print(f"Forced absolute paths in {file}")
                except:
                    pass
    print("Absolute path sanitization complete.")

if __name__ == "__main__":
    force_absolute_paths()
