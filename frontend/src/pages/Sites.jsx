import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Play } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"
import apiClient from "@/api/client"
import toast from "react-hot-toast"

export default function Sites() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const canStartScan = ["admin", "security"].includes(user?.role)

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites", statusFilter],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/sites")
      return response.data.sites || []
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  })

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch =
        searchTerm === "" || site.url?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || (site.status || "unknown") === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [sites, searchTerm, statusFilter])

  const handleRunScan = async (site) => {
    if (!canStartScan) return
    try {
      await apiClient.post("/api/protected/scans", {
        type: "zap",
        scanType: "simple",
        target: site.url
      })
      toast.success("Scan ZAP enfileirado.")
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao iniciar scan.")
    }
  }

  const renderStatus = (status) => {
    if (status === "active") return "text-emerald-400"
    if (status === "offline") return "text-red-400"
    return "text-yellow-300"
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="pl-64">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">Sites Monitorados</h1>
            <p className="text-slate-400">
              Status operacional, últimos scans e vulnerabilidades detectadas.
            </p>
          </header>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase text-slate-400">Buscar</label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por URL..."
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="offline">Offline</option>
                <option value="warning">Atenção</option>
              </select>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Inventário</h2>
                <p className="text-sm text-slate-400">Visão consolidada dos ativos monitorados.</p>
              </div>
              <span className="text-xs text-slate-500">{filteredSites.length} sites</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-400 bg-slate-950/70">
                  <tr>
                    <th className="px-6 py-3 text-left">Site</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Último Scan</th>
                    <th className="px-6 py-3 text-left">Última Vulnerabilidade</th>
                    <th className="px-6 py-3 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {isLoading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-6 text-slate-500">
                        Carregando sites...
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredSites.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-6 text-slate-500">
                        Nenhum site encontrado.
                      </td>
                    </tr>
                  )}
                  {filteredSites.map((site) => (
                    <tr key={site.id} className="text-slate-200">
                      <td className="px-6 py-4">
                        <div className="text-sm">{site.url || site.name}</div>
                        <div className="text-xs text-slate-500">Vulns: {site.vulnerabilities || 0}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold ${renderStatus(site.status)}`}>
                          {(site.status || "unknown").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {site.last_scan ? new Date(site.last_scan).toLocaleString("pt-BR") : "Nunca"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {site.last_alert_message ? (
                          <div>
                            <div className="text-slate-200">{site.last_alert_message}</div>
                            <div className="text-xs text-slate-500">
                              {site.last_alert_at
                                ? new Date(site.last_alert_at).toLocaleString("pt-BR")
                                : "Sem data"}
                            </div>
                          </div>
                        ) : (
                          "Sem registros"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRunScan(site)}
                          disabled={!canStartScan}
                          className="inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 disabled:opacity-40"
                        >
                          <Play className="w-4 h-4" />
                          Executar ZAP
                        </button>
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
