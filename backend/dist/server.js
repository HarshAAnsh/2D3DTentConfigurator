import express from "express";
import cors from "cors";
const app = express();
app.use(cors({
    origin: true,
}));
app.use(express.json({
    limit: "12mb",
}));
const BASE_PRICE = 699;
const VARIANT_PRICES = {
    "5x5": 0,
    "6.5x6.5": 100,
    "8x8": 200,
};
const CUSTOMIZATION_PRICES = {
    text: 25,
    image: 50,
};
const VALID_SIZES = new Set([
    "5x5",
    "6.5x6.5",
    "8x8",
]);
const VALID_SECTIONS = [
    "front",
    "back",
    "left",
    "right",
    "roof",
];
function calculateCustomizationPrice(config) {
    let textCount = 0;
    let imageCount = 0;
    for (const sectionName of VALID_SECTIONS) {
        const section = config?.sections?.[sectionName];
        if (!section) {
            continue;
        }
        const elements = Array.isArray(section.elements)
            ? section.elements
            : [];
        for (const element of elements) {
            if (element.type === "text") {
                textCount++;
            }
            if (element.type === "image") {
                imageCount++;
            }
        }
    }
    const customizationPrice = textCount *
        CUSTOMIZATION_PRICES.text +
        imageCount *
            CUSTOMIZATION_PRICES.image;
    return {
        customizationPrice,
        textCount,
        imageCount,
    };
}
/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/
app.get("/api/health", (_req, res) => {
    res.json({
        ok: true,
        service: "tent-configurator-api",
        timestamp: new Date().toISOString(),
    });
});
/*
|--------------------------------------------------------------------------
| Pricing
|--------------------------------------------------------------------------
*/
app.post("/api/pricing", (req, res) => {
    try {
        const config = req.body;
        const size = config?.size;
        if (!VALID_SIZES.has(size)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tent size.",
            });
        }
        const variantPrice = VARIANT_PRICES[size];
        const { customizationPrice, textCount, imageCount, } = calculateCustomizationPrice(config);
        const total = BASE_PRICE +
            variantPrice +
            customizationPrice;
        return res.json({
            success: true,
            basePrice: BASE_PRICE,
            variantPrice,
            customizationPrice,
            total,
            currency: "USD",
            breakdown: {
                textCount,
                imageCount,
            },
        });
    }
    catch (error) {
        console.error("Pricing error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to calculate pricing.",
        });
    }
});
/*
|--------------------------------------------------------------------------
| Shopify Cart
|--------------------------------------------------------------------------
|
| This is intentionally a mock integration until real Shopify credentials
| and variant IDs are provided.
|
*/
app.post("/api/shopify/cart", (req, res) => {
    try {
        const { configuration, price, } = req.body;
        if (!configuration) {
            return res.status(400).json({
                success: false,
                message: "Configuration is required.",
            });
        }
        const cartId = `mock-cart-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
        return res.json({
            success: true,
            cartId,
            message: "Configuration successfully prepared for Shopify cart.",
            cart: {
                id: cartId,
                product: "Custom 10x10 Logo Canopy Tent",
                variant: configuration.size,
                quantity: 1,
                price,
                configurationId: configuration.id,
                configuration,
            },
        });
    }
    catch (error) {
        console.error("Shopify cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create cart.",
        });
    }
});
/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/
const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
    console.log(`Tent Configurator API running at http://localhost:${port}`);
});
