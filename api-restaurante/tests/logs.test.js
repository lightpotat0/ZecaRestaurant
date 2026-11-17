const request = require("supertest");

jest.mock("../src/utils/data", () => ({
    ...jest.requireActual("../src/utils/data"),
    diaDaSemana: jest.fn(() => 1)
}));

const app = require("../server");
const { agoraFormatado } = require("../utils/data");

describe("GET /logs", () => {
    test("400 - sem informar a data", async () => {
        const res = await request(app).get("/logs");

        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/Informe a data/);
    });

    test.each(["99/99/2026", "31/02/2026", "2026-13-01", "abc", "2026/01/01"])(
        "400 - data inválida (%s)",
        async data => {
            const res = await request(app).get("/logs").query({ data });

            expect(res.status).toBe(400);
            expect(res.body.erro).toMatch(/Data inválida/);
        }
    );

    test("200 - retorna as requisições feitas hoje (DD/MM/AAAA)", async () => {
        await request(app).get("/pratos/1");
        const hoje = agoraFormatado().data;

        const res = await request(app).get("/logs").query({ data: hoje });

        expect(res.status).toBe(200);
        expect(res.body.data).toBe(hoje);
        expect(res.body.total).toBe(res.body.registros.length);
        expect(res.body.total).toBeGreaterThan(0);

        const registro = res.body.registros.find(r => r.rota === "/pratos/1");
        expect(registro).toEqual({
            data: hoje,
            horario: expect.stringMatching(/^\d{2}:\d{2}:\d{2}$/),
            rota: "/pratos/1",
            metodo: "GET"
        });
        // campo interno de busca não deve vazar na resposta
        expect(registro.dataISO).toBeUndefined();
    });

    test("200 - aceita a data no formato AAAA-MM-DD", async () => {
        const hojeISO = agoraFormatado().dataISO;

        const res = await request(app).get("/logs").query({ data: hojeISO });

        expect(res.status).toBe(200);
        expect(res.body.total).toBeGreaterThan(0);
    });

    test("200 - data sem requisições retorna lista vazia", async () => {
        const res = await request(app).get("/logs").query({ data: "01/01/2000" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ data: "01/01/2000", total: 0, registros: [] });
    });

    test("registra o método HTTP de cada requisição", async () => {
        await request(app).post("/pratos").send({ nome: "Log", categoria: "T", preco: 1 });
        const hoje = agoraFormatado().data;

        const res = await request(app).get("/logs").query({ data: hoje });

        expect(res.body.registros.some(r => r.metodo === "POST" && r.rota === "/pratos")).toBe(true);
    });
});