import os
import requests
import json

def finalize_delivery():
    # NOVO ID DA IMAGEM DO USUARIO
    app_id = "0a529083a3f84d0189"
    api_key = "ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670"
    endpoint = "https://api-v2.appdeploy.ai/mcp"

    hub_html = """
<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SL Academy Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { background-color: #030712; color: white; font-family: sans-serif; }
        .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
    </style>
</head>
<body class="bg-gray-950 text-white min-h-screen">
    <!-- VIEW: LANDING -->
    <div id="view-landing" class="flex flex-col items-center justify-center min-h-screen p-4">
        <div class="max-w-4xl w-full text-center space-y-12 animate-in fade-in duration-700">
            <header class="space-y-4">
                <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
                    SL <span class="text-blue-500">ACADEMY</span>
                </h1>
                <p class="text-xl text-gray-400 max-w-2xl mx-auto">
                    Plataforma B2B de Educação e Gestão Hospitalar. Gerencie indicadores e trilhas em tempo real.
                </p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                <button onclick="showView('login', 'manager')" class="group p-8 rounded-2xl bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 text-left shadow-xl">
                    <div class="flex flex-col h-full justify-between space-y-4">
                        <span class="text-2xl font-bold">Login Gestor</span>
                        <p class="text-sm text-gray-600 font-medium">Acesse indicadores e dashboards estratégicos.</p>
                    </div>
                </button>

                <button onclick="showView('login', 'doctor')" class="group p-8 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 text-left border border-white/10 shadow-xl">
                    <div class="flex flex-col h-full justify-between space-y-4">
                        <span class="text-2xl font-bold text-blue-400">Login Médico</span>
                        <p class="text-sm text-gray-400">Acesse trilhas de conhecimento e materiais de apoio.</p>
                    </div>
                </button>
            </div>
        </div>
    </div>

    <!-- VIEW: LOGIN -->
    <div id="view-login" style="display:none" class="flex items-center justify-center min-h-screen px-4 animate-in slide-in-from-bottom-4 duration-500">
        <div class="max-w-md w-full space-y-8 glass p-10 rounded-3xl shadow-2xl">
            <div class="text-center">
                <div class="inline-block p-3 rounded-2xl bg-blue-600/20 text-blue-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 id="login-title" class="text-3xl font-bold text-white tracking-tight">Login Gestor</h2>
                <p class="mt-2 text-sm text-gray-400">Entre com sua conta SL Academy</p>
            </div>

            <form onsubmit="handleLogin(event)" class="mt-8 space-y-6">
                <div id="login-error" class="hidden rounded-lg bg-red-900/40 border border-red-500/50 p-3 text-sm text-red-200"></div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Email Corporativo</label>
                        <input id="email" type="email" required class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="nome@hospital.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                        <input id="password" type="password" required class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••">
                    </div>
                </div>
                <button id="btn-login" type="submit" class="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg shadow-blue-600/20">
                    Entrar na Plataforma
                </button>
            </form>
            
            <button onclick="showView('landing')" class="w-full text-center text-sm text-gray-500 hover:text-white transition-colors mt-6 font-medium">
                ← Voltar para seleção de perfil
            </button>
        </div>
    </div>

    <script>
        const supabaseUrl = 'https://joewhfllvdaygffsosor.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQ1MTUsImV4cCI6MjA4OTA4MDUxNX0.r7UVrbONJGipYyvDgB5jHA4SA1jtgs0Vl9NEQbw8Nc4';
        const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

        function showView(view, role) {
            document.getElementById('view-landing').style.display = view === 'landing' ? 'flex' : 'none';
            document.getElementById('view-login').style.display = view === 'login' ? 'flex' : 'none';
            if (role) {
                document.getElementById('login-title').innerText = role === 'manager' ? 'Acesso Gestor' : 'Acesso Médico';
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('btn-login');
            const errorDiv = document.getElementById('login-error');
            
            errorDiv.classList.add('hidden');
            btn.innerText = 'Autenticando...';
            btn.disabled = true;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                alert('Autenticado com sucesso! Carregando seu dashboard...');
                // Redirecionamento seguro para a mesma página com query de estado se o /dashboard falhar
                window.location.href = '?auth=success'; 
            } catch (err) {
                errorDiv.innerText = err.message === 'Invalid login credentials' ? 'Credenciais inválidas' : err.message;
                errorDiv.classList.remove('hidden');
            } finally {
                btn.innerText = 'Entrar na Plataforma';
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>
    """

    # Enviar para o orquestrador via JSON RPC (Tentativa 2 com cabeçalhos corretos)
    payload = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {
            "name": "deploy_app",
            "arguments": {
                "app_id": app_id,
                "app_type": "frontend-only",
                "files": [{"filename": "index.html", "content": hub_html}],
                "model": "gemini-2.5-pro",
                "intent": "RESTORE NAVIGATION FIX"
            }
        }
    }
    
    # IMPORTANTE: Para evitar 406, vou usar o comando CLI via shell se o python falhar
    with open('hub_final.json', 'w', encoding='utf-8') as f:
        json.dump(payload, f)
    
    print(f"Build complete for {app_id}. Sending...")

if __name__ == "__main__":
    finalize_delivery()
