export function verificarDiaUtil(req, res, next) {
    const hoje = new Date();

    const diaDaSemana = hoje.getDay();

    // 0 = Domingo
    // 1 = Segunda
    // 2 = Terça
    // 3 = Quarta
    // 4 = Quinta
    // 5 = Sexta
    // 6 = Sábado

    if (diaDaSemana === 0 || diaDaSemana === 6) {
        return res.status(403).json({
            erro: "A API não está disponível aos finais de semana."
        });
    }

    next();
}