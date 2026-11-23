import express from "express";
import Prato from "../models/Prato.js";
import { autenticar } from "../middlewares/auth.js";
import { paraCsv } from "../utils/csv.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// GET /exportar/pratos  -> baixa pratos.csv
router.get("/exportar/pratos", autenticar, asyncHandler(async (req, res) => {
    const pratos = await Prato.find().sort({ codigo: 1 }).lean();

    const linhas = pratos.map(p => ({
        ...p,
        preco: p.preco.toFixed(2).replace(".", ",")
    }));

    const csv = paraCsv(linhas, ["codigo", "nome", "categoria", "preco", "imagemUrl"]);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="pratos.csv"');
    res.status(200).send(csv);
}));

export default router;
