const request = require("supertest");

// Fixa o dia como segunda-feira para os testes não falharem no fim de semana
jest.mock("../src/utils/data", () => ({
    ...jest.requireActual("../src/utils/data"),
    diaDaSemana: jest.fn(() => 1)
}));

const app = require("../server");

describe("GET /pratos", () => {
    test("200 - retorna a lista de pratos", async () => {
        const res = await request(app).get("/pratos");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(10);
        expect(res.body[0]).toEqual(
            expect.objectContaining({
                codigo: expect.any(Number),
                nome: expect.any(String),
                categoria: expect.any(String),
                preco: expect.any(Number)
            })
        );
    });
});

describe("GET /pratos/:codigo", () => {
    test("200 - retorna o prato do código informado", async () => {
        const res = await request(app).get("/pratos/3");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            codigo: 3,
            nome: "Baião de Dois Completo",
            categoria: "Prato Principal",
            preco: 35
        });
    });

    test("404 - código que não existe", async () => {
        const res = await request(app).get("/pratos/999");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Prato não encontrado" });
    });

    test("404 - código não numérico", async () => {
        const res = await request(app).get("/pratos/abc");

        expect(res.status).toBe(404);
        expect(res.body.erro).toBe("Prato não encontrado");
    });
});

describe("POST /pratos", () => {
    test("201 - cria um prato com o próximo código", async () => {
        const antes = (await request(app).get("/pratos")).body;
        const maiorCodigo = Math.max(...antes.map(p => p.codigo));

        const res = await request(app)
            .post("/pratos")
            .send({ nome: "Tapioca", categoria: "Lanche", preco: 9.5 });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
            codigo: maiorCodigo + 1,
            nome: "Tapioca",
            categoria: "Lanche",
            preco: 9.5
        });

        // o prato criado passa a existir na listagem e na busca por código
        const depois = await request(app).get("/pratos");
        expect(depois.body).toHaveLength(antes.length + 1);

        const busca = await request(app).get(`/pratos/${res.body.codigo}`);
        expect(busca.status).toBe(200);
        expect(busca.body.nome).toBe("Tapioca");
    });

    test("converte o preço enviado como texto para número", async () => {
        const res = await request(app)
            .post("/pratos")
            .send({ nome: "Cuscuz", categoria: "Prato Principal", preco: "15.75" });

        expect(res.status).toBe(201);
        expect(res.body.preco).toBe(15.75);
    });

    test.each([
        ["sem nome", { categoria: "Lanche", preco: 10 }],
        ["sem categoria", { nome: "X", preco: 10 }],
        ["sem preço", { nome: "X", categoria: "Lanche" }],
        ["corpo vazio", {}]
    ])("400 - %s", async (_descricao, corpo) => {
        const res = await request(app).post("/pratos").send(corpo);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ erro: "Preencha o nome, categoria e preco" });
    });

    test("400 - não cria o prato quando os dados são inválidos", async () => {
        const antes = (await request(app).get("/pratos")).body.length;

        await request(app).post("/pratos").send({ nome: "Incompleto" });

        const depois = (await request(app).get("/pratos")).body.length;
        expect(depois).toBe(antes);
    });
});

describe("DELETE /pratos/:codigo", () => {
    test("200 - remove o prato e ele deixa de existir", async () => {
        const criado = await request(app)
            .post("/pratos")
            .send({ nome: "Para apagar", categoria: "Teste", preco: 1 });
        const codigo = criado.body.codigo;

        const res = await request(app).delete(`/pratos/${codigo}`);

        expect(res.status).toBe(200);
        expect(res.body.mensagem).toBe("Prato removido com sucesso");
        expect(res.body.prato.codigo).toBe(codigo);

        const busca = await request(app).get(`/pratos/${codigo}`);
        expect(busca.status).toBe(404);
    });

    test("404 - código que não existe", async () => {
        const res = await request(app).delete("/pratos/999");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: "Prato não encontrado" });
    });

    test("404 - apagar duas vezes o mesmo prato", async () => {
        const criado = await request(app)
            .post("/pratos")
            .send({ nome: "Duas vezes", categoria: "Teste", preco: 1 });

        await request(app).delete(`/pratos/${criado.body.codigo}`);
        const segunda = await request(app).delete(`/pratos/${criado.body.codigo}`);

        expect(segunda.status).toBe(404);
    });
});