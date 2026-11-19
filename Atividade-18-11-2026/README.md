# Atividade 18/11/2026 — Gerenciador de Tarefas: Leitura, Análise e Evolução

**Disciplina:** Desenvolvimento de Sistemas Web · Prof. Alexandre Bendlin
**Estudante:** João Vitor da Silva

Objetivo da atividade: preparar para o ENADE com leitura de código real, depuração e evolução incremental do front-end React + TypeScript que está na pasta [`web/`](../web).

| Etapa | O que foi feito | Onde |
|:-:|---|---|
| 0 | Setup e exploração | [`COMO_RODAR.md`](../COMO_RODAR.md) |
| 1 | Questionário de leitura dirigida (11 perguntas) | [abaixo](#etapa-1--leitura-dirigida--questionário) |
| 2 | Caça ao bug (3 bugs) | [abaixo](#etapa-2--caça-ao-bug) · branch `bugs-inserted` |
| 3 | Feature nova: filtro por prioridade | [`web/src/Tarefas.tsx`](../web/src/Tarefas.tsx) |
| 4 | Reflexão escrita (discursiva) | [abaixo](#etapa-4--reflexão-escrita) |

---

## Etapa 0 — Setup

```bash
# Terminal 1 — API (raiz do repositório)
npm install
npm run dev            # http://localhost:3000

# Terminal 2 — Front (pasta web)
cd web
npm install
npm run dev            # http://localhost:5173
```

Roteiro de teste: criar conta → login → adicionar 3 tarefas (uma de cada prioridade) → concluir uma → buscar → excluir uma.

---

## Etapa 1 — Leitura dirigida + questionário

### App.tsx

**1. Por que `useState` recebe `() => getUsuario()` (função) e não `getUsuario()` (valor)?**

Porque é um *lazy initializer*. Passando a função, o React só a executa **na primeira renderização**. Com `useState(getUsuario())` a chamada aconteceria em **todo** re-render (ler o `localStorage`, dividir o token, `atob` e `JSON.parse`), e o resultado seria jogado fora, já que o estado só usa o valor inicial uma vez. É desperdício de processamento.

**2. `logado = usuario !== null` é um estado ou uma derivação? Por que não guardar `logado` separado?**

É uma **derivação**: um valor calculado a partir de um estado que já existe. Guardar `logado` em outro `useState` criaria duas fontes da verdade que precisariam ser atualizadas juntas. Bastaria esquecer um `setLogado` para a tela mostrar "logado" com `usuario === null` (ou o contrário). Regra: se dá para calcular, não é estado.

**3. Onde o token é apagado? Por que não apagar dentro do `Tarefas.tsx`?**

Na função `sair()` do `App.tsx`, que chama `apagarToken()` e `setUsuario(null)`. O `App` é o **dono** do estado `usuario` e decide qual tela aparece. Se o `Tarefas` apagasse o token sozinho, o `App` continuaria com `usuario` preenchido e a tela de tarefas continuaria aberta, sem token, e toda requisição daria 401. Por isso o `Tarefas` apenas **avisa** pela prop `onSair` (no botão "Sair" e quando a API responde 401), e quem muda o estado é o componente que é dono dele.

### api.ts

**4. `getUsuario()` decodifica o JWT no front. Isso valida o token? Justifique.**

**Não.** O JWT tem três partes (`header.payload.assinatura`) e o payload é só **base64**, que qualquer um decodifica. Validar significa conferir a **assinatura** com o `JWT_SECRET`, e esse segredo só existe no servidor (nunca pode ir para o navegador). Qualquer pessoa pode montar um token falso que o `getUsuario()` vai aceitar. Ele serve só para a interface (saber se há sessão e mostrar o e-mail). A segurança de verdade está no middleware `authenticate` do back, que usa `jwt.verify` em toda rota de tarefas.

**5. `tratarResposta` usa `res.text()` antes de `JSON.parse`. Por que não `res.json()` direto?**

Porque nem toda resposta tem JSON:

- uma resposta `204 No Content` ou com corpo vazio faz o `res.json()` lançar `SyntaxError` (`JSON.parse("")` dá erro);
- se o servidor cair e algo devolver uma página HTML de erro, o `res.json()` estoura com `Unexpected token '<'`.

Lendo como texto primeiro, o código consegue tratar o corpo vazio, tentar o `JSON.parse` dentro de um `try` e transformar qualquer falha em um `ErroApi` com mensagem amigável e com o `status` HTTP.

**6. `API_BASE` é `"http://localhost:3000"` em dev e `""` em prod. O que muda no `fetch`?**

- **Dev:** o front está em `localhost:5173` e a API em `localhost:3000`. O `fetch` usa a URL absoluta e a requisição é **cross-origin**, então o navegador aplica **CORS** (e faz um *preflight* `OPTIONS` por causa do `Authorization` e do `Content-Type: application/json`). Funciona porque o back tem `app.use(cors())`.
- **Prod:** o Express entrega o build (`web/dist`) e a API na **mesma origem**. Com `""`, o `fetch("/api/tasks")` é relativo ao domínio onde o site está. Não há CORS e o código funciona em qualquer domínio do deploy sem precisar escrever a URL no código.

### Tarefas.tsx

**7. Existem dois estados de busca (`busca` e `buscaAplicada`). Qual problema isso resolve?**

Separa **o que está sendo digitado** do **que foi pesquisado**. `busca` muda a cada tecla e mantém o input fluido. `buscaAplicada` só muda depois que a pessoa para de digitar por 400 ms (*debounce*), e é ela que dispara a chamada à API. Sem isso seriam várias requisições por palavra (uma por letra), com respostas para termos incompletos. Também permite mostrar "Nenhuma tarefa encontrada para X" com o termo que realmente foi buscado.

**8. O que é `requisicaoAtual` (um `useRef`) e por que não é `useState`?**

É um contador que identifica a requisição mais recente. Cada busca guarda o seu número, e quando a resposta chega ela só é aplicada se ainda for a mais nova. Isso evita a *race condition* de uma resposta antiga (lenta) chegar depois de uma nova e sobrescrever a lista.

É `useRef` porque:

- mudar o contador **não precisa redesenhar a tela** (um `useState` causaria re-render à toa);
- o `.then()` roda depois, e uma variável de estado capturada na *closure* estaria com o valor velho; o `ref.current` é sempre lido "ao vivo".

**9. `PRIORIDADES_PT` é `Record<Prioridade, string>`. Se o back adicionar `"urgent"`, o que acontece na compilação?**

Depende de o tipo do front ser atualizado, porque o TypeScript não enxerga o back:

- **Se só o back mudar:** nada acontece na compilação. Em execução, `PRIORIDADES_PT["urgent"]` e `COR_PRIORIDADE["urgent"]` dão `undefined` e a etiqueta aparece vazia e sem cor.
- **Quando alguém adicionar `"urgent"` em `PRIORIDADES` (e portanto no tipo `Prioridade`) no `api.ts`:** a compilação **quebra** em `PRIORIDADES_PT` e `COR_PRIORIDADE` com *"Property 'urgent' is missing"*. O `Record` obriga a ter uma entrada para cada valor do tipo. É o comportamento desejado: o compilador aponta todo lugar que precisa ser atualizado.

### Login.tsx

**10. `validar()` checa 6 caracteres só no registro. Se o back exigir 6 no login também, qual o impacto?**

O front deixaria passar uma senha curta, o back responderia `400` e a mensagem do servidor apareceria no alerta: só uma requisição a mais, sem quebrar nada. O impacto real seria **no back**: contas criadas antes da regra, com senha menor que 6, ficariam **trancadas para fora**, sem conseguir entrar nem trocar a senha. Por isso regra de formato de senha se aplica no cadastro (e na troca de senha), não no login. No login só importa se a senha confere com o hash.

**11. Por que registrar chama `login` em seguida em vez de apenas criar a conta?**

Porque o `/api/auth/register` **não devolve token**, só confirma o cadastro. Sem o login automático, a pessoa criaria a conta e teria que digitar e-mail e senha de novo na mesma tela. Chamando `login()` logo depois, o front recebe o JWT, salva no `localStorage` e já abre a lista de tarefas. Também reaproveita a mesma função de login, sem duplicar código.

> Para apresentar em grupo, escolhi: **4** (decodificar ≠ validar), **8** (useRef e race condition) e **6** (CORS em dev × mesma origem em prod).

---

## Etapa 2 — Caça ao bug

Os três bugs estão inseridos na branch **`bugs-inserted`**. Para ver exatamente o que mudou:

```bash
git fetch origin
git diff origin/atividade-18-11-front-react origin/bugs-inserted -- web/src
```

### Bug A — Race condition no debounce (`Tarefas.tsx`)

| | |
|---|---|
| **Inserção** | `setCarregando(true)` saiu de dentro do `setTimeout` e foi para antes do timer |
| **Sintoma** | A tela pisca "Carregando..." a cada tecla, e às vezes fica presa em "Carregando..." |
| **Causa** | O efeito do debounce roda a cada tecla. Com `setCarregando(true)` fora do timer, a lista some a cada letra, antes mesmo de existir uma busca. E se o *cleanup* cancelar o timer, a busca nunca acontece e ninguém volta o `carregando` para `false` |
| **Correção** | `setCarregando(true)` de volta para **dentro** do `setTimeout`, logo depois de `setBuscaAplicada(termo)`. O "carregando" só liga quando a busca vai mesmo acontecer |

```tsx
const timer = setTimeout(() => {
    setBuscaAplicada(termo);
    setCarregando(true);   // ✅ só quando a busca realmente vai para a API
}, ATRASO_BUSCA);
```

### Bug B — `alternarStatus` sem aguardar `atualizarTarefa` (`Tarefas.tsx`)

| | |
|---|---|
| **Inserção** | Removido o `await` de `atualizarTarefa(...)` |
| **Sintoma** | Clicar em "Concluir" não atualiza a lista; às vezes aparece erro silencioso no console |
| **Causa** | Sem `await`, `atualizada` é uma **Promise**, não a tarefa. O `map` troca a tarefa da lista por um objeto Promise (sem `titulo`, `status`...), e o item quebra na tela. Além disso, se a API falhar, a rejeição acontece fora do `try`, o `catch` nunca roda e vira *unhandled promise rejection* |
| **Correção** | Restaurar `await atualizarTarefa(...)`. O `await` garante a **ordem** (só atualiza a tela depois que o banco respondeu) e que o erro caia no `catch` |
| **Pista extra** | O `npm run dev` do Vite **não checa tipos**, então o bug roda. Já o `npm run build` (`tsc -b`) acusa: `Promise<Tarefa>` não é atribuível a `Tarefa`. A tipagem pega o bug antes de ir para produção |

### Bug C — `tratarResposta` quebra em 204 (`api.ts`)

| | |
|---|---|
| **Inserção** | Removida a checagem `if (res.status === 204 \|\| texto === "")` |
| **Sintoma** | Uma resposta com corpo vazio lança `SyntaxError: Unexpected end of JSON input` |
| **Causa** | `JSON.parse("")` **lança erro** (não retorna `null` nem `undefined`). Sem a checagem, todo corpo vazio vai para o `JSON.parse` e cai no `catch` como "O servidor respondeu algo que não é JSON" |
| **Correção** | Restaurar a checagem de 204 / corpo vazio antes do `JSON.parse` |

> **Observação:** no nosso `server.ts` o `DELETE` responde `200` com `{ "message": "..." }`, então a exclusão em si continua funcionando mesmo com o Bug C. O defeito aparece em qualquer rota que responda `204` ou corpo vazio, por exemplo se o DELETE for trocado para o mais comum em APIs REST: `res.status(204).end()`. É um *edge case*: o código parece funcionar até alguém mudar o back.

### O que os três bugs têm em comum

- **A e B** são falhas de código **assíncrono**: a ordem em que as coisas acontecem não é a ordem em que estão escritas.
- **A** mostra a importância do *cleanup* (`return () => clearTimeout(timer)`) e de ligar um estado só quando o trabalho realmente começa.
- **C** é um *edge case*: o caminho feliz funciona e o erro só aparece com uma resposta diferente da esperada.

---

## Etapa 3 — Feature nova: filtro por prioridade

Implementado em [`web/src/Tarefas.tsx`](../web/src/Tarefas.tsx) seguindo o passo a passo:

1. **Estado novo:** `type FiltroPrioridade = "todas" | Prioridade` e `useState<FiltroPrioridade>("todas")`.
2. **Derivação com `useMemo`:** `tarefasFiltradas` recalcula só quando `tarefas` ou `filtroPrioridade` mudam.
3. **UI:** chips "Todas / Baixa / Média / Alta" acima da lista, reaproveitando `PRIORIDADES` e `PRIORIDADES_PT`, com `role="group"` e `aria-pressed` para acessibilidade.
4. A lista usa `tarefasFiltradas.map(...)`.
5. **Extra:** contador "*X de Y · Z concluída(s)*" e mensagem própria quando nenhuma tarefa tem a prioridade escolhida.

O filtro é **local**: nenhuma chamada nova à API. Ele combina com a busca textual porque a busca define `tarefas` (vem do servidor) e o filtro age em cima dela.

Testado: tarefas das três prioridades → clique em cada chip → "Alta" + busca "bug" → volta para "Todas".

**Ponto ENADE — por que `useMemo` e não `useEffect` + `setState`?**

Porque a lista filtrada é uma **derivação**, não uma **sincronização** com algo externo.

- `useEffect` + `setState` renderizaria **duas vezes** (primeiro com a lista velha, depois com a filtrada), teria um segundo estado que pode ficar dessincronizado e misturaria a lógica com efeitos colaterais.
- `useMemo` calcula o valor **durante a própria renderização**, sempre consistente com `tarefas` e `filtroPrioridade`, e só refaz o cálculo quando uma das dependências muda.

`useEffect` é para falar com o mundo de fora do React (API, timer, `localStorage`). Para calcular um valor a partir de outros, usa-se derivação (com `useMemo` quando o cálculo pesa).

---

## Etapa 4 — Reflexão escrita

> *"O arquivo `api.ts` centraliza todas as chamadas HTTP. Cite três vantagens arquiteturais dessa decisão e um risco se a aplicação crescer muito. Em seguida, proponha uma melhoria (padrão ou biblioteca) que mitigue esse risco, justificando com conceitos de separation of concerns e testability."*

**Vantagens**

1. **Ponto único de mudança:** a URL da API (`API_BASE`), o cabeçalho `Authorization` e o formato de erro ficam em um só lugar. Trocar o domínio ou o jeito de autenticar mexe em um arquivo, não em todos os componentes.
2. **Tratamento de erro padronizado:** toda resposta passa pelo `tratarResposta`, então 204, corpo vazio, HTML inesperado e erros 4xx/5xx viram sempre um `ErroApi` com `status`. Os componentes só precisam de `try/catch` e de checar `status === 401`.
3. **Separação de responsabilidades e tipagem:** os componentes cuidam da tela e chamam funções com nome de negócio (`listarTarefas`, `criarTarefa`), sem conhecer `fetch`, rotas ou JSON. Os tipos (`Tarefa`, `Prioridade`) ficam definidos em um lugar e são reaproveitados.

**Risco**

Com o crescimento, o `api.ts` vira um **"arquivo deus"**: centenas de funções de domínios diferentes (tarefas, usuários, relatórios...), conflitos de merge constantes e acoplamento alto. Pior: cache, *loading*, nova tentativa e cancelamento continuam espalhados nos componentes com `useState` + `useEffect` (como o `requisicaoAtual` do `Tarefas.tsx`), e cada tela reinventa a mesma lógica. Testar um componente também exige simular o `fetch` global.

**Melhoria proposta**

Dividir em **camadas**:

- um **cliente HTTP** pequeno (`http.ts`, só `requisitar` e `tratarResposta`);
- **módulos por domínio** (`tarefasApi.ts`, `authApi.ts`), no padrão *Repository/Service*;
- **TanStack Query** (React Query) para o estado do servidor: `useQuery(["tarefas", busca], ...)` e `useMutation(...)`.

**Justificativa**

- **Separation of concerns:** transporte HTTP, regras de cada domínio e estado da interface ficam em camadas diferentes. O React Query assume cache, *loading*, nova tentativa, cancelamento e descarte de respostas velhas, coisas que hoje o componente faz na mão com `requisicaoAtual` e `carregando`.
- **Testability:** cada módulo de domínio recebe o cliente HTTP e pode ser testado sozinho com um cliente falso (ou com **MSW**, que intercepta as requisições). Os componentes são testados com um `QueryClient` de teste, sem depender do servidor nem de simular o `fetch` global.
