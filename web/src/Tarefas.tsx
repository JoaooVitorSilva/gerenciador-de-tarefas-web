import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
    atualizarTarefa,
    criarTarefa,
    deletarTarefa,
    ErroApi,
    listarTarefas,
    PRIORIDADES,
    type Prioridade,
    type Tarefa,
    type Usuario,
} from "./api";

// Record<Prioridade, string> obriga a ter UMA entrada para CADA prioridade.
// Se o tipo Prioridade ganhar "urgent", o TypeScript acusa erro aqui até
// alguém escrever a tradução — nenhuma tarefa fica sem rótulo na tela.
const PRIORIDADES_PT: Record<Prioridade, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
};

const COR_PRIORIDADE: Record<Prioridade, string> = {
    low: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    high: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

/** Etapa 3 da atividade: "todas" + as prioridades que vêm do api.ts */
type FiltroPrioridade = "todas" | Prioridade;

/** Tempo (ms) que esperamos a pessoa parar de digitar antes de buscar. */
const ATRASO_BUSCA = 400;

interface Props {
    usuario: Usuario;
    onSair: () => void;
}

export default function Tarefas({ usuario, onSair }: Props) {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // Formulário de nova tarefa
    const [titulo, setTitulo] = useState("");
    const [prioridade, setPrioridade] = useState<Prioridade>("medium");
    const [salvando, setSalvando] = useState(false);

    // Busca em DOIS estados:
    //  - busca: o que está no input, muda a cada tecla (deixa o input fluido);
    //  - buscaAplicada: o termo que de fato foi para a API, muda só depois
    //    que a pessoa para de digitar (debounce). Sem isso seria 1 requisição
    //    por tecla.
    const [busca, setBusca] = useState("");
    const [buscaAplicada, setBuscaAplicada] = useState("");

    // Número da requisição mais recente. É useRef (e não useState) porque
    // mudar esse contador NÃO deve redesenhar a tela, e o valor precisa ser
    // lido "ao vivo" dentro de um .then() que terminou depois.
    const requisicaoAtual = useRef(0);

    // Etapa 3: filtro local por prioridade
    const [filtroPrioridade, setFiltroPrioridade] = useState<FiltroPrioridade>("todas");

    /** Erro 401 = token vencido/inválido: volta para o login. */
    function tratarErro(err: unknown) {
        if (err instanceof ErroApi && err.status === 401) {
            onSair();
            return;
        }
        setErro(err instanceof ErroApi ? err.message : "Erro inesperado.");
    }

    // ------------------------------------------------------------------------
    // Debounce da busca
    // ------------------------------------------------------------------------
    useEffect(() => {
        const termo = busca.trim();
        if (termo === buscaAplicada) return;

        setCarregando(true);
        const timer = setTimeout(() => {
            setBuscaAplicada(termo);
        }, ATRASO_BUSCA);

        // Cleanup: se a pessoa digitar de novo antes dos 400 ms, o timer
        // anterior é cancelado e só o último termo vai para a API.
        return () => clearTimeout(timer);
    }, [busca, buscaAplicada]);

    // ------------------------------------------------------------------------
    // Carrega a lista sempre que o termo aplicado mudar
    // ------------------------------------------------------------------------
    useEffect(() => {
        const minhaRequisicao = ++requisicaoAtual.current;
        const controle = new AbortController();

        listarTarefas(buscaAplicada, controle.signal)
            .then((lista) => {
                // Se outra busca começou depois desta, esta resposta é velha:
                // ignoramos para não sobrescrever o resultado mais novo.
                if (minhaRequisicao !== requisicaoAtual.current) return;
                setTarefas(lista);
                setErro(null);
            })
            .catch((err) => {
                if (controle.signal.aborted || minhaRequisicao !== requisicaoAtual.current) return;
                tratarErro(err);
            })
            .finally(() => {
                if (minhaRequisicao === requisicaoAtual.current) setCarregando(false);
            });

        return () => controle.abort();
        // tratarErro fica de fora das dependências de propósito: ele só usa
        // onSair, e incluí-lo dispararia uma nova busca a cada render.
    }, [buscaAplicada]);

    // ------------------------------------------------------------------------
    // Etapa 3: derivação (NÃO é estado novo). Recalcula só quando a lista ou
    // o filtro mudam, sem nenhuma chamada nova à API.
    // ------------------------------------------------------------------------
    const tarefasFiltradas = useMemo(
        () =>
            filtroPrioridade === "todas"
                ? tarefas
                : tarefas.filter((t) => t.prioridade === filtroPrioridade),
        [tarefas, filtroPrioridade],
    );

    const concluidas = tarefas.filter((t) => t.status === "completed").length;

    // ------------------------------------------------------------------------
    // Ações
    // ------------------------------------------------------------------------
    async function adicionar(e: FormEvent) {
        e.preventDefault();
        if (titulo.trim().length < 3) {
            setErro("O título precisa ter pelo menos 3 caracteres.");
            return;
        }

        setSalvando(true);
        try {
            const nova = await criarTarefa(titulo.trim(), prioridade);
            setTarefas((lista) => [nova, ...lista]);
            setTitulo("");
            setErro(null);
        } catch (err) {
            tratarErro(err);
        } finally {
            setSalvando(false);
        }
    }

    async function alternarStatus(tarefa: Tarefa) {
        const novoStatus = tarefa.status === "completed" ? "pending" : "completed";
        try {
            // O await garante que só atualizamos a tela com a tarefa que o
            // banco realmente salvou (e que um erro cai no catch abaixo).
            const atualizada = atualizarTarefa(tarefa.id, { status: novoStatus });
            setTarefas((lista) => lista.map((t) => (t.id === tarefa.id ? atualizada : t)));
        } catch (err) {
            tratarErro(err);
        }
    }

    async function excluir(tarefa: Tarefa) {
        if (!window.confirm(`Excluir "${tarefa.titulo}"?`)) return;
        try {
            await deletarTarefa(tarefa.id);
            setTarefas((lista) => lista.filter((t) => t.id !== tarefa.id));
        } catch (err) {
            tratarErro(err);
        }
    }

    // ------------------------------------------------------------------------
    // Tela
    // ------------------------------------------------------------------------
    return (
        <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Minhas tarefas</h1>
                    <p className="text-sm text-slate-400">{usuario.email}</p>
                </div>
                <button
                    type="button"
                    onClick={onSair}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-800"
                >
                    Sair
                </button>
            </header>

            {/* Nova tarefa */}
            <form onSubmit={adicionar} className="flex flex-col gap-2 sm:flex-row">
                <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="O que precisa ser feito?"
                    aria-label="Título da nova tarefa"
                    className="flex-1 rounded-lg bg-slate-800 px-3 py-2 ring-1 ring-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                />
                <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                    aria-label="Prioridade da nova tarefa"
                    className="rounded-lg bg-slate-800 px-3 py-2 ring-1 ring-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                >
                    {PRIORIDADES.map((p) => (
                        <option key={p} value={p}>
                            {PRIORIDADES_PT[p]}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-500 disabled:opacity-60"
                >
                    {salvando ? "Salvando..." : "Adicionar"}
                </button>
            </form>

            {/* Busca */}
            <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título..."
                aria-label="Buscar tarefas"
                className="w-full rounded-lg bg-slate-900 px-3 py-2 ring-1 ring-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
            />

            {/* Etapa 3: chips de filtro por prioridade */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por prioridade">
                {(["todas", ...PRIORIDADES] as FiltroPrioridade[]).map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setFiltroPrioridade(p)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                            filtroPrioridade === p
                                ? "bg-white/10 text-white ring-white/30"
                                : "bg-slate-800 text-slate-300 ring-slate-700 hover:bg-slate-700"
                        }`}
                        aria-pressed={filtroPrioridade === p}
                    >
                        {p === "todas" ? "Todas" : PRIORIDADES_PT[p]}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-500">
                    {tarefasFiltradas.length} de {tarefas.length} · {concluidas} concluída(s)
                </span>
            </div>

            {erro && (
                <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
                    {erro}
                </p>
            )}

            {/* Lista */}
            {carregando ? (
                <p className="py-8 text-center text-slate-400">Carregando...</p>
            ) : tarefasFiltradas.length === 0 ? (
                <p className="py-8 text-center text-slate-500">
                    {tarefas.length === 0
                        ? buscaAplicada
                            ? `Nenhuma tarefa encontrada para "${buscaAplicada}".`
                            : "Nenhuma tarefa ainda. Que tal criar a primeira?"
                        : "Nenhuma tarefa com essa prioridade."}
                </p>
            ) : (
                <ul className="space-y-2">
                    {tarefasFiltradas.map((t) => {
                        const feita = t.status === "completed";
                        return (
                            <li
                                key={t.id}
                                className="flex items-center gap-3 rounded-xl bg-slate-900/80 px-4 py-3 ring-1 ring-slate-800"
                            >
                                <button
                                    type="button"
                                    onClick={() => alternarStatus(t)}
                                    aria-label={feita ? "Marcar como pendente" : "Concluir"}
                                    title={feita ? "Marcar como pendente" : "Concluir"}
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 transition ${
                                        feita
                                            ? "bg-sky-600 text-white ring-sky-500"
                                            : "ring-slate-600 hover:ring-sky-500"
                                    }`}
                                >
                                    {feita && "✓"}
                                </button>

                                <span className={`flex-1 ${feita ? "text-slate-500 line-through" : ""}`}>{t.titulo}</span>

                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${COR_PRIORIDADE[t.prioridade]}`}
                                >
                                    {PRIORIDADES_PT[t.prioridade]}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => excluir(t)}
                                    aria-label={`Excluir ${t.titulo}`}
                                    className="rounded-md px-2 py-1 text-sm text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                                >
                                    Excluir
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
