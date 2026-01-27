import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Globe, Scan, AlertTriangle, Activity, RefreshCw } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
import StatsCard from "@/components/cyber/StatsCard"
import AlertsChart from "@/components/cyber/AlertsChart"
import { Button } from "@/components/ui/button"
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

  // Buscar estatísticas reais da API
  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/dashboard/stats')
      return response.data.stats || { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 }
    },
    enabled: !!user,
    initialData: { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 }
  })

  const stats = statsData || { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 }

  // Buscar atividade recente
  const { data: activitiesData } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/dashboard/activity?limit=3')
      return response.data.activities || []
    },
    enabled: !!user
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

  const handleRefresh = () => {
    refetchStats()
    toast.success("Dados atualizados!")
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
    </div>
  )
}
