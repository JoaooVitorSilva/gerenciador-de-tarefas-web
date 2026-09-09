# Aula 00 — Ambiente e primeiros passos (02/09/2026)

## O que eu aprendi ✅
- Estruturei um back-end com Node.js + TypeScript, usando `tsx` para rodar o servidor sem precisar compilar manualmente (`npm run dev`).
- Criei uma API REST com Express (`server.ts`) para gerenciar tarefas, com rotas `GET`, `POST`, `PUT`, `PATCH` e `DELETE` em `/api/tasks`.
- Usei `better-sqlite3` para persistir os dados em um arquivo local (`tarefas.db`), incluindo criação de tabelas com `CREATE TABLE IF NOT EXISTS`.
- Aprendi a testar a API sem front-end, usando arquivos `.http` com a extensão REST Client do VS Code (`testes.http`).

## Principal dificuldade 🧩
- No primeiro commit (`first commit`), subi a pasta `node_modules/` e o arquivo `tarefas.db` inteiros para o repositório sem perceber.

## Como eu resolvi 🔧
- Criei um arquivo `.gitignore` (ignorando `node_modules/`, `dist/`, `*.db` e `.env`) e usei `git rm --cached` para remover esses arquivos do controle de versão sem apagá-los do disco. Entendi que `node_modules` é reconstruído pelo `npm install` a partir do `package-lock.json`, então não precisa (e não deve) ir para o Git.

## Observações (opcional) 💡
- O `server.ts` inicial já tem um usuário fake (`admin@senail.com`) inserido no banco só para fins de demonstração — quero entender melhor, nas próximas aulas, como isso se conecta com autenticação (Fase 02) e por que dados sensíveis não devem ficar hardcoded assim.
- Também notei que as rotas já usam Prepared Statements (`?`) nas queries SQL — quero entender melhor por que isso protege contra SQL Injection.
