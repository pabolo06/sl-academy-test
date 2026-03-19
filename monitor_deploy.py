import json
import urllib.request
import time

# Configurações
API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"
APP_ID = "ec91ee2801d64cc7b951409e794a89fe"

def check_status():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "get_app_status",
            "arguments": {
                "app_id": APP_ID
            }
        }
    }

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "application/json, text/event-stream"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result
    except Exception as e:
        print(f"Error checking status: {e}")
        return None

if __name__ == "__main__":
    while True:
        status_data = check_status()
        if status_data:
            content = status_data.get("result", {}).get("content", [])
            if content:
                text = content[0].get("text", "{}")
                data = json.loads(text)
                status = data.get("deployment", {}).get("status")
                print(f"Status: {status}")
                if status in ["ready", "failed"]:
                    with open("final_status.json", "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    break
        time.sleep(10)
