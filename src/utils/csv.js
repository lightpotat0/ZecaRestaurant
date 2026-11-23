// CSV com ";" (padrão do Excel em pt-BR) e BOM para os acentos abrirem certo.
export function paraCsv(linhas, colunas) {
    const escapar = valor => {
        if (valor === null || valor === undefined) return "";
        const texto = String(valor);
        return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };

    const corpo = linhas.map(l => colunas.map(c => escapar(l[c])).join(";"));
    return "\uFEFF" + [colunas.join(";"), ...corpo].join("\r\n");
}
