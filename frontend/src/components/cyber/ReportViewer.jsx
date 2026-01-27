import { CheckCircle2, XCircle, AlertTriangle, FileText, Clock, Shield, Zap } from "lucide-react"

export function SemgrepReportViewer({ data }) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Carregando relatório...</p>
      </div>
    )
  }

  const results = data.results || []
  const errors = data.errors || []
  const scannedFiles = data.paths?.scanned || []
  const totalTime = data.time?.profiling_times?.total_time || 0
  const version = data.version || "N/A"

  // Contar severidades
  const criticalCount = results.filter(r => r.extra?.severity === "ERROR" || r.extra?.severity === "CRITICAL").length
  const warningCount = results.filter(r => r.extra?.severity === "WARNING").length
  const infoCount = results.filter(r => r.extra?.severity === "INFO").length

  return (
    <div className="space-y-6">
      {/* Resumo Visual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{results.length === 0 ? "0" : results.length}</p>
              <p className="text-xs text-gray-400">Problemas Encontrados</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{criticalCount}</p>
              <p className="text-xs text-gray-400">Críticos</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{warningCount}</p>
              <p className="text-xs text-gray-400">Avisos</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{scannedFiles.length}</p>
              <p className="text-xs text-gray-400">Arquivos Escaneados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Geral */}
      <div className={`p-4 rounded-xl border ${
        results.length === 0 
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-yellow-500/10 border-yellow-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {results.length === 0 ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-white">✅ Nenhum problema encontrado!</p>
                <p className="text-sm text-gray-400">Seu código está seguro segundo as regras do Semgrep.</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="font-semibold text-white">⚠️ {results.length} problema(s) encontrado(s)</p>
                <p className="text-sm text-gray-400">Revisar os problemas encontrados abaixo.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Informações do Scan - Simplificado */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Análise concluída em {totalTime.toFixed(1)} segundos</span>
          </div>
          <div className="text-xs text-gray-500">
            Semgrep v{version}
          </div>
        </div>
      </div>

      {/* Arquivos Escaneados - Simplificado */}
      {scannedFiles.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Arquivos Analisados ({scannedFiles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {scannedFiles.map((file, index) => (
              <div key={index} className="text-xs text-gray-400 font-mono bg-slate-900/50 p-2 rounded truncate" title={file}>
                {file.replace(/\\/g, '/')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problemas Encontrados */}
      {results.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Problemas Encontrados ({results.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => {
              const severity = result.extra?.severity || "INFO"
              const severityColors = {
                ERROR: "border-red-500/50 bg-red-500/10",
                CRITICAL: "border-red-500/50 bg-red-500/10",
                WARNING: "border-yellow-500/50 bg-yellow-500/10",
                INFO: "border-blue-500/50 bg-blue-500/10"
              }
              
              return (
                <div key={index} className={`p-3 rounded-lg border ${severityColors[severity] || severityColors.INFO}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-white">{result.check_id || "Regra de Segurança"}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      severity === "ERROR" || severity === "CRITICAL" 
                        ? "bg-red-500/20 text-red-400" 
                        : severity === "WARNING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{result.extra?.message || "Problema de segurança detectado"}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText className="w-3 h-3" />
                    <span className="font-mono">{result.path?.replace(/\\/g, '/')}</span>
                    {result.start?.line && (
                      <span className="text-gray-500">• Linha {result.start.line}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Erros do Scan */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Erros durante o Scan ({errors.length})
          </h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-gray-300">{error.message || JSON.stringify(error)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ZapReportViewer({ htmlContent }) {
  if (!htmlContent) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Carregando relatório...</p>
      </div>
    )
  }

  // Extrair informações do HTML usando regex (mais robusto)
  const parseHTML = (html) => {
    // Extrair target
    const targetMatch = html.match(/<strong>Target:<\/strong>\s*([^<]+)/i) || 
                       html.match(/Target[^<]*<strong>([^<]+)<\/strong>/i) ||
                       html.match(/Target:\s*([^\n<]+)/i)
    const target = targetMatch?.[1]?.trim() || 'N/A'
    
    // Extrair scan date
    const dateMatch = html.match(/<strong>Scan Date:<\/strong>\s*([^<]+)/i) ||
                     html.match(/Scan Date[^<]*<strong>([^<]+)<\/strong>/i) ||
                     html.match(/Scan Date:\s*([^\n<]+)/i)
    const scanDate = dateMatch?.[1]?.trim() || 'N/A'
    
    // Extrair tabela de endpoints usando regex
    const endpoints = []
    const endpointTableMatch = html.match(/Endpoint Tests[\s\S]*?<table>([\s\S]*?)<\/table>/i)
    if (endpointTableMatch) {
      const tableContent = endpointTableMatch[1]
      const rowMatches = tableContent.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)
      for (const rowMatch of rowMatches) {
        const rowContent = rowMatch[1]
        if (rowContent.includes('<th>')) continue // Pular header
        
        const cells = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)
        const cellArray = Array.from(cells).map(m => m[1]?.replace(/<[^>]+>/g, '').trim())
        
        if (cellArray.length >= 4) {
          endpoints.push({
            endpoint: cellArray[0] || '',
            method: cellArray[1] || '',
            status: cellArray[2] || '',
            result: cellArray[3] || ''
          })
        }
      }
    }
    
    // Extrair security headers
    const headers = []
    const headerTableMatch = html.match(/Security Headers[\s\S]*?<table>([\s\S]*?)<\/table>/i)
    if (headerTableMatch) {
      const tableContent = headerTableMatch[1]
      const rowMatches = tableContent.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)
      for (const rowMatch of rowMatches) {
        const rowContent = rowMatch[1]
        if (rowContent.includes('<th>')) continue // Pular header
        
        const cells = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)
        const cellArray = Array.from(cells).map(m => m[1]?.replace(/<[^>]+>/g, '').trim())
        
        if (cellArray.length >= 2) {
          headers.push({
            name: cellArray[0] || '',
            status: cellArray[1] || ''
          })
        }
      }
    }
    
    return { target, scanDate, endpoints, headers }
  }

  let reportData
  try {
    reportData = parseHTML(htmlContent)
  } catch (error) {
    console.error('Erro ao parsear HTML:', error)
    // Fallback: exibir HTML bruto em iframe
    return (
      <div className="w-full h-full">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-[600px] border border-slate-700 rounded-lg bg-white"
          title="OWASP ZAP Report"
        />
      </div>
    )
  }

  const { target, scanDate, endpoints = [], headers = [] } = reportData

  // Contar estatísticas
  const totalEndpoints = endpoints.length
  const okEndpoints = endpoints.filter(e => e.result?.includes('OK') || e.result?.includes('✅')).length
  const warningEndpoints = endpoints.filter(e => e.result?.includes('Warning') || e.result?.includes('⚠️')).length
  const presentHeaders = headers.filter(h => h.status?.includes('Present') || h.status?.includes('✅')).length
  const missingHeaders = headers.filter(h => h.status?.includes('Missing') || h.status?.includes('⚠️')).length

  return (
    <div className="space-y-6">
      {/* Resumo Visual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{okEndpoints}</p>
              <p className="text-xs text-gray-400">Endpoints OK</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{warningEndpoints}</p>
              <p className="text-xs text-gray-400">Avisos</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{presentHeaders}</p>
              <p className="text-xs text-gray-400">Headers Presentes</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{missingHeaders}</p>
              <p className="text-xs text-gray-400">Headers Faltando</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Scan */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Informações do Scan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Alvo Escaneado</p>
            <p className="text-white font-medium font-mono">{target}</p>
          </div>
          <div>
            <p className="text-gray-400">Data do Scan</p>
            <p className="text-white font-medium">{scanDate}</p>
          </div>
        </div>
      </div>

      {/* Status Geral */}
      <div className={`p-4 rounded-xl border ${
        warningEndpoints === 0 && missingHeaders === 0
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-yellow-500/10 border-yellow-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {warningEndpoints === 0 && missingHeaders === 0 ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-white">✅ Tudo OK!</p>
                <p className="text-sm text-gray-400">Nenhum problema de segurança encontrado nos testes básicos.</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="font-semibold text-white">⚠️ Atenção necessária</p>
                <p className="text-sm text-gray-400">
                  {warningEndpoints > 0 && `${warningEndpoints} endpoint(s) com avisos. `}
                  {missingHeaders > 0 && `${missingHeaders} header(s) de segurança faltando.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Testes de Endpoints */}
      {endpoints.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Testes de Endpoints ({totalEndpoints})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-semibold">Endpoint</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-semibold">Método</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-semibold">Status</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, index) => {
                  const isOk = endpoint.result?.includes('OK') || endpoint.result?.includes('✅')
                  return (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-2 px-3 text-white font-mono text-xs">{endpoint.endpoint}</td>
                      <td className="py-2 px-3 text-gray-300">
                        <span className={`px-2 py-1 rounded text-xs ${
                          endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                          endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-300">{endpoint.status}</td>
                      <td className="py-2 px-3">
                        {isOk ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>OK</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Aviso</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Headers */}
      {headers.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Headers de Segurança ({headers.length})
          </h3>
          <div className="space-y-2">
            {headers.map((header, index) => {
              const isPresent = header.status?.includes('Present') || header.status?.includes('✅')
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    isPresent
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <span className="text-sm text-white font-medium">{header.name}</span>
                  {isPresent ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Presente</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Faltando</span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Nota */}
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong>Nota:</strong> Este é um relatório simplificado. Para uma análise completa de segurança, use o OWASP ZAP Desktop.
        </p>
      </div>
    </div>
  )
}

export function SecurityGateReportViewer({ data }) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Carregando relatório...</p>
      </div>
    )
  }

  const summary = data.summary || {}
  const critical = summary.critical || 0
  const high = summary.high || 0
  const medium = summary.medium || 0
  const low = summary.low || 0
  const total = critical + high + medium + low

  return (
    <div className="space-y-6">
      {/* Resumo Visual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{critical}</p>
              <p className="text-xs text-gray-400">Críticos</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{high}</p>
              <p className="text-xs text-gray-400">Alto</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{medium}</p>
              <p className="text-xs text-gray-400">Médio</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={`p-4 rounded-xl border ${
        total === 0 
          ? "bg-green-500/10 border-green-500/30" 
          : critical > 0
          ? "bg-red-500/10 border-red-500/30"
          : "bg-yellow-500/10 border-yellow-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {total === 0 ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-white">✅ Nenhum problema encontrado!</p>
                <p className="text-sm text-gray-400">Seu código passou em todas as verificações de segurança.</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="font-semibold text-white">⚠️ {total} problema(s) encontrado(s)</p>
                <p className="text-sm text-gray-400">
                  {critical > 0 && `${critical} crítico(s), `}
                  {high > 0 && `${high} alto(s), `}
                  {medium > 0 && `${medium} médio(s), `}
                  {low > 0 && `${low} baixo(s)`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detalhes */}
      {data.findings && data.findings.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Detalhes dos Problemas</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.findings.map((finding, index) => (
              <div key={index} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <p className="text-sm text-white font-medium">{finding.message || finding.rule || "Problema de segurança"}</p>
                {finding.path && (
                  <p className="text-xs text-gray-400 font-mono mt-1">{finding.path}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
