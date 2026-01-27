import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, AlertCircle, Info, AlertTriangle, XCircle, CheckCircle, Search, Filter } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/api/client"

export default function Logs() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // Buscar logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['logs', severityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (severityFilter) params.append('severity', severityFilter)
      if (typeFilter) params.append('log_type', typeFilter)
      params.append('limit', '100')
      
      const response = await apiClient.get(`/api/protected/logs?${params.toString()}`)
      return response.data.logs || []
    },
    enabled: !!user,
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  })

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'border-red-500/30 bg-red-500/10'
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10'
      case 'success':
        return 'border-green-500/30 bg-green-500/10'
      default:
        return 'border-blue-500/30 bg-blue-500/10'
    }
  }

  const filteredLogs = data?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.site_url?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Logs do Sistema</h1>
            <p className="text-gray-500">Visualize os logs de segurança</p>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas as severidades</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
              <option value="success">Success</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="scan">Scan</option>
              <option value="security">Security</option>
              <option value="access">Access</option>
              <option value="error">Error</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Lista de Logs */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
              Erro ao carregar logs: {error.message}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || severityFilter || typeFilter ? 'Nenhum log encontrado' : 'Nenhum log disponível'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || severityFilter || typeFilter 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Os logs aparecerão aqui quando houver atividade'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border rounded-xl p-4 ${getSeverityColor(log.severity)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getSeverityIcon(log.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-slate-800/50 rounded text-xs font-medium text-gray-300">
                            {log.log_type || 'system'}
                          </span>
                          <span className="px-2 py-1 bg-slate-800/50 rounded text-xs font-medium text-gray-300 capitalize">
                            {log.severity || 'info'}
                          </span>
                          {log.site_url && (
                            <span className="px-2 py-1 bg-slate-800/50 rounded text-xs font-medium text-blue-400 truncate max-w-[200px]">
                              {log.site_url}
                            </span>
                          )}
                        </div>
                        <p className="text-white mb-2">{log.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(log.created_at)}</span>
                          {log.ip_address && (
                            <span>IP: {log.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
