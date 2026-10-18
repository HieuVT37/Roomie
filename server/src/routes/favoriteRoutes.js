import { Router } from "express";
import { listFavorites, addFavorite, removeFavorite } from "../controllers/favoriteController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { favoriteRules } from "../validators/accommodationValidator.js";

const router = Router();
router.use(requireAuth);

router.get("/", listFavorites);
router.post("/", favoriteRules, validate, addFavorite);
router.delete("/:targetType/:targetId", removeFavorite);

export default router;