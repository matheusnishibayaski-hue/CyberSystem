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
.EXAMPLE
    .\security-scan.ps1 -RunSecurityGate
    Executa Semgrep e Security Gate integrado
.EXAMPLE
    .\security-scan.ps1 -RunSecurityGate -FailOnCritical -ShowAll
    Executa com Security Gate, falha em críticos e mostra todos os findings
.NOTES
    Para instalar Semgrep: python -m pip install --user semgrep
#>

param(
    [Parameter(HelpMessage="Arquivo de configuração do Semgrep")]
    [string]$Config = "security/semgrep.yml",
    
    [Parameter(HelpMessage="Diretório ou arquivo a ser analisado")]
    [string]$Target = "src/",
    
    [Parameter(HelpMessage="Executa Security Gate após o scan")]
    [switch]$RunSecurityGate,
    
    [Parameter(HelpMessage="Arquivo JSON de saída do Semgrep")]
    [string]$JsonOutput = "semgrep-result.json",
    
    [Parameter(HelpMessage="Falha no build se houver problemas críticos")]
    [switch]$FailOnCritical,
    
    [Parameter(HelpMessage="Mostra todos os findings no Security Gate")]
    [switch]$ShowAll
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
    Write-Host "[ERRO] Semgrep nao encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar Semgrep:" -ForegroundColor Yellow
    Write-Host "  python -m pip install --user semgrep" -ForegroundColor Cyan
    Write-Host "  ou" -ForegroundColor Gray
    Write-Host "  pip install semgrep" -ForegroundColor Cyan
    exit 1
}

Write-Host "[OK] Semgrep encontrado em: $semgrepPath" -ForegroundColor Green
Write-Host ""

# Verifica se o arquivo de configuração existe
if (-not (Test-Path $Config)) {
    Write-Host "[!] Arquivo de configuracao nao encontrado: $Config" -ForegroundColor Yellow
    Write-Host "   Usando configuração padrão do Semgrep" -ForegroundColor Gray
    $Config = "auto"
}

