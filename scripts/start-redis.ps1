# Script para iniciar Redis no Docker
# Aguarda o Docker estar pronto e inicia o container Redis

Write-Host "Verificando se Docker esta instalado e rodando..." -ForegroundColor Cyan

# Verificar se Docker Desktop esta instalado
$dockerInstalled = $false
try {
    $dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerCheck) {
        $dockerInstalled = $true
    }
} catch {
    # Tentar verificar via winget
    $wingetCheck = winget list Docker.DockerDesktop 2>$null
    if ($wingetCheck -match "Docker Desktop") {
        Write-Host "Docker Desktop esta instalado, mas o comando 'docker' nao esta disponivel." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Por favor:" -ForegroundColor Yellow
        Write-Host "1. Abra o Docker Desktop (procure por 'Docker Desktop' no menu Iniciar)" -ForegroundColor Cyan
        Write-Host "2. Aguarde o Docker Desktop inicializar completamente (icone na bandeja do sistema)" -ForegroundColor Cyan
        Write-Host "3. Execute este script novamente" -ForegroundColor Cyan
        Write-Host ""
        
        $openDocker = Read-Host "Deseja abrir o Docker Desktop agora? (S/N)"
        if ($openDocker -eq "S" -or $openDocker -eq "s") {
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            Write-Host ""
            Write-Host "Aguarde o Docker Desktop inicializar e execute este script novamente." -ForegroundColor Yellow
        }
        exit 1
    } else {
        Write-Host "Docker Desktop nao esta instalado." -ForegroundColor Red
        Write-Host "Execute: powershell -ExecutionPolicy Bypass -File scripts/install-docker.ps1" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar se Docker esta rodando
Write-Host "Aguardando Docker estar pronto..." -ForegroundColor Yellow
$timeout = 90
$elapsed = 0
$dockerReady = $false

while ($elapsed -lt $timeout) {
    try {
        $null = docker version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "Docker esta pronto!" -ForegroundColor Green
            break
        }
    } catch {
        # Continuar tentando
    }
    
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""

if (-not $dockerReady) {
    Write-Host "Timeout: Docker nao esta respondendo." -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique se:" -ForegroundColor Yellow
    Write-Host "1. Docker Desktop esta aberto e rodando" -ForegroundColor Cyan
    Write-Host "2. O icone do Docker esta visivel na bandeja do sistema" -ForegroundColor Cyan
    Write-Host "3. Aguarde mais alguns segundos e tente novamente" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou execute manualmente:" -ForegroundColor Yellow
    Write-Host "docker run -d --name redis -p 6379:6379 redis:7" -ForegroundColor Gray
    exit 1
}

# Verificar se o container Redis ja existe
Write-Host "Verificando container Redis..." -ForegroundColor Cyan
$existingContainer = docker ps -a --filter "name=redis" --format "{{.Names}}" 2>$null

if ($existingContainer -eq "redis") {
    Write-Host "Container Redis ja existe." -ForegroundColor Yellow
    
    # Verificar se esta rodando
    $redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" 2>$null
    if ($redisRunning -eq "redis") {
        Write-Host "Redis ja esta rodando na porta 6379!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para parar: docker stop redis" -ForegroundColor Gray
        Write-Host "Para ver logs: docker logs redis" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "Iniciando container Redis existente..." -ForegroundColor Yellow
        docker start redis 2>&1 | Out-Null
        
        Start-Sleep -Seconds 2
        
        $redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" 2>$null
        if ($redisRunning -eq "redis") {
            Write-Host "Redis iniciado com sucesso!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Erro ao iniciar Redis. Removendo container antigo..." -ForegroundColor Yellow
            docker rm redis 2>&1 | Out-Null
        }
    }
}

# Criar novo container Redis
Write-Host "Criando novo container Redis..." -ForegroundColor Cyan
$result = docker run -d --name redis -p 6379:6379 redis:7 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Redis iniciado com sucesso!" -ForegroundColor Green
    $containerId = $result -replace "`n", ""
    Write-Host "Container ID: $containerId" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Redis esta rodando na porta 6379" -ForegroundColor Green
    Write-Host ""
    Write-Host "Comandos uteis:" -ForegroundColor Yellow
    Write-Host "  Parar:    docker stop redis" -ForegroundColor Gray
    Write-Host "  Iniciar:  docker start redis" -ForegroundColor Gray
    Write-Host "  Logs:    docker logs redis" -ForegroundColor Gray
    Write-Host "  Remover: docker rm -f redis" -ForegroundColor Gray
} else {
    Write-Host "Erro ao criar container Redis:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}
