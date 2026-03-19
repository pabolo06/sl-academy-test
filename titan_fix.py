import os
import shutil

def titan_fix():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Rename directory
    old_dir = os.path.join(out_dir, '_next')
    new_dir = os.path.join(out_dir, 'assets')
    
    if os.path.exists(old_dir):
        if os.path.exists(new_dir):
            shutil.rmtree(new_dir)
        os.rename(old_dir, new_dir)
        print(f"Renamed {old_dir} -> {new_dir}")

    # 2. Global search and replace in ALL files
    # We target: /_next/ -> /assets/ and _next/ -> assets/
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if any(file.endswith(ext) for ext in ['.html', '.js', '.css', '.json']):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'rb') as f:
                        data = f.read()
                    
                    # Replacement in bytes to be safe for all encodings
                    new_data = data.replace(b'/_next/', b'/assets/')
                    new_data = new_data.replace(b'_next/', b'assets/')
                    
                    # Also fix any static_assets/ or public_assets/ from previous attempts
                    new_data = new_data.replace(b'/static_assets/', b'/assets/')
                    new_data = new_data.replace(b'static_assets/', b'assets/')
                    new_data = new_data.replace(b'/public_assets/', b'/assets/')
                    new_data = new_data.replace(b'public_assets/', b'assets/')
                    
                    if data != new_data:
                        with open(filepath, 'wb') as f:
                            f.write(new_data)
                        print(f"Patched {file}")
                except Exception as e:
                    print(f"Error patching {file}: {e}")

    print("Titan fix complete.")

if __name__ == "__main__":
    titan_fix()
