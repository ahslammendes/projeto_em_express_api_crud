// Passo 9: depois do deploy no Render, troque a URL abaixo pelo endpoint online,
// ex.: 'https://sua-api.onrender.com/api/notes'
// (ou defina a variável de ambiente VITE_API_URL na Vercel, sem mexer no código).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/notes';

async function tratarResposta(res) {
  if (res.status === 204) return null;
  const dados = await res.json().catch(() => null);
  if (!res.ok) throw new Error(dados?.erro || `Erro ${res.status}`);
  return dados;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export function listarNotas() {
  return fetch(API_URL).then(tratarResposta);
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
