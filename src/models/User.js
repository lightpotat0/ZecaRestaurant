import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senhaHash: { type: String, required: true }, // nunca guardamos a senha pura
    codigo2fa: {
        hash: String,
        expira: Date,
        tentativas: { type: Number, default: 0 }
    }
});

export default mongoose.model("User", userSchema);
