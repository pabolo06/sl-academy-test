import os
import base64
import json

def generate():
    out_dir = 'frontend/out'
    files = []
    
    if not os.path.exists(out_dir):
        print(f"Error: {out_dir} not found.")
        return

    binary_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2', '.ttf']

    for root, dirs, filenames in os.walk(out_dir):
        for filename in filenames:
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, out_dir).replace('\\', '/')
            
            is_binary = any(filename.lower().endswith(ext) for ext in binary_extensions)
            
            if is_binary:
                with open(full_path, 'rb') as f:
                    content = base64.b64encode(f.read()).decode('utf-8')
                    files.append({
                        "filename": rel_path,
                        "content": content,
                        "encoding": "base64"
                    })
            else:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    files.append({
                        "filename": rel_path,
                        "content": f.read()
                    })

    # Backend
    backend_path = 'backend/index.ts'
    if os.path.exists(backend_path):
        with open(backend_path, 'r', encoding='utf-8') as f:
            files.append({
                "filename": "backend/index.ts",
                "content": f.read()
            })

    with open('mcp_files_payload.json', 'w', encoding='utf-8') as f:
        json.dump(files, f)
    print(f"Generated payload with {len(files)} files.")

if __name__ == "__main__":
    generate()
