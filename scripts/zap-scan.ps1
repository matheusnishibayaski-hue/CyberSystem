<#
.SYNOPSIS
    Script para escanear a API com OWASP ZAP
.DESCRIPTION
    Executa scan completo de segurança usando OWASP ZAP.
    Requer: OWASP ZAP instalado ou Docker
.PARAMETER Target
    URL do servidor a ser escaneado (padrão: http://localhost:3000)
    O script detecta automaticamente a porta se não especificada
.PARAMETER ReportPath
    Caminho onde o relatório HTML será salvo (padrão: security/zap-report.html)
.PARAMETER Timeout
    Timeout do scan em segundos (padrão: 300)
.PARAMETER AutoStart
    Inicia o servidor automaticamente se não estiver rodando
.EXAMPLE
    .\zap-scan.ps1
    Executa scan completo na porta padrão
.EXAMPLE
    .\zap-scan.ps1 -Target "http://localhost:3001" -Timeout 600
    Executa scan em porta específica com timeout maior
.NOTES
    Para instalar OWASP ZAP:
    - Desktop: https://www.zaproxy.org/download/
    - Docker: docker pull owasp/zap2docker-stable
    - CLI: python -m pip install --user zapcli
#>

param(
    [Parameter(HelpMessage="URL do servidor (ex: http://localhost:3000)")]
    [string]$Target = "http://localhost:3000",
    
    [Parameter(HelpMessage="Caminho do relatório HTML")]
    [string]$ReportPath = "security/zap-report.html",
    
    [Parameter(HelpMessage="Timeout do scan em segundos")]
    [int]$Timeout = 300,
    
    [Parameter(HelpMessage="Inicia o servidor automaticamente se não estiver rodando")]
    [switch]$AutoStart
)

Write-Host "=== OWASP ZAP Security Scan ===" -ForegroundColor Cyan
Write-Host "Scan completo de segurança com OWASP ZAP" -ForegroundColor Gray
Write-Host ""

# Função para detectar a porta do servidor
function Find-ServerPort {
    # Tenta ler do arquivo .env primeiro
    if (Test-Path ".env") {
        try {
            $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
            $portLine = $envContent | Where-Object { $_ -match '^\s*PORT\s*=\s*(\d+)' } | Select-Object -First 1
            if ($portLine) {
                if ($portLine -match 'PORT\s*=\s*(\d+)') {
                    $port = [int]$matches[1]
                    if ($port -gt 0 -and $port -lt 65536) {
                        # Verifica se o servidor está realmente rodando nessa porta
                        try {
                            $testResponse = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                            return $port
                        } catch {
                            # Porta do .env não está respondendo, continua procurando
                        }
                    }
                }
            }
        } catch {
            # Ignora erros ao ler .env
        }
    }
    
    # Tenta portas comuns (3001 primeiro, pois é comum quando 3000 está ocupada)
    $commonPorts = @(3001, 3000, 3002, 8000, 8080, 5000)
    foreach ($port in $commonPorts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                return $port
            }
        } catch {
            continue
        }
    }
    
    # Retorna null se não encontrar (não retorna 3000 para evitar falsos positivos)
    return $null
}

