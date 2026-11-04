# Aula 09 — Banco de Dados em Nuvem (Turso / libSQL) - 04/11/2026

## O que eu aprendi
Servidores de deploy em nuvem (Render, Railway, Fly.io) usam disco efêmero: a cada deploy ou reinício o contêiner é recriado e o arquivo `tarefas.db` some junto com todos os usuários e tarefas. Para resolver isso, trocamos o `better-sqlite3` pelo `@libsql/client`, que conversa com o Turso (SQLite gerenciado na nuvem) via HTTP e também funciona com arquivo local (`file:./tarefas.db`) quando não há credenciais.

## O que foi cada lacuna

| Lacuna | O que preenchi | Problema se ficasse vazia |
| --- | --- | --- |
| 1 | `import { createClient } from "@libsql/client"` | `createClient` não existiria e o servidor nem compilaria. |
| 2 | Função `carregarEnv()` que lê o `.env`, verifica os bytes `0xEF 0xBB 0xBF` (BOM) e chama `process.loadEnvFile` | As variáveis do `.env` nunca seriam carregadas, e um `.env` com BOM perderia a `TURSO_URL` sem nenhum aviso. |
| 3 | Constantes `TURSO_URL`, `TURSO_TOKEN`, `usandoNuvem` e `MODO_BANCO` | O código não saberia se deve usar a nuvem ou o arquivo local. |
| 4 | `const db = createClient({ url, authToken })` com fallback para `file:./tarefas.db` | Todas as rotas quebrariam com `db is not defined`. |
| 5 | Função `exibirBannerBanco()` mostrando modo, destino e se o token existe (sem imprimir o token) | O servidor funcionaria, mas eu não saberia onde os dados estão sendo salvos. |
| 6 | `SQL_USUARIOS` e `SQL_TAREFAS` com `CREATE TABLE IF NOT EXISTS` (colunas `senha_hash`, `usuario_id`, `atualizado_em`) | Não haveria tabelas: erro `no such table` em qualquer cadastro ou tarefa. |
| 7 | `async function inicializarBanco()` com `db.batch([...], "write")`, `ALTER TABLE` para `atualizado_em` e criação do admin | Tabelas e usuário admin não seriam criados; o login com `admin@senai.com` não funcionaria. |
| 8 | `primeiraLinha` e os helpers `buscarUsuarioPorEmail`, `buscarUsuarioPorId`, `inserirUsuario`, `listarTarefasDoUsuario`, `buscarTarefaPorIdEUsuario`, `deletarTarefaPorIdEUsuario` | As rotas de tarefas chamam esses helpers: dariam erro de função inexistente. |
| 9 | Rotas assíncronas `/api/health` (com `SELECT 1`), `/api/auth/register` e `/api/auth/login` (token de 8h) | Ninguém conseguiria se cadastrar nem fazer login, e o health check não testaria o banco. |
| 10 | 404 em JSON para `/api`, `express.static(FRONT_DIST)`, SPA fallback e `verificarFront()` | O front não seria servido e a chamada `verificarFront()` derrubaria o servidor na inicialização. |
| 11 | `async function iniciarServidor()` que faz `await inicializarBanco()` antes do `app.listen()` | O servidor nunca subiria (nenhum `listen`) ou aceitaria requisições antes das tabelas existirem. |

## Por que trocamos `better-sqlite3` por `@libsql/client`?
O `better-sqlite3` só sabe gravar em arquivo no disco local e é síncrono. Na nuvem esse disco é apagado a cada deploy. O `@libsql/client` manda o SQL pela rede para o Turso, então os dados ficam guardados fora do contêiner e sobrevivem aos reinícios.

## Diferença entre síncrono e assíncrono no banco
Antes, `stmt.get()` e `stmt.all()` travavam o Node até o disco responder. Agora toda consulta é `await db.execute({ sql, args })`, então todas as rotas viraram `async`. Também mudaram os nomes: `changes` virou `rowsAffected`, e `lastInsertRowid` vem como `bigint`, por isso uso `Number(...)`. O uso de `?` com `args` continua, o que mantém a proteção contra SQL Injection.

## Qual a importância do `db.batch()`?
No `@libsql/client`, passar dois comandos no mesmo `execute()` faz o segundo ser ignorado em silêncio (a tabela `tarefas` nunca seria criada). O `batch` executa cada comando separado e de forma atômica: se um falhar, tudo é desfeito.

## Principal dificuldade
O guia das lacunas fala que o cadastro usa `password`, mas o TODO e o front usam `senha`. Deixei o servidor aceitar os dois nomes para o `request.http` e a tela funcionarem.

## Observações (opcional)
Também corrigi a rota PATCH, que ficava sem resposta quando a tarefa não existia (agora devolve 404). O `.env` não vai para o Git; deixei um `.env.example` de modelo.
