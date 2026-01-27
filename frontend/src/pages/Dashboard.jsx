import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Globe, Scan, AlertTriangle, Activity, RefreshCw, Shield, Zap, FileText, Loader2, ExternalLink } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
import StatsCard from "@/components/cyber/StatsCard"
import AlertsChart from "@/components/cyber/AlertsChart"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { SemgrepReportViewer, ZapReportViewer, SecurityGateReportViewer } from "@/components/cyber/ReportViewer"
import { useAuth } from "@/lib/AuthContext"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/api/client"
import toast from "react-hot-toast"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // Buscar estatísticas reais da API com polling automático
  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/dashboard/stats')
      return response.data.stats || { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 }
    },
    enabled: !!user,
    initialData: { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    refetchIntervalInBackground: false,
    staleTime: 10000,
    cacheTime: 60000
  })

  const stats = statsData || { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 }

  // Buscar atividade recente com polling automático
  const { data: activitiesData, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/dashboard/activity?limit=3')
      return response.data.activities || []
    },
    enabled: !!user,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    refetchIntervalInBackground: false,
    staleTime: 10000,
    cacheTime: 60000
  })

  const activities = activitiesData || []

  // Buscar dados do gráfico de alertas
  const { data: chartData } = useQuery({
    queryKey: ['dashboard-alerts-chart'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/dashboard/alerts-chart')
      return response.data.data || []
    },
    enabled: !!user
  })

  // Estados para os scans
  const [isRunningSecurityScan, setIsRunningSecurityScan] = useState(false)
  const [isRunningZapScan, setIsRunningZapScan] = useState(false)
  const [isRunningZapFullScan, setIsRunningZapFullScan] = useState(false)
  
  // Ref para armazenar intervalos de polling
  const pollingIntervalsRef = useRef([])

  // Estados para o modal de relatórios
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [reportData, setReportData] = useState(null)
  const [reportType, setReportType] = useState(null)

  // Estado para rastrear timestamps dos relatórios (para detectar novos)
  const [lastReportTimestamps, setLastReportTimestamps] = useState({})

  // Buscar relatórios disponíveis com polling automático
  const { data: reportsData, refetch: refetchReports, isFetching: isFetchingReports } = useQuery({
    queryKey: ['scan-reports'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/protected/scans/reports', {
          // Adicionar timestamp para evitar cache
          params: { _t: Date.now() }
        })
        return response.data.reports || []
      } catch (error) {
        // Silenciar erros esperados (arquivos não encontrados são normais)
        if (error.response?.status === 404 || error.response?.status === 500) {
          // Retornar array vazio em caso de erro, não propagar
          return []
        }
        throw error
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Verificar a cada 30 segundos (reduzido para evitar spam)
    refetchIntervalInBackground: false, // Não verificar quando a aba não está ativa
    staleTime: 10000, // Dados válidos por 10 segundos
    cacheTime: 60000, // Manter cache por 1 minuto
    refetchOnMount: true, // Sempre buscar ao montar
    refetchOnWindowFocus: true, // Buscar quando a janela recebe foco
    retry: 1, // Tentar apenas 1 vez em caso de erro
    retryDelay: 2000 // Aguardar 2 segundos entre tentativas
  })

  const reports = reportsData || []

  // Inicializar timestamps na primeira carga e detectar novos relatórios
  useEffect(() => {
    if (!reports || reports.length === 0) return

    setLastReportTimestamps(prev => {
      const currentTimestamps = { ...prev }
      const newReports = []

      reports.forEach((report) => {
        if (report.exists && report.lastModified) {
          const reportKey = report.type
          const lastTimestamp = prev[reportKey]
          const currentTimestamp = new Date(report.lastModified).getTime()

          // Se já temos um timestamp anterior e o atual é mais recente, é um novo relatório
          if (lastTimestamp && currentTimestamp > lastTimestamp) {
            newReports.push(reportKey)
          }

          // Atualizar timestamp
          currentTimestamps[reportKey] = currentTimestamp
        }
      })

      // Mostrar notificações após atualizar o estado (evita setState durante render)
      if (newReports.length > 0) {
        setTimeout(() => {
          const reportNames = {
            'security': 'Semgrep Security Scan',
            'zap': 'OWASP ZAP Scan Report',
            'security-gate': 'Security Gate Summary'
          }
          
          newReports.forEach(reportKey => {
            toast.success(`📄 Novo relatório disponível: ${reportNames[reportKey] || 'Relatório'}`, {
              duration: 5000
            })
          })
        }, 0)
      }

      return currentTimestamps
    })
  }, [reports])

  const handleRefresh = () => {
    refetchStats()
    refetchReports()
    toast.success("Dados atualizados!")
  }

  // Limpar intervalos ao desmontar
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach(interval => clearInterval(interval))
      pollingIntervalsRef.current.length = 0
    }
  }, [])

  // Executar scan de segurança (Semgrep)
  const handleRunSecurityScan = async () => {
    setIsRunningSecurityScan(true)
    try {
      const response = await apiClient.post('/api/protected/scans/security')
      toast.success(response.data.message || 'Scan de segurança iniciado!')
      
      // Polling moderado após iniciar o scan (não criar intervalo manual, usar refetch do useQuery)
      // Apenas forçar refetch algumas vezes após iniciar o scan
      let pollCount = 0
      const maxPolls = 12 // 12 tentativas = 6 minutos (30s cada)
      const pollInterval = setInterval(() => {
        pollCount++
        try {
          refetchReports().catch(() => {}) // Silenciar erros de refetch
          refetchStats().catch(() => {}) // Silenciar erros de refetch
          refetchActivity().catch(() => {}) // Atualizar atividade também
        } catch (err) {
          // Ignorar erros silenciosamente
        }
        
        // Parar polling após maxPolls
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          const index = pollingIntervalsRef.current.indexOf(pollInterval)
          if (index > -1) pollingIntervalsRef.current.splice(index, 1)
        }
      }, 30000) // Poll a cada 30 segundos (reduzido)
      
      pollingIntervalsRef.current.push(pollInterval)
      
      // Limpar intervalo após 6 minutos
      setTimeout(() => {
        clearInterval(pollInterval)
        const index = pollingIntervalsRef.current.indexOf(pollInterval)
        if (index > -1) pollingIntervalsRef.current.splice(index, 1)
      }, 360000) // 6 minutos máximo
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao iniciar scan de segurança')
      console.error('Erro ao iniciar scan:', error)
    } finally {
      setIsRunningSecurityScan(false)
    }
  }

  // Executar scan ZAP simplificado
  const handleRunZapScan = async () => {
    setIsRunningZapScan(true)
    try {
      const response = await apiClient.post('/api/protected/scans/zap', { scanType: 'simple' })
      toast.success(response.data.message || 'Scan ZAP iniciado!')
      
      // Polling moderado após iniciar o scan
      let pollCount = 0
      const maxPolls = 12 // 12 tentativas = 6 minutos (30s cada)
      const pollInterval = setInterval(() => {
        pollCount++
        try {
          refetchReports().catch(() => {}) // Silenciar erros de refetch
          refetchStats().catch(() => {}) // Silenciar erros de refetch
          refetchActivity().catch(() => {}) // Atualizar atividade também
        } catch (err) {
          // Ignorar erros silenciosamente
        }
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          const index = pollingIntervalsRef.current.indexOf(pollInterval)
          if (index > -1) pollingIntervalsRef.current.splice(index, 1)
        }
      }, 30000) // Poll a cada 30 segundos
      
      pollingIntervalsRef.current.push(pollInterval)
      
      setTimeout(() => {
        clearInterval(pollInterval)
        const index = pollingIntervalsRef.current.indexOf(pollInterval)
        if (index > -1) pollingIntervalsRef.current.splice(index, 1)
      }, 360000) // 6 minutos máximo
    } catch (error) {
      // Apenas mostrar toast, não logar no console (evitar spam)
      toast.error(error.response?.data?.message || 'Erro ao iniciar scan ZAP')
    } finally {
      setIsRunningZapScan(false)
    }
  }

  // Executar scan ZAP completo
  const handleRunZapFullScan = async () => {
    setIsRunningZapFullScan(true)
    try {
      const response = await apiClient.post('/api/protected/scans/zap', { scanType: 'full' })
      toast.success(response.data.message || 'Scan ZAP completo iniciado!')
      
      // Polling moderado após iniciar o scan (ZAP completo pode demorar mais)
      let pollCount = 0
      const maxPolls = 20 // 20 tentativas = 10 minutos (30s cada)
      const pollInterval = setInterval(() => {
        pollCount++
        try {
          refetchReports().catch(() => {}) // Silenciar erros de refetch
          refetchStats().catch(() => {}) // Silenciar erros de refetch
          refetchActivity().catch(() => {}) // Atualizar atividade também
        } catch (err) {
          // Ignorar erros silenciosamente
        }
        
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          const index = pollingIntervalsRef.current.indexOf(pollInterval)
          if (index > -1) pollingIntervalsRef.current.splice(index, 1)
        }
      }, 30000) // Poll a cada 30 segundos
      
      pollingIntervalsRef.current.push(pollInterval)
      
      setTimeout(() => {
        clearInterval(pollInterval)
        const index = pollingIntervalsRef.current.indexOf(pollInterval)
        if (index > -1) pollingIntervalsRef.current.splice(index, 1)
      }, 600000) // 10 minutos máximo
    } catch (error) {
      // Apenas mostrar toast, não logar no console (evitar spam)
      toast.error(error.response?.data?.message || 'Erro ao iniciar scan ZAP completo')
    } finally {
      setIsRunningZapFullScan(false)
    }
  }

  // Abrir/visualizar relatório no modal
  const handleOpenReport = async (reportTypeParam) => {
    try {
      setIsModalOpen(false) // Fechar modal anterior se estiver aberto
      setReportData(null) // Limpar dados anteriores
      setReportType(null) // Limpar tipo anterior
      
      // Determinar título do modal
      const titles = {
        'security': 'Relatório Semgrep Security Scan',
        'zap': 'Relatório OWASP ZAP',
        'security-gate': 'Security Gate Summary'
      }
      setModalTitle(titles[reportTypeParam] || 'Relatório')
      
      // Abrir modal primeiro para mostrar loading
      setIsModalOpen(true)
      
      // Usar fetch direto para ter controle total sobre o responseType
      const token = localStorage.getItem('auth_token')
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000'
      const url = `${baseURL}/api/protected/scans/reports/${reportTypeParam}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        // Se for 404, arquivo não existe (é esperado, não mostrar erro)
        if (response.status === 404) {
          toast.error('Relatório ainda não foi gerado')
          setIsModalOpen(false)
          return
        }
        const errorData = await response.json().catch(() => ({ message: 'Erro ao carregar relatório' }))
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
      }

      if (reportTypeParam === 'zap') {
        // Para HTML, obter como texto
        const htmlContent = await response.text()
        if (!htmlContent || htmlContent.trim().length === 0) {
          throw new Error('Relatório HTML está vazio')
        }
        setReportData(htmlContent)
        setReportType('zap')
      } else {
        // Para JSON, obter como texto primeiro para validar
        const textContent = await response.text()
        
        if (!textContent || textContent.trim().length === 0) {
          throw new Error('Relatório JSON está vazio')
        }
        
        // Tentar parsear o JSON
        let jsonData
        try {
          jsonData = JSON.parse(textContent)
        } catch (parseError) {
          console.error('Erro ao parsear JSON:', parseError)
          console.error('Conteúdo recebido:', textContent.substring(0, 200))
          throw new Error('Relatório JSON inválido ou corrompido')
        }
        
        setReportData(jsonData)
        setReportType(reportTypeParam)
      }
    } catch (error) {
      // Apenas mostrar toast, não logar no console (evitar spam)
      const errorMessage = error.message || 'Erro ao carregar relatório'
      toast.error(errorMessage)
      setIsModalOpen(false) // Fechar modal em caso de erro
      setReportData(null)
      setReportType(null)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-500 mt-1">Visão geral do sistema de segurança</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Sites Monitorados"
            value={loadingStats ? "..." : stats.sites}
            icon={Globe}
            color="blue"
          />
          <StatsCard
            title="Scans Executados"
            value={loadingStats ? "..." : stats.scans}
            icon={Scan}
            color="green"
          />
          <StatsCard
            title="Vulnerabilidades Críticas"
            value={loadingStats ? "..." : stats.vulnerabilities}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Alertas Hoje"
            value={loadingStats ? "..." : stats.alerts}
            icon={Activity}
            color="cyan"
          />
        </div>

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">🔒 Ações de Segurança</h3>
              <p className="text-gray-400 text-sm mt-1">Execute scans de segurança com um clique</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Botão Scan Semgrep */}
            <Button
              onClick={handleRunSecurityScan}
              disabled={isRunningSecurityScan}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-auto py-4 px-6 flex flex-col items-center gap-2"
            >
              {isRunningSecurityScan ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isRunningSecurityScan ? 'Executando...' : 'Scan Semgrep'}
              </span>
              <span className="text-xs opacity-90">Análise estática de código</span>
            </Button>

            {/* Botão Scan ZAP Simples */}
            <Button
              onClick={handleRunZapScan}
              disabled={isRunningZapScan}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 h-auto py-4 px-6 flex flex-col items-center gap-2"
            >
              {isRunningZapScan ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isRunningZapScan ? 'Executando...' : 'Scan ZAP Simples'}
              </span>
              <span className="text-xs opacity-90">Testes básicos de segurança</span>
            </Button>

            {/* Botão Scan ZAP Completo */}
            <Button
              onClick={handleRunZapFullScan}
              disabled={isRunningZapFullScan}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 h-auto py-4 px-6 flex flex-col items-center gap-2"
            >
              {isRunningZapFullScan ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Scan className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isRunningZapFullScan ? 'Executando...' : 'Scan ZAP Completo'}
              </span>
              <span className="text-xs opacity-90">Análise completa OWASP ZAP</span>
            </Button>
          </div>

          {/* Relatórios Disponíveis */}
          {reports.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Relatórios Disponíveis
                  {isFetchingReports && (
                    <span className="text-xs text-gray-400 ml-2 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Atualizando...
                    </span>
                  )}
                </h4>
                <Button
                  onClick={() => {
                    refetchReports()
                    toast.success('Relatórios atualizados!')
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {reports.map((report) => (
                  <div
                    key={`${report.type}-${report.lastModified || 'none'}`}
                    onClick={() => report.exists && handleOpenReport(report.type)}
                    className={`p-3 rounded-lg border transition-all group ${
                      report.exists
                        ? 'bg-slate-800/30 border-green-500/30 cursor-pointer hover:bg-slate-800/50 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10'
                        : 'bg-slate-800/10 border-slate-700/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white">{report.name}</p>
                        {report.exists && report.lastModified && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(report.lastModified).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        )}
                        {!report.exists && (
                          <p className="text-xs text-gray-500 mt-1">Não disponível</p>
                        )}
                      </div>
                      {report.exists && (
                        <div className="flex items-center gap-2 ml-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <ExternalLink className="w-3 h-3 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Chart */}
        <AlertsChart data={chartData} />

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
            ) : (
              activities.map((activity, index) => {
                const getIcon = () => {
                  switch (activity.log_type) {
                    case 'scan': return Scan
                    case 'security': return AlertTriangle
                    default: return Globe
                  }
                }
                const getColor = () => {
                  switch (activity.severity) {
                    case 'error':
                    case 'critical': return 'text-red-400'
                    case 'warning': return 'text-yellow-400'
                    case 'success': return 'text-green-400'
                    default: return 'text-blue-400'
                  }
                }
                const formatTime = (dateString) => {
                  if (!dateString) return 'N/A'
                  const date = new Date(dateString)
                  const now = new Date()
                  const diffMs = now - date
                  const diffMins = Math.floor(diffMs / 60000)
                  if (diffMins < 1) return 'Agora'
                  if (diffMins < 60) return `${diffMins} min atrás`
                  const diffHours = Math.floor(diffMins / 60)
                  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
                  const diffDays = Math.floor(diffHours / 24)
                  return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
                }
                const Icon = getIcon()
                const color = getColor()
                return (
                  <motion.div
                    key={activity.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                  >
                    <div className={`p-2 rounded-lg bg-slate-800 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm">{activity.message}</p>
                      {activity.site_url && (
                        <p className="text-gray-500 text-xs mt-1">{activity.site_url}</p>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">{formatTime(activity.created_at)}</span>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.div>
      </main>

      {/* Modal de Relatórios */}
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
        {reportType === 'security' && <SemgrepReportViewer data={reportData} />}
        {reportType === 'zap' && <ZapReportViewer htmlContent={reportData} />}
        {reportType === 'security-gate' && <SecurityGateReportViewer data={reportData} />}
      </Modal>
    </div>
  )
}
