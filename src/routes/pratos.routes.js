import express from "express";
import multer from "multer";
import Prato from "../models/Prato.js";
import { autenticar } from "../middlewares/auth.js";
import { gerarPdfCardapio } from "../services/pdf.js";
import { enviarImagem, removerImagem } from "../services/imagem.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("TIPO_INVALIDO"))
});

const SEM_CAMPOS_INTERNOS = "-_id -__v -imagemPublicId";

// GET /pratos
router.get("/pratos", asyncHandler(async (req, res) => {
    const pratos = await Prato.find().sort({ codigo: 1 }).select(SEM_CAMPOS_INTERNOS).lean();
    res.status(200).json(pratos);
}));

// GET /pratos/pdf  (precisa vir antes de /pratos/:codigo)
router.get("/pratos/pdf", asyncHandler(async (req, res) => {
    const pratos = await Prato.find().sort({ codigo: 1 }).lean();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="cardapio.pdf"');
    gerarPdfCardapio(res, pratos);
}));

// GET /pratos/:codigo
router.get("/pratos/:codigo", asyncHandler(async (req, res) => {
    const prato = await Prato.findOne({ codigo: Number(req.params.codigo) })
        .select(SEM_CAMPOS_INTERNOS)
        .lean();

    if (!prato) {
        return res.status(404).json({ erro: "Prato não encontrado" });
    }
    res.status(200).json(prato);
}));

// POST /pratos  (JSON ou multipart/form-data com o campo "imagem")
router.post("/pratos", autenticar, upload.single("imagem"), asyncHandler(async (req, res) => {
    const { nome, categoria, preco } = req.body;

    if (!nome || !categoria || preco === undefined || preco === "") {
        return res.status(400).json({ erro: "Preencha o nome, categoria e preco" });
    }
    if (Number.isNaN(Number(preco)) || Number(preco) < 0) {
        return res.status(400).json({ erro: "Preço inválido" });
    }

    const ultimo = await Prato.findOne().sort({ codigo: -1 }).lean();
    const dados = {
        codigo: ultimo ? ultimo.codigo + 1 : 1,
        nome,
        categoria,
        preco: Number(preco)
    };

    if (req.file) {
        const { url, publicId } = await enviarImagem(req.file.buffer);
        dados.imagemUrl = url;
        dados.imagemPublicId = publicId;
    }

    const novo = await Prato.create(dados);

    res.status(201).json({
        codigo: novo.codigo,
        nome: novo.nome,
        categoria: novo.categoria,
        preco: novo.preco,
        imagemUrl: novo.imagemUrl
    });
}));

// DELETE /pratos/:codigo
router.delete("/pratos/:codigo", autenticar, asyncHandler(async (req, res) => {
    const removido = await Prato.findOneAndDelete({ codigo: Number(req.params.codigo) });

    if (!removido) {
        return res.status(404).json({ erro: "Prato não encontrado" });
    }

    if (removido.imagemPublicId) {
        await removerImagem(removido.imagemPublicId).catch(() => {});
    }

    res.status(200).json({
        mensagem: "Prato removido com sucesso",
        prato: {
            codigo: removido.codigo,
            nome: removido.nome,
            categoria: removido.categoria,
            preco: removido.preco
        }
    });
}));

export default router;
