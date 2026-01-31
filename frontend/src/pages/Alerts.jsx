import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"
import apiClient from "@/api/client"
import toast from "react-hot-toast"
import { Modal } from "@/components/ui/modal"

const RISK_COLORS = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-blue-400"
}

const STATUS_LABELS = {
  open: "Aberto",
  accepted: "Aceito",
  resolved: "Resolvido"
}

export default function Alerts() {
  const { user } = useAuth()
  const canUpdate = ["admin", "security"].includes(user?.role)
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("open")
  const [originFilter, setOriginFilter] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState(null)

  const { data: alerts = [], refetch, isLoading } = useQuery({
    queryKey: ["alerts", severityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)
      if (severityFilter !== "all") params.append("risk", severityFilter)
      const response = await apiClient.get(`/api/protected/alerts?${params.toString()}`)
      return response.data.alerts || []
    },
    enabled: !!user,
    initialData: []
  })

  const filteredAlerts = useMemo(() => {
    const normalized = alerts.map((alert) => ({ ...alert, origin: "OWASP ZAP" }))
    if (originFilter === "all") return normalized
    if (originFilter === "zap") return normalized
    return []
  }, [alerts, originFilter])

  const handleUpdateStatus = async (alertId, status) => {
    try {
      await apiClient.patch(`/api/protected/alerts/${alertId}`, { status })
      toast.success("Status atualizado.")
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao atualizar alerta.")
    }
  }

  const getRiskLabel = (risk) => {
    if (!risk) return "Indefinido"
    const normalized = risk.toLowerCase()
    if (normalized.includes("critical")) return "Critical"
    if (normalized.includes("high")) return "High"
    if (normalized.includes("medium")) return "Medium"
    if (normalized.includes("low")) return "Low"
    return risk
  }

  const getRiskColor = (risk) => {
    const normalized = (risk || "").toLowerCase()
    if (normalized.includes("critical")) return RISK_COLORS.critical
    if (normalized.includes("high")) return RISK_COLORS.high
    if (normalized.includes("medium")) return RISK_COLORS.medium
    if (normalized.includes("low")) return RISK_COLORS.low
    return "text-slate-400"
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="pl-64">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">Alertas & Riscos</h1>
            <p className="text-slate-400">
              Central de vulnerabilidades com foco em criticidade e ação imediata.
            </p>
          </header>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase text-slate-400">Severidade</label>
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              >
                <option value="open">Aberto</option>
                <option value="accepted">Aceito</option>
                <option value="resolved">Resolvido</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Origem</label>
              <select
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="zap">OWASP ZAP</option>
                <option value="semgrep">Semgrep</option>
              </select>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Alertas abertos</h2>
                <p className="text-sm text-slate-400">Acompanhe riscos ativos e suas ações.</p>
              </div>
              <span className="text-xs text-slate-500">{filteredAlerts.length} alertas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 bg-slate-950/70">
                  <tr>
                    <th className="px-6 py-3 text-left">Severidade</th>
                    <th className="px-6 py-3 text-left">Título</th>
                    <th className="px-6 py-3 text-left">Origem</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {isLoading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-6 text-slate-500">
                        Carregando alertas...
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredAlerts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-6 text-slate-500">
                        Nenhum alerta encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="text-slate-200">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 ${getRiskColor(alert.risk)}`}>
                          <AlertTriangle className="w-4 h-4" />
                          {getRiskLabel(alert.risk)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{alert.title}</td>
                      <td className="px-6 py-4">{alert.origin}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <ShieldAlert className="w-4 h-4" />
                          {STATUS_LABELS[alert.status] || "Aberto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-3">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(alert.id, "accepted")}
                          disabled={!canUpdate}
                          className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(alert.id, "resolved")}
                          disabled={!canUpdate}
                          className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Resolver
                        </button>
                        {!canUpdate && (
                          <span className="text-xs text-slate-500">
                            Apenas admin/security
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Detalhes do alerta"
        size="lg"
      >
        {selectedAlert && (
          <div className="space-y-4 text-slate-200">
            <div>
              <div className="text-xs uppercase text-slate-500">Título</div>
              <div className="text-sm">{selectedAlert.title}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Severidade</div>
              <div className={`text-sm ${getRiskColor(selectedAlert.risk)}`}>
                {getRiskLabel(selectedAlert.risk)}
              </div>
            </div>
            {selectedAlert.url && (
              <div>
                <div className="text-xs uppercase text-slate-500">URL</div>
                <div className="text-sm break-all">{selectedAlert.url}</div>
              </div>
            )}
            {selectedAlert.description && (
              <div>
                <div className="text-xs uppercase text-slate-500">Descrição</div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap">
                  {selectedAlert.description}
                </div>
              </div>
            )}
            {selectedAlert.solution && (
              <div>
                <div className="text-xs uppercase text-slate-500">Mitigação</div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap">
                  {selectedAlert.solution}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
