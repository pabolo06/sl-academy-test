import requests
import json

def sse_deploy():
    app_id = "0a529083a3f84d0189"
    api_key = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
    endpoint = "https://api-v2.appdeploy.ai/mcp"

    # Carregar o Hub Blindado (HTML unico)
    with open('frontend/out/index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    payload = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": app_id,
                "app_type": "frontend-only",
                "files": [{"filename": "index.html", "content": html_content}],
                "model": "gemini-2.5-pro",
                "intent": "RESTORE NAVIGATION FIX"
            }
        }
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Accept": "text/event-stream"
    }

    print(f"Starting SSE Stream for APP_ID: {app_id}")
    
    try:
        # Usar stream=True para manter a conexão aberta como exigido pelo SSE
        with requests.post(endpoint, json=payload, headers=headers, stream=True) as response:
            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                print(response.text)
                return

            print("Streaming response:")
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    print(decoded_line)
                    if "result" in decoded_line:
                        print("DEPLOY SUCCESSFUL!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    sse_deploy()
