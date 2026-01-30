import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Scan, AlertTriangle, Activity, Shield, Zap, FileText } from "lucide-react";
import HackerNavbar from "@/components/hacker/HackerNavbar";
import HackerCard from "@/components/hacker/HackerCard";
import TerminalBackground from "@/components/hacker/TerminalBackground";
import { Modal } from "@/components/ui/modal";
import { SemgrepReportViewer, ZapReportViewer, SecurityGateReportViewer } from "@/components/cyber/ReportViewer";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Buscar estatísticas
  const { data: statsData, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/dashboard/stats');
      return response.data.stats || { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 };
    },
    enabled: !!user,
    initialData: { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 }
  });

  const stats = statsData || { sites: 0, scans: 0, vulnerabilities: 0, alerts: 0 };

  // Buscar sites para fazer scan
  const { data: sitesData, refetch: refetchSites } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await apiClient.get('/api/protected/sites');
      return response.data.sites || [];
    },
    enabled: !!user,
    initialData: []
  });

  const sites = sitesData || [];

  // Estados para os scans
  const [isRunningSecurityScan, setIsRunningSecurityScan] = useState(false);
  const [isRunningZapScan, setIsRunningZapScan] = useState(false);
  const [isRunningZapFullScan, setIsRunningZapFullScan] = useState(false);
  
  // Estados para o modal de relatórios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState(null);

  // Buscar relatórios disponíveis
  const { data: reportsData } = useQuery({
    queryKey: ['scan-reports'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/protected/scans/reports');
        return response.data.reports || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  const reports = reportsData || [];

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  // Executar scan de segurança (Semgrep)
  const handleRunSecurityScan = async () => {
    if (sites.length === 0) {
      toast.error('Nenhum site cadastrado para escanear');
      return;
    }

    setIsRunningSecurityScan(true);
    try {
      // Executar scan geral no código
      const response = await apiClient.post('/api/protected/scans/security');
      
      // Atualizar last_scan de todos os sites (backend irá usar CURRENT_TIMESTAMP)
      const updatePromises = sites.map(site => 
        apiClient.put(`/api/protected/sites/${site.id}`, {
          updateScan: true
        }).catch(err => console.error(`Erro ao atualizar site ${site.url}:`, err))
      );
      
      await Promise.all(updatePromises);
      
      toast.success(`Scan de segurança executado em ${sites.length} site(s)!`);
      refetchStats();
      refetchSites();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao iniciar scan de segurança');
    } finally {
      setIsRunningSecurityScan(false);
    }
  };

  // Executar scan ZAP simplificado
  const handleRunZapScan = async () => {
    if (sites.length === 0) {
      toast.error('Nenhum site cadastrado para escanear');
      return;
    }

    setIsRunningZapScan(true);
    let scannedCount = 0;
    
    try {
      // Escanear cada site individualmente
      for (const site of sites) {
        try {
          await apiClient.post('/api/protected/scans/zap', { 
            scanType: 'simple',
            target: site.url
          });
          
          // Atualizar last_scan do site (backend irá usar CURRENT_TIMESTAMP)
          await apiClient.put(`/api/protected/sites/${site.id}`, {
            updateScan: true
          });
          
          scannedCount++;
          toast.success(`Scan ZAP: ${scannedCount}/${sites.length} - ${site.url}`);
        } catch (error) {
          console.error(`Erro ao escanear ${site.url}:`, error);
          toast.error(`Erro ao escanear ${site.url}`);
        }
      }
      
      toast.success(`✓ Scan ZAP completo! ${scannedCount} site(s) escaneado(s)`);
      refetchStats();
      refetchSites();
    } catch (error) {
      toast.error('Erro ao executar scans ZAP');
    } finally {
      setIsRunningZapScan(false);
    }
  };

  // Executar scan ZAP completo
  const handleRunZapFullScan = async () => {
    if (sites.length === 0) {
      toast.error('Nenhum site cadastrado para escanear');
      return;
    }

    setIsRunningZapFullScan(true);
    let scannedCount = 0;
    
    try {
      // Escanear cada site individualmente
      for (const site of sites) {
        try {
          await apiClient.post('/api/protected/scans/zap', { 
            scanType: 'full',
            target: site.url
          });
          
          // Atualizar last_scan do site (backend irá usar CURRENT_TIMESTAMP)
          await apiClient.put(`/api/protected/sites/${site.id}`, {
            updateScan: true
          });
          
          scannedCount++;
          toast.success(`Scan ZAP Full: ${scannedCount}/${sites.length} - ${site.url}`);
        } catch (error) {
          console.error(`Erro ao escanear ${site.url}:`, error);
          toast.error(`Erro ao escanear ${site.url}`);
        }
      }
      
      toast.success(`✓ Scan ZAP Full completo! ${scannedCount} site(s) escaneado(s)`);
      refetchStats();
      refetchSites();
    } catch (error) {
      toast.error('Erro ao executar scans ZAP completos');
    } finally {
      setIsRunningZapFullScan(false);
    }
  };

  // Abrir relatório
  const handleOpenReport = async (reportTypeParam) => {
    try {
      setIsModalOpen(false);
      setReportData(null);
      setReportType(null);
      
      // Determinar título do modal
      const titles = {
        'security': 'Relatório Semgrep - Análise de Código',
        'zap': 'Relatório OWASP ZAP - Vulnerabilidades Web',
        'security-gate': 'Security Gate - Resumo de Segurança'
      };
      setModalTitle(titles[reportTypeParam] || 'Relatório');
      
      // Abrir modal com loading
      setIsModalOpen(true);
      
      const token = localStorage.getItem('auth_token');
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000';
      
      const response = await fetch(`${baseURL}/api/protected/scans/reports/${reportTypeParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Relatório ainda não foi gerado');
          setIsModalOpen(false);
          return;
        }
        throw new Error('Erro ao carregar relatório');
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        // Para relatórios HTML (ZAP)
        const htmlContent = await response.text();
        setReportData(htmlContent);
        setReportType('zap');
      } else {
        // Para relatórios JSON
        const jsonData = await response.json();
        setReportData(jsonData);
        setReportType(reportTypeParam);
      }
      
    } catch (error) {
      console.error('Erro ao abrir relatório:', error);
      toast.error('Erro ao abrir relatório: ' + error.message);
      setIsModalOpen(false);
      setReportData(null);
      setReportType(null);
    }
  };

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
      <HackerNavbar currentPage="Dashboard" onLogout={handleLogout} />
      
      <main className="pt-20 px-6 pb-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-green-500 text-sm mb-2">root@cybersystem:~# ./dashboard</div>
          <h1 className="text-3xl font-bold text-green-500 mb-1">SYSTEM DASHBOARD</h1>
          <p className="text-green-700 text-sm">[ REAL-TIME MONITORING ACTIVE ]</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HackerCard
            title="MONITORED_SITES"
            value={loadingStats ? "..." : stats.sites}
            icon={Globe}
            subtitle="ACTIVE TARGETS"
          />
          <HackerCard
            title="SCANS_EXECUTED"
            value={loadingStats ? "..." : stats.scans}
            icon={Scan}
            subtitle="TOTAL OPERATIONS"
          />
          <HackerCard
            title="CRITICAL_VULNS"
            value={loadingStats ? "..." : stats.vulnerabilities}
            icon={AlertTriangle}
            subtitle="HIGH PRIORITY"
          />
          <HackerCard
            title="ALERTS_TODAY"
            value={loadingStats ? "..." : stats.alerts}
            icon={Activity}
            subtitle="SYSTEM EVENTS"
          />
        </div>

        {/* Scan Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black border-2 border-green-500 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4 text-green-500">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-bold">SECURITY_SCANS</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scan Semgrep */}
            <button
              onClick={handleRunSecurityScan}
              disabled={isRunningSecurityScan}
              className="border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 text-green-400 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold text-sm mb-1">
                {isRunningSecurityScan ? '[ EXECUTING... ]' : '[ SEMGREP SCAN ]'}
              </div>
              <div className="text-xs text-green-700">Static code analysis</div>
            </button>

            {/* Scan ZAP Simples */}
            <button
              onClick={handleRunZapScan}
              disabled={isRunningZapScan}
              className="border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 text-green-400 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold text-sm mb-1">
                {isRunningZapScan ? '[ EXECUTING... ]' : '[ ZAP SIMPLE ]'}
              </div>
              <div className="text-xs text-green-700">Basic security tests</div>
            </button>

            {/* Scan ZAP Completo */}
            <button
              onClick={handleRunZapFullScan}
              disabled={isRunningZapFullScan}
              className="border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 text-green-400 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Scan className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold text-sm mb-1">
                {isRunningZapFullScan ? '[ EXECUTING... ]' : '[ ZAP FULL ]'}
              </div>
              <div className="text-xs text-green-700">Complete OWASP analysis</div>
            </button>
          </div>
        </motion.div>

        {/* Reports Section */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border-2 border-green-500 p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4 text-green-500">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-bold">AVAILABLE_REPORTS</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reports.map((report) => (
                <button
                  key={report.type}
                  onClick={() => report.exists && handleOpenReport(report.type)}
                  disabled={!report.exists}
                  className={`border-2 p-4 transition-all text-left ${
                    report.exists
                      ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20 text-green-400 cursor-pointer'
                      : 'border-green-900 bg-green-900/5 text-green-700 cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold text-sm mb-2">{report.name}</div>
                  {report.exists && report.lastModified && (
                    <div className="text-xs text-green-700">
                      {new Date(report.lastModified).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {!report.exists && (
                    <div className="text-xs text-green-900">NOT AVAILABLE</div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Terminal Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black border-2 border-green-500 p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-green-500">
            <div className="w-2 h-2 bg-green-500 animate-pulse" />
            <span className="text-sm font-bold">ACTIVITY_LOG</span>
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="text-green-400">[INFO] Sistema inicializado com sucesso</div>
            <div className="text-green-400">[SCAN] Monitoramento de sites ativo</div>
            <div className="text-yellow-500">[WARN] Aguardando execução de scans de segurança</div>
            <div className="text-green-400">[INFO] Dashboard pronto para operação</div>
          </div>
        </motion.div>
      </main>

      {/* Modal de Relatórios */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setReportData(null);
          setReportType(null);
        }}
        title={modalTitle}
        size="xl"
      >
        {reportType === 'security' && <SemgrepReportViewer data={reportData} />}
        {reportType === 'zap' && <ZapReportViewer htmlContent={reportData} />}
        {reportType === 'security-gate' && <SecurityGateReportViewer data={reportData} />}
        {!reportType && reportData === null && (
          <div className="text-green-400 text-center p-8">Carregando relatório...</div>
        )}
      </Modal>
    </div>
  );
}
