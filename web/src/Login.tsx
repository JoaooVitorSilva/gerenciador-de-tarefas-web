import { useState, type FormEvent } from "react";
import { ErroApi, login, registrar, type Usuario } from "./api";

type Modo = "login" | "registro";

interface Props {
    onLogin: (usuario: Usuario) => void;
}

export default function Login({ onLogin }: Props) {
    const [modo, setModo] = useState<Modo>("login");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    const registrando = modo === "registro";

    /** Validação no front: só para dar resposta rápida. Quem manda é o back. */
    function validar(): string | null {
        if (!email.includes("@")) return "Informe um e-mail válido.";
        if (!senha) return "Informe a senha.";
        // O back só exige 6 caracteres no CADASTRO. No login a regra não se
        // aplica: uma conta antiga com senha curta ainda precisa conseguir entrar.
        if (registrando && senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
        return null;
    }

    async function enviar(e: FormEvent) {
        e.preventDefault();
        const problema = validar();
        if (problema) {
            setErro(problema);
            return;
        }

        setErro(null);
        setEnviando(true);
        try {
            if (registrando) {
                await registrar(email.trim(), senha);
            }
            // Depois de criar a conta já fazemos login: o cadastro não devolve
            // token, e sem token a pessoa teria que digitar tudo de novo.
            const usuario = await login(email.trim(), senha);
            onLogin(usuario);
        } catch (err) {
            setErro(err instanceof ErroApi ? err.message : "Erro inesperado. Tente de novo.");
        } finally {
            setEnviando(false);
        }
    }

    function trocarModo() {
        setModo(registrando ? "login" : "registro");
        setErro(null);
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <form
                onSubmit={enviar}
                className="w-full max-w-sm space-y-5 rounded-2xl bg-slate-900/80 p-8 shadow-2xl ring-1 ring-slate-800"
                noValidate
            >
                <header className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Gerenciador de Tarefas</h1>
                    <p className="text-sm text-slate-400">
                        {registrando ? "Crie sua conta para começar" : "Entre para ver suas tarefas"}
                    </p>
                </header>

                <label className="block space-y-1.5">
                    <span className="text-sm text-slate-300">E-mail</span>
                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="voce@senai.com"
                    />
                </label>

                <label className="block space-y-1.5">
                    <span className="text-sm text-slate-300">Senha</span>
                    <input
                        type="password"
                        autoComplete={registrando ? "new-password" : "current-password"}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder={registrando ? "Mínimo de 6 caracteres" : "••••••"}
                    />
                </label>

                {erro && (
                    <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
                        {erro}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={enviando}
                    className="w-full rounded-lg bg-sky-600 py-2 font-medium text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
                >
                    {enviando ? "Aguarde..." : registrando ? "Criar conta" : "Entrar"}
                </button>

                <p className="text-center text-sm text-slate-400">
                    {registrando ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                    <button type="button" onClick={trocarModo} className="font-medium text-sky-400 hover:underline">
                        {registrando ? "Entrar" : "Criar conta"}
                    </button>
                </p>
            </form>
        </main>
    );
}
