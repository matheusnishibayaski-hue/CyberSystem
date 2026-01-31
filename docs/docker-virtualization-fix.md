# Como Habilitar Virtualização para Docker Desktop

## ⚠️ Problema Detectado

O Docker Desktop está mostrando o erro: **"Virtualization support not detected"**

Isso significa que a virtualização precisa ser habilitada no seu sistema.

## 🔧 Solução: Habilitar Virtualização

### Opção 1: Habilitar no Windows (Mais Fácil)

1. **Abra o PowerShell como Administrador:**
   - Clique com botão direito no menu Iniciar
   - Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Execute os seguintes comandos:**
   ```powershell
   # Habilitar Hyper-V (se disponível)
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   
   # Ou habilitar apenas Virtual Machine Platform
   Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All
   ```

3. **Reinicie o computador**

4. **Após reiniciar, abra o Docker Desktop novamente**

### Opção 2: Habilitar no BIOS/UEFI

Se a Opção 1 não funcionar, você precisa habilitar no BIOS:

1. **Reinicie o computador**

2. **Entre no BIOS/UEFI:**
   - Durante a inicialização, pressione uma dessas teclas (depende do fabricante):
     - `F2`, `F10`, `F12`, `Del`, ou `Esc`
   - Ou no Windows 10/11:
     - Configurações → Atualização e Segurança → Recuperação → Reiniciar agora (Avançado)

3. **Procure por uma dessas opções:**
   - **Intel**: "Intel Virtualization Technology" ou "Intel VT-x"
   - **AMD**: "AMD-V" ou "SVM Mode"
   - **Geral**: "Virtualization", "Virtualization Technology", "VT-x", "SVM"

4. **Habilite a opção** (mude de Disabled para Enabled)

5. **Salve e saia** (geralmente F10)

6. **Reinicie o Windows**

7. **Abra o Docker Desktop novamente**

### Opção 3: Usar WSL2 (Alternativa Recomendada)

Como você já tem WSL2 instalado, pode usar Redis diretamente no WSL2 sem precisar do Docker Desktop:

```powershell
# Abra o WSL2
wsl

# Instale o Redis
sudo apt update
sudo apt install redis-server -y

# Inicie o Redis
sudo service redis-server start

# Verifique se está rodando
redis-cli ping
# Deve retornar: PONG

# Para iniciar automaticamente no futuro, adicione ao .bashrc:
echo "sudo service redis-server start" >> ~/.bashrc
```

**Vantagens:**
- ✅ Não precisa habilitar virtualização
- ✅ Mais leve que Docker Desktop
- ✅ Funciona imediatamente
- ✅ Redis nativo no Linux

## 🔍 Verificar se Virtualização Está Habilitada

Execute no PowerShell:

```powershell
systeminfo | Select-String -Pattern "Hyper-V"
```

Ou:

```powershell
Get-ComputerInfo | Select-Object HyperV*
```

## 📝 Configuração do .env

Independente da opção escolhida, configure no arquivo `.env`:

```env
REDIS_URL=redis://localhost:6379
```

## ✅ Testar Redis

Após configurar, teste a conexão:

```powershell
# Se usando Docker:
docker ps --filter "name=redis"

# Se usando WSL2:
wsl redis-cli ping
```

## 🎯 Recomendação

**Para desenvolvimento rápido:** Use WSL2 (Opção 3) - é mais simples e não requer configurações adicionais.

**Para produção ou se precisar de Docker:** Habilite a virtualização (Opção 1 ou 2).
