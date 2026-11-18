import { useEffect, useState } from 'react';
import { listarNotas, criarNota, atualizarNota, excluirNota } from './api.js';

const formVazio = { titulo: '', texto: '' };

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleString('pt-BR') : '';
}

export default function App() {
  const [notas, setNotas] = useState([]);
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    try {
      setErro('');
      setNotas(await listarNotas());
    } catch (e) {
      setNotas([]);
      setErro('Não foi possível carregar as notas. ' + e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim()) {
      setErro('Preencha o título e o texto.');
      return;
    }
    try {
      setErro('');
      if (editandoId) {
        await atualizarNota(editandoId, form);
      } else {
        await criarNota(form);
      }
      cancelarEdicao();
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function iniciarEdicao(nota) {
    setEditandoId(nota.id);
    setForm({ titulo: nota.titulo, texto: nota.texto });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(formVazio);
  }

  async function handleExcluir(id) {
    if (!window.confirm('Deseja realmente excluir esta nota?')) return;
    try {
      await excluirNota(id);
      if (editandoId === id) cancelarEdicao();
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="container">
      <h1>📝 Minhas Notas</h1>

      <form className="form" onSubmit={handleSubmit}>
        <h2>{editandoId ? 'Editar nota' : 'Nova nota'}</h2>
        <input
          name="titulo"
          placeholder="Título"
          value={form.titulo}
          onChange={handleChange}
        />
        <textarea
          name="texto"
          placeholder="Escreva sua nota..."
          rows={4}
          value={form.texto}
          onChange={handleChange}
        />
        <div className="acoes">
          <button type="submit">{editandoId ? 'Salvar alterações' : 'Adicionar'}</button>
          {editandoId && (
            <button type="button" className="secundario" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : notas.length === 0 ? (
        <p className="vazio">Nenhuma nota cadastrada.</p>
      ) : (
        <ul className="lista">
          {notas.map((nota) => (
            <li key={nota.id} className={`nota ${editandoId === nota.id ? 'ativa' : ''}`}>
              <h3>{nota.titulo}</h3>
              <p>{nota.texto}</p>
              <small>
                Criada em {formatarData(nota.criadoEm)}
                {nota.atualizadoEm && ` · Editada em ${formatarData(nota.atualizadoEm)}`}
              </small>
              <div className="acoes">
                <button onClick={() => iniciarEdicao(nota)}>Editar</button>
                <button className="perigo" onClick={() => handleExcluir(nota.id)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
