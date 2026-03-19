import os

def get_dir_stats(d):
    s = 0
    c = 0
    for root, _, files in os.walk(d):
        for f in files:
            fp = os.path.join(root, f)
            try:
                s += os.path.getsize(fp)
                c += 1
            except:
                pass
    return s, c

base = "frontend"
if os.path.exists(base):
    print(f"Stats for {base}:")
    for d in os.listdir(base):
        path = os.path.join(base, d)
        if os.path.isdir(path):
            size, count = get_dir_stats(path)
            print(f"{d:20} | {size/1024/1024:8.2f} MB | {count:5} files")
else:
    print(f"Directory {base} not found")
