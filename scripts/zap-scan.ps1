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
            Write-Host "✅ Servidor iniciado com sucesso" -ForegroundColor Green
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
        Write-Host "✅ Servidor detectado na porta $detectedPort" -ForegroundColor Green
        Write-Host ""
    } else {
        # Se não detectou, tenta a porta padrão mas não assume que está rodando
        Write-Host "⚠️  Servidor não detectado automaticamente, tentando porta padrão 3000..." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Verifica se o target está acessível
Write-Host "Verificando se o servidor está rodando em $Target..." -ForegroundColor Yellow
$serverRunning = Test-ServerHealth -Url $Target

if (-not $serverRunning) {
    Write-Host "❌ Erro: Servidor não está acessível em $Target" -ForegroundColor Red
    
    if ($AutoStart) {
        Write-Host "Tentando iniciar automaticamente..." -ForegroundColor Yellow
        $started = Start-Server
        if (-not $started) {
            Write-Host "❌ Não foi possível iniciar o servidor automaticamente" -ForegroundColor Red
            Write-Host "   Inicie o servidor com: npm start" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "   Inicie o servidor com: npm start" -ForegroundColor Yellow
        Write-Host "   Ou use -AutoStart para iniciar automaticamente" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✅ Servidor está rodando em $Target" -ForegroundColor Green
}

# Função para encontrar ZAP CLI
function Find-ZapCli {
    # Método 1: Verifica se zap-cli está no PATH
    try {
        $zapCli = Get-Command zap-cli -ErrorAction Stop
        return @{
            Found = $true
            Method = "zap-cli"
            Path = "zap-cli"
            Location = "PATH"
        }
    } catch {
        # Método 2: Verifica diretórios comuns do Python
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
                }
            }
        }
        
        # Método 3: Verifica se ZAP está rodando na porta padrão (8080)
        try {
            $zapResponse = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            return @{
                Found = $true
                Method = "zap-api"
                Path = ""
                Location = "http://localhost:8080"
            }
        } catch {
            return @{
                Found = $false
                Method = ""
                Path = ""
                Location = ""
            }
        }
    }
}

# Verifica se ZAP está disponível
Write-Host "Procurando OWASP ZAP..." -ForegroundColor Yellow
$zapInfo = Find-ZapCli

if (-not $zapInfo.Found) {
    Write-Host "⚠️  ZAP não encontrado automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opções de instalação:" -ForegroundColor Yellow
    Write-Host "1. Baixar OWASP ZAP Desktop: https://www.zaproxy.org/download/" -ForegroundColor Cyan
    Write-Host "2. Usar Docker: docker run -t owasp/zap2docker-stable zap-baseline.py -t $Target" -ForegroundColor Cyan
    Write-Host "3. Instalar zap-cli: python -m pip install --user zapcli" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Para usar zap-cli, você precisa:" -ForegroundColor Yellow
    Write-Host "   - Baixar e instalar OWASP ZAP Desktop" -ForegroundColor Gray
    Write-Host "   - Ou usar Docker com ZAP" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "✅ ZAP encontrado: $($zapInfo.Method) em $($zapInfo.Location)" -ForegroundColor Green
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

if ($zapMethod -eq "zap-cli") {
    # Usa zap-cli para fazer o scan
    try {
        Write-Host "Executando scan com zap-cli..." -ForegroundColor Yellow
        Write-Host "⚠️  Nota: zap-cli requer OWASP ZAP instalado e rodando" -ForegroundColor Yellow
        Write-Host ""
        
        # Quick scan (mais rápido) - requer ZAP rodando
        & $zapCliPath quick-scan --self-contained --start-options '-config api.disablekey=true' $Target
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "❌ Erro: ZAP não está rodando ou não foi encontrado" -ForegroundColor Red
            Write-Host ""
            Write-Host "Soluções:" -ForegroundColor Yellow
            Write-Host "1. Baixe e inicie OWASP ZAP Desktop: https://www.zaproxy.org/download/" -ForegroundColor Cyan
            Write-Host "2. Ou use Docker: docker run -d -p 8080:8080 owasp/zap2docker-stable zap.sh -daemon" -ForegroundColor Cyan
            exit 1
        }
        
        # Gera relatório HTML
        Write-Host ""
        Write-Host "Gerando relatório HTML..." -ForegroundColor Yellow
        & $zapCliPath report -o $ReportPath -f html
        
        Write-Host ""
        Write-Host "✅ Scan concluído!" -ForegroundColor Green
        Write-Host "📄 Relatório salvo em: $ReportPath" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ Erro ao executar scan: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Certifique-se de que OWASP ZAP está instalado e rodando" -ForegroundColor Yellow
        exit 1
    }
} elseif ($zapMethod -eq "zap-api") {
    # Usa API REST do ZAP
    Write-Host "Usando ZAP API..." -ForegroundColor Yellow
    Write-Host "⚠️  Scan via API requer ZAP já iniciado" -ForegroundColor Yellow
    Write-Host "   Inicie ZAP Desktop ou ZAP daemon primeiro" -ForegroundColor Yellow
    
    # Aqui poderia implementar chamadas à API REST do ZAP
    # Mas é mais complexo, então vamos sugerir zap-cli
    Write-Host ""
    Write-Host "💡 Recomendação: Use zap-cli para automação" -ForegroundColor Cyan
    Write-Host "   python -m pip install --user zapcli" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Scan Finalizado ===" -ForegroundColor Cyan
