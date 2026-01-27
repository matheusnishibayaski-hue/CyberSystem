<#
.SYNOPSIS
    Helper script para executar Semgrep diretamente
.DESCRIPTION
    Wrapper para executar Semgrep com detecção automática do executável.
    Detecta automaticamente a instalação do Semgrep em vários locais.
.PARAMETER Config
    Arquivo de configuração do Semgrep (padrão: security/semgrep.yml)
    Use -Auto para usar regras automáticas
.PARAMETER Target
    Diretório ou arquivo a ser analisado (padrão: src/)
.PARAMETER Auto
    Usa regras automáticas do Semgrep (pode ter problemas de encoding no Windows)
.EXAMPLE
    .\semgrep.ps1
    Executa com configuração padrão
.EXAMPLE
    .\semgrep.ps1 -Auto
    Usa regras automáticas do Semgrep
.EXAMPLE
    .\semgrep.ps1 -Config "security/semgrep.yml" -Target "src/controllers"
    Analisa apenas o diretório controllers
.EXAMPLE
    .\semgrep.ps1 -JsonOutput "semgrep-result.json"
    Executa Semgrep e salva resultado em JSON
.NOTES
    Para instalar Semgrep: python -m pip install --user semgrep
#>

param(
    [Parameter(HelpMessage="Arquivo de configuração do Semgrep")]
    [string]$Config = "security/semgrep.yml",
    
    [Parameter(HelpMessage="Diretório ou arquivo a ser analisado")]
    [string]$Target = "src/",
    
    [Parameter(HelpMessage="Usa regras automáticas do Semgrep")]
    [switch]$Auto,
    
    [Parameter(HelpMessage="Salva resultado em arquivo JSON")]
    [string]$JsonOutput = $null
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

if ($Auto) {
    Write-Host "⚠️  Nota: --config=auto pode ter problemas de encoding no Windows" -ForegroundColor Yellow
    Write-Host "   Considere usar: .\scripts\semgrep.ps1 -Config security/semgrep.yml" -ForegroundColor Cyan
    Write-Host ""
    $Config = "auto"
} else {
    # Verifica se o arquivo de configuração existe
    if (-not (Test-Path $Config)) {
        Write-Host "⚠️  Arquivo de configuração não encontrado: $Config" -ForegroundColor Yellow
        Write-Host "   Usando configuração padrão do Semgrep (auto)" -ForegroundColor Gray
        $Config = "auto"
    }
}

# Verifica se o diretório alvo existe
if (-not (Test-Path $Target)) {
    Write-Host "❌ Diretório alvo não encontrado: $Target" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Executando Semgrep..." -ForegroundColor Cyan
Write-Host "Configuração: $Config" -ForegroundColor Gray
Write-Host "Alvo: $Target" -ForegroundColor Gray
if ($JsonOutput) {
    Write-Host "Saída JSON: $JsonOutput" -ForegroundColor Gray
}
Write-Host ""

try {
    # Tenta definir encoding UTF-8
    $env:PYTHONIOENCODING = "utf-8"
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    
    if ($JsonOutput) {
        # Salva resultado em JSON (sem BOM)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        if ($Config -eq "auto") {
            $output = & $semgrepPath --config=auto --json $Target
            [System.IO.File]::WriteAllText($JsonOutput, $output, $utf8NoBom)
        } else {
            $output = & $semgrepPath --config=$Config --json $Target
            [System.IO.File]::WriteAllText($JsonOutput, $output, $utf8NoBom)
        }
        
        $exitCode = $LASTEXITCODE
        
        if (Test-Path $JsonOutput) {
            Write-Host ""
            Write-Host "✅ Resultado salvo em: $JsonOutput" -ForegroundColor Green
        }
    } else {
        # Modo normal (saída no console)
        if ($Config -eq "auto") {
            & $semgrepPath --config=auto $Target
        } else {
            & $semgrepPath --config=$Config $Target
        }
        
        $exitCode = $LASTEXITCODE
    }
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Scan concluído sem problemas encontrados" -ForegroundColor Green
    } elseif ($exitCode -eq 1) {
        Write-Host "⚠️  Problemas encontrados. Revise a saída acima." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erro ao executar Semgrep (código: $exitCode)" -ForegroundColor Red
    }
    
    exit $exitCode
} catch {
    Write-Host ""
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "   - Use a configuração customizada: .\scripts\semgrep.ps1 -Config security/semgrep.yml" -ForegroundColor Cyan
    Write-Host "   - Verifique se Semgrep está atualizado: python -m pip install --upgrade semgrep" -ForegroundColor Cyan
    exit 1
}
