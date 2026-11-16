import express from "express";
import pratos from "../data/pratos.js";
import { gerarPdfCardapio } from "../services/pdf.js";
import upload from "../middlewares/upload.js";
import { uploadImagemCloudinary } from "../services/cloudinary.js";

const router = express.Router();

router.get("/pratos", (req, res) => {
    res.status(200).json(pratos);
});

router.get("/pratos/pdf", (req, res) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="cardapio.pdf"');
    gerarPdfCardapio(res, pratos);
});

// REQUISITO H: Exportar dados do banco em formato CSV
router.get("/pratos/exportar", (req, res) => {
    try {
        const cabecalho = ["Codigo", "Nome", "Categoria", "Preco", "Imagem_URL"];

        const linhas = pratos.map((prato) => {
            const codigo = prato.codigo ?? prato._id ?? "";
            const nome = `"${String(prato.nome || "").replace(/"/g, '""')}"`;
            const categoria = `"${String(prato.categoria || "").replace(/"/g, '""')}"`;
            const preco =
                prato.preco !== undefined && prato.preco !== null
                    ? Number(prato.preco).toFixed(2).replace(".", ",")
                    : "0,00";
            const imagemUrl = prato.imagemUrl || "";

            return [codigo, nome, categoria, preco, imagemUrl].join(";");
        });

        // \uFEFF garante que acentos (ç, ã, é) abram corretamente no Excel
        const csv = "\uFEFF" + [cabecalho.join(";"), ...linhas].join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="cardapio-zeca-restaurant.csv"');

        return res.status(200).send(csv);
    } catch (error) {
        return res.status(500).json({
            erro: "Erro ao exportar dados para CSV",
            detalhes: error.message
        });
    }
});

router.get("/pratos/:codigo", (req, res) => {
    const codigo = Number(req.params.codigo);
    const prato = pratos.find(prato => prato.codigo === codigo);

    if (!prato) {
        return res.status(404).json({
            erro: "Prato não encontrado"
        });
    }

    res.status(200).json(prato);
});

// REQUISITO B: Cadastrar prato com upload opcional de imagem para o Cloudinary
router.post("/pratos", upload.single("imagem"), async (req, res) => {
    try {
        const { nome, categoria, preco } = req.body;

        if (!nome || !categoria || preco === undefined || preco === "") {
            return res.status(400).json({
                erro: "Preencha o nome, categoria e preco"
            });
        }

        let imagemUrl = "";
        let imagemPublicId = "";

        if (req.file) {
            const resultadoNuvem = await uploadImagemCloudinary(req.file.buffer);
            imagemUrl = resultadoNuvem.secure_url;
            imagemPublicId = resultadoNuvem.public_id;
        }

        const novoCodigo =
            pratos.length > 0
                ? Math.max(...pratos.map(prato => prato.codigo)) + 1
                : 1;

        const novoPrato = {
            codigo: novoCodigo,
            nome,
            categoria,
            preco: Number(preco),
            imagemUrl,
            imagemPublicId
        };

        pratos.push(novoPrato);

        return res.status(201).json(novoPrato);
    } catch (error) {
        return res.status(500).json({
            erro: "Erro ao cadastrar prato",
            detalhes: error.message
        });
    }
});

router.delete("/pratos/:codigo", (req, res) => {
    const codigo = Number(req.params.codigo);
    const indice = pratos.findIndex(prato => prato.codigo === codigo);

    if (indice === -1) {
        return res.status(404).json({
            erro: "Prato não encontrado"
        });
    }

    const pratoRemovido = pratos.splice(indice, 1)[0];

    res.status(200).json({
        mensagem: "Prato removido com sucesso",
        prato: pratoRemovido
    });
});

export default router;