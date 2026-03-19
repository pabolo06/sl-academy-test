import os
import shutil

def rename_assets_deep():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    old_name = os.path.join(out_dir, 'next_assets')
    new_name = os.path.join(out_dir, 'static_assets')

    if os.path.exists(new_name):
        shutil.rmtree(new_name)
    
    if os.path.exists(old_name):
        os.rename(old_name, new_name)
    else:
        # Check if _next still exists
        old_next = os.path.join(out_dir, '_next')
        if os.path.exists(old_next):
            os.rename(old_next, new_name)
        else:
            print("No asset directory found to rename.")
            return

    # Replace references in ALL files (HTML, JS, CSS, JSON)
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if any(file.endswith(ext) for ext in ['.html', '.js', '.css', '.json']):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace both versions just in case
                    new_content = content.replace('/_next/', '/static_assets/')
                    new_content = new_content.replace('_next/', 'static_assets/')
                    new_content = new_content.replace('/next_assets/', '/static_assets/')
                    new_content = new_content.replace('next_assets/', 'static_assets/')
                    
                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except:
                    pass
    print("Deep asset rebranding complete.")

if __name__ == "__main__":
    rename_assets_deep()
