#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Security Gate Inteligente - Sistema de gates por severidade

Comportamento:
- 🔵 Baixa / 🟠 Média → apenas alerta (não quebra build)
- 🔴 Alta / Crítica → marca como "attention needed" (pode quebrar opcionalmente)
"""

import json
import sys
import os
from typing import Dict, Any, List, Tuple
from pathlib import Path

# Configura encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, io.UnsupportedOperation):
        pass

SEVERITY_ICONS = {
    "ERROR": "🔴",
    "WARNING": "🟠",
    "INFO": "🔵"
}

SEVERITY_NAMES = {
    "ERROR": "ALTA",
    "WARNING": "MÉDIA",
    "INFO": "BAIXA"
}

def load_results(file_path: str) -> Dict[str, Any]:
    """Carrega resultados do Semgrep de um arquivo JSON."""
    file_path_obj = Path(file_path)
    
    if not file_path_obj.exists():
        print(f"[ERRO] Arquivo não encontrado: {file_path}")
        sys.exit(1)
    
    try:
        # Usa utf-8-sig para lidar com BOM UTF-8 que pode ser adicionado pelo PowerShell
        with open(file_path, "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"[ERRO] Erro ao decodificar JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERRO] Erro ao ler arquivo: {e}")
        sys.exit(1)

def categorize_findings(findings: List[Dict[str, Any]]) -> Tuple[List, List, List]:
    """Categoriza findings por severidade."""
    errors = []
    warnings = []
    infos = []
    
    for finding in findings:
        severity = finding.get("extra", {}).get("severity", "INFO")
        if severity == "ERROR":
            errors.append(finding)
        elif severity == "WARNING":
            warnings.append(finding)
        else:
            infos.append(finding)
    
    return errors, warnings, infos

def generate_summary(errors: List, warnings: List, infos: List) -> Dict[str, Any]:
    """Gera resumo dos findings."""
    total = len(errors) + len(warnings) + len(infos)
    
    return {
        "total": total,
        "critical": len(errors),
        "warning": len(warnings),
        "info": len(infos),
        "status": "critical" if errors else "warning" if warnings else "info" if infos else "clean"
    }

def print_gate_status(summary: Dict[str, Any], fail_on_critical: bool = False):
    """Imprime status do Security Gate."""
    print("\n" + "=" * 70)
    print("🛡️  SECURITY GATE INTELIGENTE")
    print("=" * 70)
    
    if summary["total"] == 0:
        print("\n✅ STATUS: CLEAN")
        print("   Nenhuma vulnerabilidade encontrada!")
        print("\n" + "=" * 70)
        return
    
    # Status por severidade
    print(f"\n📊 RESUMO DE VULNERABILIDADES:")
    print(f"   🔴 Alta/Crítica:    {summary['critical']:3d}")
    print(f"   🟠 Média:            {summary['warning']:3d}")
    print(f"   🔵 Baixa:            {summary['info']:3d}")
    print(f"   ────────────────────────────")
    print(f"   📋 Total:            {summary['total']:3d}")
    
    # Gate Status
    print("\n🚪 GATE STATUS:")
    
    if summary["critical"] > 0:
        status_icon = "🔴"
        status_text = "ATTENTION NEEDED"
        print(f"   {status_icon} {status_text}")
        print(f"   ⚠️  {summary['critical']} problema(s) de ALTA severidade detectado(s)!")
        print(f"   💡 Ação recomendada: Corrigir antes de fazer merge")
        
        if fail_on_critical:
            print(f"\n   ❌ BUILD QUEBRADO (fail_on_critical=true)")
        else:
            print(f"\n   ⚠️  BUILD CONTINUA (mas requer atenção)")
    elif summary["warning"] > 0:
        status_icon = "🟠"
        status_text = "WARNING"
        print(f"   {status_icon} {status_text}")
        print(f"   ⚠️  {summary['warning']} problema(s) de MÉDIA severidade")
        print(f"   💡 Ação recomendada: Revisar e corrigir quando possível")
        print(f"\n   ✅ BUILD PASSA (apenas alerta)")
    elif summary["info"] > 0:
        status_icon = "🔵"
        status_text = "INFO"
        print(f"   {status_icon} {status_text}")
        print(f"   ℹ️  {summary['info']} problema(s) de BAIXA severidade")
        print(f"   💡 Ação recomendada: Opcional, mas recomendado")
        print(f"\n   ✅ BUILD PASSA (apenas alerta)")
    
    print("\n" + "=" * 70)

def print_detailed_findings(errors: List, warnings: List, infos: List, show_all: bool = False):
    """Imprime findings detalhados."""
    if not (errors or warnings or infos):
        return
    
    print("\n📋 DETALHES DOS FINDINGS:\n")
    
    # Mostra críticos sempre, outros apenas se show_all
    if errors:
        print("🔴 PROBLEMAS CRÍTICOS (ALTA SEVERIDADE):")
        print("-" * 70)
        for i, finding in enumerate(errors, 1):
            rule_id = finding.get("check_id", "unknown")
            message = finding.get("extra", {}).get("message", "")
            file_path = finding.get("path", "unknown")
            line = finding.get("start", {}).get("line", "?")
            
            print(f"\n{i}. {file_path}:{line}")
            print(f"   Regra: {rule_id}")
            print(f"   Problema: {message}")
        print()
    
    if show_all and warnings:
        print("🟠 AVISOS (MÉDIA SEVERIDADE):")
        print("-" * 70)
        for i, finding in enumerate(warnings, 1):
            rule_id = finding.get("check_id", "unknown")
            message = finding.get("extra", {}).get("message", "")
            file_path = finding.get("path", "unknown")
            line = finding.get("start", {}).get("line", "?")
            
            print(f"\n{i}. {file_path}:{line}")
            print(f"   Regra: {rule_id}")
            print(f"   Problema: {message}")
        print()
    
    if show_all and infos:
        print("🔵 INFORMAÇÕES (BAIXA SEVERIDADE):")
        print("-" * 70)
        for i, finding in enumerate(infos, 1):
            rule_id = finding.get("check_id", "unknown")
            message = finding.get("extra", {}).get("message", "")
            file_path = finding.get("path", "unknown")
            line = finding.get("start", {}).get("line", "?")
            
            print(f"\n{i}. {file_path}:{line}")
            print(f"   Regra: {rule_id}")
            print(f"   Problema: {message}")
        print()

def save_gate_summary(summary: Dict[str, Any], output_file: str = "security-gate-summary.json"):
    """Salva resumo do Security Gate, fazendo backup do arquivo anterior se existir."""
    output_path = Path(output_file)
    
    # Fazer backup do arquivo anterior se existir
    if output_path.exists():
        backup_path = output_path.parent / (output_path.stem + '-backup.json')
        try:
            import shutil
            shutil.copy2(output_path, backup_path)
            print(f"📦 Backup do relatório anterior criado: {backup_path}")
        except Exception as e:
            print(f"⚠️  Não foi possível criar backup: {e}")
    
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Resumo salvo em: {output_file}")
    except Exception as e:
        print(f"\n⚠️  Erro ao salvar resumo: {e}")

def main():
    """Função principal."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Security Gate Inteligente - Sistema de gates por severidade",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Modo básico (não quebra build)
  python scripts/security_gate.py --file semgrep-result.json
  
  # Quebra build se houver problemas críticos
  python scripts/security_gate.py --file semgrep-result.json --fail-on-critical
  
  # Mostra todos os findings (não apenas críticos)
  python scripts/security_gate.py --file semgrep-result.json --show-all
        """
    )
    
    parser.add_argument(
        '--file',
        type=str,
        required=True,
        help='Arquivo JSON com resultados do Semgrep'
    )
    
    parser.add_argument(
        '--fail-on-critical',
        action='store_true',
        help='Quebra o build se houver problemas críticos (padrão: apenas alerta)'
    )
    
    parser.add_argument(
        '--show-all',
        action='store_true',
        help='Mostra todos os findings, não apenas os críticos'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='security-gate-summary.json',
        help='Arquivo de saída para o resumo (padrão: security-gate-summary.json)'
    )
    
    args = parser.parse_args()
    
    # Carrega resultados
    results = load_results(args.file)
    findings = results.get("results", [])
    
    # Categoriza por severidade
    errors, warnings, infos = categorize_findings(findings)
    
    # Gera resumo
    summary = generate_summary(errors, warnings, infos)
    
    # Imprime status do gate
    print_gate_status(summary, fail_on_critical=args.fail_on_critical)
    
    # Imprime findings detalhados
    print_detailed_findings(errors, warnings, infos, show_all=args.show_all)
    
    # Salva resumo
    save_gate_summary(summary, output_file=args.output)
    
    # Define código de saída
    if args.fail_on_critical and summary["critical"] > 0:
        print("\n❌ BUILD FALHOU: Problemas críticos encontrados!")
        sys.exit(1)
    elif summary["critical"] > 0:
        print("\n⚠️  BUILD CONTINUA: Mas atenção necessária para problemas críticos!")
        sys.exit(0)
    else:
        print("\n✅ BUILD PASSA: Nenhum problema crítico!")
        sys.exit(0)

if __name__ == "__main__":
    main()
