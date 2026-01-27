# 🔒 GitHub Actions - Pipeline de Segurança

## 📋 Comportamento do Pipeline

### Quando você faz `git push`

O pipeline **Security Scan - Semgrep** é executado automaticamente quando:

1. ✅ **Push para branches `main` ou `develop`**
2. ✅ **Pull Request** para qualquer branch

### 🔄 Fluxo de Execução

```
┌─────────────────────────────────────────┐
│ 1. 📥 Checkout do código                │
│    - Baixa o código do repositório     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 2. 🐍 Configurar Python                │
│    - Instala Python 3.11                │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 3. 🔍 Instalar Semgrep                 │
│    - pip install semgrep                │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 4. 🛡️ Rodar Semgrep (JSON)            │
│    - Executa scan de segurança          │
│    - Salva em semgrep-result.json      │
│    - continue-on-error: true           │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 5. 💡 Analisar e sugerir correções     │
│    - Executa script Python              │
│    - Exibe sugestões de correção        │
│    - continue-on-error: true           │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 6. ❌ Falhar se houver problemas críticos│
│    - Verifica severidade dos problemas  │
│    - FALHA se houver ERROR (alta)       │
│    - PASSA se houver apenas WARNING/INFO│
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ 7. 📦 Salvar resultado como artefato   │
│    - Upload do JSON para download       │
└─────────────────────────────────────────┘
```

## ⚠️ Comportamento por Severidade

### ❌ **ERROR (Alta Severidade)**
- **Pipeline FALHA** ❌
- Exemplo: JWT secret hardcoded, SQL injection, uso de eval()
- **Ação**: Corrija antes de fazer merge

### ⚠️ **WARNING (Média Severidade)**
- **Pipeline PASSA** ✅ (mas avisa)
- Exemplo: Validação de senha fraca
- **Ação**: Revise e corrija quando possível

### ℹ️ **INFO (Baixa Severidade)**
- **Pipeline PASSA** ✅ (mas avisa)
- Exemplo: Sugestões de melhoria
- **Ação**: Opcional, mas recomendado

## 📊 Exemplos de Saída

### ✅ Cenário 1: Nenhum problema
```
✅ Nenhuma vulnerabilidade encontrada!
```

### ⚠️ Cenário 2: Apenas avisos (pipeline passa)
```
⚠️  Aviso: 2 problema(s) de média severidade e 1 de baixa severidade encontrados
✅ Nenhum problema crítico. Pipeline continua...
```

### ❌ Cenário 3: Problemas críticos (pipeline falha)
```
❌ ERRO: 1 problema(s) de ALTA severidade encontrado(s)!
⚠️  Avisos: 2 média, 0 baixa
```

## 🔍 Onde Ver os Resultados

1. **GitHub Actions Tab**
   - Vá para: `Actions` → Selecione o workflow → Veja os logs

2. **Artifacts (Downloads)**
   - No final do workflow, clique em `semgrep-result`
   - Baixe o arquivo `semgrep-result.json` para análise detalhada

3. **Pull Request**
   - O status do pipeline aparece como check no PR
   - ✅ Verde = Passou
   - ❌ Vermelho = Falhou (há problemas críticos)

## 🛠️ Como Corrigir Problemas

### Se o pipeline falhar:

1. **Veja os logs** no GitHub Actions
2. **Identifique o problema** na saída do script
3. **Siga as sugestões** exibidas
4. **Corrija o código**
5. **Faça commit e push novamente**

### Exemplo de correção:

```javascript
// ❌ ERRADO (vai falhar o pipeline)
jwt.sign(payload, "hardcoded-secret")

// ✅ CORRETO
jwt.sign(payload, process.env.JWT_SECRET)
```

## 📝 Configuração

O pipeline usa a configuração em:
- `security/semgrep.yml` - Regras customizadas de segurança

Escaneia os diretórios:
- `src/` - Código backend
- `frontend/src/` - Código frontend

## 🔧 Troubleshooting

### Pipeline não executa?
- Verifique se está fazendo push para `main` ou `develop`
- Verifique se o arquivo `.github/workflows/security.yml` existe

### Semgrep não encontra problemas mas deveria?
- Verifique se o arquivo `security/semgrep.yml` está correto
- Verifique se os arquivos estão nos diretórios `src/` ou `frontend/src/`

### Pipeline falha mas não há problemas críticos?
- Verifique os logs do step "❌ Falhar se houver problemas críticos"
- Pode ser um problema de parsing do JSON

## 📚 Referências

- [Semgrep Documentation](https://semgrep.dev/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
