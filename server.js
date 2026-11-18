const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Libera o acesso à API a partir de outros domínios (ex.: front-end na Vercel)
app.use(cors());

// Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// Rota raiz – útil para verificar se a API está no ar (ex.: no Render)
app.get('/', (req, res) => {
  res.json({ mensagem: 'API de Notas no ar! Use /api/notes' });
});

// ---------- Funções auxiliares de leitura/escrita no arquivo JSON ----------

async function lerNotas() {
  try {
    const conteudo = await fs.readFile(DATA_FILE, 'utf-8');
    return conteudo.trim() ? JSON.parse(conteudo) : [];
  } catch (erro) {
    if (erro.code === 'ENOENT') return []; // arquivo ainda não existe
    throw erro;
  }
}

async function salvarNotas(notas) {
  await fs.writeFile(DATA_FILE, JSON.stringify(notas, null, 2), 'utf-8');
}

// Valida se titulo e texto foram enviados (strings não vazias)
function validarNota(body) {
  const { titulo, texto } = body || {};
  if (typeof titulo !== 'string' || !titulo.trim() ||
      typeof texto !== 'string' || !texto.trim()) {
    return null;
  }
  return { titulo: titulo.trim(), texto: texto.trim() };
}

// ------------------------------- Rotas CRUD --------------------------------

// Listar todas as notas
app.get('/api/notes', async (req, res) => {
  const notas = await lerNotas();
  res.json(notas);
});

// Criar nova nota
app.post('/api/notes', async (req, res) => {
  const dados = validarNota(req.body);
  if (!dados) {
    return res.status(400).json({ erro: 'Os campos titulo e texto são obrigatórios.' });
  }

  const notas = await lerNotas();
  const novaNota = {
    id: Date.now().toString(),
    titulo: dados.titulo,
    texto: dados.texto,
    criadoEm: new Date().toISOString(),
  };

  notas.push(novaNota);
  await salvarNotas(notas);
  res.status(201).json(novaNota);
});

// Obter nota por ID
app.get('/api/notes/:id', async (req, res) => {
  const notas = await lerNotas();
  const nota = notas.find((n) => n.id === req.params.id);
  if (!nota) {
    return res.status(404).json({ erro: 'Nota não encontrada.' });
  }
  res.json(nota);
});

// Atualizar nota por ID
app.put('/api/notes/:id', async (req, res) => {
  const dados = validarNota(req.body);
  if (!dados) {
    return res.status(400).json({ erro: 'Os campos titulo e texto são obrigatórios.' });
  }

  const notas = await lerNotas();
  const indice = notas.findIndex((n) => n.id === req.params.id);
  if (indice === -1) {
    return res.status(404).json({ erro: 'Nota não encontrada.' });
  }

  notas[indice] = {
    ...notas[indice],
    titulo: dados.titulo,
    texto: dados.texto,
    atualizadoEm: new Date().toISOString(),
  };

  await salvarNotas(notas);
  res.json(notas[indice]);
});

// Excluir nota por ID
app.delete('/api/notes/:id', async (req, res) => {
  const notas = await lerNotas();
  const indice = notas.findIndex((n) => n.id === req.params.id);
  if (indice === -1) {
    return res.status(404).json({ erro: 'Nota não encontrada.' });
  }

  notas.splice(indice, 1);
  await salvarNotas(notas);
  res.status(204).send();
});

// ------------------------- Tratamento de erros ------------------------------

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Erros gerais (inclui JSON malformado no corpo)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
