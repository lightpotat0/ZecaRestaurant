import mongoose from "mongoose";

const pratoSchema = new mongoose.Schema({
    codigo: { type: Number, required: true, unique: true },
    nome: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    preco: { type: Number, required: true, min: 0 },
    imagemUrl: String,
    imagemPublicId: String
});

export default mongoose.model("Prato", pratoSchema);
