import Log from "../models/Log.js";
import { relogio, partesNoFuso } from "../utils/relogio.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registrarRequisicao = asyncHandler(async (req, res, next) => {
    const { data, dataISO, horario } = partesNoFuso(relogio.agora());

    await Log.create({
        data,
        dataISO,
        horario,
        rota: req.originalUrl,
        metodo: req.method
    });

    next();
});
