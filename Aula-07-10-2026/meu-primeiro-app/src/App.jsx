import { useState } from 'react';
import Tarefa from './Tarefa.jsx';

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [categoria, setCategoria] = useState('Estudo');

  function adicionarTarefa(event) {
    event.preventDefault();

    const tituloLimpo = novaTarefa.trim();

    if (tituloLimpo === '') {
      return;
    }

    const novaTarefaObj = {
      id: Date.now(),
      descricao: tituloLimpo,
      concluida: false,
      categoria: categoria
    };
    setTarefas([...tarefas, novaTarefaObj]);
    setNovaTarefa('');
  }

  function alternarTarefa(id) {
    setTarefas(listaAtual =>
      listaAtual.map(tarefa => {
        if (tarefa.id === id) {
          return { ...tarefa, concluida: !tarefa.concluida };
        }
        return tarefa;
      })
    );
  }

  function removerTarefa(id) {
    setTarefas(listaAtual => listaAtual.filter(tarefa => tarefa.id !== id));
  }   


  const totalPendente = tarefas.filter(tarefa => !tarefa.concluida).length;
  const totalConcluidas = tarefas.filter(tarefa => tarefa.concluida).length;


  return (
    <main>
      <h1>Lista de Tarefas</h1>
      <p>Organize minha tarefas</p>

      <form onSubmit={adicionarTarefa}>
        <label htmlFor="nova-tarefa"> Nova Tarefa: </label>
        <br></br>
        <input 
        type="text" 
        value={novaTarefa}
        onChange={(e) => setNovaTarefa(e.target.value)} 
        placeholder="Descrição da tarefa" />
        <select value ={categoria} onChange={(evento) => setCategoria(evento.target.value)}>
          <option value="Estudo">Estudo</option>
          <option value="Casa">Casa</option>
          <option value="Trabalho">Trabalho</option>
        </select>
        <button type="submit">Adicionar</button>
      </form>


      <ul>
        {tarefas.map(tarefa => (
          <Tarefa 
            key={tarefa.id} 
            tarefa={tarefa} 
            onAlternar={alternarTarefa} 
            onRemover={removerTarefa} 
          />
        ))}
      </ul>


      <p>Quantidade de tarefas: {tarefas.length}</p>
      <p>Quantidade de tarefas pendentes: {totalPendente}</p>
      <p>Quantidade de tarefas concluídas: {totalConcluidas}</p>

    </main>
  );


}


export default App;