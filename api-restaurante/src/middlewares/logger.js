import { logs } from "../data/logs.js";

export function registrarRequisicao(req, res, next) {
    const agora = new Date();

    const data = agora.toLocaleDateString("pt-BR");
    const dataISO = agora.toISOString().split("T")[0];
    const horario = agora.toLocaleTimeString("pt-BR");

    logs.push({
        data,
        dataISO,
        horario,
        rota: req.originalUrl,
        metodo: req.method
    });

    next();
}