function Tarefa({ tarefa, onAlternar, onRemover }) {
  return (
    <li>
      <input
        type="checkbox"
        checked={tarefa.concluida}
        onChange={() => onAlternar(tarefa.id)}
      />
      <span style={{ textDecoration: tarefa.concluida ? 'line-through' : 'none' }}>
        {tarefa.descricao}
      </span>
      <button type="button" onClick={() => onRemover(tarefa.id)}>
        Remover
      </button>
    </li>
  );
}

export default Tarefa;
