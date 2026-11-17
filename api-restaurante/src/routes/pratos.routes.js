import express from "express";
import { colecao } from "../database.js";
import { gerarPdfCardapio } from "../services/pdf.js";

const router = express.Router();

router.get("/pratos", async (req, res, next) => {
    try {
        res.status(200).json(await colecao("pratos").find({}, { projection: { _id: 0 } }).sort({ codigo: 1 }).toArray());
    } catch (erro) { next(erro); }
});

router.get("/pratos/pdf", async (req, res, next) => {
    try {
        const pratos = await colecao("pratos").find({}, { projection: { _id: 0 } }).sort({ codigo: 1 }).toArray();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="cardapio.pdf"');
        gerarPdfCardapio(res, pratos);
    } catch (erro) { next(erro); }
});

router.get("/pratos/:codigo", async (req, res, next) => {
    try {
        const codigo = Number(req.params.codigo);
        const prato = await colecao("pratos").findOne({ codigo }, { projection: { _id: 0 } });
        if (!prato) return res.status(404).json({ erro: "Prato não encontrado" });
        res.status(200).json(prato);
    } catch (erro) { next(erro); }
});

router.post("/pratos", async (req, res, next) => {
    try {
        const { nome, categoria, preco } = req.body;
        if (!nome || !categoria || preco === undefined || !Number.isFinite(Number(preco))) {
            return res.status(400).json({ erro: "Preencha nome, categoria e um preço válido" });
        }
        const pratos = colecao("pratos");
        const ultimo = await pratos.findOne({}, { sort: { codigo: -1 }, projection: { codigo: 1 } });
        const novoPrato = { codigo: (ultimo?.codigo || 0) + 1, nome, categoria, preco: Number(preco) };
        await pratos.insertOne(novoPrato);
        res.status(201).json(novoPrato);
    } catch (erro) { next(erro); }
});

router.delete("/pratos/:codigo", async (req, res, next) => {
    try {
        const pratos = colecao("pratos");
        const codigo = Number(req.params.codigo);
        const pratoRemovido = await pratos.findOneAndDelete({ codigo });
        if (!pratoRemovido) return res.status(404).json({ erro: "Prato não encontrado" });
        const { _id, ...prato } = pratoRemovido;
        res.status(200).json({ mensagem: "Prato removido com sucesso", prato });
    } catch (erro) { next(erro); }
});

export default router;
