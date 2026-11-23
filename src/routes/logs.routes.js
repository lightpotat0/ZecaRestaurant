import express from "express";
import Log from "../models/Log.js";
import { normalizarData } from "../utils/data.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// GET /logs?data=28/09/2026  (também aceita 2026-09-28)
router.get("/logs", asyncHandler(async (req, res) => {
    const { data } = req.query;

    if (!data) {
        return res.status(400).json({
            erro: "Informe a data na query string. Ex.: /logs?data=28/09/2026"
        });
    }

    const dataISO = normalizarData(String(data));

    if (!dataISO) {
        return res.status(400).json({ erro: "Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD" });
    }

    const registros = await Log.find({ dataISO })
        .select("-_id -__v -dataISO")
        .lean();

    res.status(200).json({ data, total: registros.length, registros });
}));

export default router;
