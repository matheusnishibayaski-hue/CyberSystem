# Modelo de Ameaças (Threat Model)

Este documento descreve o modelo de ameaças do sistema **secure-web-security**.

## Visão Geral

O sistema é uma aplicação web Node.js/Express que fornece autenticação e autorização para usuários. O modelo de ameaças identifica potenciais vulnerabilidades e medidas de mitigação.

## Componentes do Sistema

```
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       │
┌──────▼──────────────────┐
│   Express Server        │
│  ┌──────────────────┐   │
│  │  Auth Routes     │   │
│  │  Auth Controller │   │
│  │  Auth Middleware │   │
│  └──────────────────┘   │
└──────┬──────────────────┘
       │
┌──────▼──────┐
│   Storage   │
│  (Memory/   │
│   Database) │
└─────────────┘
```

## Atores e Ameaças

### 1. Usuário Não Autenticado (Atacante Externo)

**Capacidades:**
- Acesso à internet
- Pode fazer requisições HTTP/HTTPS
- Pode tentar explorar endpoints públicos

**Ameaças:**
- **T01: Brute Force Attack**
  - **Descrição:** Tentativas repetidas de login com credenciais diferentes
  - **Impacto:** Alto - Pode comprometer contas de usuários
  - **Probabilidade:** Alta
  - **Mitigação:**
    - Rate limiting (100 requisições por 15 minutos)
    - Bloqueio de conta após 5 tentativas falhas
    - Lockout de 15 minutos após bloqueio

- **T02: Credential Stuffing**
  - **Descrição:** Uso de credenciais vazadas de outros serviços
  - **Impacto:** Médio - Pode comprometer contas
  - **Probabilidade:** Média
  - **Mitigação:**
    - Validação de senhas fortes
    - Mensagens de erro genéricas (não revelam se usuário existe)

- **T03: Registration Abuse**
  - **Descrição:** Criação massiva de contas
  - **Impacto:** Baixo - Sobrecarga do sistema
  - **Probabilidade:** Média
  - **Mitigação:**
    - Rate limiting em endpoints de registro
    - Validação rigorosa de dados

### 2. Usuário Autenticado (Atacante Interno)

**Capacidades:**
- Possui token JWT válido
- Pode acessar endpoints protegidos
- Conhece estrutura da API

**Ameaças:**
- **T04: Token Theft**
  - **Descrição:** Roubo de token JWT (XSS, MITM)
  - **Impacto:** Alto - Acesso não autorizado
  - **Probabilidade:** Média
  - **Mitigação:**
    - Tokens com expiração curta (24h)
    - HTTPS obrigatório em produção
    - Cookies httpOnly para sessões
    - Headers de segurança (Helmet)

- **T05: Privilege Escalation**
  - **Descrição:** Tentativa de acessar recursos de outros usuários
  - **Impacto:** Alto - Acesso não autorizado
  - **Probabilidade:** Baixa
  - **Mitigação:**
    - Verificação de ownership em todas as operações
    - Validação de userId no token vs. recurso solicitado

- **T06: Password Change Attack**
  - **Descrição:** Tentativa de alterar senha sem conhecer a atual
  - **Impacto:** Alto - Comprometimento de conta
  - **Probabilidade:** Baixa
  - **Mitigação:**
    - Requer senha atual para alteração
    - Validação de senha atual antes de alterar

### 3. Atacante com Acesso ao Servidor

**Capacidades:**
- Acesso físico ou lógico ao servidor
- Pode ler arquivos de configuração
- Pode interceptar tráfego interno

**Ameaças:**
- **T07: Secret Exposure**
  - **Descrição:** Exposição de secrets (JWT, senhas de banco)
  - **Impacto:** Crítico - Comprometimento total
  - **Probabilidade:** Baixa
  - **Mitigação:**
    - Secrets em variáveis de ambiente
    - Arquivo `.env` no `.gitignore`
    - Rotação de secrets

- **T08: Database Dump**
  - **Descrição:** Acesso não autorizado ao banco de dados
  - **Impacto:** Crítico - Exposição de dados
  - **Probabilidade:** Baixa
  - **Mitigação:**
    - Senhas hasheadas (bcrypt)
    - Criptografia de dados sensíveis
    - Backups seguros

### 4. Ameaças de Infraestrutura

