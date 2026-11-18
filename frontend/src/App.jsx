import { useEffect, useMemo, useRef, useState } from 'react';
import {
  listarNotas,
  obterNota,
  criarNota,
  atualizarNota,
  excluirNota,
} from './api.js';

// Paleta de cores das notas (vinda do design system)
const PALETA = [
  '#FAE680', '#9EAAFA', '#A2CBAF', '#E8ADB1', '#A6C2EB',
  '#F4E8C8', '#CCA7ED', '#F29874', '#6C95CF', '#F4DAA0',
];
const ROTACOES = [0, -1, 1, -0.5, 0.5];
const formVazio = { titulo: '', texto: '' };

// Gera sempre a mesma cor/inclinação para a mesma nota, a partir do ID
function hash(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function visualDaNota(id) {
  const h = hash(id);
  return {
    cor: PALETA[h % PALETA.length],
    rotacao: ROTACOES[h % ROTACOES.length],
    x: (h % 5) - 1,
    y: (h % 7) + 1,
    sombra: h % 2 ? 'sem-antes' : 'sem-depois',
  };
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
}

const TRACOS = '-'.repeat(200);
function Tracejado() {
  return (
    <div aria-hidden="true" className="tracejado">
      {TRACOS}
    </div>
  );
}

// Filtros SVG que dão o efeito "tinta no papel" (design system)
function DefsAnalog() {
  return (
    <svg aria-hidden="true" className="analog-defs" width="0" height="0" focusable="false">
      <filter id="analog">
        <feTurbulence baseFrequency="1 1" numOctaves="1" />
        <feDisplacementMap in="SourceGraphic" scale="0.6" />
      </filter>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Cartão de nota
// ---------------------------------------------------------------------------
function CartaoNota({ nota, onAbrir }) {
  const v = visualDaNota(nota.id);
  return (
    <li
      className="nota-wrap"
      style={{ transform: `translate(${v.x}px, ${v.y}px) rotate(${v.rotacao}deg)` }}
    >
      <div className={`sombra-canto ${v.sombra}`}>
        <button
          type="button"
          className="nota grao hover-lift"
          style={{ backgroundColor: v.cor }}
          onClick={() => onAbrir(nota)}
          aria-label={`Abrir nota ${nota.titulo}`}
        >
          <div className="nota-interna analog">
            <div>
              <span className="etiqueta">Nota</span>
              <h3 className="nota-titulo">{nota.titulo}</h3>
            </div>
            <Tracejado />
            <p className="manuscrito clamp-3">{nota.texto}</p>
            <Tracejado />
            <div className="nota-meta">
              <p>
                <span>criado:</span>
                {formatarData(nota.criadoEm)}
              </p>
              {nota.atualizadoEm && (
                <p>
                  <span>editado:</span>
                  {formatarData(nota.atualizadoEm)}
                </p>
              )}
            </div>
          </div>
        </button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Diálogo: ver / criar / editar / excluir
// ---------------------------------------------------------------------------
function Dialogo({ estado, onFechar, onSalvar, onExcluir, onTrocarModo }) {
  const ref = useRef(null);
  const [form, setForm] = useState(formVazio);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const { modo, nota } = estado || {};
  const cor = nota ? visualDaNota(nota.id).cor : PALETA[0];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (estado && !dialog.open) dialog.showModal();
    if (!estado && dialog.open) dialog.close();
  }, [estado]);

  useEffect(() => {
    setErro('');
    setEnviando(false);
    if (modo === 'editar' && nota) setForm({ titulo: nota.titulo, texto: nota.texto });
    if (modo === 'criar') setForm(formVazio);
  }, [modo, nota]);

  async function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim()) {
      setErro('Preencha o título e o texto.');
      return;
    }
    try {
      setEnviando(true);
      await onSalvar(form);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  async function excluir() {
    try {
      setEnviando(true);
      await onExcluir(nota.id);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="dialogo"
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && onFechar()}
    >
      {estado && (
        <div className="dialogo-painel">
          <div className="dialogo-topo">
            <h2 className="rotulo">
              {modo === 'ver' && 'Nota'}
              {modo === 'criar' && 'Nova nota'}
              {modo === 'editar' && 'Editar nota'}
              {modo === 'excluir' && 'Excluir nota'}
            </h2>
            <button type="button" className="botao-icone" onClick={onFechar} aria-label="Fechar">
              ✕
            </button>
          </div>

          {/* ---------- Ver ---------- */}
          {modo === 'ver' && (
            <>
              <div className="nota grao folha" style={{ backgroundColor: cor }}>
                <div className="nota-interna analog">
                  <div>
                    <span className="etiqueta">Nota #{nota.id}</span>
                    <h3 className="nota-titulo grande">{nota.titulo}</h3>
                  </div>
                  <Tracejado />
                  <p className="manuscrito texto-completo">{nota.texto}</p>
                  <Tracejado />
                  <div className="nota-meta">
                    <p>
                      <span>criado:</span>
                      {formatarData(nota.criadoEm)}
                    </p>
                    {nota.atualizadoEm && (
                      <p>
                        <span>editado:</span>
                        {formatarData(nota.atualizadoEm)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="acoes">
                <button type="button" className="pilula" onClick={() => onTrocarModo('excluir')}>
                  Excluir
                </button>
                <button
                  type="button"
                  className="pilula pilula-ativa"
                  onClick={() => onTrocarModo('editar')}
                >
                  Editar
                </button>
              </div>
            </>
          )}

          {/* ---------- Criar / Editar ---------- */}
          {(modo === 'criar' || modo === 'editar') && (
            <form onSubmit={salvar}>
              <div className="nota grao folha" style={{ backgroundColor: cor }}>
                <div className="nota-interna">
                  <label className="campo">
                    <span className="etiqueta">Título</span>
                    <input
                      className="input-titulo"
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      placeholder="Dê um título..."
                      maxLength={120}
                      autoFocus
                    />
                  </label>
                  <Tracejado />
                  <label className="campo">
                    <span className="sr-only">Texto</span>
                    <textarea
                      className="manuscrito input-texto"
                      value={form.texto}
                      onChange={(e) => setForm({ ...form, texto: e.target.value })}
                      placeholder="escreva aqui sua nota..."
                      rows={6}
                    />
                  </label>
                  <Tracejado />
                </div>
              </div>
              {erro && <p className="aviso-erro">{erro}</p>}
              <div className="acoes">
                <button type="button" className="pilula" onClick={onFechar}>
                  Cancelar
                </button>
                <button type="submit" className="pilula pilula-ativa" disabled={enviando}>
                  {enviando ? 'Salvando...' : modo === 'criar' ? 'Criar nota' : 'Salvar'}
                </button>
              </div>
            </form>
          )}

          {/* ---------- Excluir ---------- */}
          {modo === 'excluir' && (
            <>
              <p className="confirmacao">
                Tem certeza que deseja excluir <strong>“{nota.titulo}”</strong>? Essa ação não
                pode ser desfeita.
              </p>
              {erro && <p className="aviso-erro">{erro}</p>}
              <div className="acoes">
                <button type="button" className="pilula" onClick={() => onTrocarModo('ver')}>
                  Voltar
                </button>
                <button
                  type="button"
                  className="pilula pilula-perigo"
                  onClick={excluir}
                  disabled={enviando}
                >
                  {enviando ? 'Excluindo...' : 'Sim, excluir'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const [notas, setNotas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [dialogo, setDialogo] = useState(null); // { modo, nota }

  async function carregar() {
    try {
      setErro('');
      setNotas(await listarNotas());
    } catch (e) {
      setNotas([]);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const notasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = [...notas].sort((a, b) =>
      String(b.criadoEm || '').localeCompare(String(a.criadoEm || ''))
    );
    if (!termo) return lista;
    return lista.filter(
      (n) =>
        n.titulo.toLowerCase().includes(termo) || n.texto.toLowerCase().includes(termo)
    );
  }, [notas, busca]);

  // Abre a nota buscando a versão mais recente pela rota GET /api/notes/:id
  async function abrirNota(nota) {
    setDialogo({ modo: 'ver', nota });
    try {
      const atual = await obterNota(nota.id);
      setDialogo((d) => (d && d.nota?.id === nota.id ? { ...d, nota: atual } : d));
    } catch (e) {
      setDialogo(null);
      setErro(e.message);
      carregar();
    }
  }

  async function salvar(form) {
    if (dialogo.modo === 'criar') {
      const nova = await criarNota(form);
      setNotas((lista) => [...lista, nova]);
    } else {
      const editada = await atualizarNota(dialogo.nota.id, form);
      setNotas((lista) => lista.map((n) => (n.id === editada.id ? editada : n)));
    }
    setDialogo(null);
  }

  async function excluir(id) {
    await excluirNota(id);
    setNotas((lista) => lista.filter((n) => n.id !== id));
    setDialogo(null);
  }

  const online = !carregando && !erro;

  return (
    <div className="pagina">
      <DefsAnalog />

      <header className="topo">
        <a href="/" className="marca" aria-label="Início">
          notas<span className="marca-ponto">.</span>
        </a>
        <span className={`status ${carregando ? 'status-carregando' : online ? 'status-on' : 'status-off'}`}>
          <span className="status-ponto" />
          {carregando ? 'conectando' : online ? 'api online' : 'api offline'}
        </span>
      </header>

      <main className="conteudo">
        <section className="intro">
          <h1 className="titulo-pagina">Minhas notas</h1>
          <p className="subtitulo">
            Um cantinho para guardar ideias, lembretes e tarefas — salvo direto no{' '}
            <code>data.json</code> da API.
          </p>
        </section>

        <nav className="barra" aria-label="Ações">
          <span className="pilula pilula-ativa pilula-contador">
            Todas<span className="contador">{notas.length}</span>
          </span>
          <button
            type="button"
            className="pilula"
            onClick={() => setDialogo({ modo: 'criar', nota: null })}
          >
            <span className="bolinha" style={{ backgroundColor: PALETA[0] }} />+ Nova nota
          </button>
          <label className="busca">
            <span className="sr-only">Buscar</span>
            <input
              type="search"
              placeholder="buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
        </nav>

        {erro && (
          <div className="aviso-erro" role="alert">
            <p>
              <strong>Ops!</strong> {erro}
            </p>
            <button type="button" className="pilula" onClick={carregar}>
              Tentar de novo
            </button>
          </div>
        )}

        {carregando ? (
          <>
            <p className="dica">
              Carregando notas... se a API estiver “dormindo” no Render, pode levar alguns
              segundos.
            </p>
            <ul className="grade">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="esqueleto" />
              ))}
            </ul>
          </>
        ) : notasFiltradas.length === 0 && !erro ? (
          <div className="vazio">
            <p className="manuscrito">
              {busca ? 'nenhuma nota encontrada...' : 'nenhuma nota por aqui ainda...'}
            </p>
            {!busca && (
              <button
                type="button"
                className="pilula pilula-ativa"
                onClick={() => setDialogo({ modo: 'criar', nota: null })}
              >
                Criar a primeira nota
              </button>
            )}
          </div>
        ) : (
          <ul className="grade">
            {notasFiltradas.map((nota) => (
              <CartaoNota key={nota.id} nota={nota} onAbrir={abrirNota} />
            ))}
          </ul>
        )}
      </main>

      <footer className="rodape">
        <Tracejado />
        <p>Notas · CRUD com Express.js + React</p>
      </footer>

      <Dialogo
        estado={dialogo}
        onFechar={() => setDialogo(null)}
        onSalvar={salvar}
        onExcluir={excluir}
        onTrocarModo={(modo) => setDialogo((d) => ({ ...d, modo }))}
      />
    </div>
  );
}
