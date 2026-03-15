import { Router } from "express";
import * as productController from "../controllers/productController.js";

const router = Router();

router.get("/search", productController.searchProducts);
router.get("/products/:rNumber", productController.getProductByRNumber);
router.get("/products/manual/:product_name", productController.getISByProductName);

export default router;
