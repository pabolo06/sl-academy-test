import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0e1a]">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full mx-auto px-6 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          SL Academy{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Platform
          </span>
        </h1>

        <p className="text-lg text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
          Plataforma de educação médica corporativa para hospitais. Trilhas, avaliações e indicadores em um só lugar.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login?role=doctor"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/25"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Área do Médico
          </Link>

          <Link
            href="/login?role=manager"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Área do Gestor
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-4">
          {[
            { icon: '📋', label: 'Trilhas de Aprendizado' },
            { icon: '📊', label: 'Indicadores Hospitalares' },
            { icon: '✅', label: 'Avaliações Pre & Pós' },
          ].map((f) => (
            <div key={f.label} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-xs text-slate-400 font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
