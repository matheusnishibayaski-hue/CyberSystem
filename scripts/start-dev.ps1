<#
.SYNOPSIS
    Inicia os servidores de desenvolvimento (Backend + Frontend)
.DESCRIPTION
    Inicia o servidor backend na porta 3000 e o frontend na porta 5173
    em terminais separados
.EXAMPLE
    .\scripts\start-dev.ps1
#>

Write-Host "[*] Iniciando servidores de desenvolvimento..." -ForegroundColor Cyan
Write-Host ""

# Função para encontrar PID usando uma porta
function Find-ProcessByPort {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($connection) {
            return $connection.OwningProcess
        }
    } catch {
        return $null
    }
    return $null
}

# Função para verificar se é processo Node.js
function Test-IsNodeProcess {
    param([int]$Pid)
    try {
        $process = Get-Process -Id $Pid -ErrorAction SilentlyContinue
        if ($process -and $process.ProcessName -eq "node") {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Função para encerrar processo
function Stop-ProcessByPort {
    param([int]$Port, [string]$PortName)
    
    $pid = Find-ProcessByPort -Port $Port
    if ($pid) {
        Write-Host "[!] Porta $Port ($PortName) ja esta em uso (PID: $pid)" -ForegroundColor Yellow
        
        # Verificar se é processo Node.js
        if (Test-IsNodeProcess -Pid $pid) {
            Write-Host "   🔄 Tentando encerrar processo Node.js automaticamente..." -ForegroundColor Yellow
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "   ✅ Processo $pid encerrado com sucesso!" -ForegroundColor Green
                Write-Host "   ⏳ Aguardando 2 segundos para o sistema liberar a porta..." -ForegroundColor Gray
                Start-Sleep -Seconds 2
                
                # Verificar novamente se a porta foi liberada
                $stillInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
                if ($stillInUse) {
                    Write-Host "   ⚠️  Porta ainda em uso. Por favor, aguarde mais alguns segundos ou encerre manualmente." -ForegroundColor Yellow
                    return $false
                }
                return $true
            } catch {
                Write-Host "   ❌ Nao foi possivel encerrar o processo automaticamente: $_" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "   ⚠️  Processo nao e Node.js. Encerre manualmente:" -ForegroundColor Yellow
            Write-Host "      taskkill /PID $pid /F" -ForegroundColor Gray
            return $false
        }
    }
    return $true
}

# Verifica e tenta liberar porta 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($port3000) {
    if (-not (Stop-ProcessByPort -Port 3000 -PortName "Backend")) {
        Write-Host "[!] Nao foi possivel liberar a porta 3000" -ForegroundColor Red
        Write-Host "   Pare o processo manualmente antes de continuar" -ForegroundColor Gray
        exit 1
    }
}

# Verifica e tenta liberar porta 5173
$port5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($port5173) {
    if (-not (Stop-ProcessByPort -Port 5173 -PortName "Frontend")) {
        Write-Host "[!] Nao foi possivel liberar a porta 5173" -ForegroundColor Red
        Write-Host "   Pare o processo manualmente antes de continuar" -ForegroundColor Gray
        exit 1
    }
}

# Obtém o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

Write-Host "[*] Iniciando Backend (porta 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host '[*] Backend Server (Port 3000)' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[*] Iniciando Frontend (porta 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host '[*] Frontend Server (Port 5173)' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "[OK] Servidores iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Acesse:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "[*] Para parar os servidores, feche as janelas do PowerShell" -ForegroundColor Gray
