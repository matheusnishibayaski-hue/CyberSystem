#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analisar resultados do Semgrep e gerar sugestões de correção.

Modo CI: Lê resultados de arquivo JSON (semgrep-result.json)
Modo Local: Pode executar Semgrep diretamente (opcional)

Uso:
    # Modo CI (lê de arquivo)
    semgrep --config=security/semgrep.yml --json src/ > semgrep-result.json
    python scripts/semgrep_suggestions.py --file semgrep-result.json

    # Modo local (executa semgrep)
    python scripts/semgrep_suggestions.py --config security/semgrep.yml --target src/
"""

import json
import subprocess
import sys
import argparse
import io
from pathlib import Path
from typing import Dict, Any, Optional

# Configura encoding UTF-8 para Windows
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, io.UnsupportedOperation):
        # Fallback se não for possível reconfigurar
        pass

SEVERITY_MAP = {
    "ERROR": "[ALTA]",
    "WARNING": "[MEDIA]",
    "INFO": "[BAIXA]"
}

def load_results(file_path: str) -> Dict[str, Any]:
    """Carrega resultados do Semgrep de um arquivo JSON."""
    file_path_obj = Path(file_path)
    
    if not file_path_obj.exists():
        print(f"[ERRO] Arquivo de resultado do Semgrep nao encontrado: {file_path}")
        sys.exit(1)
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"[ERRO] Erro ao decodificar JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERRO] Erro ao ler arquivo: {e}")
        sys.exit(1)

def run_semgrep(config: str, target: str) -> Dict[str, Any]:
    """Executa Semgrep e retorna resultados em JSON."""
    # Tenta encontrar semgrep
    semgrep_cmd = None
    
    # Tenta diferentes formas de executar semgrep
    test_commands = [
        ['semgrep'],  # Comando direto
        ['python', '-m', 'semgrep'],  # Via módulo Python (pode ter aviso de deprecation)
    ]
    
    # Também tenta encontrar semgrep.exe em locais comuns do Windows
    if sys.platform == 'win32':
        import os
        import sysconfig
        user_profile = os.environ.get('USERPROFILE', '')
        local_appdata = os.environ.get('LOCALAPPDATA', '')
        roaming_appdata = os.environ.get('APPDATA', '')
        
        # Tenta obter o diretório de scripts do Python
        try:
            scripts_dir = sysconfig.get_path('scripts')
            if scripts_dir:
                semgrep_exe = os.path.join(scripts_dir, 'semgrep.exe')
                if os.path.exists(semgrep_exe):
                    test_commands.insert(0, [semgrep_exe])
        except Exception:
            pass
        
        # Fallback: tenta locais comuns
        possible_paths = [
            os.path.join(local_appdata, 'Python', 'pythoncore-3.14-64', 'Scripts', 'semgrep.exe'),
            os.path.join(local_appdata, 'Python', 'PythonCore-3.14-64', 'Scripts', 'semgrep.exe'),
            os.path.join(user_profile, 'AppData', 'Local', 'Python', 'bin', 'semgrep.exe'),
            os.path.join(roaming_appdata, 'Python', 'Python314', 'Scripts', 'semgrep.exe'),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                test_commands.insert(0, [path])
                break
    
    for cmd_parts in test_commands:
        try:
            result = subprocess.run(
                cmd_parts + ['--version'],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=5
            )
            # Aceita se returncode for 0, ou se houver menção a semgrep (mesmo com aviso de deprecation)
            if (result.returncode == 0 or 
                'semgrep' in result.stdout.lower() or 
                'semgrep' in result.stderr.lower() or
                'deprecated' in result.stderr.lower()):
                semgrep_cmd = cmd_parts
                break
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    if not semgrep_cmd:
        print("[ERRO] Semgrep nao encontrado. Instale com: python -m pip install --user semgrep")
        print("[INFO] Tente executar: python -m semgrep --version")
        sys.exit(1)
    
    # Verifica se target existe
    if not Path(target).exists():
        print(f"[ERRO] Diretorio alvo nao encontrado: {target}")
        sys.exit(1)
    
    # Executa semgrep
    cmd = semgrep_cmd + [
        '--config', config,
        '--json',
        target
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300
        )
        
        # Verifica se é apenas um aviso de deprecation (returncode 2)
        is_deprecation_warning = (
            result.returncode == 2 and 
            'deprecated' in result.stderr.lower() and
            len(result.stdout.strip()) > 0
        )
        
        # Aceita returncode 0, 1 (normal do semgrep) ou 2 (se for apenas aviso de deprecation)
        if result.returncode not in [0, 1] and not is_deprecation_warning:
            print(f"[ERRO] Erro ao executar Semgrep (codigo: {result.returncode})")
            if result.stderr:
                print(f"[ERRO] {result.stderr}")
            sys.exit(1)
        
        # Tenta parsear JSON mesmo com aviso de deprecation
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            # Se stdout não for JSON válido, pode ser que o erro esteja em stderr
            if is_deprecation_warning and result.stdout.strip():
                # Tenta extrair JSON mesmo com aviso
                print("[AVISO] Aviso de deprecation detectado, tentando processar resultado...")
                # Remove possíveis linhas de aviso do início
                output = result.stdout.strip()
                if output.startswith('{'):
                    return json.loads(output)
            
            print("[ERRO] Erro ao processar saida JSON do Semgrep")
            if result.stdout:
                print(f"[SAIDA] {result.stdout[:500]}")
            if result.stderr:
                print(f"[ERRO] {result.stderr[:500]}")
            sys.exit(1)
    except subprocess.TimeoutExpired:
        print("[ERRO] Timeout ao executar Semgrep")
        sys.exit(1)
    except Exception as e:
        print(f"[ERRO] Erro inesperado: {e}")
        sys.exit(1)

def suggest_fix(rule_id: str) -> str:
    """Retorna sugestão de correção baseada na regra."""
    suggestions = {
        "javascript.jwt.security.insecure-jwt":
            "Defina expiresIn no JWT e use uma chave secreta forte (env).",
        
        "javascript.express.security.audit.xss":
            "Sanitize entradas do usuário e utilize Helmet.",
        
        "javascript.lang.security.audit.eval-used":
            "Evite eval(). Use alternativas seguras como JSON.parse().",
        
        "insecure-jwt-secret":
            "Use variáveis de ambiente: jwt.sign(payload, process.env.JWT_SECRET)",
        
        "weak-crypto-algorithm":
            "Use algoritmos fortes: crypto.createHash('sha256') ou 'sha512'",
        
        "sql-injection":
            "Use consultas parametrizadas: db.query('SELECT * FROM users WHERE id = $1', [userId])",
        
        "hardcoded-secrets":
            "Mova credenciais para variáveis de ambiente: process.env.API_KEY",
        
        "weak-password-validation":
            "Implemente validação: mínimo 8 caracteres, maiúsculas, minúsculas, números e símbolos",
        
        "eval-usage":
            "Evite eval(). Use JSON.parse() para JSON ou bibliotecas específicas."
    }
    
    # Busca por substring para regras similares
    for key, suggestion in suggestions.items():
        if key in rule_id:
            return suggestion
    
    return "Revise o código e aplique boas práticas do OWASP Top 10."

def summarize(findings):
    """Conta findings por severidade."""
    summary = {"ERROR": 0, "WARNING": 0, "INFO": 0}

    for item in findings:
        severity = item.get("extra", {}).get("severity", "INFO")
        summary[severity] += 1

    return summary

def analyze(results: Dict[str, Any], fail_on_errors: bool = True) -> int:
    """
    Analisa resultados do Semgrep e exibe sugestões.
    
    Returns:
        Número de problemas encontrados
    """
    findings = results.get("results", [])
    
    if not findings:
        print("[OK] Nenhuma vulnerabilidade encontrada.")
        return 0
    
    # Agrupa por severidade
    errors = [f for f in findings if f.get("extra", {}).get("severity") == "ERROR"]
    warnings = [f for f in findings if f.get("extra", {}).get("severity") == "WARNING"]
    infos = [f for f in findings if f.get("extra", {}).get("severity") == "INFO"]
    
    # Resumo de severidade
    summary = summarize(findings)
    
    print("\n[SEGURANCA] RELATORIO DE SUGESTOES DE SEGURANCA\n")
    print("\n📊 RESUMO DE RISCO")
    print(f"🔴 Alta: {summary['ERROR']}")
    print(f"🟠 Média: {summary['WARNING']}")
    print(f"🔵 Baixa: {summary['INFO']}")
    print("=" * 60)
    
    # Processa todos os findings
    for item in findings:
        rule_id = item.get("check_id", "unknown")
        severity = item.get("extra", {}).get("severity", "INFO")
        message = item.get("extra", {}).get("message", "")
        file_path = item.get("path", "unknown")
        line = item.get("start", {}).get("line", "?")
        
        print(f"\n[ARQUIVO] {file_path}:{line}")
        print(f"[REGRA] {rule_id}")
        print(f"[SEVERIDADE] {SEVERITY_MAP.get(severity, severity)}")
        print(f"[PROBLEMA] {message}")
        print(f"[SUGESTAO] {suggest_fix(rule_id)}")
        print("-" * 60)
    
    # Resumo final
    print(f"\n[TOTAL] {len(findings)} problema(s) encontrado(s)")
    
    if fail_on_errors and errors:
        print(f"\n[ERRO] {len(errors)} problema(s) de alta severidade encontrado(s).")
        return len(errors)
    
    return len(findings)

def main():
    """Função principal."""
    parser = argparse.ArgumentParser(
        description="Analisa resultados do Semgrep e gera sugestões de correção",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Modo CI (lê de arquivo)
  semgrep --config=security/semgrep.yml --json src/ > semgrep-result.json
  python scripts/semgrep_suggestions.py --file semgrep-result.json

  # Modo local (executa semgrep)
  python scripts/semgrep_suggestions.py --config security/semgrep.yml --target src/

  # Modo CI sem falhar no pipeline
  python scripts/semgrep_suggestions.py --file semgrep-result.json --no-fail
        """
    )
    
    # Modo arquivo (CI)
    parser.add_argument(
        '--file',
        type=str,
        help='Arquivo JSON com resultados do Semgrep (modo CI)'
    )
    
    # Modo execução (local)
    parser.add_argument(
        '--config',
        type=str,
        default='security/semgrep.yml',
        help='Arquivo de configuração do Semgrep (padrão: security/semgrep.yml)'
    )
    
    parser.add_argument(
        '--target',
        type=str,
        default='src/',
        help='Diretório ou arquivo a ser analisado (padrão: src/)'
    )
    
    # Opções
    parser.add_argument(
        '--no-fail',
        action='store_true',
        help='Não falha o pipeline mesmo com problemas encontrados'
    )
    
    args = parser.parse_args()
    
    # Carrega resultados
    if args.file:
        # Modo CI: lê de arquivo
        results = load_results(args.file)
    else:
        # Modo local: executa semgrep
        results = run_semgrep(args.config, args.target)
    
    # Analisa e exibe resultados
    count = analyze(results, fail_on_errors=not args.no_fail)
    
    # Verifica resumo de severidade para alerta
    findings = results.get("results", [])
    if findings:
        summary = summarize(findings)
        if summary["ERROR"] > 0:
            print("\n🚨 ATENÇÃO: Vulnerabilidades de ALTA severidade detectadas.")
    
    # Código de saída para CI
    if args.no_fail:
        sys.exit(0)  # Sempre sucesso em modo --no-fail
    elif count > 0:
        sys.exit(1)  # Falha se houver problemas
    else:
        sys.exit(0)  # Sucesso se não houver problemas

if __name__ == "__main__":
    main()
