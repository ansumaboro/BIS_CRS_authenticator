import db from "../db.js";

export const getProductByRNumber = async (req, res) => {
  const { rNumber } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE registration_number = ?", [rNumber]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Product not found in database" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchProducts = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

  try {
    // Try R-number first (exact match)
    let [rows] = await db.query("SELECT * FROM products WHERE registration_number = ?", [q]);
    
    // If not found, try IS-number (partial or exact)
    if (rows.length === 0) {
      [rows] = await db.query("SELECT * FROM products WHERE is_number LIKE ?", [`%${q}%`]);
    }

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "No product found matching your search" });
    }
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getISByProductName = async (req, res) => {
  console.log(product_name)
  const { product_name } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM isstandards WHERE product_name = ?", [product_name]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Standard not found in database" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};