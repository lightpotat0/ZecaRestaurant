import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Serviços externos (e-mail e Cloudinary) são simulados nos testes.
const enviarCodigo = jest.fn().mockResolvedValue();
const enviarImagem = jest.fn().mockResolvedValue({ url: "https://img.teste/prato.png", publicId: "pratos/abc" });
const removerImagem = jest.fn().mockResolvedValue();

jest.unstable_mockModule("../src/services/email.js", () => ({ enviarCodigo }));
jest.unstable_mockModule("../src/services/imagem.js", () => ({ enviarImagem, removerImagem }));

const SEGUNDA = new Date("2026-09-28T15:00:00Z");
const SABADO = new Date("2026-09-26T15:00:00Z");

const usuario = { nome: "Ana", email: "ana@teste.com", senha: "123456" };

let mongo, app, relogio, Prato, User, token;

const binario = (res, cb) => {
    const partes = [];
    res.on("data", p => partes.push(p));
    res.on("end", () => cb(null, Buffer.concat(partes)));
};


beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_SECRET = "segredo-de-teste";

    ({ default: app } = await import("../src/app.js"));
    ({ relogio } = await import("../src/utils/relogio.js"));
    ({ default: Prato } = await import("../src/models/Prato.js"));
    ({ default: User } = await import("../src/models/User.js"));

});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

beforeEach(() => {
    jest.spyOn(relogio, "agora").mockReturnValue(SEGUNDA);
});

describe("Status e acesso apenas de segunda a sexta", () => {
    test("GET /status responde 200 em dia útil", async () => {
        const res = await request(app).get("/status");
        expect(res.status).toBe(200);
        expect(res.body.mensagem).toMatch(/funcionando/i);
    });

    test("GET / entrega a página com o botão Exportar", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Exportar");
    });

    test("bloqueia a API no sábado com 403", async () => {
        relogio.agora.mockReturnValue(SABADO);
        const res = await request(app).get("/pratos");
        expect(res.status).toBe(403);
        expect(res.body.erro).toMatch(/finais de semana/i);
    });
});

