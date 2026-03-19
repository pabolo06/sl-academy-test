import requests
import json

def sync_final():
    api_key = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
    endpoint = "https://api-v2.appdeploy.ai/mcp"
    app_id = "3c71215371174476a6"
    
    with open('frontend/out/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    payload = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": app_id,
                "app_type": "frontend-only",
                "files": [{"filename": "index.html", "content": content}],
                "model": "gemini-2.5-pro",
                "intent": "FINAL RESILIENT DEPLOY"
            }
        }
    }
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
    resp = requests.post(endpoint, json=payload, headers=headers)
    print(resp.status_code)
    print(resp.text)

if __name__ == "__main__":
    sync_final()
