import { useState } from "react"
import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [queuePolling, setQueuePolling] = useState(true)
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
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">Configurações</h1>
            <p className="text-slate-400">
              Ajustes operacionais e preferências do console de segurança.
            </p>
          </header>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Notificações</h2>
              <p className="text-sm text-slate-400">
                Alertas visuais e avisos em tempo real para riscos críticos.
              </p>
            </div>
            <div className="flex items-center justify-between border border-slate-800/70 rounded-xl p-4">
              <div>
                <div className="text-sm text-white">Notificações críticas</div>
                <div className="text-xs text-slate-500">Toast quando vulnerabilidade crítica é detectada.</div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                  notificationsEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                }`}
              >
                {notificationsEnabled ? "Ativo" : "Inativo"}
              </button>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Fila & Workers</h2>
              <p className="text-sm text-slate-400">
                Monitora o uso de Redis e o agendamento assíncrono de scans.
              </p>
            </div>
            <div className="flex items-center justify-between border border-slate-800/70 rounded-xl p-4">
              <div>
                <div className="text-sm text-white">Atualização automática da fila</div>
                <div className="text-xs text-slate-500">Refetch de jobs a cada 10s.</div>
              </div>
              <button
                onClick={() => setQueuePolling(!queuePolling)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                  queuePolling ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                }`}
              >
                {queuePolling ? "Ativo" : "Inativo"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
