import { useEffect, useMemo, useRef, useState } from 'react';
import {
  listarNotas,
  obterNota,
  criarNota,
  atualizarNota,
  excluirNota,
} from './api.js';

// Paleta de cores das notas (vinda do design system iamrob.in/notes)
const CORES = [
  { hex: '#FAE680', nome: 'Amarelo' },
  { hex: '#9EAAFA', nome: 'Lavanda' },
  { hex: '#A2CBAF', nome: 'Sálvia' },
  { hex: '#E8ADB1', nome: 'Rosa' },
  { hex: '#A6C2EB', nome: 'Céu' },
  { hex: '#F4E8C8', nome: 'Creme' },
  { hex: '#CCA7ED', nome: 'Lilás' },
  { hex: '#F29874', nome: 'Coral' },
  { hex: '#6C95CF', nome: 'Azul' },
  { hex: '#F4DAA0', nome: 'Pêssego' },
];

const CATEGORIAS = [
  { id: 'Nota', corPadrao: '#FAE680' },
  { id: 'Lembrete', corPadrao: '#A2CBAF' },
  { id: 'Tarefa', corPadrao: '#9EAAFA' },
  { id: 'Ideia', corPadrao: '#CCA7ED' },
  { id: 'Projeto', corPadrao: '#F29874' },
];

const PALETA = CORES.map((c) => c.hex);
const ROTACOES = [0, -1, 1, -0.5, 0.5];
const STORAGE_KEY = 'notas_custom_meta_v1';

const formVazio = {
  titulo: '',
  texto: '',
  categoria: 'Nota',
  cor: CORES[0].hex,
};

function lerMetadadosLocais() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function salvarMetadadoLocal(id, { categoria, cor }) {
  try {
    const atual = lerMetadadosLocais();
    atual[id] = { categoria, cor };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atual));
  } catch {
    // ignore storage errors
  }
}

