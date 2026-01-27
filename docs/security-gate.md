# 🛡️ Security Gate Inteligente

## 📋 Conceito

O **Security Gate Inteligente** é um sistema que classifica vulnerabilidades por severidade e aplica gates diferentes para cada nível:

- 🔵 **Baixa (INFO)** → Apenas alerta, build passa
- 🟠 **Média (WARNING)** → Apenas alerta, build passa  
- 🔴 **Alta/Crítica (ERROR)** → Marca como "attention needed", build pode continuar ou falhar (configurável)

## 🎯 Comportamento por Severidade

### 🔵 Baixa Severidade (INFO)
```
Status: INFO
Build: ✅ PASSA
Ação: Opcional, mas recomendado revisar
```

### 🟠 Média Severidade (WARNING)
```
Status: WARNING
Build: ✅ PASSA
Ação: Revisar e corrigir quando possível
```

### 🔴 Alta Severidade (ERROR)
```
Status: ATTENTION NEEDED
Build: ⚠️ CONTINUA (ou falha se configurado)
Ação: Corrigir antes de fazer merge
```

## ⚙️ Configuração

### Variável de Ambiente

No arquivo `.github/workflows/security.yml`:

```yaml
env:
  # true = quebra build se houver problemas críticos
  # false = apenas alerta (recomendado)
  FAIL_ON_CRITICAL: false
```

### Modos de Operação

#### Modo 1: Apenas Alerta (Padrão - Recomendado)
```yaml
FAIL_ON_CRITICAL: false
```

**Comportamento:**
- ✅ Build sempre passa
- ⚠️ Problemas críticos são destacados
- 📊 Resumo visual no GitHub Actions
- 💡 Permite desenvolvimento contínuo

**Quando usar:**
- Desenvolvimento ativo
- Equipes que preferem revisar antes de bloquear
- CI/CD que não deve bloquear merges automaticamente

#### Modo 2: Quebra Build (Stricto)
```yaml
FAIL_ON_CRITICAL: true
```

**Comportamento:**
- ❌ Build falha se houver problemas críticos
- ✅ Build passa se houver apenas avisos/info
- 🚫 Bloqueia merge automaticamente

**Quando usar:**
- Produção
- Branches principais (main/master)
- Quando segurança é crítica

## 📊 Exemplo de Saída

### Cenário 1: Nenhum Problema
```
🛡️  SECURITY GATE INTELIGENTE
======================================================================

✅ STATUS: CLEAN
   Nenhuma vulnerabilidade encontrada!

======================================================================

✅ BUILD PASSA: Nenhum problema crítico!
```

### Cenário 2: Apenas Avisos (Build Passa)
```
🛡️  SECURITY GATE INTELIGENTE
======================================================================

📊 RESUMO DE VULNERABILIDADES:
   🔴 Alta/Crítica:      0
   🟠 Média:             2
   🔵 Baixa:             1
   ────────────────────────────
   📋 Total:             3

🚪 GATE STATUS:
   🟠 WARNING
   ⚠️  2 problema(s) de MÉDIA severidade
   💡 Ação recomendada: Revisar e corrigir quando possível

   ✅ BUILD PASSA (apenas alerta)

======================================================================

✅ BUILD PASSA: Nenhum problema crítico!
```

### Cenário 3: Problemas Críticos (Modo Alerta)
```
🛡️  SECURITY GATE INTELIGENTE
======================================================================

📊 RESUMO DE VULNERABILIDADES:
   🔴 Alta/Crítica:      2
   🟠 Média:             1
   🔵 Baixa:             0
   ────────────────────────────
   📋 Total:             3

🚪 GATE STATUS:
   🔴 ATTENTION NEEDED
   ⚠️  2 problema(s) de ALTA severidade detectado(s)!
   💡 Ação recomendada: Corrigir antes de fazer merge

   ⚠️  BUILD CONTINUA (mas requer atenção)

======================================================================

⚠️  BUILD CONTINUA: Mas atenção necessária para problemas críticos!
```

