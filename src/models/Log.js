import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
    data: String,    // DD/MM/AAAA
    dataISO: { type: String, index: true }, // AAAA-MM-DD
    horario: String,
    rota: String,
    metodo: String
});

export default mongoose.model("Log", logSchema);
