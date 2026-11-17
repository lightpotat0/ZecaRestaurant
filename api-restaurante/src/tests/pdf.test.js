const request = require("supertest");

jest.mock("../utils/data", () => ({
    ...jest.requireActual("../utils/data"),
    diaDaSemana: jest.fn(() => 1)
}));

const app = require("../server");

// supertest não entrega binário por padrão; este parser junta os bytes num Buffer
const binario = (res, callback) => {
    const partes = [];
    res.on("data", parte => partes.push(parte));
    res.on("end", () => callback(null, Buffer.concat(partes)));
};

describe("GET /pratos/pdf", () => {
    test("200 - devolve um arquivo PDF para download", async () => {
        const res = await request(app).get("/pratos/pdf").buffer().parse(binario);

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/pdf/);
        expect(res.headers["content-disposition"]).toMatch(/attachment/);
        expect(res.headers["content-disposition"]).toMatch(/cardapio\.pdf/);

        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.subarray(0, 5).toString()).toBe("%PDF-");
        expect(res.body.length).toBeGreaterThan(500);
    });

    test("não é confundida com GET /pratos/:codigo", async () => {
        const res = await request(app).get("/pratos/pdf").buffer().parse(binario);

        // se caísse em /pratos/:codigo seria 404 em JSON
        expect(res.status).not.toBe(404);
    });
});