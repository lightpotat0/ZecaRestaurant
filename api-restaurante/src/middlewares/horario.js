const { diaDaSemana } = require("../utils/data");

function verificarDiaUtil(req, res, next) {
    const dia = diaDaSemana();

    // 0 = Domingo, 6 = Sábado
    if (dia === 0 || dia === 6) {
        return res.status(403).json({
            erro: "A API não está disponível aos finais de semana."
        });
    }

    next();
}

module.exports = { verificarDiaUtil };