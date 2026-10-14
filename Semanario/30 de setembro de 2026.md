[← Semana anterior](23%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário)

# Aula 07 — Protegendo rotas com JWT e isolamento de usuários (30/09/2026)

## O que eu aprendi
Autenticação e autorização não são a mesma coisa. Autenticar é identificar quem é o usuário, por meio do token gerado no login. Autorizar é garantir que ele só acesse e altere aquilo que pertence a ele.
Também aprendi o que é um middleware: uma função no formato `(req, res, next)` executada antes da rota. Se ela chama `next()`, a requisição continua; se responde com 401, a rota nem chega a ser executada. Com isso, a checagem do token fica concentrada em um único ponto, sem precisar repeti-la em cada rota.

## Principal dificuldade
Depois de seguir a apostila, o servidor não iniciava e mostrava este erro:

    The requested module 'express' does not provide an export named 'NextFunction'

O `tsc` também apontava problemas com os tipos importados do Express.

## Como eu resolvi
O problema é que `Request`, `Response` e `NextFunction` são apenas tipos, e não valores exportados pelo Express. Bastou importar os três marcando-os como tipo:

    import express, { type Request, type Response, type NextFunction } from "express";

## Observações (opcional)
Fiz o teste com dois usuários: nenhum deles consegue visualizar, editar ou excluir as tarefas do outro, e qualquer requisição sem token recebe 401.

---

[← Semana anterior](23%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário)