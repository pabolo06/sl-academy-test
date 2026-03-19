import os
import re

def hub_zero_build():
    out_dir = r'c:\Users\pablo\OneDrive\Documentos\Oslo\frontend\out'
    
    # 1. Carregar CSS compilado
    css_content = ""
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            if file.endswith('.css'):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    css_content += f.read() + "\n"

    # 2. Carregar o HTML Base (Landing)
    with open(os.path.join(out_dir, 'index.html'), 'r', encoding='utf-8') as f:
        landing_content = f.read()

    # 3. Extrair o conteúdo do Login (o formulário)
    login_form_html = ""
    login_path = os.path.join(out_dir, 'login', 'index.html')
    if os.path.exists(login_path):
        with open(login_path, 'r', encoding='utf-8') as f:
            login_data = f.read()
            # Tentar pegar o conteúdo dentro do main ou div principal
            match = re.search(r'<main[^>]*>(.*?)</main>', login_data, re.DOTALL)
            if match:
                login_form_html = match.group(1)
            else:
                # Fallback: tentar pegar tudo dentro do body
                body_match = re.search(r'<body[^>]*>(.*?)</body>', login_data, re.DOTALL)
                if body_match:
                    login_form_html = body_match.group(1)

    # 4. Criar o Hub Unificado
    # Injetar CSS e ocultar telas
    hub_html = landing_content
    
    # Injetar CSS na head
    if css_content:
        hub_html = hub_html.replace("</head>", f"<style>{css_content}</style></head>")

    # Criar o script de roteamento Hub
    hub_script = f"""
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
    const supabaseUrl = 'https://joewhfllvdaygffsosor.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZXdoZmxsdmRheWdmZnNvc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQ1MTUsImV4cCI6MjA4OTA4MDUxNX0.r7UVrbONJGipYyvDgB5jHA4SA1jtgs0Vl9NEQbw8Nc4';
    const supabase = supabasejs.createClient(supabaseUrl, supabaseKey);

    window.navigateTo = function(view) {{
        console.log('Navigating to:', view);
        if (view === 'login') {{
            document.getElementById('landing-view').style.display = 'none';
            document.getElementById('login-view').style.display = 'block';
            window.location.hash = 'login';
        }} else {{
            document.getElementById('landing-view').style.display = 'block';
            document.getElementById('login-view').style.display = 'none';
            window.location.hash = '';
        }}
    }};

    document.addEventListener('DOMContentLoaded', () => {{
        // Envolver o conteúdo atual da landing em uma div
        const bodyContent = document.body.innerHTML;
        document.body.innerHTML = `
            <div id="landing-view">${{bodyContent}}</div>
            <div id="login-view" style="display:none; min-height:100vh" class="bg-gray-900">
                <div class="max-w-md mx-auto pt-20 px-4">${{`{login_form_html}`}}</div>
            </div>
        `;
        
        // Ativar links
        document.querySelectorAll('a').forEach(a => {{
            if (a.href.includes('login')) {{
                a.onclick = (e) => {{ e.preventDefault(); navigateTo('login'); }};
            }}
        }});

        if (window.location.hash === '#login') navigateTo('login');
    }});
    </script>
    """
    
    hub_html = hub_html.replace("</body>", f"{hub_script}</body>")

    # Limpar referências problemáticas
    hub_html = re.sub(r'<link rel="(?:manifest|icon|preload)"[^>]*>', '', hub_html)
    hub_html = re.sub(r'<script src="[^"]*"[^>]*></script>', '', hub_html)

    # Escrever o arquivo final (SUBSTITUINDO O INDEX)
    with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(hub_html)

    print("Hub-Zero build complete. Single index.html ready.")

if __name__ == "__main__":
    hub_zero_build()
