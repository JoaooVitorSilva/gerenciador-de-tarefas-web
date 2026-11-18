# Como rodar o Gerenciador de Tarefas

## Estrutura

```text
gerenciador-de-tarefas-web/
├── package.json     # Back-end (Express 5 + TypeScript + Turso/libSQL)
├── server.ts        # API + entrega do front (web/dist) em produção
├── .env             # TURSO_URL e TURSO_TOKEN (opcional; copie do .env.example)
└── web/             # Front-end (React + Vite + TypeScript + Tailwind)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx       # decide entre Login e Tarefas
        ├── api.ts        # todas as chamadas HTTP
        ├── Login.tsx     # login e cadastro
        └── Tarefas.tsx   # lista, busca, filtro por prioridade
```

## 1. Pré-requisitos

- **Node.js 20.12 ou superior** (o `server.ts` usa `process.loadEnvFile`)
- **npm 9 ou superior**

## 2. Variáveis de ambiente (opcional)

Sem `.env` o back usa o arquivo local `tarefas.db`, criado na primeira execução.
Para usar o Turso:

```bash
copy .env.example .env      # Windows (Linux/macOS: cp .env.example .env)
```

```env
TURSO_URL=libsql://seu-banco.turso.io
TURSO_TOKEN=seu-token-aqui
# Opcionais:
# PORT=3000
# JWT_SECRET=troque_esta_chave
```

> Salve o `.env` em **UTF-8 sem BOM**: com BOM a primeira variável é ignorada sem erro.

## 3. Instalar as dependências

```bash
# Back-end (raiz)
npm install

# Front-end
cd web
npm install
cd ..
```

## 4. Desenvolvimento (dois terminais)

**Terminal 1, back-end (raiz):**

```bash
npm run dev
```

- API em `http://localhost:3000/api/...`
- Teste rápido: `http://localhost:3000/api/health`

**Terminal 2, front-end:**

```bash
cd web
npm run dev          # ou, na raiz: npm run dev:web
```

- Front em **`http://localhost:5173`** (é esse que você abre no navegador)
- Em dev o `api.ts` chama `http://localhost:3000` direto (o back tem `cors()` ligado)

Usuário pronto para teste: `admin@senai.com` / `senha_super_secreta_123`.

## 5. Build para produção

```bash
npm run build
```

1. `npm --prefix web install`: garante as dependências do front
2. `npm run build:web`: `tsc -b && vite build` gera `web/dist/`
3. `tsc`: checagem de tipos do back

## 6. Rodar em produção

```bash
npm start
```

O Express entrega o front de `web/dist/` e a API na mesma porta: tudo em **`http://localhost:3000`**.
Rotas desconhecidas de `/api` respondem `404` em JSON; qualquer outro caminho devolve o `index.html` (SPA fallback).

## 7. Scripts (raiz)

| Script | O que faz |
|---|---|
| `npm run dev` | Back com *hot reload* (`tsx watch server.ts`) |
| `npm start` | Back sem watch (serve também o `web/dist`) |
| `npm run build` | Build completo (front + checagem do back) |
| `npm run build:web` | Só o build do front |
| `npm run dev:web` | Só o front em dev (Vite) |

## 8. Problemas comuns

| Problema | Solução |
|---|---|
| `tsx: not found` | Rode `npm install` na raiz |
| Porta 3000 ocupada | Defina `PORT` no `.env` ou encerre o processo |
| "Não foi possível falar com o servidor" | O back não está rodando: `npm run dev` na raiz |
| Abriu `localhost:3000` e apareceu "Ainda não existe o build" | Em dev use `localhost:5173`; para usar a 3000 rode `npm run build` antes |
| Aviso "build do front está VELHO" | Rode `npm run build:web` de novo |
| Turso responde 404 | URL sem barra no final e token completo |
