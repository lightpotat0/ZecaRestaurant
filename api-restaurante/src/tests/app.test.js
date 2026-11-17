const request = require("supertest");

jest.mock("../utils/data", () => ({
    ...jest.requireActual("../utils/data"),
    diaDaSemana: jest.fn(() => 1)
}));

const app = require("../server");

describe("Rotas gerais", () => {
    test("200 - GET / lista as rotas disponíveis", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.body.mensagem).toMatch(/API de Pratos/);
        expect(Array.isArray(res.body.rotas)).toBe(true);
    });

    test("404 - rota inexistente", async () => {
        const res = await request(app).get("/rota-que-nao-existe");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Rota não encontrada" });
    });

    test("404 - método não implementado em rota existente", async () => {
        const res = await request(app).put("/pratos/1").send({ nome: "X" });

        expect(res.status).toBe(404);
    });

    test("400 - JSON malformado no corpo", async () => {
        const res = await request(app)
            .post("/pratos")
            .set("Content-Type", "application/json")
            .send("{nome: invalido");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "JSON inválido no corpo da requisição" });
    });
});