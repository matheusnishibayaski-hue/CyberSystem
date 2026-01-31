import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, Activity, AlertTriangle, TestTube2, Globe, FileText, Users, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { useAuth } from "@/lib/AuthContext";

export default function HackerNavbar({ currentPage, onLogout }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role;
  const canSeeAlerts = ["admin", "security"].includes(role);
  const { data: alerts = [] } = useQuery({
    queryKey: ["critical-alerts"],
    queryFn: async () => {
      const response = await apiClient.get("/api/protected/alerts");
      return response.data.alerts || [];
    },
    enabled: !!user && canSeeAlerts,
    initialData: []
  });

  const menuItems = [
    { name: "DASHBOARD", page: "Dashboard", path: "/dashboard#overview", hash: "#overview", icon: Terminal },
    { 
      name: "SCANS", 
      page: "Scans", 
      path: "/dashboard#scans", 
      hash: "#scans",
      icon: TestTube2,
      children: [
        { name: "SEMGREP (SAST)", path: "/dashboard?tool=semgrep#scans", hash: "#scans", tool: "semgrep" },
        { name: "OWASP ZAP (DAST)", path: "/dashboard?tool=zap#scans", hash: "#scans", tool: "zap" }
      ]
    },
    { name: "ALERTAS", page: "Alerts", path: "/dashboard#alerts", hash: "#alerts", icon: AlertTriangle, showAlertsBadge: true, roles: ["admin", "security"] },
    { name: "SITES", page: "Sites", path: "/dashboard#sites", hash: "#sites", icon: Globe },
    { name: "LOGS", page: "Logs", path: "/dashboard#logs", hash: "#logs", icon: FileText },
    { name: "USUÁRIOS", page: "Users", path: "/dashboard#users", hash: "#users", icon: Users, roles: ["admin"] },
    { name: "CONFIG", page: "Settings", path: "/dashboard#settings", hash: "#settings", icon: Settings, roles: ["admin"] }
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const currentPath = location.pathname;
  const currentHash = location.hash || "#overview";
  const searchParams = new URLSearchParams(location.search);
  const toolParam = searchParams.get("tool");

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black border-b-2 border-green-500 font-mono"
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/Dashboard" className="flex items-center gap-3 group">
            <Terminal className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-green-500 font-bold text-lg tracking-wider">CYBERSYSTEM</div>
              <div className="text-green-700 text-xs flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {visibleMenuItems.map((item) => {
              const isDashboard = currentPath === "/dashboard";
              const isActive =
                (currentPage === item.page && isDashboard) ||
                (isDashboard && item.hash && currentHash === item.hash);
              return (
                <div key={item.page} className="relative group">
                  <Link
                    to={item.path}
                    className={`
                      px-4 py-2 text-sm transition-all inline-flex items-center gap-2
                      ${isActive 
                        ? 'bg-green-500/20 text-green-400 border border-green-500' 
                        : 'text-green-700 hover:text-green-500 hover:bg-green-500/10'
                      }
                    `}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span className="flex items-center gap-2">
                      [ {item.name} ]
                      {item.showAlertsBadge && alerts.length > 0 && (
                        <div className="badge">{alerts.length}</div>
                      )}
                    </span>
                  </Link>

                  {item.children && (
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:block">
                      <div className="bg-black border border-green-500 min-w-[220px] shadow-xl">
                        {item.children.map((child) => {
                          const isChildActive =
                            currentPath === "/dashboard" &&
                            currentHash === child.hash &&
                            (!child.tool || child.tool === toolParam);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`
                                block px-4 py-2 text-xs tracking-wider transition-all
                                ${isChildActive
                                  ? 'text-green-300 bg-green-500/10'
                                  : 'text-green-700 hover:text-green-400 hover:bg-green-500/10'
                                }
                              `}
                            >
                              [ {child.name} ]
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right section */}
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm border border-red-500 text-red-500 hover:bg-red-500/10 transition-all"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
