# Script para instalar e configurar Redis no WSL2

Write-Host "Configurando Redis no WSL2..." -ForegroundColor Cyan
Write-Host ""

# Verificar se WSL2 esta disponivel
try {
    $wslVersion = wsl --version 2>$null
    if (-not $wslVersion) {
        $wslStatus = wsl --status 2>$null
        if (-not $wslStatus) {
            Write-Host "WSL2 nao esta instalado." -ForegroundColor Red
            Write-Host "Execute: wsl --install" -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "Erro ao verificar WSL2." -ForegroundColor Red
    exit 1
}

Write-Host "WSL2 encontrado!" -ForegroundColor Green
Write-Host ""
Write-Host "Instalando Redis no WSL2..." -ForegroundColor Yellow
Write-Host "Isso pode levar alguns minutos na primeira vez..." -ForegroundColor Gray
Write-Host ""

# Instalar Redis no WSL2
$installCommand = @"
sudo apt update -qq
sudo apt install -y redis-server > /dev/null 2>&1
echo 'Redis instalado com sucesso!'
"@

wsl bash -c $installCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Erro ao instalar Redis. Tentando novamente com mais detalhes..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Execute manualmente no WSL2:" -ForegroundColor Cyan
    Write-Host "  wsl" -ForegroundColor Gray
    Write-Host "  sudo apt update" -ForegroundColor Gray
    Write-Host "  sudo apt install redis-server -y" -ForegroundColor Gray
    Write-Host "  sudo service redis-server start" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Iniciando Redis..." -ForegroundColor Yellow

# Iniciar Redis
$startCommand = @"
sudo service redis-server start
sleep 1
redis-cli ping
"@

$pingResult = wsl bash -c $startCommand

if ($pingResult -match "PONG") {
    Write-Host ""
    Write-Host "Redis esta rodando no WSL2!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuracao:" -ForegroundColor Yellow
    Write-Host "  Host: localhost" -ForegroundColor Gray
    Write-Host "  Porta: 6379" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Adicione ao arquivo .env:" -ForegroundColor Yellow
    Write-Host "  REDIS_URL=redis://localhost:6379" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos uteis:" -ForegroundColor Yellow
    Write-Host "  Iniciar:  wsl sudo service redis-server start" -ForegroundColor Gray
    Write-Host "  Parar:    wsl sudo service redis-server stop" -ForegroundColor Gray
    Write-Host "  Status:   wsl sudo service redis-server status" -ForegroundColor Gray
    Write-Host "  Testar:   wsl redis-cli ping" -ForegroundColor Gray
    Write-Host ""
    
    # Configurar para iniciar automaticamente
    Write-Host "Configurando para iniciar automaticamente..." -ForegroundColor Yellow
    $autoStartCommand = @"
if ! grep -q 'redis-server start' ~/.bashrc; then
    echo 'sudo service redis-server start > /dev/null 2>&1' >> ~/.bashrc
    echo 'Configurado para iniciar automaticamente'
else
    echo 'Ja configurado'
fi
"@
    wsl bash -c $autoStartCommand | Out-Null
    
    Write-Host "Redis configurado para iniciar automaticamente no WSL2!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Erro ao iniciar Redis." -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente no WSL2:" -ForegroundColor Yellow
    Write-Host "  wsl" -ForegroundColor Gray
    Write-Host "  sudo service redis-server start" -ForegroundColor Gray
    Write-Host "  redis-cli ping" -ForegroundColor Gray
    exit 1
}
