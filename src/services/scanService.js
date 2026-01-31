const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const execAsync = promisify(exec);
const projectRoot = path.resolve(__dirname, '..', '..');
const { query } = require('../config/db.config');

// Função auxiliar para executar scripts PowerShell
async function executePowerShellScript(scriptPath, args = []) {
  try {
    const scriptFullPath = path.join(projectRoot, scriptPath);
    
    // Verificar se o script existe antes de executar
    try {
      await fs.access(scriptFullPath);
    } catch (accessError) {
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
    let command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptFullPath}"`;
    if (args && args.length > 0) {
      const escapedArgs = args.map(arg => arg);
      command += ' ' + escapedArgs.join(' ');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SCAN] Executando: ${command}`);
    }
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 600000, // 10 minutos timeout
      encoding: 'utf8',
      windowsHide: true
    });
    
    return {
      success: true,
      output: stdout,
      error: stderr || null
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SCAN] Erro ao executar comando:`, error.message);
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
    const htmlContent = await fs.readFile(reportPath, 'utf8');
    const alerts = [];
    
    // 1. Verificar headers de segurança ausentes
    const securityHeadersTable = htmlContent.match(/Security Headers[\s\S]*?<table>([\s\S]*?)<\/table>/i);
    if (securityHeadersTable) {
      const tableContent = securityHeadersTable[1];
      const rowMatches = tableContent.matchAll(/<tr>([\s\S]*?)<\/tr>/gi);
      
      for (const rowMatch of rowMatches) {
        const rowContent = rowMatch[1];
        if (rowContent.includes('<th>')) continue;
        
        const cells = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        const cellArray = Array.from(cells).map(m => m[1]?.replace(/<[^>]+>/g, '').trim());
        
        if (cellArray.length >= 2) {
          const headerName = cellArray[0];
          const status = cellArray[1];
          
          if (status.toLowerCase().includes('missing') || status.toLowerCase().includes('ausente')) {
            let severity = 'warning';
            let alertName = '';
            
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
        if (rowContent.includes('<th>')) continue;
        
        const cells = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        const cellArray = Array.from(cells).map(m => m[1]?.replace(/<[^>]+>/g, '').trim());
        
        if (cellArray.length >= 4) {
          const endpoint = cellArray[0];
          const method = cellArray[1];
          const status = cellArray[2];
          const result = cellArray[3];
          
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
    
    // Salvar alertas no banco de dados
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
    try {
      await fs.access(fullPath);
      const now = new Date();
      await fs.utimes(fullPath, now, now);
    } catch (accessError) {
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        await fs.writeFile(fullPath, content, 'utf8');
      } catch (rwError) {
        // Arquivo não existe ou não pode ser atualizado
      }
    }
  } catch (error) {
    console.error(`[SCAN] Erro ao atualizar arquivo ${filePath}:`, error.message);
  }
}

// Executar scan de segurança (Semgrep) - versão sem req/res
async function executeSecurityScan(userId = null) {
  try {
    const scriptPath = 'scripts/security-scan.ps1';
    const scriptFullPath = path.join(projectRoot, scriptPath);
    
    // Verificar se o script existe
    try {
      await fs.access(scriptFullPath);
    } catch (err) {
      throw new Error(`Script não encontrado: ${scriptPath}`);
    }
    
    console.log(`[SCAN] Iniciando Security scan`);
    
    // Executar o scan
    const result = await executePowerShellScript(scriptPath, ['-RunSecurityGate']);
    
    if (result.success) {
      console.log('✅ Security scan completed successfully');
      
      // Aguardar para garantir que o Security Gate termine
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Forçar atualização dos arquivos de relatório
      try {
        await touchFile('semgrep-result.json');
      } catch (touchErr) {
        // Arquivo ainda não foi gerado - normal
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await touchFile('security-gate-summary.json');
      } catch (touchErr) {
        // Arquivo ainda não foi gerado - normal
      }
    } else {
      console.error('❌ Security scan failed');
      throw new Error(result.error || 'Scan falhou');
    }
    
    return { success: true, result };
  } catch (error) {
    console.error('Erro ao executar scan de segurança:', error);
    throw error;
  }
}

// Executar scan OWASP ZAP - versão sem req/res
async function executeZapScan(userId = null, scanType = 'simple') {
  try {
    const scriptPath = scanType === 'full' 
      ? 'scripts/zap-scan.ps1' 
      : 'scripts/zap-scan-simple.ps1';
    
    const scriptFullPath = path.join(projectRoot, scriptPath);
    
    // Verificar se o script existe
    try {
      await fs.access(scriptFullPath);
    } catch (err) {
      throw new Error(`Script não encontrado: ${scriptPath}`);
    }
    
    console.log(`[SCAN] Iniciando ZAP scan (${scanType})`);
    
    // Executar o scan
    const result = await executePowerShellScript(scriptPath, ['-AutoStart']);
    
    // Verificar se o relatório foi gerado
    const reportPath = path.join(projectRoot, 'security', 'zap-report.html');
    
    if (result.success) {
      console.log(`✅ ZAP scan (${scanType}) completed successfully`);
    } else {
      console.warn(`⚠️ ZAP scan (${scanType}) retornou erro, mas pode ter gerado relatório`);
    }
    
    // Aguardar um pouco e forçar atualização do arquivo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o relatório foi gerado e processar alertas
    try {
      await fs.access(reportPath);
      await touchFile('security/zap-report.html');
      
      // Processar relatório e salvar alertas no banco
      if (userId) {
        await processZapReportAndSaveAlerts(userId, reportPath);
      }
    } catch (err) {
      // Relatório ainda não existe - normal
    }
    
    return { success: true, result };
  } catch (error) {
    console.error('Erro ao executar scan ZAP:', error);
    throw error;
  }
}

module.exports = {
  executeSecurityScan,
  executeZapScan,
  executePowerShellScript,
  processZapReportAndSaveAlerts,
  touchFile
};
