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

# Verifica se as portas estão livres
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "[!] Porta 3000 ja esta em uso!" -ForegroundColor Yellow
    Write-Host "   Pare o processo antes de continuar" -ForegroundColor Gray
    exit 1
}

if ($port5173) {
    Write-Host "[!] Porta 5173 ja esta em uso!" -ForegroundColor Yellow
    Write-Host "   Pare o processo antes de continuar" -ForegroundColor Gray
    exit 1
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
