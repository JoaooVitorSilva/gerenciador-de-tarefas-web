[← Semana anterior](09%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário) · [Próxima semana →](23%20de%20setembro%20de%202026.md)

# Aula 05 — Segurança das rotas de escrita (16/09/2026)

## O que eu aprendi
Sobre arquitetura: as funções auxiliares (helpers) ficam no início do arquivo, e as rotas apenas as chamam. Gostei muito dessa organização, porque, se for preciso alterar uma URL ou uma rota, a mudança fica concentrada em um só lugar.
Também aprendi a separar os erros 400 e 500 dentro do `catch`. Quando o problema é de validação, a mensagem é devolvida ao cliente; quando é do banco, a resposta é uma mensagem genérica, sem revelar nada sobre a estrutura das tabelas.

## Principal dificuldade
Tive dois problemas. Primeiro, a rota PATCH ficou sem toda a parte inicial, e o código quebrado impedia o servidor de rodar. Segundo, restou um trecho da versão antiga do PUT solto fora de qualquer rota, usando variáveis que já não existiam naquele escopo.

## Como eu resolvi
Comparei o arquivo com a versão que eu tinha localmente, encontrei o trecho que estava faltando e o recoloquei no lugar. Depois removi o pedaço antigo do PUT que tinha sobrado.

## Observações (opcional)
Nada a acrescentar nesta semana.

---

[← Semana anterior](09%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário) · [Próxima semana →](23%20de%20setembro%20de%202026.md)