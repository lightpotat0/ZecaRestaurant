import { v2 as cloudinary } from "cloudinary";
// A configuração é lida automaticamente da variável CLOUDINARY_URL.

export function enviarImagem(buffer) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: "restaurante/pratos" }, (erro, resultado) => {
                if (erro) return reject(erro);
                resolve({ url: resultado.secure_url, publicId: resultado.public_id });
            })
            .end(buffer);
    });
}

export async function removerImagem(publicId) {
    await cloudinary.uploader.destroy(publicId);
}
