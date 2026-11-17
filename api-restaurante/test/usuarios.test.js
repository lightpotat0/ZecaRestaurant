import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import bcrypt from "bcrypt";
import express from "express";
import request from "supertest";
import { criarRotasUsuarios } from "../src/routes/usuarios.routes.js";

describe("cadastro e login de usuários", () => {
    let usuarios;
    let app;

    beforeEach(() => {
        const documentos = [];
        let proximoId = 1;
        usuarios = {
            documentos,
            async insertOne(documento) {
                if (documentos.some(item => item.email === documento.email)) {
                    const erro = new Error("Chave duplicada");
                    erro.code = 11000;
                    throw erro;
                }
                const salvo = { ...documento, _id: String(proximoId++) };
                documentos.push(salvo);
                return { insertedId: salvo._id };
            },
            async findOne(filtro) {
                return documentos.find(item => item.email === filtro.email) ?? null;
            }
        };

        app = express();
        app.use(express.json());
        app.use(criarRotasUsuarios({ obterColecaoUsuarios: () => usuarios }));
    });

    it("armazena hash bcrypt e não expõe a senha no cadastro", async () => {
        const resposta = await request(app)
            .post("/usuarios")
            .send({ email: "Pessoa@Exemplo.com", senha: "senha-segura-123" });

        assert.equal(resposta.status, 201);
        assert.equal(resposta.body.email, "pessoa@exemplo.com");
        assert.equal("senha" in resposta.body, false);
        assert.equal("senhaHash" in resposta.body, false);
        assert.notEqual(usuarios.documentos[0].senhaHash, "senha-segura-123");
        assert.equal(await bcrypt.compare("senha-segura-123", usuarios.documentos[0].senhaHash), true);
    });

    it("aceita login com senha correta", async () => {
        await request(app).post("/usuarios").send({ email: "user@example.com", senha: "senha-segura-123" });

        const resposta = await request(app)
            .post("/usuarios/login")
            .send({ email: "USER@example.com", senha: "senha-segura-123" });

        assert.equal(resposta.status, 200);
        assert.equal(resposta.body.usuario.email, "user@example.com");
        assert.equal("senhaHash" in resposta.body.usuario, false);
        assert.equal("token" in resposta.body, false);
    });

    it("recusa senha incorreta e não revela se o e-mail existe", async () => {
        await request(app).post("/usuarios").send({ email: "user@example.com", senha: "senha-segura-123" });

        const errada = await request(app).post("/usuarios/login").send({ email: "user@example.com", senha: "incorreta-123" });
        const inexistente = await request(app).post("/usuarios/login").send({ email: "missing@example.com", senha: "incorreta-123" });

        assert.equal(errada.status, 401);
        assert.deepEqual(errada.body, inexistente.body);
    });

    it("recusa e-mails duplicados", async () => {
        await request(app).post("/usuarios").send({ email: "user@example.com", senha: "senha-segura-123" });
        const resposta = await request(app).post("/usuarios").send({ email: "USER@example.com", senha: "outra-senha-123" });
        assert.equal(resposta.status, 409);
    });
});
