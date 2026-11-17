import express from "express";
import { colecao } from "../database.js";
import { normalizarData } from "../utils/data.js";

const router = express.Router();

// G - GET /logs?data=28/09/2026
// Também aceita 2026-09-28
router.get("/logs", async (req, res, next) => {
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

    try {
        const registros = await colecao("logs").find({ dataISO }, { projection: { _id: 0, dataISO: 0 } }).toArray();
        res.status(200).json({ data, total: registros.length, registros });
    } catch (erro) { next(erro); }
});

export default router;
