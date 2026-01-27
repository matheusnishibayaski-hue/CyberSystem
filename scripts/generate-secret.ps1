<#
.SYNOPSIS
    Gera um JWT_SECRET seguro para autenticação
.DESCRIPTION
    Gera um secret aleatório e seguro para uso em autenticação JWT.
    Pode atualizar automaticamente o arquivo .env
.PARAMETER Length
    Comprimento do secret em caracteres (padrão: 64, mínimo: 32)
.PARAMETER Force
    Força atualização do .env sem perguntar
.PARAMETER EnvFile
    Caminho do arquivo .env (padrão: .env)
.EXAMPLE
    .\generate-secret.ps1
    Gera secret de 64 caracteres e pergunta se deseja atualizar .env
.EXAMPLE
    .\generate-secret.ps1 -Length 128 -Force
    Gera secret de 128 caracteres e atualiza .env automaticamente
.NOTES
    O secret gerado inclui letras, números e caracteres especiais seguros
#>

param(
    [Parameter(HelpMessage="Comprimento do secret (padrão: 64, mínimo: 32)")]
    [int]$Length = 64,
    
    [Parameter(HelpMessage="Força atualização sem perguntar")]
    [switch]$Force,
    
    [Parameter(HelpMessage="Caminho do arquivo .env")]
    [string]$EnvFile = ".env"
)

Write-Host "=== Gerador de JWT_SECRET ===" -ForegroundColor Cyan
Write-Host "Gerador de secret seguro para autenticação JWT" -ForegroundColor Gray
Write-Host ""

# Valida o comprimento
if ($Length -lt 32) {
    Write-Host "⚠️  Comprimento mínimo recomendado é 32 caracteres" -ForegroundColor Yellow
    Write-Host "   Usando 32 caracteres..." -ForegroundColor Gray
    $Length = 32
}

# Gera um secret aleatório usando caracteres seguros
# Inclui letras maiúsculas, minúsculas, números e alguns caracteres especiais
$chars = (65..90) + (97..122) + (48..57) + @(33, 35, 36, 37, 38, 42, 43, 45, 46, 95)
$secret = -join ($chars | Get-Random -Count $Length | ForEach-Object {[char]$_})

Write-Host "JWT_SECRET gerado ($Length caracteres):" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""

# Verifica se o arquivo .env existe
$envExists = Test-Path $EnvFile
$shouldUpdate = $false

if ($envExists) {
    $envContent = Get-Content $EnvFile -ErrorAction SilentlyContinue
    $hasJwtSecret = $envContent | Where-Object { $_ -match '^JWT_SECRET=' }
    
    if ($hasJwtSecret -and -not $Force) {
        Write-Host "⚠️  JWT_SECRET já existe no arquivo .env" -ForegroundColor Yellow
        $update = Read-Host "Deseja atualizar? (S/N)"
        $shouldUpdate = ($update -eq "S" -or $update -eq "s")
    } else {
        $shouldUpdate = $true
    }
} else {
    Write-Host "📝 Arquivo .env não encontrado" -ForegroundColor Yellow
    if (-not $Force) {
        $create = Read-Host "Deseja criar o arquivo .env? (S/N)"
        $shouldUpdate = ($create -eq "S" -or $create -eq "s")
    } else {
        $shouldUpdate = $true
    }
}

if ($shouldUpdate) {
    try {
        if ($envExists) {
            $envContent = Get-Content $EnvFile -ErrorAction SilentlyContinue
            if ($envContent | Where-Object { $_ -match '^JWT_SECRET=' }) {
                $envContent = $envContent -replace '^JWT_SECRET=.*', "JWT_SECRET=$secret"
            } else {
                $envContent += "JWT_SECRET=$secret"
            }
            $envContent | Set-Content $EnvFile -Encoding UTF8
        } else {
            "JWT_SECRET=$secret" | Set-Content $EnvFile -Encoding UTF8
        }
        Write-Host "✅ Arquivo $EnvFile atualizado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao atualizar arquivo: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Copie manualmente para o arquivo .env:" -ForegroundColor Yellow
        Write-Host "JWT_SECRET=$secret" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "💡 Para atualizar manualmente, adicione ao arquivo .env:" -ForegroundColor Cyan
    Write-Host "JWT_SECRET=$secret" -ForegroundColor White
}
