import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"

const ROLE_DESCRIPTIONS = [
  { role: "Admin", description: "Administra usuários, configurações e respostas." },
  { role: "Security", description: "Executa scans, trata alertas e riscos." },
  { role: "Viewer", description: "Acompanha indicadores e relatórios." }
]

export default function Users() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <main className="pl-64">
          <div className="max-w-4xl mx-auto px-8 py-16">
            <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 text-slate-300">
              Acesso restrito. Esta seção é visível apenas para administradores.
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="pl-64">
        <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">Usuários & Acessos</h1>
            <p className="text-slate-400">
              Controle de roles e acessos para operações sensíveis do sistema.
            </p>
          </header>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Usuário atual</h2>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-slate-200">{user?.email || "Usuário não identificado"}</div>
                <div className="text-sm text-slate-500">Role: {(user?.role || "viewer").toUpperCase()}</div>
              </div>
              <div className="text-xs text-slate-500">
                Gerenciamento completo disponível via painel administrativo.
              </div>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Papéis disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLE_DESCRIPTIONS.map((role) => (
                <div key={role.role} className="border border-slate-800/70 rounded-xl p-4">
                  <div className="text-sm font-semibold text-white">{role.role}</div>
                  <div className="text-xs text-slate-400 mt-2">{role.description}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
