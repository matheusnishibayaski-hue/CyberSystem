# Guia de Scan com OWASP ZAP

Este guia explica como escanear a API com OWASP ZAP para identificar vulnerabilidades de segurança.

## Pré-requisitos

1. **Servidor rodando**: Certifique-se de que a API está rodando em `http://localhost:3000`
   ```bash
   npm start
   ```

2. **OWASP ZAP instalado**: Escolha uma das opções abaixo

## Opções de Instalação do OWASP ZAP

### Opção 1: ZAP Desktop (Recomendado para iniciantes)

1. Baixe o OWASP ZAP Desktop:
   - Windows: https://www.zaproxy.org/download/
   - Instale e execute o ZAP Desktop

2. Execute o scan:
   ```powershell
   .\scripts\zap-scan.ps1
   ```

### Opção 2: Docker (Recomendado para automação)

```bash
# Inicie o ZAP em modo daemon
docker run -d -p 8080:8080 owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true

# Execute scan baseline
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000 -r security/zap-report.html
```

### Opção 3: zap-cli (Linha de comando)

```bash
# Instalar zap-cli
python -m pip install --user zapcli

# Executar scan (requer ZAP rodando)
zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://localhost:3000
zap-cli report -o security/zap-report.html -f html
```

## Executando o Scan

### Método 1: Script Simplificado (Sem ZAP)

Este script faz testes básicos sem precisar do ZAP instalado:

```bash
npm run zap-scan
```

Gera um relatório em `security/zap-report.html` com:
- Testes de endpoints
- Verificação de headers de segurança
- Recomendações básicas

### Método 2: Scan Completo com ZAP Desktop

1. **Inicie o ZAP Desktop**
   - Abra o OWASP ZAP
   - Aceite o certificado se solicitado

2. **Execute o scan automático**:
   ```powershell
   .\scripts\zap-scan.ps1
   ```

3. **Ou execute manualmente no ZAP Desktop**:
   - Menu: `File` → `New Session`
   - URL: `http://localhost:3000`
   - Clique em `Attack` → `Spider` para crawler
   - Clique em `Attack` → `Active Scan` para scan ativo
   - Exporte o relatório: `Report` → `Generate HTML Report`

### Método 3: Scan com Docker

```bash
# Scan rápido (baseline)
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000 -r security/zap-report.html

# Scan completo (pode demorar)
docker run -t owasp/zap2docker-stable zap-full-scan.py -t http://localhost:3000 -r security/zap-report.html
```

## Endpoints para Testar

Certifique-se de que estes endpoints estão acessíveis:

- `GET /health` - Health check
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/protected/profile` - Rota protegida (requer token)

## Interpretando o Relatório

O relatório ZAP mostrará:

- **Alto Risco**: Vulnerabilidades críticas que devem ser corrigidas imediatamente
- **Médio Risco**: Problemas que devem ser corrigidos
- **Baixo Risco**: Melhorias de segurança recomendadas
- **Informativo**: Informações sobre a aplicação

## Vulnerabilidades Comuns a Verificar

1. **Missing Security Headers**
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Strict-Transport-Security

2. **Authentication Issues**
   - Tokens JWT expostos
   - Falta de rate limiting
   - Senhas fracas

3. **Injection Attacks**
   - SQL Injection
   - XSS (Cross-Site Scripting)
   - Command Injection

4. **Sensitive Data Exposure**
   - Informações em logs
   - Dados em respostas de erro

## Solução de Problemas

### ZAP não encontra o servidor

```bash
# Verifique se o servidor está rodando
curl http://localhost:3000/health

# Se não estiver, inicie:
npm start
```

### Erro de conexão com ZAP

```bash
# Verifique se ZAP está rodando
curl http://localhost:8080

# Se usar Docker, verifique o container
docker ps | grep zap
```

### Relatório não gerado

- Verifique permissões de escrita no diretório `security/`
- Certifique-se de que o caminho está correto
- Verifique os logs do ZAP para erros

## Próximos Passos

Após o scan:

1. Revise o relatório em `security/zap-report.html`
2. Corrija vulnerabilidades de alto e médio risco
3. Implemente melhorias de segurança recomendadas
4. Execute o scan novamente para validar as correções
5. Integre o scan no CI/CD para testes contínuos

## Referências

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [ZAP API Documentation](https://www.zaproxy.org/docs/api/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
