export function normalizarData(data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

    const [ano, mes, dia] = data.split("-").map(Number);
    const dataValida = new Date(Date.UTC(ano, mes - 1, dia));

    if (
        dataValida.getUTCFullYear() !== ano ||
        dataValida.getUTCMonth() !== mes - 1 ||
        dataValida.getUTCDate() !== dia
    ) return null;

    return data;
}
