import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Plus, Trash2, Edit2, CheckCircle2, XCircle, Clock, Search } from "lucide-react"
import Sidebar from "@/components/cyber/Sidebar"
import { useAuth } from "@/lib/AuthContext"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/api/client"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Sites() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSite, setNewSite] = useState({ url: "", name: "" })
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // Buscar sites
  const { data, isLoading, error } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/sites')
      return response.data.sites || []
    },
    enabled: !!user
  })

  // Adicionar site
  const addMutation = useMutation({
    mutationFn: async (siteData) => {
      const response = await apiClient.post('/api/protected/sites', siteData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sites'])
      toast.success('Site adicionado com sucesso!')
      setShowAddModal(false)
      setNewSite({ url: "", name: "" })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar site')
    }
  })

  // Remover site
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/protected/sites/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sites'])
      toast.success('Site removido com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao remover site')
    }
  })

  const handleAddSite = (e) => {
    e.preventDefault()
    if (!newSite.url.trim()) {
      toast.error('URL é obrigatória')
      return
    }
    addMutation.mutate(newSite)
  }

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja remover este site?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredSites = data?.filter(site => 
    site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (site.name && site.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sites Monitorados</h1>
              <p className="text-gray-500">Gerencie os sites em monitoramento</p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Site
            </Button>
          </div>

          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar sites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Lista de Sites */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
              Erro ao carregar sites: {error.message}
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Nenhum site encontrado' : 'Nenhum site monitorado'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Tente buscar com outros termos' : 'Adicione seu primeiro site para começar o monitoramento'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Site
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSites.map((site, index) => (
                  <motion.div
                    key={site.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Globe className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold truncate max-w-[200px]">
                            {site.name || site.url}
                          </h3>
                          <p className="text-gray-500 text-sm truncate max-w-[200px]">
                            {site.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(site.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {site.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm">Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">Inativo</span>
                          </>
                        )}
                      </div>
                      {site.last_scan && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(site.last_scan).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Modal Adicionar Site */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Adicionar Site</h2>
                <form onSubmit={handleAddSite} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">URL *</label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={newSite.url}
                      onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">Nome (opcional)</label>
                    <Input
                      type="text"
                      placeholder="Nome do site"
                      value={newSite.name}
                      onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-slate-800/50 border-slate-700 text-gray-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={addMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    >
                      {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
