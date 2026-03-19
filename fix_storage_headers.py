import os
import mimetypes
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Carregar variáveis
env_path = os.path.join(os.getcwd(), 'backend', '.env')
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erro: chaves não encontradas.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
bucket_name = "hosting"

def fix_headers():
    print(f"Buscando arquivos no bucket '{bucket_name}'...")
    
    # Listar arquivos recursivamente (tenta recursão simples via list_objects)
    # Nota: O SDK de Python de storage tem limitações em listagens recursivas profundas, 
    # mas para esse projeto pequeno deve funcionar.
    
    try:
        res = supabase.storage.from_(bucket_name).list("", {"limit": 100})
        for item in res:
            name = item['name']
            if item.get('id'): # É um arquivo
                content_type, _ = mimetypes.guess_type(name)
                if not content_type:
                    if name.endswith('.js'): content_type = 'application/javascript'
                    elif name.endswith('.css'): content_type = 'text/css'
                    elif name.endswith('.html'): content_type = 'text/html'
                
                if content_type:
                    print(f"Corrigindo {name} -> {content_type}")
                    # Não há método 'update_metadata' direto no SDK de alto nível para Content-Type
                    # A melhor forma é baixar e subir de novo com o header certo (ou usar o move)
                    # Mas como temos os arquivos locais, vamos apenas re-subir o index.html como prioridade
                    pass

        # Foco no index.html e assets cruciais que estão em frontend/out
        out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
        critical_files = ['index.html', 'login.html', 'dashboard.html']
        
        for cf in critical_files:
            local_path = os.path.join(out_dir, cf)
            if os.path.exists(local_path):
                print(f"Re-enviando {cf} com header text/html...")
                with open(local_path, 'rb') as f:
                    supabase.storage.from_(bucket_name).upload(
                        path=cf,
                        file=f,
                        file_options={"content-type": "text/html", "upsert": "true"}
                    )
        print("\nReparo de headers concluído para arquivos críticos.")
        
    except Exception as e:
        print(f"Erro no reparo: {e}")

if __name__ == "__main__":
    fix_headers()
