# 📝 Notas — API RESTful CRUD com Express.js + Front-end em React

Aplicação web completa para gerenciamento de **notas, lembretes, tarefas, ideias e projetos**, desenvolvida para aplicar na prática o conceito de **CRUD** (*Create, Read, Update, Delete*) com uma **API RESTful em Express.js** persistindo dados em arquivo JSON (`data.json`) e uma interface moderna em **React (Vite)**.

---

## ✨ Funcionalidades

- **CRUD Completo de Notas**:
  - **Criar** (`POST /api/notes`): adiciona novas notas com título, texto, categoria, cor, ID único (`Date.now().toString()`) e data de criação (`criadoEm`).
  - **Listar** (`GET /api/notes`): retorna todas as notas armazenadas no `data.json`.
  - **Visualizar por ID** (`GET /api/notes/:id`): consulta os dados atualizados de uma nota específica ao abri-la.
  - **Atualizar** (`PUT /api/notes/:id`): edita título, texto, categoria e cor de uma nota existente, registrando a data da edição (`atualizadoEm`).
  - **Excluir** (`DELETE /api/notes/:id`): remove uma nota pelo ID retornando status `204 No Content`.
- **Categorias e Filtros**: classifique e filtre seus itens entre **Nota**, **Lembrete**, **Tarefa**, **Ideia** e **Projeto**, com contadores em tempo real.
- **Paleta de 10 Cores**: escolha a cor do papel de cada cartão (`Amarelo`, `Lavanda`, `Sálvia`, `Rosa`, `Céu`, `Creme`, `Lilás`, `Coral`, `Azul` e `Pêssego`).
- **Busca Instantânea**: pesquise por título, conteúdo ou categoria.
- **Design Analógico**: inspirado em `iamrob.in/notes`, com textura de papel granulado, efeito SVG de tinta no papel, linhas tracejadas, sombra de canto e tipografia manuscrita (`LiebeHeide`) + monoespaçada (`Fira Mono`).

---

## 🗂️ Estrutura do Projeto

```text
projeto_em_express_api_crud/
├── server.js               # Servidor Express.js e rotas da API RESTful CRUD
├── data.json               # Armazenamento persistente das notas em formato JSON
├── package.json            # Dependências e scripts do back-end (Express 5 + CORS)
└── frontend/               # Aplicação Front-end em React + Vite
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx        # Ponto de entrada do React
        ├── App.jsx         # Interface principal, filtros, grade de cartões e modais
        ├── App.css         # Tokens, tipografia e componentes do Design System
        ├── api.js          # Cliente HTTP consumindo as 5 rotas da API
        └── assets/fonts/   # Fontes locais (LiebeHeide, Fira Mono, Apercu)
```

---

## 🔌 Documentação da API REST

**URL Base (Local):** `http://localhost:3000`  
**URL Base (Produção - Render):** `https://projeto-em-express-api-crud.onrender.com`

| Método | Rota | Descrição | Status de Sucesso | Status de Erro |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notes` | Lista todas as notas armazenadas | `200 OK` | — |
| `POST` | `/api/notes` | Cria uma nova nota (`titulo` e `texto` obrigatórios; `categoria` e `cor` opcionais) | `201 Created` | `400 Bad Request` |
| `GET` | `/api/notes/:id` | Retorna uma nota específica pelo seu `id` | `200 OK` | `404 Not Found` |
| `PUT` | `/api/notes/:id` | Atualiza uma nota existente pelo `id` (`titulo` e `texto` obrigatórios) | `200 OK` | `400` / `404` |
| `DELETE` | `/api/notes/:id` | Exclui uma nota pelo `id` | `204 No Content` | `404 Not Found` |

### Exemplo de Objeto de Nota (`data.json`)

```json
{
  "id": "1795023295433",
  "titulo": "Lembretes",
  "texto": "Comprar leite e pão",
  "categoria": "Lembrete",
  "cor": "#A2CBAF",
  "criadoEm": "2026-04-28T10:00:00Z",
  "atualizadoEm": "2026-11-18T17:34:55.448Z"
}
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** (versão 20 ou superior)

### 1. Clonar o repositório
```bash
git clone https://github.com/ahslammendes/projeto_em_express_api_crud.git
cd projeto_em_express_api_crud
```

### 2. Iniciar o Back-end (Express.js)
Na raiz do projeto, instale as dependências e inicie o servidor:
```bash
npm install
node server.js
```
O servidor ficará disponível em `http://localhost:3000` (e as notas em `http://localhost:3000/api/notes`).

### 3. Iniciar o Front-end (React + Vite)
Em outro terminal, acesse a pasta `frontend/`, instale as dependências e rode o servidor de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
Abra `http://localhost:5173` no navegador.

> **Dica:** Para apontar o front-end local para o back-end local durante o desenvolvimento, defina a variável `VITE_API_URL=http://localhost:3000/api/notes` (ou edite `URL_BASE` em `frontend/src/api.js`).

---

## 🌐 Deploy

- **Back-end (Render)**:
  - **Build Command:** `npm install`
  - **Start Command:** `node server.js`
- **Front-end (Vercel)**:
  - **Root Directory:** `frontend`
  - **Framework Preset:** `Vite`
  - **Variável de Ambiente (opcional):** `VITE_API_URL=https://projeto-em-express-api-crud.onrender.com/api/notes`

---

## 🛠️ Tecnologias Utilizadas

- **Back-end:** Node.js, Express.js 5, CORS, File System (`fs/promises`)
- **Front-end:** React 19, Vite 8, CSS Custom Properties + Grid/Flexbox
- **Hospedagem:** Render (API) e Vercel (Front-end)
