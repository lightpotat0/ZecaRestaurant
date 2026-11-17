import "dotenv/config";
import express from "express";

import { verificarDiaUtil } from "./middlewares/horario.js";
import { registrarRequisicao } from "./middlewares/logger.js";
import logsRoutes from "./routes/logs.routes.js";
import pratosRoutes from "./routes/pratos.routes.js";
import { conectarBanco, fecharBanco } from "./database.js";

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

const PORT = process.env.PORT || 3000;

try {
    await conectarBanco();
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
} catch (erro) {
    console.error("Não foi possível iniciar a API:", erro.message);
    process.exit(1);
}

for (const sinal of ["SIGINT", "SIGTERM"]) {
    process.on(sinal, async () => {
        await fecharBanco();
        process.exit(0);
    });
}
