import PDFDocument from "pdfkit";
import { fileURLToPath } from "node:url";

const fonteRegular = fileURLToPath(new URL("../assets/Vera.ttf", import.meta.url));
const fonteNegrito = fileURLToPath(new URL("../assets/VeraBd.ttf", import.meta.url));

export function gerarPdfCardapio(res, pratos) {
    const documento = new PDFDocument({ size: "A4", margin: 40 });
    documento.registerFont("Cardapio", fonteRegular);
    documento.registerFont("Cardapio-Bold", fonteNegrito);
    documento.pipe(res);

    documento
        .font("Cardapio")
        .fontSize(12)
        .text("================================", { align: "center" })
        .font("Cardapio-Bold")
        .fontSize(18)
        .text("CARDÁPIO DO RESTAURANTE", { align: "center" })
        .font("Cardapio")
        .fontSize(12)
        .text("================================", { align: "center" });
    documento.moveDown();

    documento.font("Cardapio").fontSize(12);

    for (const prato of pratos) {
        documento
            .font("Cardapio-Bold")
            .text(`Código: ${prato.codigo}`)
            .font("Cardapio")
            .text(`Nome: ${prato.nome}`)
            .text(`Categoria: ${prato.categoria}`)
            .text(`Preço: R$ ${Number(prato.preco).toFixed(2).replace(".", ",")}`)
            .moveDown(0.5);
    }

    documento.end();
}
