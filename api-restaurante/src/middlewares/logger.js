import { logs } from "../data/logs.js";

export function registrarRequisicao(req, res, next) {
    const agora = new Date();

    const dataISO = [agora.getFullYear(), String(agora.getMonth() + 1).padStart(2, "0"), String(agora.getDate()).padStart(2, "0")].join("-");
    const horario = [agora.getHours(), agora.getMinutes(), agora.getSeconds()].map(valor => String(valor).padStart(2, "0")).join(":");

    logs.push({
        data: dataISO,
        dataISO,
        horario,
        rota: `${req.method} ${req.originalUrl}`
    });

    next();
}
