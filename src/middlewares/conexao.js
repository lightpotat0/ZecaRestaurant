import { conectar } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const garantirConexao = asyncHandler(async (req, res, next) => {
    await conectar();
    next();
});
