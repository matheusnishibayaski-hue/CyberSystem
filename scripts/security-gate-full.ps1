<#
.SYNOPSIS
    Script completo de Security Gate - Executa Semgrep e Security Gate integrado
.DESCRIPTION
    Executa analise de seguranca com Semgrep, salva resultado em JSON e executa
    o Security Gate para analise inteligente por severidade.
.PARAMETER Config
    Arquivo de configuracao do Semgrep (padrao: security/semgrep.yml)
.PARAMETER Target
    Diretorio ou arquivo a ser analisado (padrao: src/)
.PARAMETER JsonOutput
    Arquivo JSON de saida do Semgrep (padrao: semgrep-result.json)
.PARAMETER FailOnCritical
    Falha no build se houver problemas criticos
.PARAMETER ShowAll
    Mostra todos os findings no Security Gate (nao apenas criticos)
.EXAMPLE
    .\security-gate-full.ps1
    Executa scan completo com Security Gate
.EXAMPLE
    .\security-gate-full.ps1 -FailOnCritical
    Executa e falha o build se houver problemas criticos
.EXAMPLE
    .\security-gate-full.ps1 -ShowAll
    Mostra todos os findings (criticos, medios e baixos)
.NOTES
    Este script integra:
    1. Execucao do Semgrep com saida JSON
    2. Analise pelo Security Gate por severidade
    3. Relatorio detalhado em portugues
#>

param(
    [Parameter(HelpMessage="Arquivo de configuracao do Semgrep")]
    [string]$Config = "security/semgrep.yml",
    
    [Parameter(HelpMessage="Diretorio ou arquivo a ser analisado")]
    [string]$Target = "src/",
    
    [Parameter(HelpMessage="Arquivo JSON de saida do Semgrep")]
    [string]$JsonOutput = "semgrep-result.json",
    
    [Parameter(HelpMessage="Falha no build se houver problemas criticos")]
    [switch]$FailOnCritical,
    
    [Parameter(HelpMessage="Mostra todos os findings no Security Gate")]
    [switch]$ShowAll
)

function Find-Semgrep {
    try {
        $semgrep = Get-Command semgrep -ErrorAction Stop
        return $semgrep.Source
    } catch {
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

function Find-Python {
    try {
        $python = Get-Command python -ErrorAction Stop
        return $python.Source
    } catch {
        Write-Host "[ERRO] Python nao encontrado no PATH" -ForegroundColor Red
        Write-Host "   Certifique-se de que Python esta instalado e no PATH" -ForegroundColor Yellow
        return $null
    }
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "SECURITY GATE - SCAN COMPLETO" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

Write-Host "Procurando Semgrep..." -ForegroundColor Yellow
$semgrepPath = Find-Semgrep

if (-not $semgrepPath -or -not (Test-Path $semgrepPath)) {
    Write-Host "[ERRO] Semgrep nao encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar Semgrep:" -ForegroundColor Yellow
    Write-Host "  python -m pip install --user semgrep" -ForegroundColor Cyan
    Write-Host "  ou" -ForegroundColor Gray
    Write-Host "  pip install semgrep" -ForegroundColor Cyan
    exit 1
}

Write-Host "[OK] Semgrep encontrado em: $semgrepPath" -ForegroundColor Green

Write-Host "Procurando Python..." -ForegroundColor Yellow
$pythonPath = Find-Python

if (-not $pythonPath) {
    exit 1
}

Write-Host "[OK] Python encontrado em: $pythonPath" -ForegroundColor Green

if (-not (Test-Path $Config)) {
    Write-Host "[AVISO] Arquivo de configuracao nao encontrado: $Config" -ForegroundColor Yellow
    Write-Host "   Usando configuracao padrao do Semgrep (auto)" -ForegroundColor Gray
    $Config = "auto"
}

if (-not (Test-Path $Target)) {
    Write-Host "[ERRO] Diretorio alvo nao encontrado: $Target" -ForegroundColor Red
    exit 1
}

$gateScript = "scripts/security_gate.py"
if (-not (Test-Path $gateScript)) {
    Write-Host "[ERRO] Script do Security Gate nao encontrado: $gateScript" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "ETAPA 1: Executando Semgrep..." -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "Configuracao: $Config" -ForegroundColor Gray
Write-Host "Alvo: $Target" -ForegroundColor Gray
Write-Host "Saida JSON: $JsonOutput" -ForegroundColor Gray
Write-Host ""

try {
    $env:PYTHONIOENCODING = "utf-8"
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    
    # Cria encoding UTF-8 sem BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    
    if ($Config -eq "auto") {
        $output = & $semgrepPath --config=auto --json $Target
        [System.IO.File]::WriteAllText($JsonOutput, $output, $utf8NoBom)
    } else {
        $output = & $semgrepPath --config=$Config --json $Target
        [System.IO.File]::WriteAllText($JsonOutput, $output, $utf8NoBom)
    }
    
    $semgrepExitCode = $LASTEXITCODE
    
    if (Test-Path $JsonOutput) {
        $fileSize = (Get-Item $JsonOutput).Length
        Write-Host ""
        Write-Host "[OK] Resultado do Semgrep salvo em: $JsonOutput ($([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Arquivo JSON nao foi criado" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "ETAPA 2: Executando Security Gate..." -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host ""
    
    $gateArgs = @($gateScript, "--file", $JsonOutput)
    if ($FailOnCritical) {
        $gateArgs += "--fail-on-critical"
        Write-Host "[AVISO] Modo: Falha no build se houver problemas criticos" -ForegroundColor Yellow
    }
    if ($ShowAll) {
        $gateArgs += "--show-all"
        Write-Host "[INFO] Modo: Mostrar todos os findings" -ForegroundColor Cyan
    }
    Write-Host ""
    
    & $pythonPath $gateArgs
    $gateExitCode = $LASTEXITCODE
    
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "RESUMO FINAL" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
    
    if ($gateExitCode -eq 0) {
        Write-Host "[OK] Security Gate: PASSOU" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Security Gate: FALHOU" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Arquivos gerados:" -ForegroundColor Gray
    Write-Host "  - $JsonOutput (resultado do Semgrep)" -ForegroundColor Gray
    if (Test-Path "security-gate-summary.json") {
        Write-Host "  - security-gate-summary.json (resumo do Security Gate)" -ForegroundColor Gray
    }
    Write-Host ""
    
    exit $gateExitCode
    
} catch {
    Write-Host ""
    Write-Host "[ERRO] Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Dicas:" -ForegroundColor Yellow
    Write-Host "   - Verifique se Semgrep esta instalado: python -m pip install --upgrade semgrep" -ForegroundColor Cyan
    Write-Host "   - Verifique se o arquivo de configuracao existe: $Config" -ForegroundColor Cyan
    exit 1
}
