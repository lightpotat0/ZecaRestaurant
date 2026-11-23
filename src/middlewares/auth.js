import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
    const [tipo, token] = (req.headers.authorization || "").split(" ");

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({ erro: "Token não informado. Faça login." });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ erro: "Token inválido ou expirado." });
    }
}