### Cenário 4: Problemas Críticos (Modo Stricto)
```
🛡️  SECURITY GATE INTELIGENTE
======================================================================

📊 RESUMO DE VULNERABILIDADES:
   🔴 Alta/Crítica:      2
   🟠 Média:             1
   🔵 Baixa:             0
   ────────────────────────────
   📋 Total:             3

🚪 GATE STATUS:
   🔴 ATTENTION NEEDED
   ⚠️  2 problema(s) de ALTA severidade detectado(s)!
   💡 Ação recomendada: Corrigir antes de fazer merge

   ❌ BUILD QUEBRADO (fail_on_critical=true)

======================================================================

❌ BUILD FALHOU: Problemas críticos encontrados!
```

## 🔍 Detalhes dos Findings

O Security Gate mostra detalhes dos problemas encontrados:

### Problemas Críticos (sempre mostrados)
```
🔴 PROBLEMAS CRÍTICOS (ALTA SEVERIDADE):
----------------------------------------------------------------------

1. src/controllers/auth.controller.js:45
   Regra: insecure-jwt-secret
   Problema: JWT secret should come from environment variables

2. src/database/query.js:12
   Regra: sql-injection
   Problema: Potential SQL injection. Use parameterized queries.
```

### Avisos e Info (mostrados com --show-all)
```
🟠 AVISOS (MÉDIA SEVERIDADE):
----------------------------------------------------------------------

1. src/controllers/auth.controller.js:118
   Regra: weak-password-validation
   Problema: Password minimum length should be at least 8 characters.
```

## 📦 Arquivos Gerados

### `security-gate-summary.json`
Resumo estruturado dos findings:

```json
{
  "total": 3,
  "critical": 2,
  "warning": 1,
  "info": 0,
  "status": "critical"
}
```

**Uso:**
- Análise programática
- Integração com outras ferramentas
- Relatórios automatizados

## 🚀 Uso Local

### Básico (apenas alerta)
```bash
python scripts/security_gate.py --file semgrep-result.json
```

### Quebra build se crítico
```bash
python scripts/security_gate.py --file semgrep-result.json --fail-on-critical
```

### Mostra todos os findings
```bash
python scripts/security_gate.py --file semgrep-result.json --show-all
```

### Completo
```bash
python scripts/security_gate.py \
  --file semgrep-result.json \
  --fail-on-critical \
  --show-all \
  --output gate-summary.json
```

## 📊 Resumo no GitHub Actions

O pipeline gera automaticamente um resumo visual:

```markdown
## 🛡️ Security Gate - Resumo

✅ **Status:** CLEAN

| Severidade | Quantidade |
|-----------|------------|
| 🔴 Alta/Crítica | 0 |
| 🟠 Média | 2 |
| 🔵 Baixa | 1 |
| **Total** | **3** |

ℹ️ Problemas de média/baixa severidade detectados.

💡 **Ação recomendada:** Revisar quando possível
```

## 🎯 Benefícios

1. **Desenvolvimento Contínuo**
   - Não bloqueia desenvolvimento
   - Apenas alerta sobre problemas

2. **Flexibilidade**
   - Configurável por ambiente
   - Pode quebrar build quando necessário

3. **Visibilidade**
   - Resumo visual claro
   - Classificação por severidade
   - Ações recomendadas

4. **Integração**
   - JSON estruturado para automação
   - Artifacts para análise posterior

## 🔧 Troubleshooting

### Script não executa
```bash
# Verifica se o arquivo existe
ls -la semgrep-result.json

# Testa o script
python scripts/security_gate.py --file semgrep-result.json
```

### Build falha inesperadamente
- Verifique `FAIL_ON_CRITICAL` no workflow
- Veja os logs do step "Security Gate Inteligente"
- Verifique `security-gate-summary.json`

### Não mostra todos os findings
- Use `--show-all` no script
- Verifique se o arquivo JSON está completo

## 📚 Referências

- [Semgrep Documentation](https://semgrep.dev/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
