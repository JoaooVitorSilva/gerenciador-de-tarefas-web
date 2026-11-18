import { useState } from "react";
import { apagarToken, getUsuario, type Usuario } from "./api";
import Login from "./Login";
import Tarefas from "./Tarefas";

export default function App() {
    // Passamos a FUNÇÃO (lazy initializer): o React só executa getUsuario()
    // na primeira renderização. Com useState(getUsuario()) o localStorage e o
    // JSON.parse rodariam de novo em TODO re-render, e o valor seria descartado.
    const [usuario, setUsuario] = useState<Usuario | null>(() => getUsuario());

    // Derivação, não estado: "logado" sai de "usuario". Guardar os dois
    // separados abriria a chance de ficarem dessincronizados.
    const logado = usuario !== null;

    // Único lugar que encerra a sessão. Tarefas só AVISA (onSair) e o App,
    // que é o dono do estado "usuario", apaga o token e troca a tela.
    function sair() {
        apagarToken();
        setUsuario(null);
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
            {logado ? (
                <Tarefas usuario={usuario} onSair={sair} />
            ) : (
                <Login onLogin={setUsuario} />
            )}
        </div>
    );
}
