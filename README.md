<div align="center">

# Gerenciador de Tarefas Multi-Usuário

**Disciplina de Desenvolvimento de Sistemas Web**

API REST para gerenciamento de tarefas com autenticação, banco de dados em nuvem (Turso / libSQL) e front-end estilizado com Tailwind CSS.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Turso](https://img.shields.io/badge/Turso_libSQL-4FF8D2?style=for-the-badge&logo=turso&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Estudante:** João Vitor da Silva

[Objetivo](#objetivo) •
[Como rodar](#como-rodar) •
[Endpoints](#endpoints-da-api) •
[Estrutura](#estrutura-do-projeto) •
[Diário de aulas](#diário-de-aulas) •
[Semanário](#semanário)

</div>

---

## Objetivo

Desenvolver um **gerenciador de tarefas completo e multi-usuário**, persistindo os dados em **SQLite na nuvem (Turso)** para sobreviver aos discos efêmeros dos servidores de deploy, aplicando boas práticas de segurança: validação de entradas, consultas parametrizadas, tratamento de erros sem vazamento de informações e autenticação com **bcrypt + JWT**.

## Funcionalidades

| | Recurso | Descrição |
|:-:|---|---|
| ▸ | **CRUD de tarefas** | Criar, listar, buscar, atualizar (total e parcial) e excluir tarefas |
| ▸ | **Busca por título** | `GET /api/tasks?search=termo` com proteção contra SQL Injection |
| ▸ | **Validação centralizada** | Helpers (`tituloValido`, `normalizarPrioridade`, `parsearId`...) reutilizados por todas as rotas |
| ▸ | **Registro e login** | Senhas guardadas como hash (bcrypt) e login que devolve um token JWT válido por 8h |
| ▸ | **Rotas protegidas** | Todas as rotas de tarefas exigem o token JWT (middleware `authenticate`) |
| ▸ | **Isolamento de usuários** | Cada usuário só vê e altera as próprias tarefas (`usuario_id`) |
| ▸ | **Banco em nuvem** | `@libsql/client` conecta no Turso quando há credenciais no `.env`; sem elas, usa o arquivo local `tarefas.db` |
| ▸ | **Banner de inicialização** | O terminal mostra se o banco está na nuvem ou local, sem nunca imprimir o token |
| ▸ | **Health check real** | `/api/health` executa `SELECT 1` no banco e responde `503` se ele não responder |
| ▸ | **Proteção contra BOM** | Avisa no terminal quando o `.env` foi salvo em *UTF-8 with BOM* (armadilha do Windows) |
| ▸ | **Erros padronizados** | `400` validação · `401` credenciais/token · `404` não encontrado · `409` conflito · `500` erro interno genérico · `503` banco indisponível |

---

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) **20.12 ou superior** (por causa do `process.loadEnvFile`)
- Conta gratuita no [Turso](https://turso.tech) (opcional: sem ela o projeto roda com banco local)
- Extensão [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) no VS Code (para os testes)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/JoaooVitorSilva/gerenciador-de-tarefas-web.git
cd gerenciador-de-tarefas-web

# 2. Instale as dependências (rode na pasta onde está o package.json!)
npm install

# 3. Crie o .env a partir do modelo e preencha com as credenciais do Turso
copy .env.example .env      # Windows (no Linux/macOS: cp .env.example .env)

# 4. Suba o servidor em modo desenvolvimento (reinicia ao salvar)
npm run dev
```

O servidor sobe em **http://localhost:3000** e as tabelas e o usuário `admin@senai.com` (senha `senha_super_secreta_123`) são criados automaticamente.

O banner no terminal mostra onde os dados estão sendo salvos:

```text
============================================================
  Banco de dados
------------------------------------------------------------
  Modo  : Turso / libSQL (nuvem)
  Onde  : libsql://seu-banco.turso.io
  Token : presente (nunca será mostrado)
============================================================
```

Sem `.env`, o modo exibido é `arquivo local (SQLite)` e os dados vão para `tarefas.db`.

### Configurando o Turso

1. Entre em [turso.tech](https://turso.tech) com a conta do GitHub e clique em **Create Database**.
2. Copie a **Database URL** (`libsql://...turso.io`, **sem barra no final**).
3. Clique em **Create Token** (leitura e escrita) e copie o token **inteiro** com o botão de copiar.
4. Cole os dois valores no `.env` e salve em **UTF-8** (no VS Code, confira o rodapé: não pode ser *UTF-8 with BOM*).

> [!WARNING]
> O `.env` e o `tarefas.db` estão no `.gitignore` e **nunca** devem ir para o GitHub. Só o `.env.example` é versionado.

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor com *hot reload* (`tsx watch`) |
| `npm start` | Inicia o servidor sem *watch* |
| `npm run build` | Checagem de tipos com o TypeScript (`tsc`) |

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `TURSO_URL` | — | URL do banco no Turso (`libsql://...`). Sem ela, usa o arquivo local |
| `TURSO_TOKEN` | — | Token de acesso ao banco no Turso |
| `PORT` | `3000` | Porta do servidor |
| `JWT_SECRET` | `super_secreto_desenvolvimento` | Chave de assinatura dos tokens — **troque em produção!** |

---

## Endpoints da API

### Diagnóstico

| Método | Rota | Descrição |
|:-:|---|---|
| ![GET](https://img.shields.io/badge/GET-2ea44f?style=flat-square) | `/` | Entrega o front-end (`web/dist`) ou avisa que o build não existe |
| ![GET](https://img.shields.io/badge/GET-2ea44f?style=flat-square) | `/api/health` | Verifica servidor **e banco** (`SELECT 1`); responde `503` se o banco não responder |
| ![GET](https://img.shields.io/badge/GET-2ea44f?style=flat-square) | `/api/version` | Nome e versão do sistema |

### Autenticação

| Método | Rota | Corpo | Respostas |
|:-:|---|---|---|
| ![POST](https://img.shields.io/badge/POST-0969da?style=flat-square) | `/api/auth/register` | `{ "email", "senha" }` | `201` · `400` · `409` · `500` |
| ![POST](https://img.shields.io/badge/POST-0969da?style=flat-square) | `/api/auth/login` | `{ "email", "senha" }` | `200 { token }` · `400` · `401` · `500` |

> [!NOTE]
> O campo da senha pode ser enviado como `senha` (usado pelo front) ou `password` (usado no `request.http`).

### Tarefas

> [!IMPORTANT]
> Todas as rotas de tarefas exigem o cabeçalho `Authorization: Bearer <token>` (token gerado no login). Sem token, ou com token inválido/expirado, a resposta é `401`. Tarefas de outro usuário respondem `404`.

| Método | Rota | Corpo | Respostas |
|:-:|---|---|---|
| ![GET](https://img.shields.io/badge/GET-2ea44f?style=flat-square) | `/api/tasks?search=` | — | `200` · `401` · `500` |
| ![POST](https://img.shields.io/badge/POST-0969da?style=flat-square) | `/api/tasks` | `{ "titulo", "prioridade" }` | `201` · `400` · `401` · `500` |
| ![PUT](https://img.shields.io/badge/PUT-bf8700?style=flat-square) | `/api/tasks/:id` | `{ "titulo", "prioridade", "status" }` | `200` · `400` · `401` · `404` · `500` |
| ![PATCH](https://img.shields.io/badge/PATCH-8250df?style=flat-square) | `/api/tasks/:id` | qualquer campo acima | `200` · `400` · `401` · `404` · `500` |
| ![DELETE](https://img.shields.io/badge/DELETE-cf222e?style=flat-square) | `/api/tasks/:id` | — | `200` · `400` · `401` · `404` · `500` |

> [!NOTE]
> **Regras de validação**
> - `titulo`: texto com **pelo menos 3 caracteres** (espaços nas pontas são ignorados)
> - `prioridade`: `low` · `medium` · `high` (padrão: `medium`)
> - `status`: `pending` · `completed` (padrão: `pending`)
> - `senha`: **pelo menos 6 caracteres**
> - `email`: precisa conter `@`

### Testando com o REST Client

Os testes da Aula 09 estão em [`request.http`](request.http) e os cenários das aulas anteriores em [`requests.http`](requests.http). Para usar:

1. Crie um arquivo com extensão **`.http`** ou **`.rest`**
2. Separe cada requisição com **`###`** — sem isso o REST Client não reconhece as requisições
3. Use variáveis para facilitar a manutenção:

```http
@baseUrl = http://localhost:3000

### Listar todas as tarefas
GET {{baseUrl}}/api/tasks
```

> [!TIP]
> Cuidado com comentários colados logo abaixo da linha da requisição: o REST Client pode interpretá-los como *header* e o teste deixa de funcionar.

---

## Estrutura do projeto

```text
gerenciador-de-tarefas/
├── Aula-07-10-2026/        # Primeiro app React (Vite)
├── Semanario/              # Registros semanais de aprendizado
├── server.ts               # API Express + Turso/libSQL + autenticação
├── request.http            # Testes da Aula 09 (REST Client)
├── requests.http           # Cenários de teste das aulas anteriores
├── .env.example            # Modelo das variáveis do Turso (copie para .env)
├── index.html              # Front-end do gerenciador de tarefas
├── index.txt               # Código original da aula 1 (backup)
├── tailwindCSS.html        # Estudo das classes básicas do Tailwind
├── Desafio_aulas_3e4.html  # Desafio de estilização com Tailwind
├── tailwind.config.js      # Configuração do Tailwind
├── Dicas e Truques.txt     # Anotações rápidas (CSS → Tailwind)
├── package.json
└── tsconfig.json
```

---

## Diário de aulas

<details>
<summary><b>05/08/2026 — Aulas 3 e 4: Tailwind CSS</b></summary>

- **`tailwindCSS.html`** — projeto simples para aprender as funções básicas do Tailwind, estilizado apenas com classes utilitárias.
- **Desafio das aulas 3 e 4** — o professor forneceu o código do projeto e o desafio foi organizar toda a formatação usando classes Tailwind.
- **`index.txt`** — guarda o código original da aula 1. Como o Five Server lê apenas o `index.html`, o gerenciador de tarefas foi para esse arquivo para acompanhar o desenvolvimento em tempo real.

</details>

<details>
<summary><b>12/08/2026 — Aula 5: Configuração inicial do back-end</b></summary>

- Definição das dependências do projeto com Node.js.
- **`server.ts`** — configuração do `listen` do servidor, rotas `GET` de status e versão do sistema.
- Criação das rotas `GET`, `POST` e `DELETE` de tarefas.
- **`requests.http`** — arquivo para testar os endpoints com a extensão REST Client.
- Novo código no `index.html`: gerenciador de tarefas fornecido pelo professor.

</details>

<details>
<summary><b>19/08/2026 — Aula 6: Banco de dados</b></summary>

- Instalação dos pacotes do SQLite (`better-sqlite3`).
- Criação das tabelas `tarefas` e `usuarios`.
- Validação para, com o banco vazio, criar um usuário inicial e popular o banco.

</details>

<details>
<summary><b>26/08/2026 — Aula 7: PUT, PATCH e novo DELETE</b></summary>

- Criação do método de atualização completa (`PUT`) e parcial (`PATCH`) das tarefas.
- Novo `DELETE`, com novas validações de ID e retorno `404` quando a tarefa não existe.

</details>

<details>
<summary><b>04/11/2026 — Aula 09: Banco de dados em nuvem (Turso / libSQL)</b></summary>

- Troca do `better-sqlite3` pelo `@libsql/client`, que fala com o Turso via HTTP e mantém o arquivo local como *fallback*.
- **`.env`** com `TURSO_URL` e `TURSO_TOKEN`, carregado por `carregarEnv()` com detecção de BOM.
- Banner no terminal mostrando o modo do banco e o *health check* testando o banco de verdade.
- Criação das tabelas com `db.batch([...], "write")`, porque um único `execute()` ignora o segundo comando.
- Todas as consultas viraram assíncronas (`await db.execute({ sql, args })`) e o servidor só sobe depois de `await inicializarBanco()`.
- Tabelas atualizadas: `senha_hash`, `criado_em`, `descricao` e `atualizado_em`.

</details>

---

## Semanário

Reflexões semanais sobre o que foi aprendido, as dificuldades e como foram resolvidas.

| Data | Aula | Tema | Registro |
|:-:|:-:|---|:-:|
| 02/09 | 00 | Ambiente e primeiros passos | [abrir →](Semanario/02%20de%20setembro%20de%202026.md) |
| 09/09 | 01 | Começo da sanitização do código | [abrir →](Semanario/09%20de%20setembro%20de%202026.md) |
| 16/09 | 05 | Segurança das rotas de escrita | [abrir →](Semanario/16%20de%20setembro%20de%202026.md) |
| 23/09 | 06 | Autenticação (registro e login) | [abrir →](Semanario/23%20de%20setembro%20de%202026.md) |
| 30/09 | 07 | Rotas protegidas e isolamento de usuários | [abrir →](Semanario/30%20de%20setembro%20de%202026.md) |
| 07/10 | 06 | Introdução ao React (componentes) | [abrir →](Semanario/07%20de%20outubro%20de%202026.md) |
| 04/11 | 09 | Banco de dados em nuvem (Turso / libSQL) | [abrir →](Semanario/04%20de%20novembro%20de%202026.md) |

<details>
<summary><b>02/09 — Ambiente e primeiros passos</b></summary>

**» O que aprendi**
- Configurar o ambiente local direto pelo código, sem `git clone`: os arquivos foram criados na pasta do repositório copiando o que foi feito no Codespace.
- Com o `package.json` configurado, basta um `npm install` para montar todo o ambiente.
- Usar variáveis no `requests.http` deixa a criação e a manutenção dos testes mais fáceis.

**» Dificuldade** — Não tive dificuldade, mas um colega não conseguia executar o `npm install`.

**» Solução** — O comando estava sendo executado no diretório errado, então o npm não encontrava o `package.json` para instalar as dependências.

**» Observação** — Prefiro continuar no Codespace, onde o ambiente já estava configurado.

[Ler o registro completo →](Semanario/02%20de%20setembro%20de%202026.md)

</details>

<details>
<summary><b>09/09 — Começo da sanitização do código</b></summary>

**» O que aprendi**
- **Centralizar regras** facilita a manutenção: as prioridades, que eram reescritas em várias partes do código, viraram uma única constante.
- **Tratamento de erros**: já vi sistemas devolverem o erro inteiro do banco para o usuário, expondo as colunas das tabelas. Isso precisa ser evitado.

**» Dificuldade** — Entender por que dois novos testes passavam. Achei que não deveriam e que havia um erro no código, mas o novo desenho de `/api/tasks` foi feito justamente para que passassem.

**» Solução** — Investiguei o endpoint e a resposta estava nesta linha, em que os dois testes caíam na segunda parte da condição:

```ts
const search = typeof req.query.search === "string" ? req.query.search : "";
```

[Ler o registro completo →](Semanario/09%20de%20setembro%20de%202026.md)

</details>

<details>
<summary><b>16/09 — Segurança das rotas de escrita</b></summary>

**» O que aprendi**
- **Arquitetura**: os *helpers* ficam no topo do arquivo e as rotas só chamam eles. Assim, trocar uma regra ou rota fica bem mais fácil.
- **400 × 500 no `catch`**: erro de validação devolve a mensagem para o cliente; erro de banco devolve uma mensagem genérica, sem vazar a estrutura das tabelas.

**» Dificuldade** — A rota `PATCH` ficou sem o começo e o código não rodava. Além disso, sobrou um pedaço da versão antiga do `PUT` fora de qualquer rota, usando variáveis que não existiam mais naquele escopo.

**» Solução** — Comparando o arquivo com a versão local, encontrei a parte que faltava e corrigi.

[Ler o registro completo →](Semanario/16%20de%20setembro%20de%202026.md)

</details>

<details>
<summary><b>23/09 — Autenticação e segurança (registro e login)</b></summary>

**» O que aprendi**
- Boas práticas no tratamento de login e senha: controlar e validar os dados que entram no sistema.
- **Token (JWT)**: o usuário realiza suas operações sem precisar provar a autenticação a todo momento.
- **Hash de senha**: senhas nunca ficam em texto plano. Mesmo que o banco vaze, o hash não permite recuperar a senha original.

**» Dificuldade** — O desafio da semana foi tranquilo.

**» Solução** — Ao copiar os testes para o `requests.http`, um comentário ficou no lugar de *header* e o teste não rodava. Bastou mover a linha para o lugar certo.

**» Observação** — O uso de token é bem interessante; quero estudar mais por fora para entender os detalhes.

[Ler o registro completo →](Semanario/23%20de%20setembro%20de%202026.md)

</details>

<details>
<summary><b>30/09 — Protegendo rotas com JWT e isolamento de usuários</b></summary>

**» O que aprendi**
- **Autenticação × autorização**: autenticar é saber quem o usuário é (o token do login); autorizar é deixar ele mexer só no que é dele.
- **Middleware**: função `(req, res, next)` que roda antes da rota. Se chama `next()`, a requisição segue; se devolve `401`, a rota nem executa. A verificação do token fica em um lugar só.

**» Dificuldade** — Depois de aplicar a apostila, o servidor nem subia: `The requested module 'express' does not provide an export named 'NextFunction'`.

**» Solução** — Marcar os três imports como tipo:

```ts
import express, { type Request, type Response, type NextFunction } from "express";
```

**» Observação** — Testei com dois usuários: um não consegue ver, editar nem apagar a tarefa do outro, e sem token a resposta é sempre `401`.

[Ler o registro completo →](Semanario/30%20de%20setembro%20de%202026.md)

</details>

<details>
<summary><b>07/10 — Introdução ao React</b></summary>

**» O que aprendi** — Como funciona a componentização no React, que o `App` precisa retornar um único elemento raiz e como exportar componentes para usá-los em outros arquivos.

**» Dificuldade** — Nenhuma por enquanto, o conteúdo foi bem explicado.

**» Observação** — Um mesmo componente de botão executando três ações diferentes mostrou bem como componentes podem ser reaproveitados.

[Ler o registro completo →](Semanario/07%20de%20outubro%20de%202026.md)

</details>

<details>
<summary><b>04/11 — Banco de dados em nuvem (Turso / libSQL)</b></summary>

**» O que aprendi**
- **Disco efêmero**: na nuvem o contêiner é recriado a cada deploy e o `tarefas.db` some. Por isso o banco foi para o Turso.
- **Síncrono × assíncrono**: as consultas viraram `await db.execute(...)`; `changes` virou `rowsAffected` e `lastInsertRowid` precisa de `Number(...)`.
- **`db.batch()`**: executa vários comandos de forma atômica, enquanto um único `execute()` ignora o segundo em silêncio.

**» Dificuldade** — O guia dizia que o cadastro usa `password`, mas o TODO e o front usam `senha`.

**» Solução** — O servidor passou a aceitar os dois nomes. Também era preciso reiniciar o `npm run dev` depois de criar o `.env`, porque ele só é lido na inicialização.

[Ler o registro completo →](Semanario/04%20de%20novembro%20de%202026.md)

</details>

---

<details>
<summary><b>Dicas e truques — CSS → Tailwind</b></summary>

| CSS puro | Tailwind |
|---|---|
| `background-color` | `bg-` |
| `margin` | `m-` · `ml-` · `mr-` · `mt-` · `mb-` |
| `padding` | `p-` |
| `height` | `h-` |
| `width` | `w-` |

Referência: [documentação do Tailwind](https://tailwindcss.com/docs/background-color)

</details>

<div align="center">

Feito por **João Vitor da Silva**

</div>
