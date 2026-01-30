import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import HackerNavbar from "@/components/hacker/HackerNavbar";
import HackerTable from "@/components/hacker/HackerTable";
import TerminalBackground from "@/components/hacker/TerminalBackground";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";

export default function Logs() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['logs', severityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== "all") params.append('severity', severityFilter);
      if (typeFilter !== "all") params.append('log_type', typeFilter);
      params.append('limit', '100');
      
      const response = await apiClient.get(`/api/protected/logs?${params.toString()}`);
      return response.data.logs || [];
    },
    enabled: !!user,
    initialData: []
  });

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  const filteredLogs = logs.filter(log => 
    searchTerm === "" || log.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      key: 'severity', 
      label: 'SEVERITY', 
      render: (log) => (
        <span className={
          log.severity === 'critical' ? 'text-red-500' : 
          log.severity === 'error' ? 'text-red-400' : 
          log.severity === 'warning' ? 'text-yellow-500' : 
          log.severity === 'success' ? 'text-green-500' : 
          'text-cyan-500'
        }>
          {(log.severity || 'INFO').toUpperCase()}
        </span>
      )
    },
    { key: 'log_type', label: 'TYPE', render: (log) => (log.log_type || 'SYSTEM').toUpperCase() },
    { key: 'message', label: 'MESSAGE', render: (log) => log.message },
    { 
      key: 'created_at', 
      label: 'TIMESTAMP', 
      render: (log) => log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : 'N/A'
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative font-mono">
      <TerminalBackground />
      <HackerNavbar currentPage="Logs" onLogout={handleLogout} />
      
      <main className="pt-20 px-6 pb-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-green-500 text-sm mb-2">root@cybersystem:~# tail -f /var/log/security.log</div>
          <h1 className="text-3xl font-bold text-green-500 mb-1">SYSTEM LOGS</h1>
          <p className="text-green-700 text-sm">[ {logs.length} EVENTS LOGGED ]</p>
        </motion.div>

        {/* Logs Table */}
        <HackerTable data={filteredLogs} columns={columns} isLoading={isLoading} />
      </main>
    </div>
  );
}
