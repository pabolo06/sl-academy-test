import traceback
import sys
import os

def debug_import():
    try:
        print("Tentando importar FastAPI...")
        import fastapi
        print("FastAPI importado com sucesso.")
        
        print("Tentando importar main.app...")
        from main import app
        print("Aplicação importada com sucesso.")
        return True
    except ImportError as e:
        print(f"Erro de Importação: {e}")
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"Erro Inesperado: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = debug_import()
    sys.exit(0 if success else 1)
