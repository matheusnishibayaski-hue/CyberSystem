import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Info, Shield, Bug, FileText } from "lucide-react";
import { useState } from "react";

// Visualizador de Relatório Semgrep
export function SemgrepReportViewer({ data }) {
  if (!data || !data.results) {
    return (
      <div className="text-center p-8 border-2 border-green-500 bg-green-500/10">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-400 mb-2">✓ Nenhuma vulnerabilidade encontrada!</h3>
        <p className="text-green-700">Seu código está seguro de acordo com esta análise.</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'high':
        return 'text-red-500 border-red-500 bg-red-500/10';
      case 'warning':
      case 'medium':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      default:
        return 'text-blue-500 border-blue-500 bg-blue-500/10';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'high':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
      case 'medium':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const totalIssues = data.results?.length || 0;
  const highIssues = data.results?.filter(r => r.extra?.severity === 'ERROR').length || 0;
  const mediumIssues = data.results?.filter(r => r.extra?.severity === 'WARNING').length || 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black border-2 border-green-500 p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{totalIssues}</div>
          <div className="text-xs text-green-700 mt-1">TOTAL ISSUES</div>
        </div>
        <div className="bg-black border-2 border-red-500 p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{highIssues}</div>
          <div className="text-xs text-red-700 mt-1">HIGH SEVERITY</div>
        </div>
        <div className="bg-black border-2 border-yellow-500 p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{mediumIssues}</div>
          <div className="text-xs text-yellow-700 mt-1">MEDIUM SEVERITY</div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {data.results?.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border-2 p-4 ${getSeverityColor(result.extra?.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(result.extra?.severity)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm">
                    {result.check_id || 'Security Issue'}
                  </span>
                  <span className={`text-xs px-2 py-1 border ${getSeverityColor(result.extra?.severity)}`}>
                    {result.extra?.severity || 'INFO'}
                  </span>
                </div>
                <p className="text-sm mb-3">{result.extra?.message || 'Vulnerabilidade detectada'}</p>
                <div className="text-xs space-y-1 opacity-70">
                  <div>📁 Arquivo: {result.path}</div>
                  <div>📍 Linha: {result.start?.line}</div>
                  {result.extra?.metadata?.cwe && (
                    <div>🔍 CWE: {result.extra.metadata.cwe.join(', ')}</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {totalIssues === 0 && (
        <div className="text-center p-12 border-2 border-green-500 bg-green-500/10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-400 mb-2">✓ Nenhuma vulnerabilidade encontrada!</h3>
          <p className="text-green-700">Seu código está seguro de acordo com esta análise.</p>
        </div>
      )}
    </div>
  );
}

// Visualizador de Relatório ZAP
export function ZapReportViewer({ htmlContent }) {
  const [showRawHtml, setShowRawHtml] = useState(false);

  if (!htmlContent) {
    return <div className="text-green-400 text-center p-8">Carregando relatório...</div>;
  }

  // Tentar extrair informações do HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // Extrair alertas do relatório ZAP
  const extractAlerts = () => {
    const alerts = [];
    const alertDivs = doc.querySelectorAll('.risk-high, .risk-medium, .risk-low, .risk-info');
    
    alertDivs.forEach((alert) => {
      const risk = alert.className.split('risk-')[1];
      const name = alert.querySelector('h3, h4, .alert-name')?.textContent || 'Vulnerabilidade';
      const description = alert.querySelector('p, .alert-desc')?.textContent || '';
      
      alerts.push({ risk, name, description });
    });

    return alerts;
  };

  const alerts = extractAlerts();
  
  // Verificar se é um relatório simplificado ou fallback
  const isSimplified = htmlContent.includes('Simplified') || htmlContent.includes('simplificado');
  const isFallback = htmlContent.includes('Fallback') || htmlContent.includes('could not run');
  const zapNotRunning = htmlContent.includes('mas NAO esta rodando') || htmlContent.includes('not running');
  const needsZapInstall = (htmlContent.includes('Install OWASP ZAP') || htmlContent.includes('ZAP not found')) && !zapNotRunning;

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'text-red-500 border-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 border-blue-500 bg-blue-500/10';
      default:
        return 'text-green-500 border-green-500 bg-green-500/10';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <XCircle className="w-5 h-5" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5" />;
      case 'low':
        return <Info className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso se ZAP instalado mas não rodando */}
      {zapNotRunning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-yellow-500 bg-yellow-500/10 p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-yellow-400">
                ⚡ OWASP ZAP Instalado mas Não Está Rodando
              </h3>
              <p className="text-yellow-300 text-sm leading-relaxed">
                Ótima notícia! O OWASP ZAP está instalado no seu computador. Para executar scans completos, você só precisa abri-lo!
              </p>
              <div className="flex flex-col gap-2 mt-3">
                <p className="text-yellow-400 font-semibold text-sm">🚀 Como executar scans completos:</p>
                <ol className="list-decimal list-inside text-yellow-300 text-sm space-y-2 ml-2">
                  <li><strong>Abra o OWASP ZAP Desktop</strong>
                    <div className="ml-5 text-xs text-yellow-400 mt-1">
                      • Menu Iniciar → Digite "ZAP" ou "OWASP"<br/>
                      • Ou procure em: C:\Program Files\ZAP\
                    </div>
                  </li>
                  <li><strong>Deixe o ZAP aberto em segundo plano</strong>
                    <div className="ml-5 text-xs text-yellow-400 mt-1">
                      • Não precisa fazer nada dentro do programa<br/>
                      • Pode minimizar a janela
                    </div>
                  </li>
                  <li><strong>Execute o scan "ZAP FULL" novamente</strong>
                    <div className="ml-5 text-xs text-yellow-400 mt-1">
                      • O sistema detectará o ZAP automaticamente<br/>
                      • O scan completo será executado
                    </div>
                  </li>
                </ol>
                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 text-xs text-yellow-200">
                  <strong>✅ Verificação rápida:</strong> Abra seu navegador e acesse <code className="bg-yellow-900/50 px-2 py-1 rounded">http://localhost:8080</code>
                  <br/>Se ver a página do ZAP API, está funcionando!
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Aviso se scan simplificado ou ZAP não instalado */}
      {(isSimplified || isFallback || needsZapInstall) && !zapNotRunning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-blue-500 bg-blue-500/10 p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-blue-400">
                {isFallback ? '⚠️ Scan Completo Não Disponível' : 'ℹ️ Scan Simplificado'}
              </h3>
              <p className="text-blue-300 text-sm leading-relaxed">
                {isFallback 
                  ? 'O OWASP ZAP não está instalado. Um relatório básico foi gerado, mas para uma análise completa de segurança, você precisa instalar o OWASP ZAP.'
                  : 'Este é um relatório simplificado que verifica endpoints básicos e headers de segurança. Para um scan completo com testes avançados de vulnerabilidades, instale o OWASP ZAP Desktop.'
                }
              </p>
              <div className="flex flex-col gap-2 mt-3">
                <p className="text-blue-400 font-semibold text-sm">📥 Como obter scans completos:</p>
                <ol className="list-decimal list-inside text-blue-300 text-sm space-y-1 ml-2">
                  <li>Baixe o OWASP ZAP: <a href="https://www.zaproxy.org/download/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">zaproxy.org/download</a></li>
                  <li>Instale e mantenha o programa aberto em segundo plano</li>
                  <li>Execute novamente o scan "ZAP FULL" através do Dashboard</li>
                </ol>
                <div className="mt-2 p-3 bg-blue-900/20 border border-blue-700 text-xs text-blue-300">
                  <strong>💡 Enquanto isso:</strong> Use o scan simplificado para monitoramento básico. Ele já verifica problemas comuns de segurança!
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Botões de alternância */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowRawHtml(false)}
          className={`px-4 py-2 border-2 transition-all ${
            !showRawHtml
              ? 'border-green-500 bg-green-500/20 text-green-400'
              : 'border-green-700 bg-green-900/10 text-green-700'
          }`}
        >
          [ VISUALIZAÇÃO SIMPLIFICADA ]
        </button>
        <button
          onClick={() => setShowRawHtml(true)}
          className={`px-4 py-2 border-2 transition-all ${
            showRawHtml
              ? 'border-green-500 bg-green-500/20 text-green-400'
              : 'border-green-700 bg-green-900/10 text-green-700'
          }`}
        >
          [ RELATÓRIO COMPLETO HTML ]
        </button>
      </div>

      {showRawHtml ? (
        /* Visualização HTML Completa */
        <div className="max-h-[600px] overflow-y-auto border-2 border-green-500">
          <iframe
            srcDoc={htmlContent}
            className="w-full h-[600px] bg-white"
            title="ZAP Report"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      ) : (
        /* Visualização Simplificada */
        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black border-2 border-red-500 p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {alerts.filter(a => a.risk === 'high').length}
              </div>
              <div className="text-xs text-red-700 mt-1">ALTO RISCO</div>
            </div>
            <div className="bg-black border-2 border-yellow-500 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {alerts.filter(a => a.risk === 'medium').length}
              </div>
              <div className="text-xs text-yellow-700 mt-1">MÉDIO RISCO</div>
            </div>
            <div className="bg-black border-2 border-blue-500 p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {alerts.filter(a => a.risk === 'low').length}
              </div>
              <div className="text-xs text-blue-700 mt-1">BAIXO RISCO</div>
            </div>
            <div className="bg-black border-2 border-green-500 p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {alerts.filter(a => a.risk === 'info' || a.risk === 'informational').length}
              </div>
              <div className="text-xs text-green-700 mt-1">INFORMAÇÃO</div>
            </div>
          </div>

          {/* Lista de Alertas */}
          {alerts.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-2 p-4 ${getRiskColor(alert.risk)}`}
                >
                  <div className="flex items-start gap-3">
                    {getRiskIcon(alert.risk)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm">{alert.name}</span>
                        <span className={`text-xs px-2 py-1 border ${getRiskColor(alert.risk)}`}>
                          {alert.risk?.toUpperCase()}
                        </span>
                      </div>
                      {alert.description && (
                        <p className="text-sm opacity-80">{alert.description}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Se não conseguiu extrair, mostra mensagem */
            <div className="text-center p-8 border-2 border-green-500 bg-green-500/10">
              <Info className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-400 mb-2">
                Não foi possível extrair alertas automaticamente
              </h3>
              <p className="text-green-700 mb-4">
                Clique em "RELATÓRIO COMPLETO HTML" para ver o relatório original do ZAP.
              </p>
            </div>
          )}

          {alerts.length === 0 && (
            <div className="text-center p-8 border-2 border-green-500 bg-green-500/10">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-400 mb-2">
                ✓ Nenhuma vulnerabilidade encontrada!
              </h3>
              <p className="text-green-700">
                O scan ZAP não encontrou problemas de segurança significativos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Visualizador de Security Gate
export function SecurityGateReportViewer({ data }) {
  if (!data) {
    return <div className="text-green-400 text-center p-8">Nenhum dado disponível</div>;
  }

  // Extrair vulnerabilidades de diferentes estruturas possíveis
  let vulnerabilities = [];
  
  // Tentar diferentes estruturas
  if (Array.isArray(data.vulnerabilities)) {
    vulnerabilities = data.vulnerabilities;
  } else if (Array.isArray(data.results)) {
    vulnerabilities = data.results;
  } else if (Array.isArray(data.issues)) {
    vulnerabilities = data.issues;
  } else if (data.semgrep && Array.isArray(data.semgrep.results)) {
    vulnerabilities = data.semgrep.results;
  } else if (data.zap && Array.isArray(data.zap.alerts)) {
    vulnerabilities = data.zap.alerts;
  } else if (data.checks && Array.isArray(data.checks)) {
    vulnerabilities = data.checks;
  }

  // Contar por severidade
  const criticalCount = vulnerabilities.filter(v => 
    (v.severity?.toLowerCase() === 'critical' || 
     v.severity?.toLowerCase() === 'error' ||
     v.severity?.toLowerCase() === 'high' ||
     v.risk?.toLowerCase() === 'high')
  ).length;

  const mediumCount = vulnerabilities.filter(v => 
    v.severity?.toLowerCase() === 'medium' || v.severity?.toLowerCase() === 'warning' || v.risk?.toLowerCase() === 'medium'
  ).length;

  const lowCount = vulnerabilities.filter(v => 
    v.severity?.toLowerCase() === 'low' || v.risk?.toLowerCase() === 'low'
  ).length;

  const totalVulnerabilities = vulnerabilities.length;
  
  // Tentar obter contadores dos próprios dados se disponíveis
  const dataTotal = data.totalVulnerabilities || data.total || data.count || 0;
  const dataCritical = data.criticalCount || data.critical || data.high || 0;
  const dataMedium = data.mediumCount || data.medium || data.warning || 0;
  const dataLow = data.lowCount || data.low || data.info || 0;
  
  // Se temos dados de contadores mas não conseguimos extrair vulnerabilidades, usar os contadores
  const finalTotal = totalVulnerabilities > 0 ? totalVulnerabilities : dataTotal;
  const finalCritical = criticalCount > 0 ? criticalCount : dataCritical;
  const finalMedium = mediumCount > 0 ? mediumCount : dataMedium;
  const finalLow = lowCount > 0 ? lowCount : dataLow;
  
  // Determinar status baseado nos dados reais
  const passed = finalTotal === 0 && finalCritical === 0;

  const getSeverityColor = (severity) => {
    const sev = severity?.toLowerCase() || '';
    if (sev.includes('critical') || sev.includes('error') || sev.includes('high')) {
      return 'text-red-500 border-red-500 bg-red-500/10';
    } else if (sev.includes('medium') || sev.includes('warning')) {
      return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
    } else if (sev.includes('low')) {
      return 'text-blue-500 border-blue-500 bg-blue-500/10';
    }
    return 'text-green-500 border-green-500 bg-green-500/10';
  };

  const getSeverityIcon = (severity) => {
    const sev = severity?.toLowerCase() || '';
    if (sev.includes('critical') || sev.includes('error') || sev.includes('high')) {
      return <XCircle className="w-5 h-5" />;
    } else if (sev.includes('medium') || sev.includes('warning')) {
      return <AlertTriangle className="w-5 h-5" />;
    } else if (sev.includes('low')) {
      return <Info className="w-5 h-5" />;
    }
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <div className={`border-2 p-6 text-center ${passed ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
        {passed ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">✓ SECURITY GATE PASSED</h2>
            <p className="text-green-700">Todas as verificações de segurança foram aprovadas!</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-400 mb-2">✗ SECURITY GATE FAILED</h2>
            <p className="text-red-700">Vulnerabilidades críticas foram encontradas.</p>
          </>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-black border-2 border-green-500 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{finalTotal}</div>
          <div className="text-xs text-green-700 mt-1">TOTAL</div>
        </div>
        <div className="bg-black border-2 border-red-500 p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{finalCritical}</div>
          <div className="text-xs text-red-700 mt-1">CRÍTICAS</div>
        </div>
        <div className="bg-black border-2 border-yellow-500 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{finalMedium}</div>
          <div className="text-xs text-yellow-700 mt-1">MÉDIAS</div>
        </div>
        <div className="bg-black border-2 border-blue-500 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{finalLow}</div>
          <div className="text-xs text-blue-700 mt-1">BAIXAS</div>
        </div>
      </div>

      {/* Lista de Vulnerabilidades */}
      {vulnerabilities.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          <h3 className="text-green-400 font-bold flex items-center gap-2 text-lg sticky top-0 bg-black pb-2 border-b border-green-500 z-10">
            <Bug className="w-5 h-5" />
            VULNERABILIDADES ENCONTRADAS ({vulnerabilities.length})
          </h3>
          
          {vulnerabilities.map((vuln, index) => {
            const severity = vuln.severity || vuln.risk || vuln.extra?.severity || 'info';
            const title = vuln.check_id || vuln.name || vuln.alert || 'Vulnerabilidade';
            const message = vuln.extra?.message || vuln.message || vuln.description || 'Descrição não disponível';
            const file = vuln.path || vuln.file || vuln.url || '';
            const line = vuln.start?.line || vuln.line || '';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-2 p-4 ${getSeverityColor(severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-bold text-sm">{title}</span>
                      <span className={`text-xs px-2 py-1 border ${getSeverityColor(severity)}`}>
                        {severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{message}</p>
                    {(file || line) && (
                      <div className="text-xs space-y-1 opacity-70">
                        {file && <div>📁 {file}</div>}
                        {line && <div>📍 Linha: {line}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Se não há vulnerabilidades ou estrutura diferente */
        <div className="bg-black border-2 border-green-500 p-6">
          <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            RESUMO DO RELATÓRIO
          </h3>
          <div className="space-y-2 text-sm">
            {data.summary && (
              <div className="text-green-400">
                <strong>Resumo:</strong> {data.summary}
              </div>
            )}
            {data.timestamp && (
              <div className="text-green-700">
                <strong>Data:</strong> {new Date(data.timestamp).toLocaleString('pt-BR')}
              </div>
            )}
            {data.scanDuration && (
              <div className="text-green-700">
                <strong>Duração:</strong> {data.scanDuration}
              </div>
            )}
          </div>
          
          {/* Mostrar estrutura completa se não conseguiu extrair */}
          <details className="mt-4">
            <summary className="cursor-pointer text-green-500 hover:text-green-400 text-sm">
              Ver dados completos (JSON)
            </summary>
            <pre className="mt-2 text-xs text-green-400 overflow-x-auto bg-black/50 p-3 border border-green-700 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Só mostra mensagem de sucesso se realmente passou E não tem vulnerabilidades */}
      {passed && finalTotal === 0 && (
        <div className="text-center p-12 border-2 border-green-500 bg-green-500/10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-400 mb-2">✓ Sistema Seguro!</h3>
          <p className="text-green-700">Nenhuma vulnerabilidade foi encontrada nas verificações.</p>
        </div>
      )}
      
      {/* Se tem vulnerabilidades mas não conseguimos extrair detalhes, mostrar resumo */}
      {!passed && vulnerabilities.length === 0 && finalTotal > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500 p-6">
          <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" />
            RESUMO DAS VULNERABILIDADES
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-black border border-red-700">
              <span className="text-red-400">Total de vulnerabilidades encontradas:</span>
              <span className="text-red-400 font-bold text-xl">{finalTotal}</span>
            </div>
            {finalCritical > 0 && (
              <div className="flex items-center justify-between p-3 bg-black border border-red-700">
                <span className="text-red-400">Vulnerabilidades críticas:</span>
                <span className="text-red-400 font-bold text-xl">{finalCritical}</span>
              </div>
            )}
            {finalMedium > 0 && (
              <div className="flex items-center justify-between p-3 bg-black border border-yellow-700">
                <span className="text-yellow-400">Vulnerabilidades médias:</span>
                <span className="text-yellow-400 font-bold text-xl">{finalMedium}</span>
              </div>
            )}
            {finalLow > 0 && (
              <div className="flex items-center justify-between p-3 bg-black border border-blue-700">
                <span className="text-blue-400">Vulnerabilidades baixas:</span>
                <span className="text-blue-400 font-bold text-xl">{finalLow}</span>
              </div>
            )}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded">
              <p className="text-yellow-400 text-sm mb-2">
                ⚠ Os detalhes específicos das vulnerabilidades não puderam ser extraídos automaticamente.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-yellow-500 hover:text-yellow-400 text-sm font-bold">
                  Ver dados completos (JSON)
                </summary>
                <pre className="mt-2 text-xs text-yellow-400 overflow-x-auto bg-black/50 p-3 border border-yellow-500 rounded max-h-[300px] overflow-y-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
