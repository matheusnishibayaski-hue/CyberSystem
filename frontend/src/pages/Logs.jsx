import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"
import apiClient from "@/api/client"

export default function Logs() {
  const { user } = useAuth()
  const [severityFilter, setSeverityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs", severityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (severityFilter !== "all") params.append("severity", severityFilter)
      if (typeFilter !== "all") params.append("log_type", typeFilter)
      params.append("limit", "200")

      const response = await apiClient.get(`/api/protected/logs?${params.toString()}`)
      return response.data.logs || []
    },
    enabled: !!user,
    initialData: []
  })

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchTerm === "" || log.message?.toLowerCase().includes(searchTerm.toLowerCase())
      const logDate = log.created_at ? new Date(log.created_at) : null
      const matchesStart = startDate ? logDate >= new Date(startDate) : true
      const matchesEnd = endDate ? logDate <= new Date(endDate + "T23:59:59") : true
      return matchesSearch && matchesStart && matchesEnd
    })
  }, [logs, searchTerm, startDate, endDate])

  const renderSeverity = (severity) => {
    if (severity === "critical") return "text-red-400"
    if (severity === "error") return "text-red-300"
    if (severity === "warning") return "text-yellow-400"
    if (severity === "success") return "text-emerald-400"
    return "text-slate-300"
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="pl-64">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">Logs & Auditoria</h1>
            <p className="text-slate-400">
              Rastreie operações críticas, acessos e alterações do sistema.
            </p>
          </header>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs uppercase text-slate-400">Busca</label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por mensagem..."
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Severidade</label>
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Tipo</label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="scan">Scan</option>
                <option value="security">Security</option>
                <option value="auth">Auth</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Período</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-2 text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Registros</h2>
                <p className="text-sm text-slate-400">Base para compliance e auditoria.</p>
              </div>
              <span className="text-xs text-slate-500">{filteredLogs.length} eventos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 bg-slate-950/70">
                  <tr>
                    <th className="px-6 py-3 text-left">Severidade</th>
                    <th className="px-6 py-3 text-left">Tipo</th>
                    <th className="px-6 py-3 text-left">Mensagem</th>
                    <th className="px-6 py-3 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {isLoading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-6 text-slate-500">
                        Carregando logs...
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-6 text-slate-500">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="text-slate-200">
                      <td className={`px-6 py-4 text-xs font-semibold ${renderSeverity(log.severity)}`}>
                        {(log.severity || "info").toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-xs uppercase text-slate-400">
                        {log.log_type || "system"}
                      </td>
                      <td className="px-6 py-4">{log.message}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
