import os
import re

def radical_path_fix():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # Pattern to match static_assets/ not preceded by / or ./
    # We want to catch "static_assets/" and 'static_assets/' and turn them into "/static_assets/"
    pattern1 = re.compile(r'(?<![/.])static_assets/')
    # Also catch cases like src=static_assets/ in HTML attributes
    pattern2 = re.compile(r'=(["\'])static_assets/')
    
    count = 0
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if any(file.endswith(ext) for ext in ['.html', '.js', '.css', '.json']):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replacement logic
                    new_content = pattern1.sub('/static_assets/', content)
                    new_content = re.sub(r'=(["\'])static_assets/', r'=\1/static_assets/', new_content)
                    
                    # Fix possible double slashes
                    new_content = new_content.replace('//static_assets/', '/static_assets/')
                    
                    # INJECT <base href="/"> into HTML files
                    if file.endswith('.html'):
                        if '<base href="/"' not in new_content:
                            new_content = new_content.replace('<head>', '<head><base href="/">', 1)
                    
                    if content != new_content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        count += 1
                except:
                    pass
    print(f"Radical path fix complete. Patched {count} files.")

if __name__ == "__main__":
    radical_path_fix()
