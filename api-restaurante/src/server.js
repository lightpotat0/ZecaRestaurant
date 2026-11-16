import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";

import { verificarDiaUtil } from "./middlewares/horario.js";
import { registrarRequisicao } from "./middlewares/logger.js";
import logsRoutes from "./routes/logs.routes.js";
import pratosRoutes from "./routes/pratos.routes.js";

const app = express();
const publicPath = fileURLToPath(new URL("../public", import.meta.url));

app.use(express.json());

app.use(registrarRequisicao);
app.use(verificarDiaUtil);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Restaurante funcionando!"
    });
});

// Libera a pasta public/ (onde está o index.html com o botão 'Exportar')
app.use(express.static(publicPath));

app.use(logsRoutes);
app.use(pratosRoutes);

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
    console.log("Tela de upload e exportação em http://localhost:3000/index.html");
});