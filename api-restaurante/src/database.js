import { MongoClient } from "mongodb";
import pratosIniciais from "./data/pratos.js";

let client;
let database;

export async function conectarBanco() {
    const uri = process.env.MONGODB_URI;
    const nomeBanco = process.env.MONGODB_DB || "restaurante";

    if (!uri) {
        throw new Error("Defina MONGODB_URI no ambiente ou no arquivo .env.");
    }

    client = new MongoClient(uri);
    await client.connect();
    database = client.db(nomeBanco);

    await database.collection("pratos").createIndex({ codigo: 1 }, { unique: true });
    await database.collection("logs").createIndex({ dataISO: 1 });
    await database.collection("usuarios").createIndex({ email: 1 }, { unique: true });

    const pratos = database.collection("pratos");
    if (await pratos.countDocuments() === 0) {
        await pratos.insertMany(pratosIniciais);
    }

    console.log(`Conectado ao MongoDB: ${nomeBanco}`);
}

export function colecao(nome) {
    if (!database) throw new Error("Banco de dados ainda não conectado.");
    return database.collection(nome);
}

export async function fecharBanco() {
    await client?.close();
}
