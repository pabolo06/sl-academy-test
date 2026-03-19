import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = "https://api-v2.appdeploy.ai/mcp"
api_key = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Authorization": f"Bearer {api_key}"
}

payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_app_template",
        "arguments": {
            "app_type": "frontend+backend",
            "frontend_template": "nextjs-static"
        }
    }
}

req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print(result)
except Exception as e:
    print(f"Error: {e}")
