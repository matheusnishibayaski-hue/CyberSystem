# Script para configurar Redis no Windows
# Suporta Docker, WSL2 e Memurai

Write-Host "Verificando opcoes disponiveis para Redis..." -ForegroundColor Cyan

# Verificar Docker
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "Docker encontrado: $dockerVersion" -ForegroundColor Green
        $dockerAvailable = $true
    }
} catch {
    $dockerAvailable = $false
}

# Verificar WSL2
$wslAvailable = $false
try {
    $wslVersion = wsl --version 2>$null
    if ($wslVersion) {
        Write-Host "WSL2 encontrado" -ForegroundColor Green
        $wslAvailable = $true
    }
} catch {
    try {
        $wslStatus = wsl --status 2>$null
        if ($wslStatus) {
            Write-Host "WSL encontrado" -ForegroundColor Green
            $wslAvailable = $true
        }
    } catch {
        $wslAvailable = $false
    }
}

# Verificar Memurai
$memuraiAvailable = $false
try {
    $memuraiService = Get-Service -Name "Memurai*" -ErrorAction SilentlyContinue
    if ($memuraiService) {
        Write-Host "Memurai encontrado" -ForegroundColor Green
        $memuraiAvailable = $true
    }
} catch {
    $memuraiAvailable = $false
}

Write-Host ""
Write-Host "Opcoes disponiveis:" -ForegroundColor Yellow
Write-Host "1. Docker Desktop (Recomendado)"
Write-Host "2. WSL2 + Redis"
Write-Host "3. Memurai (Redis compativel para Windows)"
Write-Host "4. Redis Cloud (nuvem)"
Write-Host ""

$choice = Read-Host "Escolha uma opcao (1-4)"

switch ($choice) {
    "1" {
        if ($dockerAvailable) {
            Write-Host ""
            Write-Host "Iniciando Redis com Docker..." -ForegroundColor Cyan
            
            # Verificar se o container ja existe
            $existingContainer = docker ps -a --filter "name=redis" --format "{{.Names}}" 2>$null
            if ($existingContainer -eq "redis") {
                Write-Host "Container Redis ja existe. Iniciando..." -ForegroundColor Yellow
                docker start redis
            } else {
                Write-Host "Criando novo container Redis..." -ForegroundColor Yellow
                docker run -d --name redis -p 6379:6379 redis:7
            }
            
            Start-Sleep -Seconds 2
            
            # Verificar se esta rodando
            $redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" 2>$null
            if ($redisRunning -eq "redis") {
                Write-Host "Redis esta rodando na porta 6379!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Para parar: docker stop redis" -ForegroundColor Gray
                Write-Host "Para iniciar: docker start redis" -ForegroundColor Gray
            } else {
                Write-Host "Erro ao iniciar Redis. Verifique os logs:" -ForegroundColor Red
                Write-Host "docker logs redis" -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "Docker nao esta instalado." -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar Docker Desktop:" -ForegroundColor Yellow
            Write-Host "1. Acesse: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
            Write-Host "2. Baixe e instale o Docker Desktop para Windows"
            Write-Host "3. Reinicie o PowerShell apos a instalacao"
            Write-Host "4. Execute este script novamente"
            Write-Host ""
            
            $openBrowser = Read-Host "Deseja abrir o site de download do Docker? (S/N)"
            if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
                Start-Process "https://www.docker.com/products/docker-desktop/"
            }
        }
    }
    "2" {
        if ($wslAvailable) {
            Write-Host ""
            Write-Host "Configurando Redis no WSL2..." -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Execute os seguintes comandos no WSL2:" -ForegroundColor Yellow
            Write-Host "sudo apt update" -ForegroundColor Cyan
            Write-Host "sudo apt install redis-server -y" -ForegroundColor Cyan
            Write-Host "sudo service redis-server start" -ForegroundColor Cyan
            Write-Host "redis-cli ping" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "WSL2 nao esta instalado." -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar WSL2:" -ForegroundColor Yellow
            Write-Host "Execute no PowerShell como Administrador:" -ForegroundColor Cyan
            Write-Host "wsl --install" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Apos instalar, reinicie o computador e execute este script novamente."
        }
    }
    "3" {
        if ($memuraiAvailable) {
            Write-Host ""
            Write-Host "Memurai ja esta instalado!" -ForegroundColor Green
            $memuraiService = Get-Service -Name "Memurai*" | Select-Object -First 1
            Write-Host "Status: $($memuraiService.Status)" -ForegroundColor Cyan
            
            if ($memuraiService.Status -ne "Running") {
                Write-Host ""
                Write-Host "Iniciando Memurai..." -ForegroundColor Yellow
                Start-Service -Name $memuraiService.Name
                Write-Host "Memurai iniciado!" -ForegroundColor Green
            }
        } else {
            Write-Host ""
            Write-Host "Memurai nao esta instalado." -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar Memurai:" -ForegroundColor Yellow
            Write-Host "1. Acesse: https://www.memurai.com/get-memurai" -ForegroundColor Cyan
            Write-Host "2. Baixe a versao Developer (gratuita)"
            Write-Host "3. Instale e execute este script novamente"
            Write-Host ""
            
            $openBrowser = Read-Host "Deseja abrir o site de download do Memurai? (S/N)"
            if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
                Start-Process "https://www.memurai.com/get-memurai"
            }
        }
    }
    "4" {
        Write-Host ""
        Write-Host "Opcoes de Redis na nuvem:" -ForegroundColor Cyan
        Write-Host "1. Redis Cloud: https://redis.com/try-free/" -ForegroundColor Yellow
        Write-Host "2. Upstash: https://upstash.com/" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Apos criar uma conta, configure no arquivo .env:" -ForegroundColor Cyan
        Write-Host "REDIS_HOST=seu-host-redis" -ForegroundColor Gray
        Write-Host "REDIS_PORT=6379" -ForegroundColor Gray
        Write-Host "REDIS_PASSWORD=sua-senha" -ForegroundColor Gray
    }
    default {
        Write-Host ""
        Write-Host "Opcao invalida." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Configuracao do .env:" -ForegroundColor Yellow
Write-Host "Adicione estas variaveis ao arquivo .env:" -ForegroundColor Cyan
Write-Host "REDIS_HOST=localhost" -ForegroundColor Gray
Write-Host "REDIS_PORT=6379" -ForegroundColor Gray
Write-Host "REDIS_PASSWORD=" -ForegroundColor Gray
Write-Host "REDIS_DB=0" -ForegroundColor Gray
Write-Host ""
Write-Host "Script concluido!" -ForegroundColor Green
