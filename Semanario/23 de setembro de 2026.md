[← Semana anterior](16%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário) · [Próxima semana →](30%20de%20setembro%20de%202026.md)

# Aula 06 — Adicionando Autenticação e Segurança (Registro e Login) - 23/09/2026

## O que eu aprendi
Vi boas práticas para tratar os dados de login e senha. É essencial controlar o que entra no sistema, e as validações garantem que o usuário envie as informações no formato esperado.
Aprendi também a usar um token, que permite ao usuário fazer suas operações sem precisar se autenticar de novo a cada requisição. Além disso, as senhas nunca devem ser guardadas em texto puro: elas passam por um hash antes de ir para o banco, de modo que, mesmo em caso de vazamento, os dados não possam ser aproveitados.

## Principal dificuldade
O desafio desta semana foi tranquilo.

## Como eu resolvi
O único problema apareceu quando copiei os testes para o `requests.http`: um comentário ficou na posição errada e acabou sendo interpretado como header, o que impediu o teste de rodar. Bastou ajustar essa linha para tudo voltar a funcionar.

## Observações (opcional)
Achei o uso do token bem interessante, mas quero estudar o assunto por conta própria, porque o que fizemos em aula não entrou muito nos detalhes de como ele funciona.

---

[← Semana anterior](16%20de%20setembro%20de%202026.md) · [↑ Voltar ao README](../README.md#semanário) · [Próxima semana →](30%20de%20setembro%20de%202026.md)