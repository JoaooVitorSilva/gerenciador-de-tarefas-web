[← Semana anterior](02%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário) · [Próxima semana →](16%20de%20setembro%20de%202026.md)

# Aula 01 — Começo da sanitização do código (09/09/2026)

## O que eu aprendi
Centralizar valores deixa o código muito mais fácil de manter. Antes, a mesma informação aparecia declarada em vários pontos diferentes, com bastante repetição. As prioridades das tarefas, por exemplo, eram reescritas toda vez; agora ficam em uma única variável reaproveitada pelo código todo.
Outro ponto novo para mim foi o tratamento de erros. Já vi sistemas que, ao receber parâmetros inválidos, devolviam ao usuário o erro completo do banco de dados, expondo inclusive as colunas envolvidas naquela operação.

## Principal dificuldade
Entender por que os dois novos testes passavam. No começo achei que eles deveriam falhar e que havia algum erro no código, mas na verdade o novo formato do endpoint `/api/tasks` foi pensado justamente para que os dois passassem.

## Como eu resolvi
Fui direto ao código do endpoint `/api/tasks` para descobrir por que os testes retornavam a lista com os dados.
A explicação está neste trecho:

    const search = typeof req.query.search === "string" ? req.query.search : "";

Os dois testes caem na segunda parte da condição: como o `search` não é uma string, ele vira vazio e a lista completa é retornada.

## Observações (opcional)
Sem observações hoje.

---

[← Semana anterior](02%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário) · [Próxima semana →](16%20de%20setembro%20de%202026.md)