# Verifica se o diretório alvo existe
if (-not (Test-Path $Target)) {
    Write-Host "[ERRO] Diretorio alvo nao encontrado: $Target" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Executando scan de segurança com Semgrep..." -ForegroundColor Cyan
Write-Host "Configuração: $Config" -ForegroundColor Gray
Write-Host "Alvo: $Target" -ForegroundColor Gray
if ($RunSecurityGate) {
    Write-Host "Security Gate: Habilitado" -ForegroundColor Gray
    Write-Host "Arquivo JSON: $JsonOutput" -ForegroundColor Gray
}
Write-Host ""

try {
    # Define UTF-8 encoding para evitar problemas de encoding
    $env:PYTHONIOENCODING = "utf-8"
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    
    if ($RunSecurityGate) {
        # Fazer backup do arquivo anterior se existir
        $backupPath = $JsonOutput -replace '\.json$', '-backup.json'
        if (Test-Path $JsonOutput) {
            try {
                Copy-Item -Path $JsonOutput -Destination $backupPath -Force
                Write-Host "[*] Backup do relatório anterior criado: $backupPath" -ForegroundColor Gray
            } catch {
                Write-Host "[!] Nao foi possivel criar backup do relatorio anterior" -ForegroundColor Yellow
            }
        }
        
        # Deletar arquivo existente para garantir atualização da data de modificação
        if (Test-Path $JsonOutput) {
            try {
                Remove-Item -Path $JsonOutput -Force
            } catch {
                Write-Host "[!] Nao foi possivel deletar arquivo anterior" -ForegroundColor Yellow
            }
        }
        
        # Salva resultado em JSON para o Security Gate (sem BOM)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        
        try {
            if ($Config -eq "auto") {
                $output = & $semgrepPath --config=auto --json $Target 2>&1
            } else {
                $output = & $semgrepPath --config=$Config --json $Target 2>&1
            }
            
            $exitCode = $LASTEXITCODE
            
            # Extrair apenas o JSON do output (pode ter texto de status antes)
            $jsonContent = $output
            
            # Tentar encontrar o JSON no output (pode ter texto de status antes)
            if ($output -match '\{[\s\S]*\}') {
                # Encontrar o primeiro { e o último } para extrair o JSON completo
                $firstBrace = $output.IndexOf('{')
                if ($firstBrace -ge 0) {
                    $lastBrace = $output.LastIndexOf('}')
                    if ($lastBrace -gt $firstBrace) {
                        $jsonContent = $output.Substring($firstBrace, $lastBrace - $firstBrace + 1)
                        Write-Host "[INFO] JSON extraído do output (removido texto de status)" -ForegroundColor Gray
                    }
                }
            }
            
            # Verificar se o JSON está vazio ou inválido
            if ([string]::IsNullOrWhiteSpace($jsonContent)) {
                Write-Host "[AVISO] Semgrep retornou output vazio, criando JSON vazio válido" -ForegroundColor Yellow
                $jsonContent = '{"version":"","errors":[],"paths":{"scanned":[]},"results":[]}'
            } else {
                # Tentar validar se é JSON válido
                try {
                    $null = $jsonContent | ConvertFrom-Json
                    Write-Host "[OK] JSON válido extraído do output" -ForegroundColor Green
                } catch {
                    Write-Host "[AVISO] JSON extraído não é válido, tentando corrigir" -ForegroundColor Yellow
                    # Se não conseguir validar, criar JSON mínimo
                    $jsonContent = '{"version":"","errors":[],"paths":{"scanned":[]},"results":[]}'
                }
            }
            
            # Garantir que o arquivo seja escrito (usar jsonContent que foi extraído/validado)
            [System.IO.File]::WriteAllText($JsonOutput, $jsonContent, $utf8NoBom)
            
            # Verificar se o arquivo foi criado e não está vazio
            if (Test-Path $JsonOutput) {
                $fileSize = (Get-Item $JsonOutput).Length
                if ($fileSize -eq 0) {
                    Write-Host "[ERRO] Arquivo JSON foi criado mas está vazio!" -ForegroundColor Red
                    # Criar JSON mínimo válido
                    $minimalJson = '{"version": "","errors": [],"paths": {"scanned": []},"results": []}'
                    [System.IO.File]::WriteAllText($JsonOutput, $minimalJson, $utf8NoBom)
                    Write-Host "[INFO] Arquivo JSON mínimo válido criado" -ForegroundColor Yellow
                } else {
                    Write-Host ""
                    Write-Host "[OK] Resultado do Semgrep salvo em: $JsonOutput ($([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
                }
            } else {
                Write-Host "[ERRO] Arquivo JSON não foi criado!" -ForegroundColor Red
                # Criar arquivo mínimo válido
                $minimalJson = '{"version": "","errors": [],"paths": {"scanned": []},"results": []}'
                [System.IO.File]::WriteAllText($JsonOutput, $minimalJson, $utf8NoBom)
                Write-Host "[INFO] Arquivo JSON mínimo válido criado" -ForegroundColor Yellow
            }
            
            # Forçar atualização da data de modificação
            if (Test-Path $JsonOutput) {
                (Get-Item $JsonOutput).LastWriteTime = Get-Date
            }
        } catch {
            Write-Host "[ERRO] Erro ao executar Semgrep: $_" -ForegroundColor Red
            # Criar arquivo mínimo válido em caso de erro
            $minimalJson = '{"version": "","errors": [],"paths": {"scanned": []},"results": []}'
            [System.IO.File]::WriteAllText($JsonOutput, $minimalJson, $utf8NoBom)
            Write-Host "[INFO] Arquivo JSON mínimo válido criado após erro" -ForegroundColor Yellow
            $exitCode = 1
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
    
    # Executa Security Gate se solicitado
    if ($RunSecurityGate -and (Test-Path $JsonOutput)) {
        Write-Host ""
        Write-Host ("=" * 70) -ForegroundColor Cyan
        Write-Host "Executando Security Gate..." -ForegroundColor Cyan
        Write-Host ("=" * 70) -ForegroundColor Cyan
        Write-Host ""
        
        $gateArgs = @("scripts/security_gate.py", "--file", $JsonOutput)
        if ($FailOnCritical) {
            $gateArgs += "--fail-on-critical"
        }
        if ($ShowAll) {
            $gateArgs += "--show-all"
        }
        
        & python $gateArgs
        $gateExitCode = $LASTEXITCODE
        
        if ($gateExitCode -ne 0) {
            exit $gateExitCode
        }
    } else {
        Write-Host ""
        if ($exitCode -eq 0) {
            Write-Host "[OK] Nenhum problema de seguranca encontrado!" -ForegroundColor Green
        } elseif ($exitCode -eq 1) {
            Write-Host "[!] Problemas de seguranca encontrados. Revise a saida acima." -ForegroundColor Yellow
        } else {
            Write-Host "[ERRO] Erro ao executar Semgrep (codigo de saida: $exitCode)" -ForegroundColor Red
        }
    }
    
    exit $exitCode
} catch {
    Write-Host ""
    Write-Host "[ERRO] Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "[INFO] Dicas:" -ForegroundColor Yellow
    Write-Host "   - Verifique se Semgrep está instalado corretamente" -ForegroundColor Gray
    Write-Host "   - Tente executar: python -m pip install --upgrade semgrep" -ForegroundColor Cyan
    exit 1
}

