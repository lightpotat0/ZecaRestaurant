import bcrypt from "bcrypt";
import express from "express";
import { colecao } from "../database.js";

const SALT_ROUNDS = 12;
const emailValido = email => /^\S+@\S+\.\S+$/.test(email);

export function criarRotasUsuarios({ obterColecaoUsuarios = () => colecao("usuarios") } = {}) {
    const router = express.Router();

    router.post("/usuarios", async (req, res, next) => {
        try {
            const body = req.body && typeof req.body === "object" ? req.body : {};
            const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
            const senha = body.senha;

            if (!emailValido(email) || typeof senha !== "string" || senha.length < 8 || Buffer.byteLength(senha, "utf8") > 72) {
                return res.status(400).json({ erro: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres e no máximo 72 bytes" });
            }

            const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
            const resultado = await obterColecaoUsuarios().insertOne({ email, senhaHash, criadoEm: new Date() });

            res.status(201).json({ id: resultado.insertedId.toString(), email });
        } catch (erro) {
            if (erro?.code === 11000) {
                return res.status(409).json({ erro: "Já existe um usuário com esse e-mail" });
            }
            next(erro);
        }
    });

    router.post("/usuarios/login", async (req, res, next) => {
        try {
            const body = req.body && typeof req.body === "object" ? req.body : {};
            const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
            const senha = body.senha;

            if (!emailValido(email) || typeof senha !== "string" || Buffer.byteLength(senha, "utf8") > 72) {
                return res.status(400).json({ erro: "Informe um e-mail válido e uma senha válida" });
            }

            const usuario = await obterColecaoUsuarios().findOne({ email });
            const senhaCorreta = usuario && await bcrypt.compare(senha, usuario.senhaHash);
            if (!senhaCorreta) {
                return res.status(401).json({ erro: "E-mail ou senha incorretos" });
            }

            res.status(200).json({
                mensagem: "Login realizado com sucesso",
                usuario: { id: usuario._id.toString(), email: usuario.email }
            });
        } catch (erro) {
            next(erro);
        }
    });

    return router;
}

export default criarRotasUsuarios();
