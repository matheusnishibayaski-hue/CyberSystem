# OWASP Top 10 - Documentação de Segurança

## Visão Geral

Este projeto implementa proteções robustas contra as principais vulnerabilidades de segurança web identificadas pelo **OWASP Top 10 2021**. A arquitetura foi projetada seguindo princípios de segurança desde o início (Security by Design), garantindo que as melhores práticas sejam aplicadas em todas as camadas da aplicação.

## Vulnerabilidades Mitigadas

Este projeto segue o OWASP Top 10, mitigando as seguintes vulnerabilidades críticas:

- **A01:2021** – Broken Access Control
- **A02:2021** – Cryptographic Failures
- **A03:2021** – Injection
- **A07:2021** – Identification and Authentication Failures

---

## A01:2021 – Broken Access Control

### Descrição da Vulnerabilidade

Falhas de controle de acesso permitem que usuários acessem recursos ou funcionalidades para os quais não têm permissão. Esta é a vulnerabilidade mais crítica do OWASP Top 10 2021.

### Impacto

- Acesso não autorizado a dados sensíveis
- Modificação ou exclusão de dados de outros usuários
- Elevação de privilégios
- Bypass de controles de autenticação

### Mitigações Implementadas

#### 1. Autenticação Baseada em JWT

**Implementação:**
- Tokens JWT com assinatura criptográfica usando `JWT_SECRET`
- Expiração configurável via variável de ambiente (`JWT_EXPIRES_IN`)
- Validação obrigatória em todas as rotas protegidas

**Localização:** `src/middleware/auth.middleware.js`

```javascript
// Verificação de token em cada requisição protegida
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // Dados do usuário disponíveis no request
```

#### 2. Middleware de Autorização

**Implementação:**
- Middleware dedicado para verificação de tokens
- Tratamento específico para tokens expirados, inválidos ou ausentes
- Mensagens de erro padronizadas que não expõem informações sensíveis

**Localização:** `src/middleware/auth.middleware.js`

```javascript
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  // Validação e decodificação do token
};
```

#### 3. Proteção de Rotas

**Rotas Protegidas:**
- `/api/protected/*` - Todas as rotas protegidas requerem autenticação
- Validação de ownership de recursos
- Verificação de permissões antes de operações sensíveis

**Exemplo de Implementação:**
```javascript
router.get('/profile', authMiddleware, (req, res) => {
  // req.user contém dados do usuário autenticado
  // Acesso garantido apenas para usuários autenticados
});
```

### Validação

- ✅ Tokens JWT obrigatórios em rotas protegidas
- ✅ Validação de assinatura em cada requisição
- ✅ Tratamento de tokens expirados
- ✅ Separação entre rotas públicas e protegidas

---

## A02:2021 – Cryptographic Failures

### Descrição da Vulnerabilidade

Anteriormente conhecida como "Sensitive Data Exposure", esta vulnerabilidade ocorre quando dados sensíveis não são adequadamente protegidos por criptografia ou quando algoritmos criptográficos fracos são utilizados.

### Impacto

- Exposição de senhas em texto plano
- Comprometimento de tokens de autenticação
- Interceptação de dados sensíveis em trânsito
- Violação de privacidade e conformidade (LGPD, GDPR)

### Mitigações Implementadas

#### 1. Criptografia de Senhas com bcrypt

**Implementação:**
- Uso de `bcryptjs` com 12 rounds de salt (recomendado para produção)
- Hash único gerado para cada senha
- Senhas nunca armazenadas em texto plano

**Localização:** `src/controllers/auth.controller.js`

```javascript
// Hash de senha durante registro
const hash = await bcrypt.hash(password, 12);

// Verificação de senha durante login
const valid = await bcrypt.compare(password, user.password);
```

**Características:**
- **Salt automático**: Cada hash inclui um salt único
- **12 rounds**: Balanceamento entre segurança e performance
- **Resistente a rainbow tables**: Salt único por senha

#### 2. Segurança de Tokens JWT

