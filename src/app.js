import express from "express";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "node:url";

import { garantirConexao } from "./middlewares/conexao.js";
import { verificarDiaUtil } from "./middlewares/horario.js";
import { registrarRequisicao } from "./middlewares/logger.js";
import authRoutes from "./routes/auth.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import pratosRoutes from "./routes/pratos.routes.js";
import exportarRoutes from "./routes/exportar.routes.js";

const app = express();

// CORS: só aceita requisições cujo Origin seja o próprio servidor (mesmo host).
// Requisições sem Origin (mesma origem, Postman, curl) passam normalmente.
app.use(cors((req, callback) => {
    const origin = req.headers.origin;
    let mesmoServidor = !origin;

    if (origin) {
        try {
            mesmoServidor = new URL(origin).host === req.headers.host;
        } catch {
            mesmoServidor = false;
        }
    }
    callback(null, { origin: mesmoServidor });
}));

app.use(express.json());

// Página com o botão "Exportar"
app.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));

app.use(garantirConexao);
app.use(registrarRequisicao);
app.use(verificarDiaUtil);

app.get("/status", (req, res) => {
    res.json({ mensagem: "API do Restaurante funcionando!" });
});

app.use(authRoutes);
app.use(logsRoutes);
app.use(pratosRoutes);
app.use(exportarRoutes);

app.use((err, req, res, next) => {
    if (err.message === "TIPO_INVALIDO") {
        return res.status(400).json({ erro: "O arquivo enviado não é uma imagem" });
    }
    if (err instanceof multer.MulterError) {
        const mensagens = {
            LIMIT_FILE_SIZE: "A imagem passa de 5 MB",
            LIMIT_UNEXPECTED_FILE: 'Envie o arquivo no campo chamado imagem'
        };
        return res.status(400).json({ erro: mensagens[err.code] || "Erro no envio do arquivo" });
    }
    console.error(err);
    res.status(500).json({ erro: "Erro interno do servidor" });
});

export default app;
