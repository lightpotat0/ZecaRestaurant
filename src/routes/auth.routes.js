import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/User.js";
import { enviarCodigo } from "../services/email.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const EXPIRACAO_MS = 5 * 60 * 1000;
const MAX_TENTATIVAS = 5;

// POST /auth/registrar  { nome, email, senha }
router.post("/auth/registrar", asyncHandler(async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Preencha nome, email e senha" });
    }
    if (String(senha).length < 6) {
        return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });
    }
    if (await User.findOne({ email: String(email).toLowerCase() })) {
        return res.status(409).json({ erro: "E-mail já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);
    const usuario = await User.create({ nome, email, senhaHash });

    res.status(201).json({ id: usuario._id, nome: usuario.nome, email: usuario.email });
}));

// POST /auth/login  { email, senha }  -> 1º fator: envia o código por e-mail
router.post("/auth/login", asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Informe email e senha" });
    }

    const usuario = await User.findOne({ email: String(email).toLowerCase() });
    const senhaOk = usuario && (await bcrypt.compare(String(senha), usuario.senhaHash));

    if (!senhaOk) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const codigo = String(crypto.randomInt(100000, 1000000));

    usuario.codigo2fa = {
        hash: await bcrypt.hash(codigo, 8),
        expira: new Date(Date.now() + EXPIRACAO_MS),
        tentativas: 0
    };
    await usuario.save();

    await enviarCodigo(usuario.email, codigo);

    res.status(200).json({ mensagem: "Código de verificação enviado por e-mail" });
}));

// POST /auth/verificar  { email, codigo }  -> 2º fator: devolve o token JWT
router.post("/auth/verificar", asyncHandler(async (req, res) => {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
        return res.status(400).json({ erro: "Informe email e codigo" });
    }

    const usuario = await User.findOne({ email: String(email).toLowerCase() });
    const dados = usuario?.codigo2fa;

    if (!dados?.hash || dados.expira < new Date() || dados.tentativas >= MAX_TENTATIVAS) {
        return res.status(401).json({ erro: "Código expirado ou inválido. Faça login novamente." });
    }

    if (!(await bcrypt.compare(String(codigo), dados.hash))) {
        usuario.codigo2fa.tentativas += 1;
        await usuario.save();
        return res.status(401).json({ erro: "Código incorreto" });
    }

    usuario.codigo2fa = undefined; // código só vale uma vez
    await usuario.save();

    const token = jwt.sign(
        { id: usuario._id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.status(200).json({ token });
}));

export default router;
