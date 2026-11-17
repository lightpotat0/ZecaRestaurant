import { colecao } from "../database.js";

export async function registrarRequisicao(req, res, next) {
    const agora = new Date();

    const data = agora.toLocaleDateString("pt-BR");
    const dataISO = agora.toISOString().split("T")[0];
    const horario = agora.toLocaleTimeString("pt-BR");

    try {
        await colecao("logs").insertOne({
        data,
        dataISO,
        horario,
        rota: req.originalUrl,
        metodo: req.method
        });
        next();
    } catch (erro) {
        next(erro);
    }
}
