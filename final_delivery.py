import os

def create_blinded_hub():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. HTML Base com Tailwind via Play CDN para garantir estilo sem arquivos locais
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
    </style>
</head>
<body class="bg-gray-950 text-white min-h-screen">
    <!-- VIEW: LANDING -->
    <div id="view-landing" class="flex flex-col items-center justify-center min-h-screen p-4">
        <div class="max-w-4xl w-full text-center space-y-12">
            <header class="space-y-4">
                <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
                    SL ACADEMY
                </h1>
                <p class="text-xl text-gray-400 max-w-2xl mx-auto">
                    Acompanhe seus indicadores, acesse trilhas de conhecimento e dúvidas em tempo real.
                </p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                <button onclick="showView('login', 'manager')" class="group p-8 rounded-2xl bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 text-left border border-white/10">
                    <div class="flex flex-col h-full justify-between space-y-4">
                        <span class="text-2xl font-bold">Login Gestor</span>
                        <p class="text-sm text-gray-600">Acesse o dashboard de indicadores e gestão hospitalar.</p>
                    </div>
                </button>

                <button onclick="showView('login', 'doctor')" class="group p-8 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 text-left border border-white/10">
                    <div class="flex flex-col h-full justify-between space-y-4">
                        <span class="text-2xl font-bold">Login Médico</span>
                        <p class="text-sm text-gray-400">Acesse suas trilhas de aprendizado e materiais de apoio.</p>
                    </div>
                </button>
            </div>
        </div>
    </div>

    <!-- VIEW: LOGIN -->
    <div id="view-login" style="display:none" class="flex items-center justify-center min-h-screen px-4">
        <div class="max-w-md w-full space-y-8 bg-gray-900 p-10 rounded-3xl border border-white/5 shadow-2xl">
            <div class="text-center">
                <h2 id="login-title" class="text-3xl font-bold text-white tracking-tight">Login Gestor</h2>
                <p class="mt-2 text-sm text-gray-400">Entre com suas credenciais do Supabase</p>
            </div>

            <form onsubmit="handleLogin(event)" class="mt-8 space-y-6">
                <div id="login-error" class="hidden rounded-lg bg-red-900/40 border border-red-500/50 p-3 text-sm text-red-200"></div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input id="email" type="email" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="seu@email.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                        <input id="password" type="password" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••">
                    </div>
                </div>
                <button id="btn-login" type="submit" class="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-sm">
                    Entrar
                </button>
            </form>
            
            <button onclick="showView('landing')" class="w-full text-center text-sm text-gray-500 hover:text-white mt-4">
                ← Voltar para seleção
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
                document.getElementById('login-title').innerText = role === 'manager' ? 'Login Gestor' : 'Login Médico';
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
                
                alert('Sucesso! Redirecionando...');
                window.location.href = '/dashboard'; // Aqui o orquestrador pode falhar, mas o login funcionou
            } catch (err) {
                errorDiv.innerText = err.message;
                errorDiv.classList.remove('hidden');
            } finally {
                btn.innerText = 'Entrar';
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>
    """

    # Sobrescrever o index.html da pasta out para o deploy
    with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(hub_html)

    print("Blinded Hub created. Total isolation achieved.")

if __name__ == "__main__":
    create_blinded_hub()
