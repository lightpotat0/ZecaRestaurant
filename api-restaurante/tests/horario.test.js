const request = require("supertest");

jest.mock("../src/utils/data", () => ({
    ...jest.requireActual("../src/utils/data"),
    diaDaSemana: jest.fn(() => 1)
}));

const app = require("../server");
const { diaDaSemana, agoraFormatado } = require("../utils/data");

beforeEach(() => diaDaSemana.mockReturnValue(1));

describe("Middleware de dias úteis (segunda a sexta)", () => {
    test.each([
        [1, "segunda"],
        [2, "terça"],
        [3, "quarta"],
        [4, "quinta"],
        [5, "sexta"]
    ])("200 - libera o acesso na %s", async dia => {
        diaDaSemana.mockReturnValue(dia);

        const res = await request(app).get("/pratos");

        expect(res.status).toBe(200);
    });

    test.each([
        [6, "sábado"],
        [0, "domingo"]
    ])("403 - bloqueia o acesso no %s", async dia => {
        diaDaSemana.mockReturnValue(dia);

        const res = await request(app).get("/pratos");

        expect(res.status).toBe(403);
        expect(res.body).toEqual({
            erro: "A API não está disponível aos finais de semana."
        });
    });

    test("403 - bloqueia todas as rotas no fim de semana", async () => {
        diaDaSemana.mockReturnValue(6);

        const respostas = await Promise.all([
            request(app).get("/"),
            request(app).get("/pratos/1"),
            request(app).post("/pratos").send({ nome: "X", categoria: "Y", preco: 1 }),
            request(app).delete("/pratos/1"),
            request(app).get("/pratos/pdf"),
            request(app).get("/logs").query({ data: "01/01/2000" })
        ]);

        respostas.forEach(res => expect(res.status).toBe(403));
    });

    test("o bloqueio não apaga o prato (DELETE não chega à rota)", async () => {
        diaDaSemana.mockReturnValue(6);
        await request(app).delete("/pratos/1");

        diaDaSemana.mockReturnValue(1);
        const res = await request(app).get("/pratos/1");

        expect(res.status).toBe(200);
    });

    test("requisições bloqueadas também são registradas no log", async () => {
        diaDaSemana.mockReturnValue(0);
        await request(app).get("/pratos/bloqueado-no-domingo");

        diaDaSemana.mockReturnValue(1);
        const res = await request(app).get("/logs").query({ data: agoraFormatado().data });

        expect(res.body.registros.some(r => r.rota === "/pratos/bloqueado-no-domingo")).toBe(true);
    });
});