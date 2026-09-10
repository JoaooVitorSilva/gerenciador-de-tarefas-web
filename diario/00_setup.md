# Aula 00 — Ambiente e primeiros passos (02/09/2026)

## O que eu aprendi ✅
- Back-end com Node.js + TypeScript (`tsx`, `npm run dev`) e API REST em Express (`server.ts`), com rotas `GET/POST/PUT/PATCH/DELETE` em `/api/tasks`.
- Persistência com `better-sqlite3` (`tarefas.db`), criando tabelas com `CREATE TABLE IF NOT EXISTS`.
- Testes de API sem front-end, usando arquivos `.http` com a extensão REST Client do VS Code.

## Principal dificuldade 🧩
- Subi `node_modules/` e `tarefas.db` sem perceber no primeiro commit.

## Como eu resolvi 🔧
- Criei `.gitignore` e usei `git rm --cached` para tirá-los do controle de versão sem apagar do disco.

## Observações (opcional) 💡
- Quero entender melhor como o usuário fake hardcoded se conecta com autenticação (Fase 02) e por que Prepared Statements (`?`) protegem contra SQL Injection.

# Aula 02 — Sanitização e segurança do servidor (09/09/2026)

## O que eu aprendi ✅
- Apliquei os 4 pilares de segurança: tipagem explícita, validação na entrada, Prepared Statements e erros controlados.
- Centralizei regras (`PRIORIDADES`, `STATUS_VALIDOS`) e criei helpers (`tituloValido`, `normalizarPrioridade`, `normalizarStatus`, `parsearId`) em vez de repetir validações nas rotas.
- Tirei o `as any` e o `db.exec()` com texto colado da inicialização do banco, trocando por Prepared Statements compilados uma única vez fora das rotas.
- Descobri a pegadinha do Express com arrays na query string (`?search=a&search=b` vira `['a','b']`; `?search[]=a&search[]=b` deixa `search` `undefined`) e corrigi com coerção seguro (`typeof req.query.search === "string"`).
- Troquei o erro detalhado (`erro.message`) por uma mensagem genérica no `catch`, pra não vazar a estrutura do banco.

## Principal dificuldade 🧩
- Entender que o código antigo falhava silenciosamente com arrays na URL, sem dar erro — só testando os dois formatos de ataque percebi a diferença de comportamento.
- Um comentário colado no `.http` quebrou de linha sem o `#`, e o REST Client interpretou como header inválido.

## Como eu resolvi 🔧
- Adicionei os testes 31 e 32 no `.http`, rodando antes/depois da proteção pra comparar o comportamento.
- Corrigi a quebra de linha dos comentários e consolidei os dois arquivos de teste (`testes.http` e `resquest.http`) em um só.

## Observações (opcional) 💡
- Sobraram Prepared Statements ainda não usados nas rotas de escrita — a faxina de POST/PUT/PATCH/DELETE fica pra próxima aula.