describe("CORS", () => {
    test("aceita Origin igual ao próprio servidor", async () => {
        const res = await request(app)
            .get("/status")
            .set("Host", "localhost:3000")
            .set("Origin", "http://localhost:3000");
        expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    });

    test("não libera Origin de outro site", async () => {
        const res = await request(app)
            .get("/status")
            .set("Host", "localhost:3000")
            .set("Origin", "http://site-malicioso.com");
        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
});

describe("Autenticação com segundo fator", () => {
    test("POST /auth/registrar cria usuário com a senha criptografada", async () => {
        const res = await request(app).post("/auth/registrar").send(usuario);
        expect(res.status).toBe(201);
        expect(res.body.senha).toBeUndefined();

        const salvo = await User.findOne({ email: usuario.email });
        expect(salvo.senhaHash).not.toBe(usuario.senha);
        expect(salvo.senhaHash.startsWith("$2")).toBe(true); // formato bcrypt
    });

    test("POST /auth/registrar valida campos e e-mail repetido", async () => {
        expect((await request(app).post("/auth/registrar").send({ email: "x@x.com" })).status).toBe(400);
        expect((await request(app).post("/auth/registrar").send({ ...usuario, email: "b@b.com", senha: "123" })).status).toBe(400);
        expect((await request(app).post("/auth/registrar").send(usuario)).status).toBe(409);
    });

    test("POST /auth/login recusa senha errada", async () => {
        const res = await request(app).post("/auth/login").send({ email: usuario.email, senha: "errada" });
        expect(res.status).toBe(401);
        expect(enviarCodigo).not.toHaveBeenCalled();
    });

    test("POST /auth/login envia o código por e-mail", async () => {
        const res = await request(app).post("/auth/login").send({ email: usuario.email, senha: usuario.senha });
        expect(res.status).toBe(200);
        expect(enviarCodigo).toHaveBeenCalledWith(usuario.email, expect.stringMatching(/^\d{6}$/));
    });

    test("POST /auth/verificar recusa código incorreto", async () => {
        const res = await request(app).post("/auth/verificar").send({ email: usuario.email, codigo: "000000" });
        expect(res.status).toBe(401);
    });

    test("POST /auth/verificar com código correto devolve o token (e só vale uma vez)", async () => {
        const codigo = enviarCodigo.mock.calls.at(-1)[1];
        const res = await request(app).post("/auth/verificar").send({ email: usuario.email, codigo });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        token = res.body.token;

        const repetido = await request(app).post("/auth/verificar").send({ email: usuario.email, codigo });
        expect(repetido.status).toBe(401);
    });

    test("POST /auth/verificar exige email e codigo", async () => {
        const res = await request(app).post("/auth/verificar").send({});
        expect(res.status).toBe(400);
    });
});

describe("Pratos", () => {
    beforeAll(async () => {
        await Prato.insertMany([
            { codigo: 1, nome: "Pastel", categoria: "Lanche", preco: 10 },
            { codigo: 2, nome: 'Suco "Cajá"; natural', categoria: "Bebida", preco: 8.5 }
        ]);
    });

    test("GET /pratos lista os pratos", async () => {
        const res = await request(app).get("/pratos");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toMatchObject({ codigo: 1, nome: "Pastel" });
        expect(res.body[0]._id).toBeUndefined();
    });

    test("GET /pratos/:codigo encontra e retorna 404 quando não existe", async () => {
        const ok = await request(app).get("/pratos/1");
        expect(ok.status).toBe(200);
        expect(ok.body.nome).toBe("Pastel");

        const naoExiste = await request(app).get("/pratos/999");
        expect(naoExiste.status).toBe(404);
    });

    test("POST /pratos exige token", async () => {
        const res = await request(app).post("/pratos").send({ nome: "X", categoria: "Y", preco: 1 });
        expect(res.status).toBe(401);
    });

    test("POST /pratos cria prato com código automático", async () => {
        const res = await request(app)
            .post("/pratos")
            .set("Authorization", `Bearer ${token}`)
            .send({ nome: "Tapioca", categoria: "Lanche", preco: "9.5" });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ codigo: 3, nome: "Tapioca", preco: 9.5 });
    });

    test("POST /pratos valida os campos", async () => {
        const auth = { Authorization: `Bearer ${token}` };
        expect((await request(app).post("/pratos").set(auth).send({ nome: "X" })).status).toBe(400);
        expect((await request(app).post("/pratos").set(auth).send({ nome: "X", categoria: "Y", preco: "abc" })).status).toBe(400);
    });

    test("POST /pratos com imagem envia para a nuvem e salva a URL", async () => {
        const res = await request(app)
            .post("/pratos")
            .set("Authorization", `Bearer ${token}`)
            .field("nome", "Açaí")
            .field("categoria", "Sobremesa")
            .field("preco", "20")
            .attach("imagem", Buffer.from("conteudo-falso"), { filename: "foto.png", contentType: "image/png" });

        expect(res.status).toBe(201);
        expect(res.body.imagemUrl).toBe("https://img.teste/prato.png");
        expect(enviarImagem).toHaveBeenCalledTimes(1);
    });

    test("POST /pratos recusa arquivo que não é imagem", async () => {
        const res = await request(app)
            .post("/pratos")
            .set("Authorization", `Bearer ${token}`)
            .field("nome", "X").field("categoria", "Y").field("preco", "1")
            .attach("imagem", Buffer.from("texto"), { filename: "a.txt", contentType: "text/plain" });
        expect(res.status).toBe(400);
    });

    test("GET /pratos/pdf devolve um PDF", async () => {
        const res = await request(app).get("/pratos/pdf").buffer(true).parse(binario);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("application/pdf");
        expect(res.body.subarray(0, 4).toString()).toBe("%PDF");
    });

    test("DELETE /pratos/:codigo exige token", async () => {
        const res = await request(app).delete("/pratos/1");
        expect(res.status).toBe(401);
    });

    test("DELETE /pratos/:codigo remove o prato (e a imagem da nuvem)", async () => {
        const auth = { Authorization: `Bearer ${token}` };

        const comImagem = await request(app).delete("/pratos/4").set(auth);
        expect(comImagem.status).toBe(200);
        expect(removerImagem).toHaveBeenCalledWith("pratos/abc");

        const semImagem = await request(app).delete("/pratos/3").set(auth);
        expect(semImagem.status).toBe(200);

        const naoExiste = await request(app).delete("/pratos/999").set(auth);
        expect(naoExiste.status).toBe(404);
    });
});

describe("Exportar CSV", () => {
    test("GET /exportar/pratos exige token", async () => {
        const res = await request(app).get("/exportar/pratos");
        expect(res.status).toBe(401);
    });

    test("GET /exportar/pratos baixa o CSV", async () => {
        const res = await request(app).get("/exportar/pratos").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("text/csv");
        expect(res.headers["content-disposition"]).toContain("attachment");
        expect(res.text).toContain("codigo;nome;categoria;preco;imagemUrl");
        expect(res.text).toContain("1;Pastel;Lanche;10,00");
        expect(res.text).toContain('"Suco ""Cajá""; natural"'); // escape correto
    });
});

describe("Logs de requisição", () => {
    test("GET /logs sem data retorna 400", async () => {
        const res = await request(app).get("/logs");
        expect(res.status).toBe(400);
    });

    test("GET /logs com data inválida retorna 400", async () => {
        const res = await request(app).get("/logs?data=abc");
        expect(res.status).toBe(400);
    });

    test("GET /logs?data= retorna os registros do dia (DD/MM/AAAA e AAAA-MM-DD)", async () => {
        const br = await request(app).get("/logs?data=28/09/2026");
        expect(br.status).toBe(200);
        expect(br.body.total).toBeGreaterThan(0);
        expect(br.body.registros[0]).toEqual(
            expect.objectContaining({ data: "28/09/2026", rota: expect.any(String), metodo: expect.any(String), horario: expect.any(String) })
        );
        expect(br.body.registros.some(r => r.rota === "/status")).toBe(true);

        const iso = await request(app).get("/logs?data=2026-09-28");
        expect(iso.body.total).toBeGreaterThanOrEqual(br.body.total);
    });

    test("GET /logs de uma data sem requisições retorna lista vazia", async () => {
        const res = await request(app).get("/logs?data=01/01/2020");
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(0);
    });
});
