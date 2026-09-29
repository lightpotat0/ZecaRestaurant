import express from "express";
import { logs } from "../data/logs.js";
import { normalizarData } from "../utils/data.js";

const router = express.Router();

// G - GET /logs?data=28/09/2026
// Também aceita 2026-09-28
router.get("/logs", (req, res) => {
    const { data } = req.query;

    if (!data) {
        return res.status(400).json({
            erro: "Informe a data na query string. Ex.: /logs?data=28/09/2026"
        });
    }

    const dataISO = normalizarData(data);

    if (!dataISO) {
        return res.status(400).json({
            erro: "Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD"
        });
    }

    const registros = logs
        .filter(log => log.dataISO === dataISO)
        .map(({ dataISO, ...resto }) => resto);

    res.status(200).json({
        data,
        total: registros.length,
        registros
    });
});

export default router;