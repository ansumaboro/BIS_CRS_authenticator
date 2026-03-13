import { Router } from "express";
import * as productController from "../controllers/productController.js";

const router = Router();

router.get("/search", productController.searchProducts);
router.get("/products/:rNumber", productController.getProductByRNumber);

export default router;
