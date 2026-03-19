import json
import urllib.request

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def probe():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_type": "frontend-only",
                "app_name": "Probe",
                "frontend_template": "html-static",
                "files": [{"filename": "index.html", "content": "hello"}]
            }
        }
    }
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"), headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"
    }, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            print(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Probe Error: {e}")

if __name__ == "__main__":
    probe()
