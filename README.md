# 📺 OferTV — Digital Signage & TV de Ofertas PWA

> Sistema de sinalização digital, mídia indoor e geração automatizada de cartazes promocionais para varejo, supermercados, açougues e comércios em geral.

---

## 🌟 Visão Geral

O **OferTV** é uma plataforma moderna desenvolvida em **Next.js 16**, **React 19** e **Supabase**. O sistema opera em dois módulos complementares:

1. **Painel de Gestão & Estúdio (`/admin`)**: Permite criar cartazes promocionais via Canvas, realizar upload de imagens/vídeos com compressão WebP e gerenciar a programação de mídias e trilhas sonoras.
2. **TV Player PWA (`/tv`)**: Reprodutor em tela cheia otimizado para Smart TVs, TV Boxes (Android/Fire TV) e computadores, com transições dinâmicas, sincronização em tempo real e música de fundo independente.

---

## ✨ Funcionalidades Principais

### 🎨 Estúdio de Cartazes de Ofertas (Canvas Nativo)
* **Criação Rápida no Navegador**: Gere cartazes promocionais com foto do produto, selos de destaque, preço "De / Por" e avisos de rodapé sem necessidade de ferramentas externas.
* **Temas Visuais de Varejo**:
  * *Supermercado* (Vermelho & Amarelo)
  * *Gourmet / Moderno* (Dark & Cyan)
  * *Açougue & Carnes* (Bordeaux & Dourado)
  * *Hortifrúti* (Verde Natural)
  * *Black Friday* (Preto & Neon Gold)
* **Orientação de Tela**: Suporte para **16:9 (Horizontal / TV)** e **9:16 (Vertical / Totem)**.
* **Tipografia de Precisão**: Alinhamento milimétrico de prefixos monetários (`R$`), números e unidades de medida (`/kg`, `/un`).
* **Controle de Tempo**: Definição da duração de exibição (segundos) por cartaz diretamente no estúdio.

### 🖼️ Upload Otimizado & Auto-Crop
* **Compressão Automática no Cliente**: Imagens convertidas para `.webp` Full HD (1080p) a 85% de qualidade antes do upload, reduzindo o tamanho de arquivos em até 85%.
* **Auto-Crop**: Ajuste automático e corte proporcional centralizado para 16:9, 9:16 ou formato livre.
* **Suporte a Vídeos**: Reprodução nativa de vídeos em MP4 e WebM.

### 📻 Rádio Indoor & Trilha Sonora Multi-Streaming
* **Execução Contínua em Segundo Plano**: A trilha sonora toca ininterruptamente, sem reiniciar ou cortar durante a transição de slides.
* **Multi-Provedores Suportados**:
  * **YouTube & YouTube Music**: Links de vídeos individuais ou playlists completas.
  * **SoundCloud**: Faixas e álbuns via widget HTML5.
  * **Arquivos Locais**: Upload de arquivos MP3, WAV, OGG e AAC.
  * **Web Rádios**: Streaming direto via URLs HTTPS.

### 📺 Player de TV PWA de Alta Resiliência
* **Transições Visuais Configuráveis**: Efeitos animados via Framer Motion (`Fade / Dissolver`, `Slide / Deslizar`, `Zoom In / Aproximar` e `Flip 3D / Girar`).
* **Modo Tela Cheia Inteligente**:
  * Botão flutuante com *auto-hide* (desaparece após 3,5 segundos de inatividade).
  * Atalhos de teclado: `F` (Tela Cheia), `Espaço` (Pausar/Continuar), `M` (Silenciar/Ativar Áudio).
* **Barra de Progresso**: Indicador linear em tempo real da duração de cada oferta.
* **Resiliência Offline**: Detecção automática de status de conexão com indicação visual.

### ⚡ Tempo Real & Acesso Direto (Zero-Auth)
* **Supabase Realtime**: Atualizações instantâneas na TV via WebSockets assim que um item é adicionado, reordenado ou excluído no painel administrativo.
* **Modo Sem Fricção**: Operação imediata sem telas de login, compatível com a nova `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Framework Web** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Biblioteca de UI** | [React 19](https://react.dev/) |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Animações** | [Framer Motion](https://www.framer.com/motion/) |
| **Ícones** | [Lucide React](https://lucide.dev/) |
| **Backend & Realtime** | [Supabase (PostgreSQL & Realtime)](https://supabase.com/) |
| **Armazenamento de Mídia** | [Supabase Storage](https://supabase.com/docs/guides/storage) |
| **PWA** | [@ducanh2912/next-pwa](https://github.com/DuCanhDe/next-pwa) |

---

## 📂 Estrutura de Pastas

```text
ofertv/
├── public/
│   ├── icone.jpg             # Ícone do PWA
│   └── ...                   # SVGs e ativos estáticos
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx      # Rota do Painel Administrativo
│   │   ├── tv/
│   │   │   └── page.tsx      # Rota do Player TV
│   │   ├── globals.css       # Estilos globais e Tailwind v4
│   │   ├── layout.tsx        # Layout raiz e metadados
│   │   ├── manifest.ts       # Configuração do Manifesto PWA
│   │   └── page.tsx          # Redirecionamento inicial
│   ├── components/
│   │   ├── AdminDashboard.tsx# Estúdio Canvas, Uploads e Rádio
│   │   └── TVPlayer.tsx      # Player de TV com transições e som
│   └── lib/
│       └── supabaseClient.ts # Cliente Supabase e parsers de áudio
├── next.config.ts            # Configurações do Next.js e PWA
├── package.json              # Dependências do projeto
├── supabase_schema.sql       # Script SQL do banco e Storage
└── tsconfig.json             # Configurações TypeScript

```

---

## 🚀 Como Executar o Projeto

### 1. Clonar o Repositório

```bash
git clone [https://github.com/faelscarpato/ofertv.git](https://github.com/faelscarpato/ofertv.git)
cd ofertv

```

### 2. Instalar Dependências

```bash
npm install

```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_aqui

```

### 4. Configurar o Banco de Dados e Storage (Supabase)

Acesse o **SQL Editor** no painel do Supabase e execute o script `supabase_schema.sql` para criar as tabelas `media` e `audios`, habilitar a publicação Realtime e configurar o bucket `ofertv-media`.

### 5. Executar em Ambiente de Desenvolvimento

```bash
npm run dev

```

Abra o navegador nos seguintes endereços:

* **Painel Administrativo**: [http://localhost:3000/admin](http://localhost:3000/admin)
* **Player da TV**: [http://localhost:3000/tv](http://localhost:3000/tv)

### 6. Build de Produção (Exportação Estática)

```bash
npm run build

```

---

## 🎮 Atalhos do Player TV

| Tecla | Ação |
| --- | --- |
| F | Alternar Modo Tela Cheia (*Fullscreen*) |
| Espaço | Pausar / Continuar rotação de slides |
| M | Ativar / Silenciar música de fundo (*Mute*) |

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo de licença para mais detalhes.

Desenvolvido por [Rafael Scarpato](https://github.com/faelscarpato).