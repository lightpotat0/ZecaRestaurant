// Popula o MongoDB com os pratos iniciais:  npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import { conectar } from "../src/config/db.js";
import Prato from "../src/models/Prato.js";
import pratos from "../src/data/pratos.js";

await conectar();
await Prato.deleteMany({});
await Prato.insertMany(pratos);
console.log(`${pratos.length} pratos inseridos.`);
await mongoose.disconnect();
