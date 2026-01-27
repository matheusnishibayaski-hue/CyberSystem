<#
.SYNOPSIS
    Script simplificado para scan de segurança web
.DESCRIPTION
    Este script cria um relatório básico de segurança sem precisar do OWASP ZAP instalado.
    Detecta automaticamente a porta do servidor e testa endpoints e headers de segurança.
.PARAMETER Target
    URL do servidor a ser escaneado (padrão: http://localhost:3000)
    O script detecta automaticamente a porta se não especificada
.PARAMETER ReportPath
    Caminho onde o relatório HTML será salvo (padrão: security/zap-report.html)
.PARAMETER AutoStart
    Inicia o servidor automaticamente se não estiver rodando
.PARAMETER RetryCount
    Número de tentativas para verificar o servidor (padrão: 3)
.PARAMETER RetryDelay
    Delay em segundos entre tentativas (padrão: 2)
.EXAMPLE
    .\zap-scan-simple.ps1
    Executa scan na porta padrão (detecta automaticamente)
.EXAMPLE
    .\zap-scan-simple.ps1 -Target "http://localhost:3001"
    Executa scan em porta específica
.EXAMPLE
    .\zap-scan-simple.ps1 -AutoStart
    Inicia o servidor automaticamente se necessário
#>

param(
    [Parameter(HelpMessage="URL do servidor (ex: http://localhost:3000)")]
    [string]$Target = "http://localhost:3000",
    
    [Parameter(HelpMessage="Caminho do relatório HTML")]
    [string]$ReportPath = "security/zap-report.html",
    
    [Parameter(HelpMessage="Inicia o servidor automaticamente se não estiver rodando")]
    [switch]$AutoStart,
    
    [Parameter(HelpMessage="Número de tentativas")]
    [int]$RetryCount = 3,
    
    [Parameter(HelpMessage="Delay entre tentativas (segundos)")]
    [int]$RetryDelay = 2
)

Write-Host "=== Security Scan Report (Simplified) ===" -ForegroundColor Cyan
Write-Host "Script de análise de segurança web simplificada" -ForegroundColor Gray
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
    
    # Aguarda o servidor iniciar
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
    Write-Host "[!] Servidor pode nao ter iniciado completamente" -ForegroundColor Yellow
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

# Verifica se o servidor está rodando
Write-Host "Verificando servidor em $Target..." -ForegroundColor Yellow
$serverRunning = Test-ServerHealth -Url $Target

if (-not $serverRunning) {
    Write-Host "[ERRO] Servidor nao esta acessivel" -ForegroundColor Red
    
    if ($AutoStart) {
        Write-Host "Tentando iniciar automaticamente..." -ForegroundColor Yellow
        $started = Start-Server
        if (-not $started) {
            Write-Host "[ERRO] Nao foi possivel iniciar o servidor automaticamente" -ForegroundColor Red
            Write-Host "[INFO] Inicie manualmente com: npm start" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "[INFO] Inicie o servidor com: npm start" -ForegroundColor Yellow
        Write-Host "   Ou use -AutoStart para iniciar automaticamente" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "[OK] Servidor esta rodando" -ForegroundColor Green
}

# Cria diretório se não existir
$reportDir = Split-Path -Parent $ReportPath
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

# Testa endpoints básicos
Write-Host ""
Write-Host "Testando endpoints..." -ForegroundColor Yellow

$tests = @(
    @{Path="/health"; Method="GET"; Expected=200},
    @{Path="/api/auth/register"; Method="POST"; Expected=400},
    @{Path="/api/auth/login"; Method="POST"; Expected=400}
)

$results = @()

foreach ($test in $tests) {
    try {
        if ($test.Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "$Target$($test.Path)" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        } else {
            $body = @{} | ConvertTo-Json
            $response = Invoke-WebRequest -Uri "$Target$($test.Path)" -Method $test.Method -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        }
        
        $results += @{
            Endpoint = $test.Path
            Method = $test.Method
            Status = $response.StatusCode
            Secure = $response.StatusCode -eq $test.Expected
            Headers = $response.Headers
        }
        $statusIcon = if ($response.StatusCode -eq $test.Expected) { "OK" } else { "WARN" }
        Write-Host "  $statusIcon $($test.Method) $($test.Path) - Status: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq $test.Expected) { "Green" } else { "Yellow" })
    } catch {
        $statusCode = 0
        if ($null -ne $_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        
        $isExpected = if ($statusCode -gt 0) { $statusCode -eq $test.Expected } else { $false }
        $results += @{
            Endpoint = $test.Path
            Method = $test.Method
            Status = $statusCode
            Secure = $isExpected
            Error = $_.Exception.Message
        }
        $statusIcon = if ($isExpected) { "OK" } else { "WARN" }
        $statusText = if ($statusCode -gt 0) { "Status: $statusCode" } else { "Error: Connection failed" }
        Write-Host "  $statusIcon $($test.Method) $($test.Path) - $statusText" -ForegroundColor $(if ($isExpected) { "Green" } else { "Yellow" })
    }
}

# Verifica headers de segurança
Write-Host ""
Write-Host "Verificando headers de segurança..." -ForegroundColor Yellow
$securityHeaders = @("X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection", "Strict-Transport-Security")
$foundHeaders = @()

try {
    $response = Invoke-WebRequest -Uri "$Target/health" -UseBasicParsing
    foreach ($header in $securityHeaders) {
        if ($response.Headers[$header]) {
            $foundHeaders += $header
            Write-Host "  [OK] $header presente" -ForegroundColor Green
        } else {
            Write-Host "  [!] $header ausente" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  [ERRO] Erro ao verificar headers" -ForegroundColor Red
}

# Gera relatório HTML
Write-Host ""
Write-Host "Gerando relatório HTML..." -ForegroundColor Yellow

$html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Security Scan Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .error { background: #f8d7da; border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #4CAF50; color: white; }
        .status-ok { color: #28a745; font-weight: bold; }
        .status-warn { color: #ffc107; font-weight: bold; }
        .status-error { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Security Scan Report</h1>
        <p><strong>Target:</strong> $Target</p>
        <p><strong>Scan Date:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <p><strong>Note:</strong> Este é um relatório simplificado. Para scan completo, use OWASP ZAP Desktop.</p>
        
        <h2>Endpoint Tests</h2>
        <table>
            <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Status Code</th>
                <th>Result</th>
            </tr>
"@

foreach ($result in $results) {
    $statusClass = if ($result.Secure) { "status-ok" } else { "status-warn" }
    $statusText = if ($result.Secure) { "OK" } else { "Warning" }
    $html += @"
            <tr>
                <td>$($result.Endpoint)</td>
                <td>$($result.Method)</td>
                <td>$($result.Status)</td>
                <td class="$statusClass">$statusText</td>
            </tr>
"@
}

$html += @"
        </table>
        
        <h2>Security Headers</h2>
        <table>
            <tr>
                <th>Header</th>
                <th>Status</th>
            </tr>
"@

foreach ($header in $securityHeaders) {
    $present = $foundHeaders -contains $header
    $status = if ($present) { '<span class="status-ok">Present</span>' } else { '<span class="status-warn">Missing</span>' }
    $html += @"
            <tr>
                <td>$header</td>
                <td>$status</td>
            </tr>
"@
}

$html += @"
        </table>
        
        <h2>Recommendations</h2>
        <div class="test-result warning">
            <strong>Aviso: Para scan completo de seguranca:</strong>
            <ul>
                <li>Instale OWASP ZAP Desktop: <a href="https://www.zaproxy.org/download/">https://www.zaproxy.org/download/</a></li>
                <li>Execute scan completo com: <code>.\scripts\zap-scan.ps1</code></li>
                <li>Ou use Docker: <code>docker run -t owasp/zap2docker-stable zap-baseline.py -t $Target</code></li>
            </ul>
        </div>
    </div>
</body>
</html>
"@

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

# Salvar novo relatório
$html | Out-File -FilePath $ReportPath -Encoding UTF8

# Forçar atualização da data de modificação
if (Test-Path $ReportPath) {
    (Get-Item $ReportPath).LastWriteTime = Get-Date
}

Write-Host ""
Write-Host "[OK] Relatorio gerado!" -ForegroundColor Green
Write-Host "[INFO] Salvo em: $ReportPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Para scan completo, instale OWASP ZAP Desktop" -ForegroundColor Yellow

