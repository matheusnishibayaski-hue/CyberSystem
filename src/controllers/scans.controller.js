const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const execAsync = promisify(exec);

// Função auxiliar para executar scripts PowerShell
async function executePowerShellScript(scriptPath, args = []) {
  const scriptFullPath = path.join(process.cwd(), scriptPath);
  const argsString = args.join(' ');
  const command = `powershell -ExecutionPolicy Bypass -File "${scriptFullPath}" ${argsString}`;
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    return {
      success: true,
      output: stdout,
      error: stderr || null
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
}

// Executar scan de segurança (Semgrep)
exports.runSecurityScan = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Executar o scan em background (não bloquear a resposta)
    executePowerShellScript('scripts/security-scan.ps1')
      .then(result => {
        // Log do resultado (opcional - pode salvar no banco)
        console.log('Security scan completed:', result.success ? 'SUCCESS' : 'FAILED');
      })
      .catch(err => {
        console.error('Security scan error:', err);
      });
    
    // Retornar imediatamente
    res.json({
      success: true,
      message: 'Scan de segurança iniciado. O relatório será gerado em breve.',
      scanType: 'security'
    });
  } catch (error) {
    console.error('Erro ao iniciar scan de segurança:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar scan de segurança',
      message: error.message
    });
  }
};

// Executar scan OWASP ZAP (simplificado)
exports.runZapScan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const scanType = req.body.scanType || 'simple'; // 'simple' ou 'full'
    
    const scriptPath = scanType === 'full' 
      ? 'scripts/zap-scan.ps1' 
      : 'scripts/zap-scan-simple.ps1';
    
    // Executar o scan em background
    executePowerShellScript(scriptPath, ['-AutoStart'])
      .then(result => {
        console.log('ZAP scan completed:', result.success ? 'SUCCESS' : 'FAILED');
      })
      .catch(err => {
        console.error('ZAP scan error:', err);
      });
    
    res.json({
      success: true,
      message: `Scan OWASP ZAP (${scanType}) iniciado. O relatório será gerado em breve.`,
      scanType: 'zap',
      zapScanType: scanType
    });
  } catch (error) {
    console.error('Erro ao iniciar scan ZAP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar scan ZAP',
      message: error.message
    });
  }
};

// Baixar/visualizar relatório
exports.downloadReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const userId = req.user.userId;
    
    let filePath;
    let contentType;
    let fileName;
    
    switch (reportType) {
      case 'security':
        filePath = path.join(process.cwd(), 'semgrep-result.json');
        contentType = 'application/json';
        fileName = 'semgrep-result.json';
        break;
      case 'zap':
        filePath = path.join(process.cwd(), 'security', 'zap-report.html');
        contentType = 'text/html';
        fileName = 'zap-report.html';
        break;
      case 'security-gate':
        filePath = path.join(process.cwd(), 'security-gate-summary.json');
        contentType = 'application/json';
        fileName = 'security-gate-summary.json';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de relatório inválido'
        });
    }
    
    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Relatório não encontrado'
      });
    }
    
    // Enviar o arquivo (res.sendFile requer path absoluto)
    const absolutePath = path.resolve(filePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
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
    const reports = [];
    
    // Verificar relatório Semgrep
    const semgrepReport = path.join(process.cwd(), 'semgrep-result.json');
    try {
      const semgrepStats = await fs.stat(semgrepReport);
      reports.push({
        type: 'security',
        name: 'Semgrep Security Scan',
        file: 'semgrep-result.json',
        lastModified: semgrepStats.mtime,
        exists: true
      });
    } catch {
      reports.push({
        type: 'security',
        name: 'Semgrep Security Scan',
        file: 'semgrep-result.json',
        exists: false
      });
    }
    
    // Verificar relatório ZAP
    const zapReport = path.join(process.cwd(), 'security', 'zap-report.html');
    try {
      const zapStats = await fs.stat(zapReport);
      reports.push({
        type: 'zap',
        name: 'OWASP ZAP Scan Report',
        file: 'security/zap-report.html',
        lastModified: zapStats.mtime,
        exists: true
      });
    } catch {
      reports.push({
        type: 'zap',
        name: 'OWASP ZAP Scan Report',
        file: 'security/zap-report.html',
        exists: false
      });
    }
    
    // Verificar Security Gate Summary
    const securityGateReport = path.join(process.cwd(), 'security-gate-summary.json');
    try {
      const gateStats = await fs.stat(securityGateReport);
      reports.push({
        type: 'security-gate',
        name: 'Security Gate Summary',
        file: 'security-gate-summary.json',
        lastModified: gateStats.mtime,
        exists: true
      });
    } catch {
      reports.push({
        type: 'security-gate',
        name: 'Security Gate Summary',
        file: 'security-gate-summary.json',
        exists: false
      });
    }
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar relatórios',
      message: error.message
    });
  }
};
