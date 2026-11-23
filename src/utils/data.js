export function normalizarData(data) {
    // DD/MM/AAAA
    if (data.includes("/")) {
        const partes = data.split("/");

        if (partes.length !== 3) {
            return null;
        }

        const [dia, mes, ano] = partes;

        return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }

    // AAAA-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data;
    }

    return null;
}