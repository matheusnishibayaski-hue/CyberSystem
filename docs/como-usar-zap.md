# 🔒 Como Usar o OWASP ZAP com CyberSystem

## ✅ Você JÁ tem o OWASP ZAP instalado!

Ótimo! Agora você só precisa seguir estes passos simples:

## 📋 Passo a Passo

### 1️⃣ Abrir o OWASP ZAP Desktop

**Localize o ZAP no seu computador:**
- Menu Iniciar → Digite "ZAP" ou "OWASP"
- Ou procure em: `C:\Program Files\ZAP\Zed Attack Proxy\`

**Abra o programa:**
- Clique duas vezes no ícone do ZAP
- Aguarde o programa iniciar (pode levar alguns segundos)

### 2️⃣ Configuração Inicial (primeira vez)

Quando o ZAP abrir, você verá algumas opções:

**Escolha: "No, I do not want to persist this session"**
- Esta é a opção mais simples para começar
- Clique em "Start"

**API Key (se solicitado):**
- Se o ZAP perguntar sobre API Key, escolha: **"Disable API Key"**
- Isso permite que o CyberSystem se conecte automaticamente

### 3️⃣ Deixar o ZAP Rodando

**IMPORTANTE:** 
- ✅ Deixe o ZAP **aberto** em segundo plano
- ✅ Não precisa fazer nada dentro do programa
- ✅ O programa precisa estar **minimizado ou em segundo plano**
- ✅ Você verá que ele está rodando na **porta 8080**

### 4️⃣ Executar o Scan no CyberSystem

Agora volte ao CyberSystem:

1. Acesse o **Dashboard**
2. Clique em **"[ ZAP FULL ]"** em "Security Actions"
3. Aguarde o scan completar
4. Veja o relatório completo em "Available Reports"

## 🎯 Verificação Rápida

Para verificar se o ZAP está rodando corretamente:

1. Abra seu navegador
2. Acesse: `http://localhost:8080`
3. Se ver a página do ZAP API, está funcionando! ✅

## ⚙️ Configurações Recomendadas

### Desabilitar API Key (Recomendado para uso local)

1. No ZAP, vá em: **Tools → Options**
2. No menu lateral, clique em: **API**
3. **Desmarque** a opção: "Enable API Key"
4. Clique em **OK**

Isso permite que o CyberSystem se conecte automaticamente.

### Porta Padrão

O ZAP usa a **porta 8080** por padrão. Se estiver usando outra porta:

1. Tools → Options → Local Proxies
2. Verifique qual porta está configurada
3. Se for diferente de 8080, você precisará ajustar no script

## 🔄 Fluxo de Trabalho Recomendado

```
┌─────────────────────────────┐
│  1. Abrir OWASP ZAP Desktop │
│     (deixar rodando)        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  2. Voltar ao CyberSystem   │
│     Dashboard               │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  3. Clicar "ZAP FULL"       │
│     (scan completo)         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  4. Aguardar scan           │
│     (alguns minutos)        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  5. Ver relatório completo  │
│     em "Available Reports"  │
└─────────────────────────────┘
```

## 🚨 Problemas Comuns

### "ZAP não encontrado"

**Solução:**
1. Certifique-se de que o ZAP está **aberto e rodando**
2. Verifique se pode acessar `http://localhost:8080` no navegador
3. Reinicie o ZAP se necessário

### "ZAP instalado mas não rodando"

**Você verá esta mensagem:**
```
[!] OWASP ZAP Desktop encontrado, mas NAO esta rodando!

COMO EXECUTAR O SCAN COMPLETO:
1. Abra o OWASP ZAP Desktop
2. Deixe o ZAP aberto em segundo plano
3. Execute o scan novamente
```

**Solução:** Simplesmente abra o ZAP Desktop!

### Scan demora muito

**Normal!** Scans completos podem levar:
- **ZAP Simple:** 1-2 minutos
- **ZAP Full:** 5-15 minutos (dependendo do tamanho do site)

**Dica:** Use "ZAP SIMPLE" para testes rápidos no dia a dia.

## 💡 Dicas Pro

### 1. Scan Manual no ZAP

Se preferir fazer scan manualmente no ZAP:

1. No ZAP, vá em: **Quick Start**
2. Digite a URL: `http://localhost:3000`
3. Clique em: **Attack**
4. Após completar, exporte: **Report → Generate HTML Report**

### 2. Salvar Configurações

Para não configurar toda vez:

1. Tools → Options
2. Configure como preferir
3. O ZAP salva automaticamente

### 3. Usar Docker (Alternativa)

Se preferir usar Docker em vez do Desktop:

```bash
docker run -d -p 8080:8080 owasp/zap2docker-stable zap.sh -daemon -config api.disablekey=true
```

Depois execute os scans normalmente pelo CyberSystem.

## 📚 Mais Informações

- **Documentação Oficial:** https://www.zaproxy.org/docs/
- **Vídeos Tutoriais:** https://www.youtube.com/zaproxy
- **Fórum da Comunidade:** https://groups.google.com/group/zaproxy-users

## ✅ Checklist de Uso

- [ ] OWASP ZAP instalado
- [ ] ZAP aberto e rodando
- [ ] Porta 8080 acessível (`http://localhost:8080`)
- [ ] API Key desabilitada (opcional, mas recomendado)
- [ ] CyberSystem consegue se conectar ao ZAP
- [ ] Scans completos funcionando

---

**Pronto!** Agora você pode executar scans completos de segurança! 🎯🔒
