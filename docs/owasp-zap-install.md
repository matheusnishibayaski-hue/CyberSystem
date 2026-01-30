# 🔒 Como Instalar o OWASP ZAP

## O que é OWASP ZAP?

O **OWASP ZAP** (Zed Attack Proxy) é uma ferramenta de segurança gratuita e open-source que ajuda a encontrar vulnerabilidades em aplicações web durante o desenvolvimento e testes.

## ⚠️ Problema Atual

Você está vendo esta mensagem porque o sistema tentou executar um **scan completo de segurança**, mas o OWASP ZAP não está instalado no seu computador.

**Não se preocupe!** O sistema executou automaticamente um **scan simplificado** que já fornece informações básicas de segurança.

## 📥 Como Instalar (Recomendado)

### Opção 1: OWASP ZAP Desktop (Mais Fácil)

1. **Baixe o instalador:**
   - Acesse: https://www.zaproxy.org/download/
   - Escolha a versão para **Windows**
   - Baixe o instalador `.exe`

2. **Instale:**
   - Execute o instalador baixado
   - Siga as instruções na tela
   - Aceite as configurações padrão

3. **Execute o ZAP:**
   - Após instalação, **mantenha o OWASP ZAP aberto** em segundo plano
   - Não precisa fazer nada dentro do programa
   - O sistema vai se conectar automaticamente

4. **Execute o scan novamente:**
   - Volte ao Dashboard do CyberSystem
   - Clique em **"ZAP FULL"** para executar o scan completo

### Opção 2: Docker (Para Usuários Avançados)

Se você tem Docker instalado:

```bash
# Executar ZAP em modo daemon
docker run -d -p 8080:8080 owasp/zap2docker-stable zap.sh -daemon -config api.disablekey=true

# Executar scan direto
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

### Opção 3: Python CLI (Para Desenvolvedores)

```bash
# Instalar zap-cli
python -m pip install --user zapcli

# Nota: Ainda requer OWASP ZAP Desktop instalado
```

## 🔍 Diferenças entre Scans

### Scan Simplificado (Atual)
✅ Não requer instalação  
✅ Testa endpoints básicos  
✅ Verifica headers de segurança  
❌ Não testa vulnerabilidades avançadas  
❌ Não faz testes de penetração  

### Scan Completo (com OWASP ZAP)
✅ Testa todos os endpoints  
✅ Verifica headers de segurança  
✅ Testa injeção SQL  
✅ Testa XSS (Cross-Site Scripting)  
✅ Testa CSRF  
✅ Testa autenticação e sessões  
✅ Muito mais completo!  

## 🎯 Recomendação

Para **desenvolvimento profissional** e **segurança robusta**, recomendamos:

1. ✅ Instalar OWASP ZAP Desktop
2. ✅ Executar scans completos regularmente
3. ✅ Corrigir todas as vulnerabilidades encontradas
4. ✅ Executar scan final antes de fazer deploy

## ❓ Precisa de Ajuda?

- **Documentação oficial:** https://www.zaproxy.org/docs/
- **Vídeos tutoriais:** https://www.youtube.com/results?search_query=owasp+zap+tutorial
- **Comunidade:** https://groups.google.com/group/zaproxy-users

## 📝 Notas

- O OWASP ZAP é **100% gratuito** e open-source
- É usado por milhares de empresas no mundo todo
- É mantido pela OWASP Foundation
- Instalação ocupa aproximadamente **200-300 MB**
- Funciona em Windows, Linux e macOS

---

**💡 Dica:** Enquanto não instala o ZAP, continue usando o scan simplificado para monitorar a segurança básica do seu sistema!
