import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Play, FileText, XCircle, Loader2 } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
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

export default function Scans() {
  const { user } = useAuth()
  const canStartScan = ["admin", "security"].includes(user?.role)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "history")
  const [scanKind, setScanKind] = useState(searchParams.get("tool") === "zap" ? "zap" : "security")
  const [zapMode, setZapMode] = useState("simple")
  const [target, setTarget] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [reportData, setReportData] = useState(null)
  const [reportType, setReportType] = useState(null)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
    const tool = searchParams.get("tool")
    if (tool && tool !== scanKind) {
      setScanKind(tool === "zap" ? "zap" : "security")
    }
  }, [searchParams, activeTab, scanKind])

  const { data: queueStatus } = useQuery({
    queryKey: ["scan-queue-status"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/scans/queue")
      return response.data
    },
    enabled: !!user,
    refetchInterval: 10000
  })

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/sites")
      return response.data.sites || []
    },
    enabled: !!user,
    initialData: []
  })

  const { data: reportsData = [] } = useQuery({
    queryKey: ["scan-reports"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/scans/reports")
      return response.data.reports || []
    },
    enabled: !!user
  })

  const reportAvailability = useMemo(() => {
    return reportsData.reduce((acc, report) => {
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab, tool: scanKind })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="pl-64">
        <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
          <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white">Scans de Segurança</h1>
              <p className="text-slate-400">
                Inicie scans assíncronos e acompanhe o histórico de execução.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartScan}
                disabled={!canStartScan || isStarting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500/90 hover:bg-blue-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Iniciar Scan
              </button>
            </div>
          </header>

          <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase text-slate-400">Tipo de Scan</label>
                <select
                  value={scanKind}
                  onChange={(event) => setScanKind(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                  disabled={!canStartScan}
                >
                  <option value="security">Semgrep (SAST)</option>
                  <option value="zap">OWASP ZAP (DAST)</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-400">Modo ZAP</label>
                <select
                  value={zapMode}
                  onChange={(event) => setZapMode(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
                  disabled={scanKind !== "zap" || !canStartScan}
                >
                  <option value="simple">Simples</option>
                  <option value="full">Completo</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-400">Alvo (ZAP)</label>
                <select
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm"
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
              <p className="text-xs text-slate-500">
                Apenas administradores e equipe de segurança podem iniciar scans.
              </p>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            <button
              onClick={() => handleTabChange("history")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === "history" ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400"
              }`}
            >
              Histórico de Scans
            </button>
            <button
              onClick={() => handleTabChange("queue")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === "queue" ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400"
              }`}
            >
              Fila de Execução
            </button>
          </section>

          {activeTab === "history" && (
            <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Histórico</h2>
                  <p className="text-sm text-slate-400">Últimos jobs concluídos ou falhos.</p>
                </div>
                <span className="text-xs text-slate-500">{historyJobs.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-950/70">
                    <tr>
                      <th className="px-6 py-3 text-left">Tipo</th>
                      <th className="px-6 py-3 text-left">Alvo</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Severidade</th>
                      <th className="px-6 py-3 text-left">Data</th>
                      <th className="px-6 py-3 text-left">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {historyJobs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-6 text-slate-500">
                          Nenhum scan concluído ainda.
                        </td>
                      </tr>
                    )}
                    {historyJobs.map((job) => (
                      <tr key={job.id} className="text-slate-200">
                        <td className="px-6 py-4">{job.type === "zap" ? "OWASP ZAP" : "Semgrep"}</td>
                        <td className="px-6 py-4">{job.target || "Código"}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-slate-800 text-slate-200">
                            {STATUS_LABELS[job.state] || job.state}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">—</td>
                        <td className="px-6 py-4">
                          {job.finishedAt ? new Date(job.finishedAt).toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenReport(job.type === "zap" ? "zap" : "security")}
                            disabled={!reportAvailability[job.type === "zap" ? "zap" : "security"]}
                            className="inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 disabled:opacity-40"
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
            <section className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800/70 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Fila de Execução</h2>
                  <p className="text-sm text-slate-400">Jobs aguardando ou em execução.</p>
                </div>
                <span className="text-xs text-slate-500">{queueJobs.length} jobs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-950/70">
                    <tr>
                      <th className="px-6 py-3 text-left">Tipo</th>
                      <th className="px-6 py-3 text-left">Alvo</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Criado</th>
                      <th className="px-6 py-3 text-left">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {queueJobs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-6 text-slate-500">
                          Nenhum scan aguardando execução.
                        </td>
                      </tr>
                    )}
                    {queueJobs.map((job) => (
                      <tr key={job.id} className="text-slate-200">
                        <td className="px-6 py-4">{job.type === "zap" ? "OWASP ZAP" : "Semgrep"}</td>
                        <td className="px-6 py-4">{job.target || "Código"}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-slate-800 text-slate-200">
                            {STATUS_LABELS[job.state] || job.state}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {job.createdAt ? new Date(job.createdAt).toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            disabled
                            className="inline-flex items-center gap-2 text-xs text-slate-500 cursor-not-allowed"
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
