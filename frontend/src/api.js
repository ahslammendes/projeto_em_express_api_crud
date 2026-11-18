// Passo 9: depois do deploy no Render, troque a URL abaixo pelo endpoint online,
// ex.: 'https://sua-api.onrender.com/api/notes'
// (ou defina a variável de ambiente VITE_API_URL na Vercel, sem mexer no código).
const URL_BASE = import.meta.env.VITE_API_URL || 'https://projeto-em-express-api-crud.onrender.com/api/notes';

// Garante que a URL termine em /api/notes, mesmo que seja informada só a raiz da API
const API_URL = URL_BASE.replace(/\/+$/, '').replace(/(\/api\/notes)?$/, '/api/notes');

async function tratarResposta(res) {
  if (res.status === 204) return null;
  const dados = await res.json().catch(() => null);
  if (!res.ok) throw new Error(dados?.erro || `Erro ${res.status}`);
  return dados;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function listarNotas() {
  const dados = await fetch(API_URL).then(tratarResposta);
  if (!Array.isArray(dados)) {
    throw new Error(`Resposta inesperada da API (${API_URL}).`);
  }
  return dados;
}

export function obterNota(id) {
  return fetch(`${API_URL}/${id}`).then(tratarResposta);
}

export function criarNota(nota) {
  return fetch(API_URL, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(nota),
  }).then(tratarResposta);
}

export function atualizarNota(id, nota) {
  return fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(nota),
  }).then(tratarResposta);
}

export function excluirNota(id) {
  return fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(tratarResposta);
}
