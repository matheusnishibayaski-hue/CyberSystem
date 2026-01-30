import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import HackerNavbar from "@/components/hacker/HackerNavbar";
import HackerTable from "@/components/hacker/HackerTable";
import TerminalBackground from "@/components/hacker/TerminalBackground";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";

export default function Sites() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { data: sites, isLoading, refetch } = useQuery({
    queryKey: ['sites', statusFilter],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/sites');
      return response.data.sites || [];
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    refetchOnWindowFocus: true
  });

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  const filteredSites = sites.filter(site => 
    searchTerm === "" || site.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'url', label: 'URL', render: (site) => site.url || site.name },
    { 
      key: 'status', 
      label: 'STATUS', 
      render: (site) => (
        <span className={
          site.status === 'active' ? 'text-green-500' : 
          site.status === 'offline' ? 'text-red-500' : 
          'text-yellow-500'
        }>
          {(site.status || 'UNKNOWN').toUpperCase()}
        </span>
      )
    },
    { 
      key: 'vulnerabilities', 
      label: 'VULNS', 
      render: (site) => (
        <span className={site.vulnerabilities > 0 ? 'text-red-500' : 'text-green-500'}>
          {site.vulnerabilities || 0}
        </span>
      )
    },
    { 
      key: 'last_scan', 
      label: 'LAST_SCAN', 
      render: (site) => site.last_scan ? new Date(site.last_scan).toLocaleString('pt-BR') : 'NEVER'
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
      <HackerNavbar currentPage="Sites" onLogout={handleLogout} />
      
      <main className="pt-20 px-6 pb-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-green-500 text-sm mb-2">root@cybersystem:~# ./sites --list</div>
          <h1 className="text-3xl font-bold text-green-500 mb-1">MONITORED SITES</h1>
          <p className="text-green-700 text-sm">[ {sites.length} TARGETS ACTIVE ]</p>
        </motion.div>

        {/* Sites Table */}
        <HackerTable data={filteredSites} columns={columns} isLoading={isLoading} />
      </main>
    </div>
  );
}
