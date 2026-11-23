import "dotenv/config";
import app from "./app.js";

const PORTA = process.env.PORT || 3000;

// Na Vercel o app é exportado como função serverless; localmente, sobe o servidor.
if (!process.env.VERCEL) {
    app.listen(PORTA, () => console.log(`Servidor rodando em http://localhost:${PORTA}`));
}

export default app;
