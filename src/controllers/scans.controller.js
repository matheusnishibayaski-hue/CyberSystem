const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const execAsync = promisify(exec);
const projectRoot = path.resolve(__dirname, '..', '..');
const { query } = require('../config/db.config');
const { getScanQueue } = require('../queues/scanQueue');

// Função auxiliar para executar scripts PowerShell
async function executePowerShellScript(scriptPath, args = []) {
  try {
    const scriptFullPath = path.join(projectRoot, scriptPath);
    
    // Verificar se o script existe antes de executar
    try {
      await fs.access(scriptFullPath);
    } catch (accessError) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SCAN] Script não encontrado: ${scriptFullPath}`);
      }
      return {
        success: false,
        output: '',
        error: `Script não encontrado: ${scriptPath}`,
        code: 'ENOENT'
      };
    }
    
    // Construir comando com argumentos adequadamente formatados
    // Usar -File com encoding UTF-8 explícito
    let command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptFullPath}"`;
    if (args && args.length > 0) {
      // Adicionar argumentos, escapando espaços se necessário
      const escapedArgs = args.map(arg => {
        // Se o argumento contém espaços, não precisa de aspas extras pois já está no formato correto
        return arg;
      });
      command += ' ' + escapedArgs.join(' ');
    }
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SCAN] Executando: ${command}`);
      console.log(`[SCAN] Executando comando no diretório: ${projectRoot}`);
      console.log(`[SCAN] Script path: ${scriptFullPath}`);
    }
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 600000, // 10 minutos timeout
      encoding: 'utf8',
      windowsHide: true
    });
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SCAN] Comando executado. stdout length: ${stdout?.length || 0}, stderr length: ${stderr?.length || 0}`);
      
      // Log primeiras linhas do output para debug
      if (stdout) {
        const lines = stdout.split('\n').slice(0, 10);
        console.log(`[SCAN] Primeiras linhas do output:`, lines.join('\n'));
      }
      
      // Se houver stderr, logar mas não falhar (alguns scripts escrevem warnings em stderr)
      if (stderr && stderr.trim().length > 0) {
        console.warn(`[SCAN] stderr recebido:`, stderr.substring(0, 500));
      }
    }
    
    return {
      success: true,
      output: stdout,
      error: stderr || null
    };
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SCAN] Erro ao executar comando:`, error.message);
      console.error(`[SCAN] Código de saída:`, error.code);
      console.error(`[SCAN] Signal:`, error.signal);
      if (error.stdout) {
        console.error(`[SCAN] stdout:`, error.stdout.substring(0, 1000));
      }
      if (error.stderr) {
        console.error(`[SCAN] stderr:`, error.stderr.substring(0, 1000));
      }
    }
    
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      code: error.code
    };
  }
}

// Função para processar relatório ZAP e salvar alertas no banco
async function processZapReportAndSaveAlerts(userId, reportPath) {
  try {
    // Ler o arquivo HTML do relatório
    const htmlContent = await fs.readFile(reportPath, 'utf8');
    
    // Extrair alertas do relatório HTML
    const alerts = [];
    
    // 1. Verificar headers de segurança ausentes
    const securityHeadersTable = htmlContent.match(/Security Headers[\s\S]*?<table>([\s\S]*?)<\/table>/i);
    if (securityHeadersTable) {
      const tableContent = securityHeadersTable[1];
      const rowMatches = tableContent.matchAll(/<tr>([\s\S]*?)<\/tr>/gi);
      
      for (const rowMatch of rowMatches) {
        const rowContent = rowMatch[1];
        if (rowContent.includes('<th>')) continue; // Pular header
        
        const cells = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        const cellArray = Array.from(cells).map(m => m[1]?.replace(/<[^>]+>/g, '').trim());
        
        if (cellArray.length >= 2) {
          const headerName = cellArray[0];
          const status = cellArray[1];
          
          // Se o header está ausente (Missing), criar alerta
          if (status.toLowerCase().includes('missing') || status.toLowerCase().includes('ausente')) {
            let severity = 'warning';
            let alertName = '';
            
            // Mapear headers para severidade e nome do alerta
            if (headerName.includes('Content-Security-Policy') || headerName.includes('CSP')) {
              severity = 'error';
              alertName = 'Content Security Policy (CSP) Header Not Set';
            } else if (headerName.includes('X-Frame-Options') || headerName.includes('Frame')) {
              severity = 'error';
              alertName = 'Missing Anti-clickjacking Header';
            } else if (headerName.includes('X-Content-Type-Options')) {
              severity = 'warning';
              alertName = 'X-Content-Type-Options Header Missing';
            } else {
              alertName = `Security Header Missing: ${headerName}`;
            }
            
            alerts.push({
              log_type: 'security',
              severity: severity,
              message: alertName,
              details: JSON.stringify({
                header: headerName,
                status: status,
                source: 'ZAP Scan',
                systemic: true
              })
            });
          }
        }
      }
    }
    
    // 2. Verificar endpoints com problemas
    const endpointsTable = htmlContent.match(/Endpoint Tests[\s\S]*?<table>([\s\S]*?)<\/table>/i);
    if (endpointsTable) {
      const tableContent = endpointsTable[1];
      const rowMatches = tableContent.matchAll(/<tr>([\s\S]*?)<\/tr>/gi);
      
      for (const rowMatch of rowMatches) {
        const rowContent = rowMatch[1];
        if (rowContent.includes('<th>')) continue; // Pular header
        
        const cells = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        const cellArray = Array.from(cells).map(m => m[1]?.replace(/<[^>]+>/g, '').trim());
        
        if (cellArray.length >= 4) {
          const endpoint = cellArray[0];
          const method = cellArray[1];
          const status = cellArray[2];
          const result = cellArray[3];
          
          // Se o resultado não é OK, criar alerta
          if (result.toLowerCase().includes('warning') || result.toLowerCase().includes('error')) {
            alerts.push({
              log_type: 'security',
              severity: 'warning',
              message: `Endpoint ${method} ${endpoint} returned unexpected status: ${status}`,
              details: JSON.stringify({
                endpoint: endpoint,
                method: method,
                status: status,
                result: result,
                source: 'ZAP Scan'
              })
            });
          }
        }
      }
    }
    
    // Salvar alertas no banco de dados (apenas se userId existir)
    if (alerts.length > 0 && userId) {
      for (const alert of alerts) {
        try {
          await query(
            `INSERT INTO security_logs 
             (user_id, log_type, severity, message, details, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [userId, alert.log_type, alert.severity, alert.message, alert.details]
          );
        } catch (dbError) {
          // Log apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.error(`[SCAN] Erro ao salvar alerta no banco:`, dbError.message);
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SCAN] ${alerts.length} alertas salvos no banco de dados`);
      }
    }
    
    return alerts.length;
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SCAN] Erro ao processar relatório ZAP:`, error.message);
    }
    return 0;
  }
}