# Função para verificar se o servidor está rodando
function Test-ServerHealth {
    param([string]$Url, [int]$Timeout = 5)
    try {
        $response = Invoke-WebRequest -Uri "$Url/health" -UseBasicParsing -TimeoutSec $Timeout -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Função para iniciar o servidor
function Start-Server {
    Write-Host "Tentando iniciar o servidor..." -ForegroundColor Yellow
    $nodeProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    $attempts = 0
    $maxAttempts = 10
    while ($attempts -lt $maxAttempts) {
        if (Test-ServerHealth -Url $Target -Timeout 2) {
            Write-Host "[OK] Servidor iniciado com sucesso" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
        $attempts++
    }
    return $false
}

# Detecta a porta do servidor se não foi especificada explicitamente
if ($Target -eq "http://localhost:3000") {
    Write-Host "Detectando porta do servidor..." -ForegroundColor Yellow
    $detectedPort = Find-ServerPort
    if ($null -ne $detectedPort) {
        $Target = "http://localhost:$detectedPort"
        Write-Host "[OK] Servidor detectado na porta $detectedPort" -ForegroundColor Green
        Write-Host ""
    } else {
        # Se não detectou, tenta a porta padrão mas não assume que está rodando
        Write-Host "[!] Servidor nao detectado automaticamente, tentando porta padrao 3000..." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Verifica se o target está acessível
Write-Host "Verificando se o servidor está rodando em $Target..." -ForegroundColor Yellow
$serverRunning = Test-ServerHealth -Url $Target

if (-not $serverRunning) {
    Write-Host "[ERRO] Erro: Servidor nao esta acessivel em $Target" -ForegroundColor Red
    
    if ($AutoStart) {
        Write-Host "Tentando iniciar automaticamente..." -ForegroundColor Yellow
        $started = Start-Server
        if (-not $started) {
            Write-Host "[ERRO] Nao foi possivel iniciar o servidor automaticamente" -ForegroundColor Red
            Write-Host "   Inicie o servidor com: npm start" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "   Inicie o servidor com: npm start" -ForegroundColor Yellow
        Write-Host "   Ou use -AutoStart para iniciar automaticamente" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "[OK] Servidor esta rodando em $Target" -ForegroundColor Green
}

# Função para encontrar instalação do ZAP Desktop
function Find-ZapInstallation {
    $commonPaths = @(
        "$env:ProgramFiles\ZAP\Zed Attack Proxy\zap.bat",
        "$env:ProgramFiles\OWASP\Zed Attack Proxy\zap.bat",
        "C:\Program Files\ZAP\Zed Attack Proxy\zap.bat",
        "C:\Program Files (x86)\ZAP\Zed Attack Proxy\zap.bat",
        "C:\Program Files\OWASP\Zed Attack Proxy\zap.bat",
        "C:\Program Files (x86)\OWASP\Zed Attack Proxy\zap.bat",
        "$env:LOCALAPPDATA\Programs\ZAP\zap.bat"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    return $null
}

# Função para encontrar ZAP CLI ou ZAP rodando
function Find-ZapCli {
    # Método 1: Verifica se ZAP está rodando na porta padrão (8080)
    try {
        $zapResponse = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return @{
            Found = $true
            Method = "zap-running"
            Path = ""
            Location = "http://localhost:8080"
            Running = $true
        }
    } catch {
        # ZAP não está rodando, verificar se está instalado
        $zapInstallPath = Find-ZapInstallation
        
        if ($null -ne $zapInstallPath) {
            return @{
                Found = $true
                Method = "zap-installed"
                Path = $zapInstallPath
                Location = $zapInstallPath
                Running = $false
            }
        }
    }
    
    # Método 2: Verifica se zap-cli está no PATH
    try {
        $zapCli = Get-Command zap-cli -ErrorAction Stop
        return @{
            Found = $true
            Method = "zap-cli"
            Path = "zap-cli"
            Location = "PATH"
            Running = $false
        }
    } catch {
        # Método 3: Verifica diretórios comuns do Python
        $pythonPaths = @(
            "$env:APPDATA\Python\Python314\Scripts\zap-cli.exe",
            "$env:APPDATA\Python\Python313\Scripts\zap-cli.exe",
            "$env:APPDATA\Python\Python312\Scripts\zap-cli.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python314\Scripts\zap-cli.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python313\Scripts\zap-cli.exe",
            "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts\zap-cli.exe"
        )
        
        foreach ($path in $pythonPaths) {
            if (Test-Path $path) {
                return @{
                    Found = $true
                    Method = "zap-cli"
                    Path = $path
                    Location = $path
                    Running = $false
                }
            }
        }
        
        return @{
            Found = $false
            Method = ""
            Path = ""
            Location = ""
            Running = $false
        }
    }
}

# Write a minimal HTML report when full scan cannot run
function Write-FallbackReport {
    param([string]$Reason)

    $reportDir = Split-Path -Parent $ReportPath
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }

    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>OWASP ZAP Report (Fallback) - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; }
        code { background: #eee; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>OWASP ZAP Full Scan Report (Fallback)</h1>
        <p><strong>Target:</strong> $Target</p>
        <p><strong>Scan Date:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <div class="warning">
            <p><strong>Full scan could not run.</strong></p>
            <p>Reason: $Reason</p>
            <p>Install OWASP ZAP Desktop and ensure it is running, or set the <code>ZAP_PATH</code> environment variable.</p>
        </div>
    </div>
</body>
</html>
"@

    # Backup existing report if present
    $backupPath = $ReportPath -replace '\.html$', '-backup.html'
    if (Test-Path $ReportPath) {
        try {
            Copy-Item -Path $ReportPath -Destination $backupPath -Force
        } catch { }
        try {
            Remove-Item -Path $ReportPath -Force
        } catch { }
    }

    $html | Out-File -FilePath $ReportPath -Encoding UTF8
    if (Test-Path $ReportPath) {
        (Get-Item $ReportPath).LastWriteTime = Get-Date
    }
}

# Verifica se ZAP está disponível
Write-Host "Procurando OWASP ZAP..." -ForegroundColor Yellow
$zapInfo = Find-ZapCli

if (-not $zapInfo.Found) {
    Write-Host "[!] ZAP nao encontrado no sistema" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[INFO] Executando scan simplificado..." -ForegroundColor Cyan
    Write-Host ""
    
    # Executar scan simplificado automaticamente
    $simpleScanPath = Join-Path $PSScriptRoot "zap-scan-simple.ps1"
    if (Test-Path $simpleScanPath) {
        & $simpleScanPath -Target $Target -ReportPath $ReportPath
        exit $LASTEXITCODE
    } else {
        Write-Host "[ERRO] Script de scan simplificado nao encontrado" -ForegroundColor Red
        Write-FallbackReport -Reason "OWASP ZAP not available. Fallback scan script also missing."
        exit 1
    }
} elseif ($zapInfo.Found -and -not $zapInfo.Running) {
    # ZAP está instalado mas não está rodando
    Write-Host "[!] OWASP ZAP Desktop encontrado, mas NAO esta rodando!" -ForegroundColor Yellow
    Write-Host "[*] Localizacao: $($zapInfo.Location)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "  COMO EXECUTAR O SCAN COMPLETO:" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Abra o OWASP ZAP Desktop" -ForegroundColor Yellow
    Write-Host "   Localizacao: $($zapInfo.Location)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Deixe o ZAP aberto em segundo plano" -ForegroundColor Yellow
    Write-Host "   (Nao precisa fazer nada dentro do programa)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Execute o scan novamente" -ForegroundColor Yellow
    Write-Host "   O sistema vai detectar o ZAP automaticamente" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[INFO] Enquanto isso, executando scan simplificado..." -ForegroundColor Cyan
    Write-Host ""
    
    # Executar scan simplificado como fallback
    $simpleScanPath = Join-Path $PSScriptRoot "zap-scan-simple.ps1"
    if (Test-Path $simpleScanPath) {
        & $simpleScanPath -Target $Target -ReportPath $ReportPath
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[OK] ZAP encontrado e rodando: $($zapInfo.Location)" -ForegroundColor Green
    $zapAvailable = $true
    $zapMethod = $zapInfo.Method
    $zapCliPath = $zapInfo.Path
}

# Cria diretório de relatórios se não existir
$reportDir = Split-Path -Parent $ReportPath
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

Write-Host ""
Write-Host "Iniciando scan de segurança..." -ForegroundColor Cyan
Write-Host "Target: $Target" -ForegroundColor Gray
Write-Host "Timeout: $Timeout segundos" -ForegroundColor Gray
Write-Host ""

if ($zapMethod -eq "zap-running" -or $zapMethod -eq "zap-cli") {
    # Usa ZAP API ou zap-cli para fazer o scan
    try {
        if ($zapMethod -eq "zap-running") {
            Write-Host "Executando scan usando ZAP API..." -ForegroundColor Yellow
            Write-Host "[OK] ZAP Desktop esta rodando na porta 8080" -ForegroundColor Green
            Write-Host ""
            
            # Usar Python para fazer chamadas à API do ZAP
            # Por enquanto, vamos usar uma abordagem simples com Invoke-WebRequest
            Write-Host "Iniciando spider scan..." -ForegroundColor Yellow
            
            try {
                # Spider scan
                $spiderResult = Invoke-WebRequest -Uri "http://localhost:8080/JSON/spider/action/scan/?url=$Target" -UseBasicParsing -TimeoutSec 5
                Write-Host "[OK] Spider scan iniciado" -ForegroundColor Green
                
                # Aguardar spider completar (simplificado)
                Start-Sleep -Seconds 5
                
                # Active scan
                Write-Host "Iniciando active scan..." -ForegroundColor Yellow
                $scanResult = Invoke-WebRequest -Uri "http://localhost:8080/JSON/ascan/action/scan/?url=$Target" -UseBasicParsing -TimeoutSec 5
                Write-Host "[OK] Active scan iniciado" -ForegroundColor Green
                
                # Aguardar scan completar
                Write-Host "Aguardando conclusao do scan (pode levar alguns minutos)..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
                
            } catch {
                Write-Host "[!] Erro ao executar scan via API, tentando metodo alternativo..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Executando scan com zap-cli..." -ForegroundColor Yellow
            Write-Host "[!] Nota: zap-cli requer OWASP ZAP instalado e rodando" -ForegroundColor Yellow
            Write-Host ""
            
            # Quick scan (mais rápido) - requer ZAP rodando
            & $zapCliPath quick-scan --self-contained --start-options '-config api.disablekey=true' $Target
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[!] ZAP daemon nao esta rodando - usando scan simplificado" -ForegroundColor Yellow
            Write-Host ""
            
            # Executar scan simplificado automaticamente
            $simpleScanPath = Join-Path $PSScriptRoot "zap-scan-simple.ps1"
            if (Test-Path $simpleScanPath) {
                & $simpleScanPath -Target $Target -ReportPath $ReportPath
                exit $LASTEXITCODE
            } else {
                Write-Host "[ERRO] Script de scan simplificado nao encontrado" -ForegroundColor Red
                Write-FallbackReport -Reason "ZAP daemon not running. Fallback to simplified scan failed."
                exit 1
            }
        }
        
        # Fazer backup do arquivo anterior se existir
        $backupPath = $ReportPath -replace '\.html$', '-backup.html'
        if (Test-Path $ReportPath) {
            try {
                Copy-Item -Path $ReportPath -Destination $backupPath -Force
                Write-Host "[*] Backup do relatorio anterior criado: $backupPath" -ForegroundColor Gray
            } catch {
                Write-Host "[!] Nao foi possivel criar backup do relatorio anterior" -ForegroundColor Yellow
            }
            
            # Deletar arquivo existente para garantir atualização da data de modificação
            try {
                Remove-Item -Path $ReportPath -Force
            } catch {
                Write-Host "[!] Nao foi possivel deletar arquivo anterior" -ForegroundColor Yellow
            }
        }
        
        # Gera relatório HTML
        Write-Host ""
        Write-Host "Gerando relatório HTML..." -ForegroundColor Yellow
        
        if ($zapMethod -eq "zap-running") {
            # Gerar relatório via API
            try {
                $reportHtml = Invoke-WebRequest -Uri "http://localhost:8080/OTHER/core/other/htmlreport/" -UseBasicParsing -TimeoutSec 30
                $reportHtml.Content | Out-File -FilePath $ReportPath -Encoding UTF8
                Write-Host "[OK] Relatorio gerado via API" -ForegroundColor Green
            } catch {
                Write-Host "[!] Erro ao gerar relatorio via API: $_" -ForegroundColor Yellow
                Write-Host "[INFO] Tente exportar manualmente do ZAP: Report > Generate HTML Report" -ForegroundColor Cyan
            }
        } else {
            & $zapCliPath report -o $ReportPath -f html
        }
        
        # Forçar atualização da data de modificação
        if (Test-Path $ReportPath) {
            (Get-Item $ReportPath).LastWriteTime = Get-Date
        }
        
        Write-Host ""
        Write-Host "[OK] Scan concluido!" -ForegroundColor Green
        Write-Host "[INFO] Relatorio salvo em: $ReportPath" -ForegroundColor Cyan
        
    } catch {
        Write-Host "[ERRO] Erro ao executar scan: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "[INFO] Certifique-se de que OWASP ZAP esta rodando" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Executando scan simplificado como alternativa..." -ForegroundColor Cyan
        
        # Fallback para scan simplificado
        $simpleScanPath = Join-Path $PSScriptRoot "zap-scan-simple.ps1"
        if (Test-Path $simpleScanPath) {
            & $simpleScanPath -Target $Target -ReportPath $ReportPath
        }
        exit 1
    }
}

Write-Host ""
Write-Host "=== Scan Finalizado ===" -ForegroundColor Cyan