// Gera sempre a mesma cor/inclinação padrão a partir do ID quando a nota ainda não tem cor definida
function hash(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function enriquecerNota(nota) {
  const locais = lerMetadadosLocais()[nota.id] || {};
  const h = hash(nota.id);
  return {
    ...nota,
    categoria: nota.categoria || locais.categoria || 'Nota',
    cor: nota.cor || locais.cor || PALETA[h % PALETA.length],
  };
}

function visualDaNota(nota) {
  const h = hash(nota.id);
  return {
    cor: nota.cor || PALETA[h % PALETA.length],
    categoria: nota.categoria || 'Nota',
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
  const v = visualDaNota(nota);
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
          aria-label={`Abrir ${v.categoria} ${nota.titulo}`}
        >
          <div className="nota-interna analog">
            <div>
              <span className="etiqueta">{v.categoria}</span>
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

  const { modo, nota, categoriaInicial } = estado || {};
  const visualAtual = nota ? visualDaNota(nota) : null;
  const corFolha =
    modo === 'criar' || modo === 'editar'
      ? form.cor
      : visualAtual?.cor || CORES[0].hex;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (estado && !dialog.open) dialog.showModal();
    if (!estado && dialog.open) dialog.close();
  }, [estado]);

  useEffect(() => {
    setErro('');
    setEnviando(false);
    if (modo === 'editar' && nota) {
      const v = visualDaNota(nota);
      setForm({
        titulo: nota.titulo,
        texto: nota.texto,
        categoria: v.categoria,
        cor: v.cor,
      });
    }
    if (modo === 'criar') {
      const cat = CATEGORIAS.find((c) => c.id === categoriaInicial) || CATEGORIAS[0];
      setForm({
        ...formVazio,
        categoria: cat.id,
        cor: cat.corPadrao,
      });
    }
  }, [modo, nota, categoriaInicial]);

  function selecionarCategoria(cat) {
    setForm((atual) => ({
      ...atual,
      categoria: cat.id,
      cor: cat.corPadrao || atual.cor,
    }));
  }

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
              {modo === 'ver' && (visualAtual?.categoria || 'Nota')}
              {modo === 'criar' && `Criar ${form.categoria.toLowerCase()}`}
              {modo === 'editar' && `Editar ${form.categoria.toLowerCase()}`}
              {modo === 'excluir' && `Excluir ${visualAtual?.categoria?.toLowerCase() || 'nota'}`}
            </h2>
            <button type="button" className="botao-icone" onClick={onFechar} aria-label="Fechar">
              ✕
            </button>
          </div>

          {/* ---------- Ver ---------- */}
          {modo === 'ver' && (
            <>
              <div className="nota grao folha" style={{ backgroundColor: corFolha }}>
                <div className="nota-interna analog">
                  <div>
                    <span className="etiqueta">{visualAtual?.categoria || 'Nota'}</span>
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
            <form onSubmit={salvar} className="form-dialogo">
              <div className="seletores">
                <div className="seletor-bloco">
                  <span className="seletor-titulo">Tipo</span>
                  <div className="seletor-opcoes" role="radiogroup" aria-label="Tipo da nota">
                    {CATEGORIAS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`pilula ${form.categoria === cat.id ? 'pilula-ativa' : ''}`}
                        onClick={() => selecionarCategoria(cat)}
                      >
                        <span className="bolinha" style={{ backgroundColor: cat.corPadrao }} />
                        {cat.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="seletor-bloco">
                  <span className="seletor-titulo">Cor do papel</span>
                  <div className="seletor-cores" role="radiogroup" aria-label="Cor da nota">
                    {CORES.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`amostra-cor ${form.cor === c.hex ? 'ativa' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setForm({ ...form, cor: c.hex })}
                        title={c.nome}
                        aria-label={c.nome}
                        aria-pressed={form.cor === c.hex}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="nota grao folha" style={{ backgroundColor: corFolha }}>
                <div className="nota-interna">
                  <div>
                    <span className="etiqueta">{form.categoria}</span>
                    <label className="campo">
                      <span className="sr-only">Título</span>
                      <input
                        className="input-titulo"
                        value={form.titulo}
                        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                        placeholder="Dê um título..."
                        maxLength={120}
                        autoFocus
                      />
                    </label>
                  </div>
                  <Tracejado />
                  <label className="campo">
                    <span className="sr-only">Texto</span>
                    <textarea
                      className="manuscrito input-texto"
                      value={form.texto}
                      onChange={(e) => setForm({ ...form, texto: e.target.value })}
                      placeholder="escreva aqui..."
                      rows={5}
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
                  {enviando
                    ? 'Salvando...'
                    : modo === 'criar'
                    ? `Criar ${form.categoria.toLowerCase()}`
                    : 'Salvar'}
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
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [dialogo, setDialogo] = useState(null); // { modo, nota, categoriaInicial }

  async function carregar() {
    try {
      setErro('');
      const lista = await listarNotas();
      setNotas(lista.map(enriquecerNota));
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

  const contagens = useMemo(() => {
    const mapa = { Todas: notas.length };
    for (const cat of CATEGORIAS) mapa[cat.id] = 0;
    for (const n of notas) {
      const c = n.categoria || 'Nota';
      mapa[c] = (mapa[c] || 0) + 1;
    }
    return mapa;
  }, [notas]);

  const notasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = [...notas].sort((a, b) =>
      String(b.criadoEm || '').localeCompare(String(a.criadoEm || ''))
    );
    return lista.filter((n) => {
      const cat = n.categoria || 'Nota';
      if (filtroCategoria !== 'Todas' && cat !== filtroCategoria) return false;
      if (!termo) return true;
      return (
        n.titulo.toLowerCase().includes(termo) ||
        n.texto.toLowerCase().includes(termo) ||
        cat.toLowerCase().includes(termo)
      );
    });
  }, [notas, busca, filtroCategoria]);

  // Abre a nota buscando a versão mais recente pela rota GET /api/notes/:id
  async function abrirNota(nota) {
    setDialogo({ modo: 'ver', nota });
    try {
      const atual = enriquecerNota(await obterNota(nota.id));
      setDialogo((d) => (d && d.nota?.id === nota.id ? { ...d, nota: atual } : d));
    } catch (e) {
      setDialogo(null);
      setErro(e.message);
      carregar();
    }
  }

  async function salvar(form) {
    if (dialogo.modo === 'criar') {
      const criada = await criarNota(form);
      salvarMetadadoLocal(criada.id, { categoria: form.categoria, cor: form.cor });
      const nova = enriquecerNota({ ...criada, categoria: form.categoria, cor: form.cor });
      setNotas((lista) => [...lista, nova]);
    } else {
      const atualizada = await atualizarNota(dialogo.nota.id, form);
      salvarMetadadoLocal(atualizada.id, { categoria: form.categoria, cor: form.cor });
      const editada = enriquecerNota({
        ...atualizada,
        categoria: form.categoria,
        cor: form.cor,
      });
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
        <span
          className={`status ${
            carregando ? 'status-carregando' : online ? 'status-on' : 'status-off'
          }`}
        >
          <span className="status-ponto" />
          {carregando ? 'conectando' : online ? 'api online' : 'api offline'}
        </span>
      </header>

      <main className="conteudo">
        <section className="intro">
          <h1 className="titulo-pagina">Minhas notas</h1>
          <p className="subtitulo">
            Um cantinho para guardar ideias, lembretes e tarefas.
          </p>
        </section>

        <nav className="barra" aria-label="Filtros e ações">
          <button
            type="button"
            className={`pilula pilula-contador ${
              filtroCategoria === 'Todas' ? 'pilula-ativa' : ''
            }`}
            onClick={() => setFiltroCategoria('Todas')}
          >
            Todas<span className="contador">{contagens.Todas}</span>
          </button>

          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pilula pilula-contador ${
                filtroCategoria === cat.id ? 'pilula-ativa' : ''
              }`}
              onClick={() => setFiltroCategoria(cat.id)}
            >
              <span className="bolinha" style={{ backgroundColor: cat.corPadrao }} />
              {cat.id}
              <span className="contador">{contagens[cat.id] || 0}</span>
            </button>
          ))}

          <button
            type="button"
            className="pilula pilula-criar"
            onClick={() =>
              setDialogo({
                modo: 'criar',
                nota: null,
                categoriaInicial: filtroCategoria === 'Todas' ? 'Nota' : filtroCategoria,
              })
            }
          >
            + Criar
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
              {busca || filtroCategoria !== 'Todas'
                ? 'nenhum item encontrado para esse filtro...'
                : 'nenhuma nota por aqui ainda...'}
            </p>
            <button
              type="button"
              className="pilula pilula-ativa"
              onClick={() =>
                setDialogo({
                  modo: 'criar',
                  nota: null,
                  categoriaInicial: filtroCategoria === 'Todas' ? 'Nota' : filtroCategoria,
                })
              }
            >
              + Criar {filtroCategoria === 'Todas' ? 'nota' : filtroCategoria.toLowerCase()}
            </button>
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
