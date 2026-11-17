# API de Restaurante

API REST para gerenciar o cardápio de um restaurante, desenvolvida para a disciplina de Web 2 (Sistemas de Informação).

**URL em produção:** https://SEU-APP.onrender.com

## Integrantes
| Nome | Responsabilidade |
|------|------------------|
| Arthur | CRUD dos pratos |
| Danilo | Middlewares |
| Carol | Logs + PDF |
| Seu Nome | GitHub, deploy e documentação |

## Tecnologias
Node.js · Express · MongoDB Atlas · PDFKit

## Como instalar
```bash
git clone https://github.com/SEU-USUARIO/api-restaurante.git
cd api-restaurante
npm install
```

## Como executar
```bash
npm start        
npm run dev      
```
Servidor em `http://localhost:3000`.

## Configurar o MongoDB Atlas
1. Crie um cluster gratuito no [MongoDB Atlas](https://www.mongodb.com/atlas/database) e um usuário de banco em **Database Access**.
2. Em **Network Access**, permita o endereço IP da máquina que executará a API (evite liberar `0.0.0.0/0` para uso permanente).
3. No cluster, selecione **Connect → Drivers → Node.js** e copie a URI `mongodb+srv://...`.
4. Na pasta `api-restaurante`, copie `.env.example` para `.env` e preencha `MONGODB_URI` com a URI copiada. Substitua usuário e senha pelos dados do usuário de banco; codifique caracteres especiais da senha para URL.
5. Opcionalmente, defina `MONGODB_DB` (padrão: `restaurante`) e `PORT` (padrão: `3000`).
6. Execute `npm install` e `npm run dev`.

O `.env` está ignorado pelo Git. A primeira inicialização cria índices e insere os dez pratos iniciais se a coleção `pratos` estiver vazia. Os pratos e logs passam a ser persistidos no Atlas. No Render, cadastre `MONGODB_URI` e `MONGODB_DB` em **Environment**; o serviço recebe a porta por `PORT`.

## Modelo de dados
```json
{ "codigo": 1, "nome": "Hambúrguer Bacon", "categoria": "Hambúrguer", "preco": 25.90 }
```

## Rotas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /pratos | Lista todos os pratos |
| POST | /pratos | Cadastra um prato |
| GET | /pratos/:codigo | Busca prato por código |
| DELETE | /pratos/:codigo | Remove um prato |
| GET | /pratos/pdf | Gera o cardápio em PDF |
| GET | /logs/:data | Lista requisições de uma data (AAAA-MM-DD) |

## Regras
- A API só funciona de **segunda a sexta**. Sábado e domingo retornam bloqueio.
- Toda requisição é registrada em log (data, horário e rota).

## Exemplos de requisição

**Listar pratos**
```bash
curl https://SEU-APP.onrender.com/pratos
```

**Criar prato**
```bash
curl -X POST https://SEU-APP.onrender.com/pratos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Lasanha","categoria":"Massas","preco":34.90}'
```

**Buscar por código**
```bash
curl https://SEU-APP.onrender.com/pratos/1
```

**Deletar**
```bash
curl -X DELETE https://SEU-APP.onrender.com/pratos/1
```

**Logs por data**
```bash
curl https://SEU-APP.onrender.com/logs/2026-09-25
```

**PDF**
```bash
curl -o cardapio.pdf https://SEU-APP.onrender.com/pratos/pdf
```

## Fluxo de trabalho (Git)
Cada integrante trabalha em uma branch `feature/*` e abre um Pull Request para `main`.
