import express from "express";
import pratos from "../data/pratos.js";
import { gerarPdfCardapio } from "../services/pdf.js";

const router = express.Router();

// H - GET /pratos/pdf
router.get("/pratos/pdf", (req, res) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="cardapio.pdf"');
    gerarPdfCardapio(res, pratos);
});

// A - GET /pratos
router.get("/pratos", (req, res) => {
    res.status(200).json(pratos);
});

// D - GET /pratos/:codigo
router.get("/pratos/:codigo", (req, res) => {
    const codigo = Number(req.params.codigo);
    const prato = pratos.find(item => item.codigo === codigo);

    if (!prato) {
        return res.status(404).json({ erro: "Prato não encontrado" });
    }

    res.status(200).json(prato);
});

// B - POST /pratos
router.post("/pratos", (req, res) => {
    const { nome, categoria, preco } = req.body;

    if (!nome || !categoria || preco === undefined || !Number.isFinite(Number(preco))) {
        return res.status(400).json({ erro: "Preencha nome, categoria e um preço válido" });
    }

    const novoCodigo = pratos.length > 0
        ? Math.max(...pratos.map(prato => prato.codigo)) + 1
        : 1;
    const novoPrato = { codigo: novoCodigo, nome, categoria, preco: Number(preco) };
    pratos.push(novoPrato);

    res.status(201).json(novoPrato);
});

// C - DELETE /pratos/:codigo
router.delete("/pratos/:codigo", (req, res) => {
    const codigo = Number(req.params.codigo);
    const indice = pratos.findIndex(item => item.codigo === codigo);

    if (indice === -1) {
        return res.status(404).json({ erro: "Prato não encontrado" });
    }

    const [pratoRemovido] = pratos.splice(indice, 1);
    res.status(200).json({ mensagem: "Prato removido com sucesso", prato: pratoRemovido });
});

export default router;
import express from "express";
import pratos from "../data/pratos.js"; 

const router = express.Router();

router.get("/pratos", (req, res) => {
    res.status(200).json(pratos);
});

router.get("/pratos/:codigo", (req, res) => {
    const codigo = Number(req.params.codigo);
    const prato = pratos.find(prato => prato.codigo === codigo);

    if (!prato) {
        return res.status(404).json({
            erro: "Prato não encontrado"
        });
    }

    res.status(200).json(prato);
});

router.post("/pratos", (req, res) => {
    const { nome, categoria, preco } = req.body;

    if (!nome || !categoria || preco === undefined) {
        return res.status(400).json({
            erro: "Preencha o nome, categoria e preco"
        });
    }

    const novoCodigo =
        pratos.length > 0
            ? Math.max(...pratos.map(prato => prato.codigo)) + 1
            : 1;

    const novoPrato = {
        codigo: novoCodigo,
        nome,
        categoria,
        preco: Number(preco)
    };

    pratos.push(novoPrato);

    res.status(201).json(novoPrato);
});

router.delete("/pratos/:codigo", (req, res) => {
    const codigo = Number(req.params.codigo);
    const indice = pratos.findIndex(prato => prato.codigo === codigo);

    if (indice === -1) {
        return res.status(404).json({
            erro: "Prato não encontrado"
        });
    }

    const pratoRemovido = pratos.splice(indice, 1)[0];

    res.status(200).json({
        mensagem: "Prato removido com sucesso",
        prato: pratoRemovido
    });
});

export default router;
