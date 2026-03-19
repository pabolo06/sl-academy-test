import os
import mimetypes
import time
from supabase import create_client, Client
from dotenv import load_dotenv
from omni_fix import omni_lite_fix

# 1. Carregar variáveis de ambiente
# O backend/.env contém as credenciais do Supabase
env_path = os.path.join(os.getcwd(), 'backend', '.env')
load_dotenv(env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env")
    exit(1)

# Inicializar cliente Supabase com Service Role Key para permissão total no Storage
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def deploy_to_supabase():
    # 2. Executar a correção Omni-Lite (Prepara o build para hospedagem estática)
    print("--- Iniciando Omni-Lite Fix ---")
    try:
        omni_lite_fix()
    except Exception as e:
        print(f"Erro ao executar omni_lite_fix: {e}")
        return

    # 3. Configurações de diretório e bucket
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    bucket_name = "hosting"

    if not os.path.exists(out_dir):
        print(f"ERRO: Diretório de build não encontrado: {out_dir}")
        return

    print(f"\n--- Inciando Upload para o Bucket: {bucket_name} ---")
    
    files_uploaded = 0
    errors = 0

    # 4. Upload Recursivo
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            file_path = os.path.join(root, file)
            # O path no storage deve ser relativo ao out_dir
            storage_path = os.path.relpath(file_path, out_dir).replace('\\', '/')
            
            # Identificar Content-Type para o navegador interpretar corretamente
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                # Fallback para tipos comuns que o mimetypes pode errar no Windows
                if file.endswith('.js'): content_type = 'application/javascript'
                elif file.endswith('.css'): content_type = 'text/css'
                elif file.endswith('.html'): content_type = 'text/html'
                else: content_type = 'application/octet-stream'
            
            print(f"Enviando {storage_path} ({content_type})...", end=" ", flush=True)
            
            try:
                with open(file_path, 'rb') as f:
                    # Garantindo que o content-type seja passado corretamente
                    # Na v2.28.2 do SDK, o parâmetro é file_options: dict
                    supabase.storage.from_(bucket_name).upload(
                        path=storage_path,
                        file=f,
                        file_options={
                            "content-type": content_type,
                            "upsert": "true"
                        }
                    )
                print("OK")
                files_uploaded += 1
            except Exception as e:
                # Fallback para sintaxe alternativa se houver erro de validação
                try:
                    with open(file_path, 'rb') as f:
                        supabase.storage.from_(bucket_name).upload(
                            path=storage_path,
                            file=f,
                            file_options={
                                "contentType": content_type,
                                "upsert": True
                            }
                        )
                    print("OK (alt-syntax)")
                    files_uploaded += 1
                except Exception as e2:
                    print(f"FALHOU: {e2}")
                    errors += 1

    print(f"\n--- Deploy Concluído ---")
    print(f"Sucesso: {files_uploaded}")
    print(f"Erros: {errors}")
    print(f"\nURL de Acesso: {SUPABASE_URL}/storage/v1/object/public/{bucket_name}/index.html")

if __name__ == "__main__":
    deploy_to_supabase()
