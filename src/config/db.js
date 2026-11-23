import mongoose from "mongoose";

let promessa = null;

// Reaproveita a conexão (importante na Vercel, onde a função "acorda" a cada requisição).
export function conectar() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();

    if (!promessa) {
        promessa = mongoose
            .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
            .catch(erro => {
                promessa = null;
                throw erro;
            });
    }
    return promessa;
}