// Função auxiliar para forçar atualização da data de modificação de um arquivo
async function touchFile(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    // Verificar se arquivo existe
    try {
      await fs.access(fullPath);
      // Usar utimes para atualizar o timestamp (mais eficiente que ler/escrever)
      const now = new Date();
      await fs.utimes(fullPath, now, now);
      console.log(`[SCAN] Timestamp atualizado: ${filePath}`);
    } catch (accessError) {
      // Se não conseguir usar utimes, tentar ler e reescrever
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        await fs.writeFile(fullPath, content, 'utf8');
        console.log(`[SCAN] Arquivo atualizado (read/write): ${filePath}`);
      } catch (rwError) {
        console.log(`[SCAN] Arquivo não existe ou não pode ser atualizado: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`[SCAN] Erro ao atualizar arquivo ${filePath}:`, error.message);
  }
}

// Adicionar scan à fila
exports.startScan = async (req, res) => {
  try {
    const { type, target, scanType } = req.body;
    const userId = req.user?.userId || null;
    
    // Validar tipo de scan
    if (!type || !['security', 'zap'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de scan inválido',
        message: 'Tipo deve ser "security" ou "zap"'
      });
    }
    
    // Tentar obter a fila (Redis pode não estar disponível)
    const scanQueue = getScanQueue();
    if (!scanQueue) {
      return res.status(503).json({
        success: false,
        error: 'Redis não disponível',
        message: 'Para usar filas de scan, o Redis precisa estar rodando. Execute: npm run worker ou inicie o Redis manualmente.'
      });
    }
    
    // Adicionar job à fila
    const job = await scanQueue.add('scan', { 
      type, 
      target: target || null,
      userId,
      scanType: scanType || (type === 'zap' ? 'simple' : null)
    });
    
    res.json({ 
      message: 'Scan enfileirado.',
      jobId: job.id,
      type,
      status: 'queued'
    });
  } catch (error) {
    console.error('Erro ao enfileirar scan:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enfileirar scan',
      message: error.message
    });
  }
};

// Status da fila de scans
exports.getQueueStatus = async (req, res) => {
  try {
    const scanQueue = getScanQueue();

    if (!scanQueue) {
      return res.json({
        available: false,
        message: 'Redis não disponível',
        counts: {},
        queue: [],
        history: [],
        metrics: { byType: { security: 0, zap: 0 } }
      });
    }

    const counts = await scanQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed');

    const [waitingJobs, activeJobs, delayedJobs, historyJobs] = await Promise.all([
      scanQueue.getJobs(['waiting'], 0, 50, true),
      scanQueue.getJobs(['active'], 0, 50, true),
      scanQueue.getJobs(['delayed'], 0, 50, true),
      scanQueue.getJobs(['completed', 'failed'], 0, 50, true)
    ]);

    const serializeJob = (job, state) => ({
      id: job.id,
      name: job.name,
      type: job.data?.type || 'unknown',
      scanType: job.data?.scanType || null,
      target: job.data?.target || null,
      state,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failedReason: job.failedReason || null
    });

    const queue = [
      ...waitingJobs.map((job) => serializeJob(job, 'waiting')),
      ...activeJobs.map((job) => serializeJob(job, 'active')),
      ...delayedJobs.map((job) => serializeJob(job, 'delayed'))
    ];

    const history = historyJobs.map((job) =>
      serializeJob(job, job.failedReason ? 'failed' : 'completed')
    );

    const metrics = history.reduce(
      (acc, job) => {
        if (job.type === 'security') {
          acc.byType.security += 1;
        }
        if (job.type === 'zap') {
          acc.byType.zap += 1;
        }
        return acc;
      },
      { byType: { security: 0, zap: 0 } }
    );

    res.json({
      available: true,
      counts,
      queue,
      history,
      metrics
    });
  } catch (error) {
    console.error('Erro ao obter status da fila:', error);
    res.json({
      available: false,
      message: 'Erro ao acessar fila',
      counts: {},
      queue: [],
      history: [],
      metrics: { byType: { security: 0, zap: 0 } }
    });
  }
};

// Executar scan de segurança (Semgrep)
exports.runSecurityScan = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const scriptPath = 'scripts/security-scan.ps1';
    
    // Verificar se o script existe
    const scriptFullPath = path.join(projectRoot, scriptPath);
    try {
      await fs.access(scriptFullPath);
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SCAN] Script encontrado: ${scriptFullPath}`);
      }
    } catch (err) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SCAN] Script não encontrado: ${scriptFullPath}`, err);
      }
      return res.status(500).json({
        success: false,
        error: 'Script de scan não encontrado',
        message: `O script ${scriptPath} não foi encontrado no servidor.`
      });
    }
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SCAN] Iniciando Security scan com script: ${scriptPath}`);
    }
    
    // Executar o scan em background com -RunSecurityGate para gerar todos os relatórios
    // Usar Promise.resolve para capturar erros síncronos
    try {
      Promise.resolve()
        .then(() => executePowerShellScript(scriptPath, ['-RunSecurityGate']))
        .then(async (result) => {
          if (result.success) {
            // Log apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Security scan completed successfully');
            }
            
            // Aguardar mais tempo para garantir que o Security Gate termine de executar
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Forçar atualização dos arquivos de relatório
            try {
              await touchFile('semgrep-result.json');
            } catch (touchErr) {
              // Arquivo ainda não foi gerado - normal
            }
            
            // Aguardar um pouco mais e tentar atualizar o Security Gate Summary
            // (pode demorar mais porque o Python precisa processar)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              await touchFile('security-gate-summary.json');
            } catch (touchErr) {
              // Arquivo ainda não foi gerado - normal
            }
          } else {
            // Log apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Security scan failed');
            }
          }
        })
        .catch(err => {
          // Log apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Security scan error:', err);
          }
        });
    } catch (execError) {
      // Erro ao iniciar a execução do script
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SCAN] Erro ao iniciar execução do script:`, execError);
      }
      // Não retornar erro aqui, pois o script pode ainda estar executando
    }
    
    // Retornar imediatamente
    res.json({
      success: true,
      message: 'Scan de segurança iniciado. O relatório será gerado em breve.',
      scanType: 'security'
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao iniciar scan de segurança:', error);
    }
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar scan de segurança',
      message: error.message || 'Erro desconhecido ao iniciar scan',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Executar scan OWASP ZAP (simplificado)
exports.runZapScan = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const scanType = req.body?.scanType || 'simple'; // 'simple' ou 'full'
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SCAN] Recebida requisição para scan ZAP: ${scanType}`);
    }
    
    const scriptPath = scanType === 'full' 
      ? 'scripts/zap-scan.ps1' 
      : 'scripts/zap-scan-simple.ps1';
    
    // Verificar se o script existe
    const scriptFullPath = path.join(projectRoot, scriptPath);
    try {
      await fs.access(scriptFullPath);
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SCAN] Script encontrado: ${scriptFullPath}`);
      }
    } catch (err) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SCAN] Script não encontrado: ${scriptFullPath}`, err);
      }
      return res.status(500).json({
        success: false,
        error: 'Script de scan não encontrado',
        message: `O script ${scriptPath} não foi encontrado no servidor.`
      });
    }
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SCAN] Iniciando ZAP scan (${scanType}) com script: ${scriptPath}`);
      console.log(`[SCAN] Script full path: ${scriptFullPath}`);
    }
    
    // Executar o scan em background (não aguardar conclusão)
    // Usar Promise.resolve().catch() para garantir que qualquer erro seja capturado
    Promise.resolve()
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[SCAN] Iniciando execução do script: ${scriptPath}`);
        }
        return executePowerShellScript(scriptPath, ['-AutoStart']);
      })
      .then(async (result) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[SCAN] Script executado. Success: ${result.success}`);
        }
        
        // Verificar se o relatório foi gerado (mesmo que o scan tenha falhado)
        const reportPath = path.join(projectRoot, 'security', 'zap-report.html');
        try {
          await fs.access(reportPath);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[SCAN] Relatório ZAP encontrado após execução`);
          }
        } catch {
          // Relatório ainda não foi gerado - normal
        }
        
        if (result.success) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ ZAP scan (${scanType}) completed successfully`);
          }
        } else {
          // Mesmo se o script falhar, pode ter gerado um relatório de fallback
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ ZAP scan (${scanType}) retornou erro, mas pode ter gerado relatório`);
          }
        }
        
        // Aguardar um pouco e forçar atualização do arquivo (se existir)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se o relatório foi gerado e processar alertas
        try {
          await fs.access(reportPath);
          
          // Forçar atualização do arquivo de relatório ZAP
          await touchFile('security/zap-report.html');
          
          // Processar relatório e salvar alertas no banco
          if (userId) {
            await processZapReportAndSaveAlerts(userId, reportPath);
          }
        } catch (err) {
          // Relatório ainda não existe - normal
        }
      })
      .catch(err => {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ ZAP scan (${scanType}) error:`, err);
        }
      });
    
    // Retornar imediatamente (não aguardar conclusão do scan)
    res.json({
      success: true,
      message: `Scan OWASP ZAP (${scanType}) iniciado. O relatório será gerado em breve.`,
      scanType: 'zap',
      zapScanType: scanType
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao iniciar scan ZAP:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
    }
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar scan ZAP',
      message: error.message || 'Erro desconhecido ao iniciar scan',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Baixar/visualizar relatório
exports.downloadReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const userId = req.user?.userId;
    
    let filePath;
    let contentType;
    let fileName;
    
    switch (reportType) {
      case 'security':
        filePath = path.join(projectRoot, 'semgrep-result.json');
        contentType = 'application/json';
        fileName = 'semgrep-result.json';
        break;
      case 'zap':
        filePath = path.join(projectRoot, 'security', 'zap-report.html');
        contentType = 'text/html';
        fileName = 'zap-report.html';
        break;
      case 'security-gate':
        filePath = path.join(projectRoot, 'security-gate-summary.json');
        contentType = 'application/json';
        fileName = 'security-gate-summary.json';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de relatório inválido'
        });
    }
    
    // Verificar se o arquivo existe e não está vazio
    // Tentar múltiplas vezes se o arquivo não existir (pode estar sendo criado)
    let fileExists = false;
    let stats = null;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await fs.access(filePath);
        stats = await fs.stat(filePath);
        fileExists = true;
        break;
      } catch (err) {
        if (attempt < maxRetries - 1) {
          // Aguardar um pouco antes de tentar novamente (arquivo pode estar sendo criado)
          await new Promise(resolve => setTimeout(resolve, 500));
          // Não logar tentativas (evitar spam de logs)
        } else {
          // Arquivo não encontrado após tentativas - não logar erro (é esperado)
          return res.status(404).json({
            success: false,
            error: 'Relatório não encontrado',
            message: `O arquivo ${fileName} não foi encontrado no servidor.`
          });
        }
      }
    }
    
    if (!fileExists || !stats) {
      // Arquivo não encontrado - não logar (é esperado)
      return res.status(404).json({
        success: false,
        error: 'Relatório não encontrado',
        message: `O arquivo ${fileName} não foi encontrado no servidor.`
      });
    }
    
    if (stats.size === 0) {
      // Arquivo vazio - não logar (é esperado)
      return res.status(404).json({
        success: false,
        error: 'Relatório vazio',
        message: `O arquivo ${fileName} existe mas está vazio.`
      });
    }
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[REPORTS] Arquivo encontrado: ${filePath} (${stats.size} bytes)`);
    }
    
    // Para arquivos JSON, validar que é JSON válido antes de enviar
    if (contentType === 'application/json') {
      try {
        let fileContent = await fs.readFile(filePath, 'utf8');
        if (!fileContent || fileContent.trim().length === 0) {
          // Arquivo vazio - não logar (é esperado)
          return res.status(404).json({
            success: false,
            error: 'Relatório vazio',
            message: `O arquivo ${fileName} está vazio.`
          });
        }
        
        // Tentar extrair JSON se houver texto antes (caso do Semgrep que imprime status)
        try {
          JSON.parse(fileContent);
          console.log(`[REPORTS] JSON válido: ${filePath}`);
        } catch (parseError) {
          // Tentar extrair JSON do conteúdo (pode ter texto de status antes)
          const jsonMatch = fileContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            try {
              JSON.parse(extractedJson);
              console.log(`[REPORTS] JSON extraído do conteúdo (removido texto de status): ${filePath}`);
              // Reescrever arquivo com apenas o JSON
              await fs.writeFile(filePath, extractedJson, 'utf8');
              fileContent = extractedJson;
            } catch (extractError) {
              console.error(`[REPORTS] JSON extraído também é inválido: ${filePath}`, extractError);
              throw parseError; // Usar o erro original
            }
          } else {
            throw parseError;
          }
        }
      } catch (jsonError) {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error(`[REPORTS] Arquivo JSON inválido: ${filePath}`, jsonError);
        }
        return res.status(500).json({
          success: false,
          error: 'Relatório corrompido',
          message: `O arquivo ${fileName} contém JSON inválido.`
        });
      }
    }
    
    // Enviar o arquivo (res.sendFile requer path absoluto)
    const absolutePath = path.resolve(filePath);
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[REPORTS] Enviando arquivo: ${absolutePath} (${contentType})`);
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.sendFile(absolutePath, (err) => {
      if (err) {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error(`[REPORTS] Erro ao enviar arquivo:`, err);
        }
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Erro ao enviar relatório',
            message: err.message
          });
        }
      }
      // Não logar sucesso (evitar spam)
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao baixar relatório:', error);
    }
    res.status(500).json({
      success: false,
      error: 'Erro ao baixar relatório',
      message: error.message
    });
  }
};

// Verificar status dos relatórios
exports.getScanReports = async (req, res) => {
  try {
    // Não precisa de userId para listar relatórios (são arquivos do sistema)
    const reports = [];
    
    // Função auxiliar para obter stats do arquivo (força nova leitura)
    const getFileStats = async (filePath) => {
      try {
        // Verificar se o diretório existe antes de tentar acessar o arquivo
        const dirPath = path.dirname(filePath);
        
        // Só tentar criar diretório se não for o diretório raiz
        if (dirPath !== '.' && dirPath !== projectRoot) {
          try {
            await fs.access(dirPath);
          } catch (dirError) {
            // Diretório não existe, criar se necessário
            try {
              await fs.mkdir(dirPath, { recursive: true });
              // Log apenas em desenvolvimento
              if (process.env.NODE_ENV === 'development') {
                console.log(`[REPORTS] Diretório criado: ${dirPath}`);
              }
            } catch (mkdirError) {
              // Se falhar ao criar, apenas continuar (pode ser que já exista)
            }
          }
        }
        
        // Forçar nova leitura do arquivo
        const stats = await fs.stat(filePath);
        const lastModified = stats.mtime.toISOString();
        // Log apenas em modo desenvolvimento ou se o arquivo foi modificado recentemente
        if (process.env.NODE_ENV === 'development') {
          console.log(`[REPORTS] Arquivo ${path.basename(filePath)}: ${lastModified} (size: ${stats.size} bytes)`);
        }
        return {
          exists: true,
          lastModified: lastModified,
          size: stats.size
        };
      } catch (err) {
        // Arquivo não existe ou erro ao acessar - não logar (é esperado que alguns arquivos não existam)
        // Apenas retornar que não existe
        return { exists: false };
      }
    };
    
    // Verificar relatório Semgrep
    try {
      const semgrepReport = path.join(projectRoot, 'semgrep-result.json');
      const semgrepInfo = await getFileStats(semgrepReport);
      reports.push({
        type: 'security',
        name: 'Semgrep Security Scan',
        file: 'semgrep-result.json',
        ...semgrepInfo
      });
    } catch (err) {
      // Erro ao verificar - apenas adicionar como não existente, não logar (é esperado)
      reports.push({
        type: 'security',
        name: 'Semgrep Security Scan',
        file: 'semgrep-result.json',
        exists: false
      });
    }
    
    // Verificar relatório ZAP
    try {
      const zapReport = path.join(projectRoot, 'security', 'zap-report.html');
      const zapInfo = await getFileStats(zapReport);
      reports.push({
        type: 'zap',
        name: 'OWASP ZAP Scan Report',
        file: 'security/zap-report.html',
        ...zapInfo
      });
    } catch (err) {
      // Erro ao verificar - apenas adicionar como não existente, não logar (é esperado)
      reports.push({
        type: 'zap',
        name: 'OWASP ZAP Scan Report',
        file: 'security/zap-report.html',
        exists: false
      });
    }
    
    // Verificar Security Gate Summary
    try {
      const securityGateReport = path.join(projectRoot, 'security-gate-summary.json');
      const gateInfo = await getFileStats(securityGateReport);
      reports.push({
        type: 'security-gate',
        name: 'Security Gate Summary',
        file: 'security-gate-summary.json',
        ...gateInfo
      });
    } catch (err) {
      // Erro ao verificar - apenas adicionar como não existente, não logar (é esperado)
      reports.push({
        type: 'security-gate',
        name: 'Security Gate Summary',
        file: 'security-gate-summary.json',
        exists: false
      });
    }
    
    // Adicionar headers para evitar cache e garantir atualização
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    
    res.json({
      success: true,
      reports,
      timestamp: new Date().toISOString() // Adicionar timestamp da resposta
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar relatórios:', error);
      console.error('Error stack:', error.stack);
    }
    
    // Sempre retornar uma resposta válida, mesmo em caso de erro (não quebrar o frontend)
    res.json({
      success: true,
      reports: [], // Retornar array vazio em caso de erro
      timestamp: new Date().toISOString()
    });
  }
};
