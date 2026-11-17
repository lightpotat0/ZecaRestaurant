const express = require("express");

const { registrarRequisicao } = require("./middlewares/logger");
const { verificarDiaUtil } = require("./middlewares/horario");

const pdfRoutes = require("./routes/pdf.routes");
const pratosRoutes = require("./routes/pratos.routes");
const logsRoutes = require("./routes/logs.routes");

const app = express();

app.use(express.json());

// F - registra toda requisição (inclusive as bloqueadas no fim de semana)
app.use(registrarRequisicao);

// E - libera a API somente de segunda a sexta
app.use(verificarDiaUtil);

app.get("/", (req, res) => {
    res.status(200).json({
        mensagem: "API de Pratos no ar",
        rotas: [
            "GET    /pratos",
            "GET    /pratos/:codigo",
            "POST   /pratos",
            "DELETE /pratos/:codigo",
            "GET    /pratos/pdf",
            "GET    /logs?data=DD/MM/AAAA"
        ]
    });
});

// O PDF vem ANTES das rotas de pratos, senão "/pratos/pdf" cairia em "/pratos/:codigo"
app.use(pdfRoutes);
app.use(pratosRoutes);
app.use(logsRoutes);

// Rota inexistente
app.use((req, res) => {
    res.status(404).json({ erro: "Rota não encontrada" });
});

// Erros (ex.: JSON inválido no body)
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ erro: "JSON inválido no corpo da requisição" });
    }
    console.error(err);
    res.status(500).json({ erro: "Erro interno do servidor" });
});

// Sobe o servidor só quando executado direto (node src/server.js).
// Nos testes (Jest) e na Vercel o app é apenas importado.
if (require.main === module) {
    const PORTA = process.env.PORT || 3000;
    app.listen(PORTA, () => {
        console.log(`Servidor rodando em http://localhost:${PORTA}`);
    });
}

// Necessário para a Vercel
module.exports = app;