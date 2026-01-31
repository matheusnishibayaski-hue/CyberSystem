# Script para instalar Docker Desktop no Windows usando winget

Write-Host "Verificando se Docker ja esta instalado..." -ForegroundColor Cyan

# Verificar se Docker ja esta instalado
$dockerInstalled = $false
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "Docker ja esta instalado: $dockerVersion" -ForegroundColor Green
        $dockerInstalled = $true
    }
} catch {
    $dockerInstalled = $false
}

if ($dockerInstalled) {
    Write-Host ""
    Write-Host "Deseja iniciar o Redis agora? (S/N)" -ForegroundColor Yellow
    $startRedis = Read-Host
    if ($startRedis -eq "S" -or $startRedis -eq "s") {
        Write-Host ""
        Write-Host "Iniciando Redis..." -ForegroundColor Cyan
        
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
        
        $redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" 2>$null
        if ($redisRunning -eq "redis") {
            Write-Host ""
            Write-Host "Redis esta rodando na porta 6379!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Erro ao iniciar Redis. Verifique os logs:" -ForegroundColor Red
            Write-Host "docker logs redis" -ForegroundColor Yellow
        }
    }
    exit 0
}

Write-Host "Docker nao esta instalado." -ForegroundColor Yellow
Write-Host ""

# Verificar se winget esta disponivel
$wingetAvailable = $false
try {
    $wingetVersion = winget --version 2>$null
    if ($wingetVersion) {
        Write-Host "Winget encontrado: $wingetVersion" -ForegroundColor Green
        $wingetAvailable = $true
    }
} catch {
    $wingetAvailable = $false
}

if (-not $wingetAvailable) {
    Write-Host "Winget nao esta disponivel." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalacao manual:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host "2. Baixe e instale o Docker Desktop para Windows"
    Write-Host "3. Reinicie o PowerShell apos a instalacao"
    Write-Host ""
    
    $openBrowser = Read-Host "Deseja abrir o site de download do Docker? (S/N)"
    if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
        Start-Process "https://www.docker.com/products/docker-desktop/"
    }
    exit 1
}

Write-Host "Opcoes de instalacao:" -ForegroundColor Yellow
Write-Host "1. Instalar Docker Desktop automaticamente (usando winget)"
Write-Host "2. Abrir site de download manual"
Write-Host "3. Cancelar"
Write-Host ""

$choice = Read-Host "Escolha uma opcao (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Instalando Docker Desktop..." -ForegroundColor Cyan
        Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
        Write-Host ""
        
        try {
            winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
            
            Write-Host ""
            Write-Host "Instalacao concluida!" -ForegroundColor Green
            Write-Host ""
            Write-Host "IMPORTANTE:" -ForegroundColor Yellow
            Write-Host "1. Reinicie o PowerShell"
            Write-Host "2. Inicie o Docker Desktop (procure por 'Docker Desktop' no menu Iniciar)"
            Write-Host "3. Aguarde o Docker inicializar completamente"
            Write-Host "4. Execute novamente este script ou use: docker run -d --name redis -p 6379:6379 redis:7"
            Write-Host ""
            
            $restart = Read-Host "Deseja reiniciar o PowerShell agora? (S/N)"
            if ($restart -eq "S" -or $restart -eq "s") {
                Write-Host "Reiniciando PowerShell..." -ForegroundColor Cyan
                Start-Process powershell
                exit 0
            }
        } catch {
            Write-Host ""
            Write-Host "Erro ao instalar Docker Desktop:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            Write-Host ""
            Write-Host "Tente instalar manualmente:" -ForegroundColor Yellow
            Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
        }
    }
    "2" {
        Write-Host ""
        Write-Host "Abrindo site de download..." -ForegroundColor Cyan
        Start-Process "https://www.docker.com/products/docker-desktop/"
    }
    "3" {
        Write-Host ""
        Write-Host "Cancelado." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Lembre-se: Redis NAO e obrigatorio para o projeto funcionar!" -ForegroundColor Green
        Write-Host "Voce pode continuar desenvolvendo normalmente sem Redis." -ForegroundColor Green
    }
    default {
        Write-Host ""
        Write-Host "Opcao invalida." -ForegroundColor Red
    }
}