**Ameaças:**
- **T09: DDoS Attack**
  - **Descrição:** Sobrecarga do servidor com requisições
  - **Impacto:** Alto - Indisponibilidade
  - **Probabilidade:** Média
  - **Mitigação:**
    - Rate limiting
    - CDN/WAF (recomendado)
    - Monitoramento de tráfego

- **T10: Man-in-the-Middle (MITM)**
  - **Descrição:** Interceptação de comunicação
  - **Impacto:** Alto - Roubo de credenciais/tokens
  - **Probabilidade:** Baixa (com HTTPS)
  - **Mitigação:**
    - HTTPS obrigatório
    - Certificados SSL válidos
    - HSTS header

## Matriz de Risco

| Ameaça | Impacto | Probabilidade | Risco | Status |
|--------|---------|---------------|-------|--------|
| T01: Brute Force | Alto | Alta | **Alto** | ✅ Mitigado |
| T02: Credential Stuffing | Médio | Média | Médio | ✅ Mitigado |
| T03: Registration Abuse | Baixo | Média | Baixo | ✅ Mitigado |
| T04: Token Theft | Alto | Média | **Alto** | ✅ Mitigado |
| T05: Privilege Escalation | Alto | Baixa | Médio | ✅ Mitigado |
| T06: Password Change | Alto | Baixa | Médio | ✅ Mitigado |
| T07: Secret Exposure | Crítico | Baixa | **Alto** | ✅ Mitigado |
| T08: Database Dump | Crítico | Baixa | **Alto** | ✅ Mitigado |
| T09: DDoS | Alto | Média | **Alto** | ⚠️ Parcial |
| T10: MITM | Alto | Baixa | Médio | ✅ Mitigado |

## Cenários de Ataque

### Cenário 1: Ataque de Brute Force

**Fluxo:**
1. Atacante tenta múltiplas combinações de email/senha
2. Sistema detecta múltiplas tentativas falhas
3. Conta é bloqueada após 5 tentativas
4. Lockout de 15 minutos é aplicado

**Proteção:** ✅ Implementada

### Cenário 2: Roubo de Token via XSS

**Fluxo:**
1. Atacante injeta script malicioso no site
2. Script rouba token JWT do localStorage
3. Atacante usa token para acessar conta

**Proteção:** 
- ✅ Headers de segurança (Helmet) previnem XSS
- ✅ Tokens com expiração
- ⚠️ Recomendado: Armazenar tokens em httpOnly cookies

### Cenário 3: SQL Injection

**Fluxo:**
1. Atacante envia payload malicioso em parâmetro
2. Payload é executado como SQL
3. Dados são expostos ou modificados

**Proteção:** 
- ✅ Validação de entrada
- ✅ Uso de ORM/ODM (recomendado)
- ⚠️ Não aplicável (armazenamento em memória atual)

## Recomendações de Melhoria

### Curto Prazo
1. ✅ Implementar rate limiting - **Concluído**
2. ✅ Implementar bloqueio de conta - **Concluído**
3. ⚠️ Adicionar logging de segurança
4. ⚠️ Implementar 2FA (Two-Factor Authentication)

### Médio Prazo
1. ⚠️ Migrar para banco de dados (MongoDB/PostgreSQL)
2. ⚠️ Implementar refresh tokens com rotação
3. ⚠️ Adicionar CAPTCHA em login/registro
4. ⚠️ Implementar auditoria de ações

### Longo Prazo
1. ⚠️ Implementar WAF (Web Application Firewall)
2. ⚠️ Adicionar monitoramento e alertas
3. ⚠️ Implementar análise de comportamento
4. ⚠️ Penetration testing regular

## Validação e Testes

### Testes de Segurança Recomendados

1. **Testes de Penetração**
   - Testar endpoints públicos
   - Tentar bypass de autenticação
   - Testar rate limiting

2. **Análise Estática**
   - Semgrep: `npm run security-scan`
   - npm audit: `npm audit`

3. **Testes de Carga**
   - Verificar comportamento sob DDoS simulado
   - Testar limites de rate limiting

4. **Testes de Validação**
   - Tentar injetar payloads maliciosos
   - Testar validação de entrada

## Referências

- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [Microsoft Threat Modeling](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool)
- [STRIDE Threat Model](https://en.wikipedia.org/wiki/STRIDE_(security))
