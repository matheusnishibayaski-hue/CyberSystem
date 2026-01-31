import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Activity, Clock, ShieldCheck, Play, FileText, XCircle, Loader2 } from "lucide-react"
import HackerNavbar from "@/components/hacker/HackerNavbar"
import HackerCard from "@/components/hacker/HackerCard"
import TerminalBackground from "@/components/hacker/TerminalBackground"
import AlertsChart from "@/components/cyber/AlertsChart"
import ScansChart from "@/components/cyber/ScansChart"
import { useAuth } from "@/lib/AuthContext"
import apiClient from "@/api/client"
import toast from "react-hot-toast"
import { Modal } from "@/components/ui/modal"
import { SemgrepReportViewer, ZapReportViewer, SecurityGateReportViewer } from "@/components/cyber/ReportViewer"

const STATUS_LABELS = {
  waiting: "Na fila",
  active: "Em execução",
  delayed: "Agendado",
  completed: "Concluído",
  failed: "Falhou"
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, logout } = useAuth()
  const canSeeAlerts = ["admin", "security"].includes(user?.role)
  const canStartScan = ["admin", "security"].includes(user?.role)
  const previousAlertCount = useRef(null)
  const [activeSection, setActiveSection] = useState("overview")
  const [activeTab, setActiveTab] = useState("history")
  const [scanKind, setScanKind] = useState("security")
  const [zapMode, setZapMode] = useState("simple")
  const [target, setTarget] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [reportData, setReportData] = useState(null)
  const [reportType, setReportType] = useState(null)

  const { data: alerts = [] } = useQuery({
    queryKey: ["critical-alerts"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/alerts?risk=high,critical&status=open")
      return response.data.alerts || []
    },
    enabled: !!user && canSeeAlerts,
    initialData: []
  })

  const { data: alertsChartData = [] } = useQuery({
    queryKey: ["alerts-chart"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/dashboard/alerts-chart")
      return response.data.data || []
    },
    enabled: !!user,
    initialData: []
  })

  const { data: logsStats } = useQuery({
    queryKey: ["logs-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/logs/stats")
      return response.data || { bySeverity: [], byType: [] }
    },
    enabled: !!user
  })

  const { data: queueStatus } = useQuery({
    queryKey: ["scan-queue-status"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/scans/queue")
      return response.data
    },
    enabled: !!user,
    refetchInterval: 10000
  })

  const { data: reportsData } = useQuery({
    queryKey: ["scan-reports"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/scans/reports")
      return response.data.reports || []
    },
    enabled: !!user
  })

  useEffect(() => {
    const tool = searchParams.get("tool")
    if (tool && tool !== scanKind) {
      setScanKind(tool === "zap" ? "zap" : "security")
    }
  }, [searchParams, scanKind])

  useEffect(() => {
    const hash = location.hash || "#overview"
    const id = hash.replace("#", "")
    setActiveSection(id || "overview")
  }, [location.hash])

  const { data: activityData } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/dashboard/activity?limit=6")
      return response.data.activities || []
    },
    enabled: !!user,
    initialData: []
  })

  useEffect(() => {
    if (!canSeeAlerts) return
    if (previousAlertCount.current !== null && alerts.length > previousAlertCount.current) {
      toast.error("Vulnerabilidade crítica detectada!")
    }
    previousAlertCount.current = alerts.length
  }, [alerts.length, canSeeAlerts])

  const mediumCount = useMemo(() => {
    const warning = logsStats?.bySeverity?.find((item) => item.severity === "warning")
    return parseInt(warning?.count || 0, 10)
  }, [logsStats])

  const scansInExecution = useMemo(() => {
    if (!queueStatus?.counts) return 0
    return (
      (queueStatus.counts.active || 0) +
      (queueStatus.counts.waiting || 0) +
      (queueStatus.counts.delayed || 0)
    )
  }, [queueStatus])

  const reportAvailability = useMemo(() => {
    return (reportsData || []).reduce((acc, report) => {
      acc[report.type] = report.exists
      return acc
    }, {})
  }, [reportsData])

  const queueJobs = useMemo(() => queueStatus?.queue || [], [queueStatus])
  const historyJobs = useMemo(() => queueStatus?.history || [], [queueStatus])

  const handleStartScan = async () => {
    if (!canStartScan) return
    if (queueStatus && !queueStatus.available) {
      toast.error("Redis indisponível. Inicie o worker e o Redis.")
      return
    }
    if (scanKind === "zap" && !target) {
      toast.error("Selecione um site para o scan ZAP.")
      return
    }
    setIsStarting(true)
    try {
      const payload = {
        type: scanKind,
        target: scanKind === "zap" ? target : null,
        scanType: scanKind === "zap" ? zapMode : null
      }
      await apiClient.post("/api/protected/scans", payload)
      toast.success("Scan enfileirado com sucesso.")
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao enfileirar scan.")
    } finally {
      setIsStarting(false)
    }
  }

  const handleOpenReport = async (reportTypeParam) => {
    try {
      setIsModalOpen(false)
      setReportData(null)
      setReportType(null)

      const titles = {
        security: "Relatório Semgrep - Análise de Código",
        zap: "Relatório OWASP ZAP - Vulnerabilidades Web",
        "security-gate": "Security Gate - Resumo de Segurança"
      }
      setModalTitle(titles[reportTypeParam] || "Relatório")
      setIsModalOpen(true)

      const token = localStorage.getItem("auth_token")
      const baseURL = apiClient.defaults.baseURL || "http://localhost:3000"

      const response = await fetch(`${baseURL}/api/protected/scans/reports/${reportTypeParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Relatório ainda não foi gerado")
          setIsModalOpen(false)
          return
        }
        throw new Error("Erro ao carregar relatório")
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        const htmlContent = await response.text()
        setReportData(htmlContent)
        setReportType("zap")
      } else {
        const jsonData = await response.json()
        setReportData(jsonData)
        setReportType(reportTypeParam)
      }
    } catch (error) {
      toast.error("Erro ao abrir relatório: " + error.message)
      setIsModalOpen(false)
      setReportData(null)
      setReportType(null)
    }
  }

  const [siteSearchTerm, setSiteSearchTerm] = useState("")
  const [logSearchTerm, setLogSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: sites = [], isLoading: isSitesLoading } = useQuery({
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
        siteSearchTerm === "" || site.url?.toLowerCase().includes(siteSearchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || (site.status || "unknown") === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [sites, siteSearchTerm, statusFilter])

  const renderStatus = (status) => {
    if (status === "active") return "text-emerald-300"
    if (status === "offline") return "text-red-400"
    return "text-yellow-300"
  }

  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
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
        logSearchTerm === "" || log.message?.toLowerCase().includes(logSearchTerm.toLowerCase())
      const logDate = log.created_at ? new Date(log.created_at) : null
      const matchesStart = startDate ? logDate >= new Date(startDate) : true
      const matchesEnd = endDate ? logDate <= new Date(endDate + "T23:59:59") : true
      return matchesSearch && matchesStart && matchesEnd
    })
  }, [logs, logSearchTerm, startDate, endDate])

  const renderSeverity = (severity) => {
    if (severity === "critical") return "text-red-400"
    if (severity === "error") return "text-red-300"
    if (severity === "warning") return "text-yellow-300"
    if (severity === "success") return "text-emerald-300"
    return "text-green-300"
  }

  const handleRunSiteScan = async (site) => {
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
  const lastScanLabel = useMemo(() => {
    const reports = (reportsData || []).filter((report) => report.exists && report.lastModified)
    if (reports.length === 0) {
      return "Sem registros"
    }
    const latest = reports.reduce((latestReport, report) =>
      new Date(report.lastModified) > new Date(latestReport.lastModified) ? report : latestReport
    )
    return new Date(latest.lastModified).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }, [reportsData])

  const scanChartData = useMemo(() => {
    return [
      { name: "Semgrep", value: queueStatus?.metrics?.byType?.security || 0 },
      { name: "OWASP ZAP", value: queueStatus?.metrics?.byType?.zap || 0 }
    ]
  }, [queueStatus])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-black relative font-mono">
      <TerminalBackground />
      <HackerNavbar currentPage="Dashboard" onLogout={handleLogout} />

      <main className="pt-20 px-6 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {activeSection === "overview" && (
            <>
              <header id="overview" className="scroll-mt-24 space-y-2">
                <div className="text-green-500 text-sm">root@cybersystem:~# ./dashboard</div>
                <h1 className="text-3xl font-bold text-green-500">SYSTEM DASHBOARD</h1>
                <p className="text-green-700 text-sm">[ REAL-TIME MONITORING ACTIVE ]</p>
          </header>

          {!queueStatus?.available && (
                <div className="bg-black border-2 border-amber-500 text-amber-300 p-4">
                  <div className="text-sm font-bold mb-1">[ QUEUE_OFFLINE ]</div>
                  <div className="text-xs text-amber-200">
              Fila de scans indisponível. Inicie o Redis e o worker para ativar a execução assíncrona.
                  </div>
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <HackerCard title="CRITICAL_ALERTS" value={alerts.length} icon={AlertTriangle} subtitle="HIGH PRIORITY" />
                <HackerCard title="MEDIUM_ALERTS" value={mediumCount} icon={ShieldCheck} subtitle="WATCHLIST" />
                <HackerCard title="SCANS_RUNNING" value={scansInExecution} icon={Activity} subtitle="QUEUE STATUS" />
                <HackerCard title="LAST_SCAN" value={<span className="text-2xl">{lastScanLabel}</span>} icon={Clock} subtitle="LATEST REPORT" />
          </section>

              <section className="bg-black border-2 border-green-500 p-6">
                <div className="flex items-center justify-between mb-4 text-green-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold">ACTIVITY_LOG</span>
              </div>
                  <span className="text-xs text-green-700">
                Últimos {activityData?.length || 0} registros
              </span>
            </div>
                <div className="space-y-3 text-sm">
              {(activityData || []).length === 0 && (
                    <div className="text-green-700">Sem atividade registrada recentemente.</div>
              )}
              {(activityData || []).map((activity) => (
                <div
                  key={activity.id}
                      className="flex items-center justify-between border border-green-900/40 rounded-lg px-4 py-3 text-green-400"
                >
                  <div>
                        <div className="text-green-400">{activity.message}</div>
                        <div className="text-xs text-green-700">
                      {activity.site_url || activity.site_name || "Sistema"} •{" "}
                      {new Date(activity.created_at).toLocaleString("pt-BR")}
                        </div>
                      </div>
                      <span className="text-xs text-green-600 uppercase">{activity.log_type}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeSection === "scans" && (
            <section id="scans" className="scroll-mt-24 space-y-6">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-green-500">SCANS DE SEGURANÇA</h2>
                <p className="text-green-700 text-sm">
                  Inicie scans assíncronos e acompanhe o histórico de execução.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartScan}
                  disabled={!canStartScan || isStarting}
                  className="inline-flex items-center gap-2 border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  [ INICIAR_SCAN ]
                </button>
              </div>
            </header>

            <div className="bg-black border-2 border-green-500 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase text-green-700">Tipo de Scan</label>
                  <select
                    value={scanKind}
                    onChange={(event) => setScanKind(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                    disabled={!canStartScan}
                  >
                    <option value="security">Semgrep (SAST)</option>
                    <option value="zap">OWASP ZAP (DAST)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-green-700">Modo ZAP</label>
                  <select
                    value={zapMode}
                    onChange={(event) => setZapMode(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                    disabled={scanKind !== "zap" || !canStartScan}
                  >
                    <option value="simple">Simples</option>
                    <option value="full">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-green-700">Alvo (ZAP)</label>
                  <select
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                    disabled={scanKind !== "zap" || !canStartScan}
                  >
                    <option value="">Selecionar site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.url}>
                        {site.url || site.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {!canStartScan && (
                <p className="text-xs text-green-700">
                  Apenas administradores e equipe de segurança podem iniciar scans.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-sm font-semibold border ${
                  activeTab === "history"
                    ? "border-green-500 text-green-300 bg-green-500/10"
                    : "border-green-900 text-green-700"
                }`}
              >
                [ HISTÓRICO ]
              </button>
              <button
                onClick={() => setActiveTab("queue")}
                className={`px-4 py-2 text-sm font-semibold border ${
                  activeTab === "queue"
                    ? "border-green-500 text-green-300 bg-green-500/10"
                    : "border-green-900 text-green-700"
                }`}
              >
                [ FILA ]
              </button>
            </div>

            {activeTab === "history" && (
              <section className="bg-black border-2 border-green-500 overflow-hidden">
                <div className="px-6 py-4 border-b border-green-900/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400">HISTÓRICO</h3>
                    <p className="text-sm text-green-700">Últimos jobs concluídos ou falhos.</p>
                  </div>
                  <span className="text-xs text-green-700">{historyJobs.length} registros</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-green-700 bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left">Tipo</th>
                        <th className="px-6 py-3 text-left">Alvo</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Severidade</th>
                        <th className="px-6 py-3 text-left">Data</th>
                        <th className="px-6 py-3 text-left">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-900/40">
                      {historyJobs.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-6 text-green-700">
                            Nenhum scan concluído ainda.
                          </td>
                        </tr>
                      )}
                      {historyJobs.map((job) => (
                        <tr key={job.id} className="text-green-300">
                          <td className="px-6 py-4">{job.type === "zap" ? "OWASP ZAP" : "Semgrep"}</td>
                          <td className="px-6 py-4">{job.target || "Código"}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs border border-green-900/60 text-green-300">
                              {STATUS_LABELS[job.state] || job.state}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-green-700">—</td>
                          <td className="px-6 py-4">
                            {job.finishedAt ? new Date(job.finishedAt).toLocaleString("pt-BR") : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleOpenReport(job.type === "zap" ? "zap" : "security")}
                              disabled={!reportAvailability[job.type === "zap" ? "zap" : "security"]}
                              className="inline-flex items-center gap-2 text-xs text-green-300 hover:text-green-200 disabled:opacity-40"
                            >
                              <FileText className="w-4 h-4" />
                              Ver Relatório
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "queue" && (
              <section className="bg-black border-2 border-green-500 overflow-hidden">
                <div className="px-6 py-4 border-b border-green-900/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400">FILA DE EXECUÇÃO</h3>
                    <p className="text-sm text-green-700">Jobs aguardando ou em execução.</p>
                  </div>
                  <span className="text-xs text-green-700">{queueJobs.length} jobs</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-green-700 bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left">Tipo</th>
                        <th className="px-6 py-3 text-left">Alvo</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Criado</th>
                        <th className="px-6 py-3 text-left">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-900/40">
                      {queueJobs.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-6 text-green-700">
                            Nenhum scan aguardando execução.
                          </td>
                        </tr>
                      )}
                      {queueJobs.map((job) => (
                        <tr key={job.id} className="text-green-300">
                          <td className="px-6 py-4">{job.type === "zap" ? "OWASP ZAP" : "Semgrep"}</td>
                          <td className="px-6 py-4">{job.target || "Código"}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs border border-green-900/60 text-green-300">
                              {STATUS_LABELS[job.state] || job.state}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {job.createdAt ? new Date(job.createdAt).toLocaleString("pt-BR") : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              disabled
                              className="inline-flex items-center gap-2 text-xs text-green-700 cursor-not-allowed"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            </section>
          )}

          {activeSection === "alerts" && (
            <section id="alerts" className="scroll-mt-24 space-y-6">
              <header className="space-y-2">
                <h2 className="text-2xl font-semibold text-green-500">ALERTAS & RISCOS</h2>
                <p className="text-green-700 text-sm">
                  Acompanhe tendências e severidade dos alertas críticos.
                </p>
              </header>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-black border-2 border-green-500 p-4">
                  <AlertsChart data={alertsChartData} />
                </div>
                <div className="bg-black border-2 border-green-500 p-4">
                  <ScansChart data={scanChartData} />
                </div>
              </div>
            </section>
          )}

          {activeSection === "sites" && (
            <section id="sites" className="scroll-mt-24 space-y-6">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-green-500">SITES MONITORADOS</h2>
              <p className="text-green-700 text-sm">
                Status operacional, últimos scans e vulnerabilidades detectadas.
              </p>
            </header>

            <div className="bg-black border-2 border-green-500 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase text-green-700">Buscar</label>
                <input
                  value={siteSearchTerm}
                  onChange={(event) => setSiteSearchTerm(event.target.value)}
                  placeholder="Buscar por URL..."
                  className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-green-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Atenção</option>
                </select>
              </div>
            </div>

            <section className="bg-black border-2 border-green-500 overflow-hidden">
              <div className="px-6 py-4 border-b border-green-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-400">INVENTÁRIO</h3>
                  <p className="text-sm text-green-700">Visão consolidada dos ativos monitorados.</p>
                </div>
                <span className="text-xs text-green-700">{filteredSites.length} sites</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-green-700 bg-black">
                    <tr>
                      <th className="px-6 py-3 text-left">Site</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Último Scan</th>
                      <th className="px-6 py-3 text-left">Última Vulnerabilidade</th>
                      <th className="px-6 py-3 text-left">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-900/40">
                    {isSitesLoading && (
                      <tr>
                        <td colSpan="5" className="px-6 py-6 text-green-700">
                          Carregando sites...
                        </td>
                      </tr>
                    )}
                    {!isSitesLoading && filteredSites.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-6 text-green-700">
                          Nenhum site encontrado.
                        </td>
                      </tr>
                    )}
                    {filteredSites.map((site) => (
                      <tr key={site.id} className="text-green-300">
                        <td className="px-6 py-4">
                          <div className="text-sm">{site.url || site.name}</div>
                          <div className="text-xs text-green-700">Vulns: {site.vulnerabilities || 0}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold ${renderStatus(site.status)}`}>
                            {(site.status || "unknown").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {site.last_scan ? new Date(site.last_scan).toLocaleString("pt-BR") : "Nunca"}
                        </td>
                        <td className="px-6 py-4 text-green-700">
                          {site.last_alert_message ? (
                            <div>
                              <div className="text-green-300">{site.last_alert_message}</div>
                              <div className="text-xs text-green-700">
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
                            onClick={() => handleRunSiteScan(site)}
                            disabled={!canStartScan}
                            className="inline-flex items-center gap-2 text-xs text-green-300 hover:text-green-200 disabled:opacity-40"
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
            </section>
          )}

          {activeSection === "logs" && (
            <section id="logs" className="scroll-mt-24 space-y-6">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-green-500">LOGS & AUDITORIA</h2>
              <p className="text-green-700 text-sm">
                Rastreie operações críticas, acessos e alterações do sistema.
              </p>
            </header>

            <section className="bg-black border-2 border-green-500 p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs uppercase text-green-700">Busca</label>
                <input
                  value={logSearchTerm}
                  onChange={(event) => setLogSearchTerm(event.target.value)}
                  placeholder="Buscar por mensagem..."
                  className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-green-700">Severidade</label>
                <select
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
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
                <label className="text-xs uppercase text-green-700">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-black border-2 border-green-500 px-3 py-2 text-sm text-green-300"
                >
                  <option value="all">Todos</option>
                  <option value="scan">Scan</option>
                  <option value="security">Security</option>
                  <option value="auth">Auth</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-green-700">Período</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-lg bg-black border-2 border-green-500 px-2 py-2 text-sm text-green-300"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full rounded-lg bg-black border-2 border-green-500 px-2 py-2 text-sm text-green-300"
                  />
                </div>
              </div>
            </section>

            <section className="bg-black border-2 border-green-500 overflow-hidden">
              <div className="px-6 py-4 border-b border-green-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-400">REGISTROS</h3>
                  <p className="text-sm text-green-700">Base para compliance e auditoria.</p>
                </div>
                <span className="text-xs text-green-700">{filteredLogs.length} eventos</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-green-700 bg-black">
                    <tr>
                      <th className="px-6 py-3 text-left">Severidade</th>
                      <th className="px-6 py-3 text-left">Tipo</th>
                      <th className="px-6 py-3 text-left">Mensagem</th>
                      <th className="px-6 py-3 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-900/40">
                    {isLogsLoading && (
                      <tr>
                        <td colSpan="4" className="px-6 py-6 text-green-700">
                          Carregando logs...
                        </td>
                      </tr>
                    )}
                    {!isLogsLoading && filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-6 text-green-700">
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    )}
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="text-green-300">
                        <td className={`px-6 py-4 text-xs font-semibold ${renderSeverity(log.severity)}`}>
                          {(log.severity || "info").toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-xs uppercase text-green-700">
                          {log.log_type || "system"}
                        </td>
                        <td className="px-6 py-4">{log.message}</td>
                        <td className="px-6 py-4 text-green-700">
                          {log.created_at ? new Date(log.created_at).toLocaleString("pt-BR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            </section>
          )}

          {activeSection === "users" && (
            <section id="users" className="scroll-mt-24 space-y-4">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-green-500">USUÁRIOS & ACESSOS</h2>
              <p className="text-green-700 text-sm">
                Administração de contas e permissões centralizada no dashboard.
              </p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black border-2 border-green-500 p-6 space-y-4">
                <div className="text-sm text-green-400 font-bold">PERFIL ATUAL</div>
                <div className="space-y-2 text-sm text-green-300">
                  <div>
                    <span className="text-green-700">E-mail:</span>{" "}
                    <span>{user?.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Perfil:</span>{" "}
                    <span className="uppercase">{user?.role || "viewer"}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Status:</span>{" "}
                    <span>{user?.is_active === false ? "Bloqueado" : "Ativo"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-black border-2 border-green-500 p-6 space-y-4">
                <div className="text-sm text-green-400 font-bold">PERMISSÕES & REGRAS</div>
                <ul className="text-sm text-green-300 space-y-2">
                  <li>Admin: controle total, apenas 1 administrador ativo.</li>
                  <li>Segurança: pode iniciar scans e ver alertas críticos.</li>
                  <li>Viewer: acesso somente leitura aos painéis.</li>
                </ul>
                <div className="text-xs text-green-700">
                  Gerencie contas via área restrita na tela de login.
                </div>
              </div>
            </div>
            </section>
          )}

          {activeSection === "settings" && (
            <section id="settings" className="scroll-mt-24 space-y-4">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-green-500">CONFIGURAÇÕES</h2>
              <p className="text-green-700 text-sm">
                Ajustes do sistema disponíveis diretamente no painel.
              </p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-black border-2 border-green-500 p-6 space-y-3">
                <div className="text-sm text-green-400 font-bold">INFRAESTRUTURA</div>
                <div className="text-sm text-green-300 space-y-1">
                  <div>
                    Redis:{" "}
                    <span className={queueStatus?.available ? "text-emerald-300" : "text-red-400"}>
                      {queueStatus?.available ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <div>
                    Fila:{" "}
                    <span className="text-green-300">
                      {queueStatus?.available ? "DISPONÍVEL" : "INDISPONÍVEL"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black border-2 border-green-500 p-6 space-y-3">
                <div className="text-sm text-green-400 font-bold">FILA DE SCANS</div>
                <div className="text-sm text-green-300 space-y-1">
                  <div>Ativos: {queueStatus?.counts?.active || 0}</div>
                  <div>Aguardando: {queueStatus?.counts?.waiting || 0}</div>
                  <div>Agendados: {queueStatus?.counts?.delayed || 0}</div>
                </div>
              </div>

              <div className="bg-black border-2 border-green-500 p-6 space-y-3">
                <div className="text-sm text-green-400 font-bold">RELATÓRIOS</div>
                <div className="text-sm text-green-300 space-y-1">
                  <div>Total: {reportsData?.length || 0}</div>
                  <div>Último scan: {lastScanLabel}</div>
                </div>
              </div>
            </div>
          </section>
          )}
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setReportData(null)
          setReportType(null)
        }}
        title={modalTitle}
        size="xl"
      >
        {reportType === "security" && <SemgrepReportViewer data={reportData} />}
        {reportType === "zap" && <ZapReportViewer htmlContent={reportData} />}
        {reportType === "security-gate" && <SecurityGateReportViewer data={reportData} />}
        {!reportType && reportData === null && (
          <div className="text-green-400 text-center p-8">Carregando relatório...</div>
        )}
      </Modal>
    </div>
  )
}
