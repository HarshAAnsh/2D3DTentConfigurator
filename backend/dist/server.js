import express from "express";
import cors from "cors";
const app = express();
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json({ limit: "8mb" }));
/* ==========================================================================
   PRODUCT PRICES
   ========================================================================== */
const BASE_PRICES = {
    "5x5": 699,
    "8x8": 899,
};
const VARIANT_PRICES = {
    "5x5": 0,
    "8x8": 100,
};
const CUSTOMIZATION_PRICE_PER_ELEMENT = 25;
/* ==========================================================================
   PRICING
   ========================================================================== */
app.post("/api/pricing", (req, res) => {
    try {
        const configuration = req.body;
        if (!configuration || typeof configuration !== "object") {
            return res.status(400).json({
                error: "Invalid configuration.",
            });
        }
        const size = configuration.size;
        /* ----------------------------------------------------------------------
           Validate product size
           ---------------------------------------------------------------------- */
        if (!(size in BASE_PRICES)) {
            return res.status(400).json({
                error: `Unsupported product size: ${size}`,
                supportedSizes: Object.keys(BASE_PRICES),
            });
        }
        /* ----------------------------------------------------------------------
           Base price
           ---------------------------------------------------------------------- */
        const basePrice = BASE_PRICES[size];
        /* ----------------------------------------------------------------------
           Variant price
           ---------------------------------------------------------------------- */
        const variantPrice = VARIANT_PRICES[size];
        /* ----------------------------------------------------------------------
           Count custom elements
           ---------------------------------------------------------------------- */
        const sections = configuration.sections ?? {};
        const customizationCount = Object.values(sections).reduce((total, section) => {
            if (!section || !Array.isArray(section.elements)) {
                return total;
            }
            return total + section.elements.length;
        }, 0);
        /* ----------------------------------------------------------------------
           Customization price
           ---------------------------------------------------------------------- */
        const customizationPrice = customizationCount * CUSTOMIZATION_PRICE_PER_ELEMENT;
        /* ----------------------------------------------------------------------
           Final price
           ---------------------------------------------------------------------- */
        const total = basePrice +
            variantPrice +
            customizationPrice;
        const response = {
            basePrice,
            variantPrice,
            customizationPrice,
            total,
            currency: "USD",
            customizationCount,
        };
        return res.json(response);
    }
    catch (error) {
        console.error("[PRICING ERROR]", error);
        return res.status(500).json({
            error: "Unable to calculate pricing.",
        });
    }
});
/* ==========================================================================
   MOCK SHOPIFY CART
   ========================================================================== */
app.post("/api/shopify/cart", (req, res) => {
    try {
        const { configuration, price } = req.body;
        if (!configuration || !price) {
            return res.status(400).json({
                success: false,
                error: "Configuration and price are required.",
            });
        }
        const cartId = "mock-cart-" +
            Math.random()
                .toString(36)
                .slice(2, 10);
        return res.json({
            success: true,
            cartId,
            received: {
                configuration,
                price,
            },
        });
    }
    catch (error) {
        console.error("[SHOPIFY CART ERROR]", error);
        return res.status(500).json({
            success: false,
            error: "Unable to create mock cart.",
        });
    }
});
/* ==========================================================================
   HEALTH CHECK
   ========================================================================== */
app.get("/api/health", (_req, res) => {
    res.json({
        ok: true,
        service: "tent-configurator-api",
    });
});
/* ==========================================================================
   SERVER
   ========================================================================== */
const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});
