import json
import urllib.request

API_KEY = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
ENDPOINT = "https://api-v2.appdeploy.ai/mcp"

def bootstrap():
    print("Initiating robust bootstrap...")
    files = [
        {
            "filename": "backend/index.ts", 
            "content": "import { router, json } from '@appdeploy/sdk'; export const handler = router({'GET /api/_healthcheck': [async () => json({message: 'ok'})]});"
        },
        {
            "filename": "app/page.tsx", 
            "content": "export default function Home() { return <div>Skeleton</div> }"
        },
        {
            "filename": "app/layout.tsx", 
            "content": "export default function Root({children}: {children: React.ReactNode}) { return <html><body>{children}</body></html> }"
        }
    ]
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": None,
                "app_type": "frontend+backend",
                "app_name": "SL Academy Greenfield",
                "description": "Clean start for SL Academy",
                "frontend_template": "nextjs-static",
                "files": files,
                "model": "claude-sonnet-3-5",
                "intent": "Initialize greenfield application with skeleton"
            }
        }
    }

    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            result = json.loads(res_data)
            print(json.dumps(result, indent=2))
            
            with open("bootstrap_result.json", "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
                
    except Exception as e:
        if hasattr(e, 'read'):
            print(e.read().decode("utf-8"))
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    bootstrap()
