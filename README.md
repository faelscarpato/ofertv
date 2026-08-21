# 🛒 OferTV

OferTV é uma plataforma moderna de Digital Signage (Sinalização Digital) desenvolvida para gerenciar e reproduzir ofertas, vídeos e promoções em Smart TVs de supermercados e lojas.

Construído com tecnologias de ponta, o sistema opera 100% no navegador utilizando banco de dados em tempo real (Supabase), permitindo que qualquer alteração no painel de controle reflita instantaneamente nas telas da loja, sem a necessidade de recarregar a página.

---

## 🚀 Links Oficiais (Ao Vivo)

O sistema está configurado e publicado no Cloudflare Pages:

- 📺 **Painel da TV (Player):** [https://ofertv.pages.dev/tv](https://ofertv.pages.dev/tv)
  - *Abra este link diretamente no navegador da sua Smart TV. Ele conta com recurso de bloqueio de suspensão de tela (Wake Lock) e botões para o modo Totem (Rotação vertical).*
- ⚙️ **Painel de Gestão (Admin):** [https://ofertv.pages.dev/admin](https://ofertv.pages.dev/admin)
  - *Acesse pelo computador ou celular para fazer upload de novas fotos, vídeos, alterar o tempo de reprodução ou organizar as mídias. As atualizações aparecem ao vivo na TV!*

---

## ✨ Funcionalidades Principais

- **Realtime Sync:** Modificações na fila do painel Admin são refletidas imediatamente no Player (Powered by Supabase WebSockets).
- **Progressive Web App (PWA):** Instalável no Windows, Android e iOS diretamente pelo navegador, comportando-se como um aplicativo nativo e independente.
- **Upload Dinâmico:** Suporte nativo para upload de arquivos de imagem e vídeo ou a opção clássica de inserir via Link URL.
- **Modo Totem:** O player permite rotacionar a tela (0º, 90º, 180º, 270º) para uso em TVs instaladas na vertical, mantendo o background dinâmico perfeitamente posicionado.
- **Glassmorphism Premium:** Interface administrativa desenvolvida com um design sofisticado (Dark Mode profundo, acentos Neon) utilizando Tailwind CSS v4.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js 15+ (App Router), React, TypeScript
- **Estilização:** Tailwind CSS v4, Lucide Icons
- **Backend & Storage:** Supabase (Database, Storage e Realtime API)
- **Hospedagem:** Cloudflare Pages (via Static HTML Export)

---

## 💻 Como Rodar Localmente (Desenvolvedores)

Se você deseja modificar o código fonte, siga os passos:

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão 18.18 ou superior)
- Conta no [Supabase](https://supabase.com/)

### 2. Preparando o Supabase
Crie um projeto no Supabase e rode os scripts SQL:

```sql
-- Criar a tabela 'media'
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
    duration INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desativar RLS para este protótipo funcionar sem login
ALTER TABLE media DISABLE ROW LEVEL SECURITY;
```
*Observação: Lembre-se de criar também um Bucket Público chamado `ofertv-media` e criar uma política (Policy) liberando permissões (SELECT/INSERT/DELETE) nele.*

### 3. Rodando o Projeto

Crie um arquivo `.env.local` na raiz e insira as suas chaves do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

Instale e inicie:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` no seu navegador e comece a desenvolver!
