import express from "express";

import { verificarDiaUtil } from "./middlewares/horario.js";
import { registrarRequisicao } from "./middlewares/logger.js";
import logsRoutes from "./routes/logs.routes.js";
import pratosRoutes from "./routes/pratos.routes.js";

const app = express();

app.use(express.json());

app.use(registrarRequisicao);
app.use(verificarDiaUtil);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Restaurante funcionando!"
    });
});

app.use(logsRoutes);
app.use(pratosRoutes); 

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});