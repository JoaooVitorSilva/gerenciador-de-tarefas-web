// ============================================================================
// api.ts — TODA conversa do front com o back passa por aqui.
//
// Os componentes (App, Login, Tarefas) nunca chamam fetch() direto: eles
// chamam funções como listarTarefas() ou login(). Assim a URL da API, o
// cabeçalho Authorization e o tratamento de erro ficam em um lugar só.
// ============================================================================

// ----------------------------------------------------------------------------
// Tipos compartilhados com o back-end (espelham as colunas da tabela tarefas)
// ----------------------------------------------------------------------------
export const PRIORIDADES = ["low", "medium", "high"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export type Status = "pending" | "completed";

export interface Tarefa {
    id: number;
    usuario_id: number;
    titulo: string;
    descricao: string | null;
    status: Status;
    prioridade: Prioridade;
    criado_em: string;
    atualizado_em: string | null;
}

export interface Usuario {
    id: number;
    email: string;
}

/** Campos que o PATCH aceita (todos opcionais). */
export type CamposTarefa = Partial<Pick<Tarefa, "titulo" | "prioridade" | "status">>;

// ----------------------------------------------------------------------------
// Endereço da API
// ----------------------------------------------------------------------------
// Em dev (npm run dev em web/) o front está em :5173 e a API em :3000, então
// precisamos da URL completa. Em produção o próprio Express entrega o front
// (web/dist), front e API estão na MESMA origem e basta o caminho "/api/...".
const API_BASE = import.meta.env.DEV ? "http://localhost:3000" : "";

const CHAVE_TOKEN = "token";

// ----------------------------------------------------------------------------
// Erro com o status HTTP junto, para a tela decidir o que fazer (ex.: 401)
// ----------------------------------------------------------------------------
export class ErroApi extends Error {
    readonly status: number;

    constructor(mensagem: string, status: number) {
        super(mensagem);
        this.name = "ErroApi";
        this.status = status;
    }
}

// ----------------------------------------------------------------------------
// Token (JWT) no localStorage
// ----------------------------------------------------------------------------
export function getToken(): string | null {
    return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token: string): void {
    localStorage.setItem(CHAVE_TOKEN, token);
}

export function apagarToken(): void {
    localStorage.removeItem(CHAVE_TOKEN);
}

/**
 * Lê o usuário de dentro do token, SEM falar com o servidor.
 *
 * Atenção: isto apenas DECODIFICA o JWT (base64), não VALIDA a assinatura —
 * quem valida é o back, no middleware authenticate. Serve só para a tela saber
 * se existe uma sessão e mostrar o e-mail. Se o token estiver vencido ou for
 * inválido, devolvemos null e a pessoa cai na tela de login.
 */
export function getUsuario(): Usuario | null {
    const token = getToken();
    if (!token) return null;

    try {
        const [, payloadBase64] = token.split(".");
        // JWT usa base64url: troca - e _ pelos caracteres do base64 comum
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join(""),
        );
        const payload = JSON.parse(json) as { id: number; email: string; exp?: number };

        // exp vem em SEGUNDOS; Date.now() em milissegundos
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            apagarToken();
            return null;
        }

        return { id: payload.id, email: payload.email };
    } catch {
        apagarToken();
        return null;
    }
}

// ----------------------------------------------------------------------------
// Núcleo: monta a requisição e trata a resposta
// ----------------------------------------------------------------------------

/**
 * Converte a resposta do fetch em dados ou em ErroApi.
 *
 * Lemos o corpo como TEXTO primeiro (e não res.json() direto) porque:
 *  - DELETE/204 pode vir com corpo vazio, e res.json() estoura SyntaxError;
 *  - se o servidor cair e um proxy devolver HTML, queremos uma mensagem
 *    amigável e não "Unexpected token '<'".
 */
async function tratarResposta<T>(res: Response): Promise<T> {
    const texto = await res.text();

    // Corpo vazio: não há o que fazer JSON.parse (JSON.parse("") lança erro)
    if (res.status === 204 || texto === "") {
        if (!res.ok) {
            throw new ErroApi(`Erro ${res.status} sem mensagem do servidor.`, res.status);
        }
        return undefined as T;
    }

    let dados: unknown;
    try {
        dados = JSON.parse(texto);
    } catch {
        throw new ErroApi("O servidor respondeu algo que não é JSON. A API está rodando?", res.status);
    }

    if (!res.ok) {
        const corpo = dados as { error?: string; message?: string };
        throw new ErroApi(corpo.error ?? corpo.message ?? `Erro ${res.status}.`, res.status);
    }

    return dados as T;
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
    const headers = new Headers(opcoes.headers);
    const token = getToken();

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (opcoes.body) headers.set("Content-Type", "application/json");

    let res: Response;
    try {
        res = await fetch(`${API_BASE}${caminho}`, { ...opcoes, headers });
    } catch {
        // fetch só rejeita quando nem chegou resposta (servidor desligado, CORS...)
        throw new ErroApi("Não foi possível falar com o servidor. Ele está ligado?", 0);
    }

    return tratarResposta<T>(res);
}

// ----------------------------------------------------------------------------
// Autenticação
// ----------------------------------------------------------------------------
export async function login(email: string, senha: string): Promise<Usuario> {
    const { token } = await requisitar<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
    });
    salvarToken(token);

    const usuario = getUsuario();
    if (!usuario) throw new ErroApi("O servidor devolveu um token inválido.", 500);
    return usuario;
}

export async function registrar(email: string, senha: string): Promise<void> {
    await requisitar("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
    });
}

// ----------------------------------------------------------------------------
// Tarefas
// ----------------------------------------------------------------------------
export function listarTarefas(busca = "", sinal?: AbortSignal): Promise<Tarefa[]> {
    const query = busca ? `?search=${encodeURIComponent(busca)}` : "";
    return requisitar<Tarefa[]>(`/api/tasks${query}`, { signal: sinal });
}

export function criarTarefa(titulo: string, prioridade: Prioridade): Promise<Tarefa> {
    return requisitar<Tarefa>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ titulo, prioridade }),
    });
}

export function atualizarTarefa(id: number, campos: CamposTarefa): Promise<Tarefa> {
    return requisitar<Tarefa>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(campos),
    });
}

export async function deletarTarefa(id: number): Promise<void> {
    await requisitar<unknown>(`/api/tasks/${id}`, { method: "DELETE" });
}
