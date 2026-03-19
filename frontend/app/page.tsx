export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">
          SL Academy Platform
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          B2B Hospital Education and Management Platform
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/login/index.html?role=manager"
            aria-label="Login para Gestores"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Login Gestor
          </a>
          <a
            href="/login/index.html?role=doctor"
            aria-label="Login para Médicos"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Login Médico
          </a>
        </div>
      </div>
    </main>
  )
}
