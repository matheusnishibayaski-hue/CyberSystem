<#
.SYNOPSIS
    Script de scan de segurança estático com Semgrep
.DESCRIPTION
    Executa análise de segurança estática do código usando Semgrep.
    Detecta vulnerabilidades comuns e problemas de segurança.
.PARAMETER Config
    Arquivo de configuração do Semgrep (padrão: security/semgrep.yml)
    Use "auto" para usar regras padrão do Semgrep
.PARAMETER Target
    Diretório ou arquivo a ser analisado (padrão: src/)
.EXAMPLE
    .\security-scan.ps1
    Executa scan no diretório src/ com configuração padrão
.EXAMPLE
    .\security-scan.ps1 -Config "auto" -Target "src/"
    Usa regras automáticas do Semgrep
.NOTES
    Para instalar Semgrep: python -m pip install --user semgrep
#>

param(
    [Parameter(HelpMessage="Arquivo de configuração do Semgrep")]
    [string]$Config = "security/semgrep.yml",
    
    [Parameter(HelpMessage="Diretório ou arquivo a ser analisado")]
    [string]$Target = "src/"
)

# Função para encontrar Semgrep
function Find-Semgrep {
    # Método 1: Verifica se está no PATH
    try {
        $semgrep = Get-Command semgrep -ErrorAction Stop
        return $semgrep.Source
    } catch {
        # Método 2: Verifica diretórios comuns do Python
        $pythonVersions = @("3.14", "3.13", "3.12", "3.11", "3.10")
        $basePaths = @(
            "$env:LOCALAPPDATA\Python",
            "$env:APPDATA\Python",
            "$env:USERPROFILE\AppData\Local\Programs\Python"
        )
        
        foreach ($basePath in $basePaths) {
            foreach ($version in $pythonVersions) {
                $paths = @(
                    "$basePath\pythoncore-$version-64\Scripts\semgrep.exe",
                    "$basePath\Python$version\Scripts\semgrep.exe",
                    "$basePath\Python$version-64\Scripts\semgrep.exe"
                )
                
                foreach ($path in $paths) {
                    if (Test-Path $path) {
                        return $path
                    }
                }
            }
        }
        
        return $null
    }
}

Write-Host "Procurando Semgrep..." -ForegroundColor Yellow
$semgrepPath = Find-Semgrep

if (-not $semgrepPath -or -not (Test-Path $semgrepPath)) {
    Write-Host "❌ Semgrep não encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar Semgrep:" -ForegroundColor Yellow
    Write-Host "  python -m pip install --user semgrep" -ForegroundColor Cyan
    Write-Host "  ou" -ForegroundColor Gray
    Write-Host "  pip install semgrep" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Semgrep encontrado em: $semgrepPath" -ForegroundColor Green

Write-Host "Running Semgrep security scan..." -ForegroundColor Cyan
Write-Host "Config: $Config" -ForegroundColor Gray
Write-Host "Target: $Target" -ForegroundColor Gray
Write-Host ""

# Verifica se o arquivo de configuração existe
if (-not (Test-Path $Config)) {
    Write-Host "⚠️  Arquivo de configuração não encontrado: $Config" -ForegroundColor Yellow
    Write-Host "   Usando configuração padrão do Semgrep" -ForegroundColor Gray
    $Config = "auto"
}

# Verifica se o diretório alvo existe
if (-not (Test-Path $Target)) {
    Write-Host "❌ Diretório alvo não encontrado: $Target" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Executando scan de segurança com Semgrep..." -ForegroundColor Cyan
Write-Host "Configuração: $Config" -ForegroundColor Gray
Write-Host "Alvo: $Target" -ForegroundColor Gray
Write-Host ""

try {
    # Define UTF-8 encoding para evitar problemas de encoding
    $env:PYTHONIOENCODING = "utf-8"
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    
    if ($Config -eq "auto") {
        & $semgrepPath --config=auto $Target
    } else {
        & $semgrepPath --config=$Config $Target
    }
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Nenhum problema de segurança encontrado!" -ForegroundColor Green
    } elseif ($exitCode -eq 1) {
        Write-Host "⚠️  Problemas de segurança encontrados. Revise a saída acima." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erro ao executar Semgrep (código de saída: $exitCode)" -ForegroundColor Red
    }
    
    exit $exitCode
} catch {
    Write-Host ""
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "   - Verifique se Semgrep está instalado corretamente" -ForegroundColor Gray
    Write-Host "   - Tente executar: python -m pip install --upgrade semgrep" -ForegroundColor Cyan
    exit 1
}
