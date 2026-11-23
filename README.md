# Zeca Restaurant API

API REST de cardápio de restaurante, feita com **Node.js + Express**, dados no **MongoDB Atlas**, imagens no **Cloudinary**, login com **segundo fator por e-mail** e testes com **Jest**.

Em produção (Vercel): Não subi para a Vercel ainda

## Tecnologias

| Necessidade | Solução |
|---|---|
| Banco de dados em nuvem | MongoDB Atlas + Mongoose |
| Imagens em nuvem | Cloudinary (+ Multer para receber o arquivo) |
| Senha criptografada | bcryptjs (hash com salt) |
| 2º fator | Código de 6 dígitos por e-mail (Nodemailer) |
| Sessão | JWT (validade de 1 hora) |
| CORS | `cors`, aceitando só o próprio servidor |
| Testes | Jest + Supertest + mongodb-memory-server |
| PDF | PDFKit |

## Como rodar

```bash
npm install
cp .env.example .env     # preencha as variáveis (veja abaixo)
npm run seed             # carrega os 10 pratos iniciais no MongoDB
npm run dev              # http://localhost:3000
npm test                 # roda os testes automatizados
```

### Variáveis de ambiente (`.env`)

| Variável | Para quê |
|---|---|
| `MONGODB_URI` | String de conexão do MongoDB Atlas (Connect → Drivers) |
| `JWT_SECRET` | Texto longo e aleatório para assinar os tokens |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (painel do Cloudinary) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Servidor de e-mail. No Gmail, use uma **senha de app** |

> O `.env` não vai para o GitHub (está no `.gitignore`). Na Vercel, cadastre as mesmas variáveis em **Settings → Environment Variables**. No Atlas, libere o IP `0.0.0.0/0` em **Network Access**, pois a Vercel não tem IP fixo.

## Regras gerais

- **Segunda a sexta:** aos sábados e domingos (horário de Fortaleza) toda a API responde `403`.
- **Logs:** toda requisição grava data, horário, rota e método no banco.
- **CORS:** só é aceita requisição cujo `Origin` seja o próprio servidor. Requisições de outros sites não recebem os cabeçalhos CORS e o navegador as bloqueia.
- **Rotas protegidas** exigem o cabeçalho `Authorization: Bearer <token>`.

## Autenticação (2 fatores)

Fluxo: **registrar → login (envia código) → verificar código (recebe token)**.

### `POST /auth/registrar`
```json
{ "nome": "Ana", "email": "ana@email.com", "senha": "123456" }
```
- `201` usuário criado (a senha é salva apenas como hash bcrypt) · `400` campos faltando ou senha com menos de 6 caracteres · `409` e-mail já cadastrado

### `POST /auth/login`
```json
{ "email": "ana@email.com", "senha": "123456" }
```
- `200` código de 6 dígitos enviado por e-mail (vale 5 minutos) · `401` e-mail ou senha inválidos

### `POST /auth/verificar`
```json
{ "email": "ana@email.com", "codigo": "482913" }
```
- `200` `{ "token": "eyJ..." }` · `401` código incorreto, expirado ou já usado (máximo de 5 tentativas)

## Pratos

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/pratos` | não | Lista todos os pratos |
| GET | `/pratos/:codigo` | não | Busca um prato pelo código (`404` se não existir) |
| POST | `/pratos` | **sim** | Cadastra um prato (JSON ou `multipart/form-data` com imagem) |
| DELETE | `/pratos/:codigo` | **sim** | Remove o prato e a imagem da nuvem |
| GET | `/pratos/pdf` | não | Gera o cardápio em PDF |

### `POST /pratos`

Sem imagem (JSON):
```json
{ "nome": "Tapioca", "categoria": "Lanche", "preco": 9.5 }
```

Com imagem (`multipart/form-data`):
```bash
curl -X POST https://SEU-APP.vercel.app/pratos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "nome=Açaí" -F "categoria=Sobremesa" -F "preco=20" \
  -F "imagem=@foto.png"
```
Resposta `201`:
```json
{ "codigo": 11, "nome": "Açaí", "categoria": "Sobremesa", "preco": 20, "imagemUrl": "https://res.cloudinary.com/..." }
```
`400` se faltar campo, o preço for inválido ou o arquivo não for imagem (máx. 5 MB).

## Logs

### `GET /logs?data=28/09/2026`
Aceita `DD/MM/AAAA` ou `AAAA-MM-DD`.
```json
{
  "data": "28/09/2026",
  "total": 2,
  "registros": [
    { "data": "28/09/2026", "horario": "10:15:32", "rota": "/pratos", "metodo": "GET" }
  ]
}
```
`400` se a data faltar ou for inválida.

## Exportar CSV

### `GET /exportar/pratos` (requer token)
Baixa `pratos.csv` (separador `;`, abre direto no Excel em português).

Na página inicial (`/`) há o botão **Exportar**: a pessoa entra com e-mail e senha, digita o código recebido e clica em *Exportar* para baixar o arquivo.

## Outras rotas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Página com o botão Exportar |
| GET | `/status` | Confirma que a API está no ar |

## Testes

`npm test` sobe um MongoDB temporário em memória e cobre todas as rotas: status, bloqueio de fim de semana, CORS, registro/login/2FA, CRUD de pratos (inclusive upload de imagem), PDF, CSV e logs. O envio de e-mail e o Cloudinary são simulados (mock), então nada externo é usado nos testes.

## Estrutura

```
src/
  app.js              # monta o Express (CORS, middlewares, rotas)
  server.js           # sobe o servidor / exporta para a Vercel
  config/db.js        # conexão MongoDB
  models/             # User, Prato, Log
  middlewares/        # horario, logger, auth, conexao
  routes/             # auth, pratos, logs, exportar
  services/           # pdf, email, imagem
  utils/              # data, csv, relogio, asyncHandler
public/index.html     # botão Exportar
scripts/seed.js       # carga inicial
tests/api.test.js     # testes Jest
```
