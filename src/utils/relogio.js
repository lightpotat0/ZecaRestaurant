// Relógio isolado para facilitar os testes (dá para simular qualquer dia).
export const relogio = { agora: () => new Date() };

const FUSO = "America/Fortaleza";

export function partesNoFuso(data) {
    const iso = data.toLocaleDateString("en-CA", { timeZone: FUSO }); // AAAA-MM-DD
    return {
        dataISO: iso,
        data: data.toLocaleDateString("pt-BR", { timeZone: FUSO }),
        horario: data.toLocaleTimeString("pt-BR", { timeZone: FUSO }),
        diaSemana: new Date(`${iso}T12:00:00Z`).getUTCDay() // 0 = domingo ... 6 = sábado
    };
}
