import { relogio, partesNoFuso } from "../utils/relogio.js";

export function verificarDiaUtil(req, res, next) {
    if (process.env.IGNORAR_HORARIO === "true") return next(); // só para testes locais

    const { diaSemana } = partesNoFuso(relogio.agora());

    // 0 = Domingo, 6 = Sábado
    if (diaSemana === 0 || diaSemana === 6) {
        return res.status(403).json({
            erro: "A API não está disponível aos finais de semana."
        });
    }

    next();
}