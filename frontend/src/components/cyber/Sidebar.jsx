import { Link, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Globe, 
  FileText, 
  Shield, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TestTube2,
  Users,
  Settings,
  Circle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/api/client"
import { useAuth } from "@/lib/AuthContext"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  const role = user?.role
  const canSeeAlerts = ["admin", "security"].includes(role)
  const { data: alerts = [] } = useQuery({
    queryKey: ["critical-alerts"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/alerts")
      return response.data.alerts || []
    },
    enabled: !!user && canSeeAlerts,
    initialData: []
  })

  const menuItems = [
    { name: "Visão Geral", icon: LayoutDashboard, path: "/dashboard" },
    { 
      name: "Scans de Segurança", 
      icon: TestTube2, 
      path: "/scans",
      children: [
        { name: "Semgrep (SAST)", path: "/scans?tool=semgrep" },
        { name: "OWASP ZAP (DAST)", path: "/scans?tool=zap" }
      ]
    },
    { name: "Alertas & Riscos", icon: AlertTriangle, path: "/alerts", showAlertsBadge: true, roles: ["admin", "security"] },
    { name: "Sites Monitorados", icon: Globe, path: "/sites" },
    { name: "Logs & Auditoria", icon: FileText, path: "/logs" },
    { name: "Usuários & Acessos (RBAC)", icon: Users, path: "/users", roles: ["admin"] },
    { name: "Configurações", icon: Settings, path: "/settings", roles: ["admin"] }
  ]

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(role)
  })

  const currentPath = location.pathname
  const searchParams = new URLSearchParams(location.search)
  const toolParam = searchParams.get("tool")

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`
        fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
        border-r border-slate-800/50 z-50 transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  CyberSystem
                </h1>
                <p className="text-xs text-gray-500">Security Monitor</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`)
          const hasBadge = item.showAlertsBadge && alerts.length > 0
          return (
            <div key={item.path} className="space-y-2">
              <Link
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.showAlertsBadge && (
                  <div className="ml-auto">
                    {alerts.length > 0 && (
                      <div className="badge">{alerts.length}</div>
                    )}
                  </div>
                )}
                {isActive && !collapsed && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ${hasBadge ? 'ml-2' : 'ml-auto'}`}
                  />
                )}
              </Link>

              {!collapsed && item.children && (
                <div className="ml-8 space-y-1">
                  {item.children.map((child) => {
                    const basePath = child.path.split("?")[0]
                    const childTool = child.path.includes("tool=") ? child.path.split("tool=")[1] : null
                    const isChildActive =
                      currentPath === basePath && (!childTool || childTool === toolParam)
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          isChildActive
                            ? 'text-blue-300 bg-blue-500/10'
                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <Circle className="w-2.5 h-2.5" />
                        <span>{child.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