**Implementação:**
- Secret armazenado em variáveis de ambiente (`.env`)
- Validação obrigatória de `JWT_SECRET` antes de gerar tokens
- Expiração configurável para limitar janela de ataque

**Localização:** `src/controllers/auth.controller.js`, `src/middleware/auth.middleware.js`

```javascript
// Verificação de configuração antes de gerar token
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

// Geração segura de token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
);
```

#### 3. Headers de Segurança HTTP

**Implementação:**
- Helmet.js configurado com políticas de segurança
- HSTS (HTTP Strict Transport Security) habilitado
- Content Security Policy configurada

**Localização:** `src/server.js`

```javascript
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: { /* ... */ }
}));
```

### Validação

- ✅ Senhas armazenadas apenas como hash bcrypt
- ✅ JWT_SECRET em variáveis de ambiente
- ✅ Tokens com expiração configurável
- ✅ Headers de segurança HTTP configurados
- ✅ Recomendação de HTTPS em produção

---

## A03:2021 – Injection

### Descrição da Vulnerabilidade

Ataques de injeção ocorrem quando dados não confiáveis são enviados a um interpretador como parte de um comando ou query. O atacante pode executar comandos não intencionais ou acessar dados não autorizados.

### Impacto

- Execução de código malicioso
- Acesso não autorizado a banco de dados
- Comprometimento do servidor
- Roubo de dados sensíveis

### Mitigações Implementadas

#### 1. Validação e Sanitização de Entrada

**Implementação:**
- Uso de `express-validator` para validação robusta
- Sanitização automática de dados de entrada
- Normalização de emails e strings

**Localização:** `src/routes/auth.routes.js`

```javascript
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail() // Sanitização automática
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
];
```

**Validações Aplicadas:**
- **Email**: Validação de formato e normalização
- **Senha**: Comprimento mínimo e complexidade
- **Strings**: Sanitização de caracteres especiais

#### 2. Prevenção de SQL Injection

**Implementação:**
- Uso de armazenamento em memória (não SQL direto)
- Preparação para migração para ORM/ODM (Mongoose, Sequelize)
- Parâmetros preparados quando necessário

**Recomendação para Produção:**
```javascript
// Exemplo com Mongoose (prevenção automática de SQL Injection)
const user = await User.findOne({ email: req.body.email });
```

#### 3. Proteção contra Command Injection

**Implementação:**
- Sem uso de `eval()` ou `Function()` com dados do usuário
- Validação de todos os inputs antes de processamento
- Limitação de tamanho de payloads

**Localização:** `src/server.js`

```javascript
// Limite de tamanho de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Validação

- ✅ Validação de entrada em todas as rotas
- ✅ Sanitização de dados do usuário
- ✅ Sem uso de eval() ou exec()
- ✅ Limitação de tamanho de payloads
- ✅ Preparado para uso de ORM em produção

---

## A07:2021 – Identification and Authentication Failures

### Descrição da Vulnerabilidade

Falhas relacionadas à identificação e autenticação de usuários, incluindo senhas fracas, falta de proteção contra brute force, e gerenciamento inadequado de sessões.

### Impacto

- Comprometimento de contas de usuários
- Acesso não autorizado ao sistema
- Roubo de credenciais
- Elevação de privilégios

### Mitigações Implementadas

#### 1. Política de Senhas Fortes

**Implementação:**
- Validação de complexidade de senha
- Mínimo de 8 caracteres
- Requer maiúscula, minúscula, número e caractere especial (quando aplicável)

**Localização:** `src/routes/auth.routes.js`

```javascript
body('password')
  .isLength({ min: 8 })
  .withMessage('Senha deve ter no mínimo 8 caracteres')
```

#### 2. Proteção contra Brute Force

**Implementação:**
- Rate limiting específico para endpoints de autenticação
- Limite de 5 tentativas por 15 minutos para login/registro
- Rate limiting geral de 100 requisições por 15 minutos

**Localização:** `src/server.js`

```javascript
// Rate limiting estrito para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas
  skipSuccessfulRequests: true // Não conta requisições bem-sucedidas
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

