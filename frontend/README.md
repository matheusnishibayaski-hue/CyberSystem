# CyberSystem Frontend

Frontend moderno do CyberSystem construído com React, Vite, Tailwind CSS e Framer Motion.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado e cache
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones
- **Recharts** - Gráficos

## 📦 Instalação

```bash
cd frontend
npm install
```

## 🛠️ Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`

## 📁 Estrutura

```
frontend/
├── src/
│   ├── api/          # Cliente HTTP e configurações
│   ├── components/   # Componentes React
│   │   ├── cyber/    # Componentes específicos do CyberSystem
│   │   └── ui/       # Componentes UI base (shadcn/ui style)
│   ├── lib/          # Utilitários e contextos
│   ├── pages/        # Páginas da aplicação
│   ├── App.jsx       # Componente principal
│   └── main.jsx      # Entry point
├── index.html
├── vite.config.js
└── tailwind.config.js
```

## 🔐 Autenticação

O frontend se integra com o backend Express através da API `/api/auth/login` e `/api/auth/register`.

O token JWT é armazenado no `localStorage` e enviado automaticamente nas requisições através do interceptor do Axios.

## 🎨 Design

O design utiliza:
- Tema dark moderno
- Gradientes e glassmorphism
- Animações suaves com Framer Motion
- Componentes baseados em shadcn/ui
- Responsivo e acessível

## 🔗 Integração com Backend

O frontend está configurado para se comunicar com o backend na porta 3000. Configure a variável de ambiente `VITE_API_URL` se necessário.