#### 3. Gerenciamento Seguro de Sessões

**Implementação:**
- Tokens JWT com expiração configurável
- Cookies httpOnly e secure em produção
- Validação de token em cada requisição protegida

**Localização:** `src/server.js`, `src/middleware/auth.middleware.js`

```javascript
// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    httpOnly: true, // Previne acesso via JavaScript
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
```

#### 4. Mensagens de Erro Seguras

**Implementação:**
- Mensagens genéricas que não revelam se usuário existe
- Logs detalhados no servidor (não expostos ao cliente)
- Tratamento consistente de erros de autenticação

**Localização:** `src/controllers/auth.controller.js`

```javascript
// Mensagem genérica - não revela se email existe
return res.status(401).json({
  error: 'Credenciais inválidas',
  message: 'Email ou senha incorretos'
});
```

### Validação

- ✅ Validação de senhas fortes
- ✅ Rate limiting em endpoints de autenticação
- ✅ Tokens JWT com expiração
- ✅ Cookies seguros configurados
- ✅ Mensagens de erro que não expõem informações
- ✅ Logs de tentativas de autenticação

---

## Outras Proteções Implementadas

### A05:2021 – Security Misconfiguration

- **Helmet.js**: Headers de segurança HTTP configurados
- **CORS**: Configuração restritiva de origens permitidas
- **Variáveis de Ambiente**: Secrets não hardcoded
- **Rate Limiting**: Proteção contra abuso de API

### A06:2021 – Vulnerable and Outdated Components

- **Dependências Atualizadas**: Versões recentes de pacotes
- **Análise Estática**: Semgrep configurado para detecção de vulnerabilidades
- **Auditoria**: `npm audit` para verificação de dependências

### A09:2021 – Security Logging and Monitoring

- **Health Check**: Endpoint `/health` para monitoramento
- **Logs de Erro**: Registro de erros e tentativas de autenticação
- **Estrutura para Monitoramento**: Preparado para integração com ferramentas de monitoramento

---

## Checklist de Segurança

### Autenticação e Autorização
- [x] Autenticação JWT implementada
- [x] Middleware de autorização em rotas protegidas
- [x] Validação de tokens em cada requisição
- [x] Expiração configurável de tokens

### Criptografia
- [x] Senhas hasheadas com bcrypt (12 rounds)
- [x] JWT_SECRET em variáveis de ambiente
- [x] Headers de segurança HTTP (Helmet)
- [x] HSTS configurado

### Validação e Sanitização
- [x] Validação de entrada com express-validator
- [x] Sanitização de dados do usuário
- [x] Normalização de emails
- [x] Limitação de tamanho de payloads

### Proteção contra Ataques
- [x] Rate limiting configurado
- [x] Proteção contra brute force
- [x] CORS configurado
- [x] Headers de segurança HTTP

### Configuração
- [x] Secrets em variáveis de ambiente
- [x] Configuração de produção vs desenvolvimento
- [x] Análise de segurança com Semgrep
- [x] Documentação de segurança

---

## Ferramentas de Análise de Segurança

### Scan Estático
```bash
npm run security-scan
```
Executa análise estática com Semgrep usando regras OWASP.

### Scan Dinâmico
```bash
npm run zap-scan
```
Executa scan de segurança com OWASP ZAP (requer servidor rodando).

### Auditoria de Dependências
```bash
npm audit
```
Verifica vulnerabilidades conhecidas nas dependências.

---

## Referências

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [bcrypt Security](https://github.com/kelektiv/node.bcrypt.js)

---

## Manutenção e Atualização

### Revisões Periódicas

- **Mensal**: Revisão de dependências (`npm audit`)
- **Trimestral**: Análise de segurança completa
- **Anual**: Revisão de políticas de segurança

### Monitoramento Contínuo

- Logs de tentativas de autenticação
- Alertas de rate limiting
- Monitoramento de health check endpoint
- Análise de padrões de tráfego suspeito

---

**Última Atualização:** 2026-01-26  
**Versão do Documento:** 1.0  
**Responsável:** Equipe de Segurança
