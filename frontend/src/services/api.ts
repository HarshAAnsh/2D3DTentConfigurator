import axios from "axios";

import type {
  PriceResponse,
  ProductConfiguration,
} from "../types/configurator";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getPrice(
  config: ProductConfiguration,
): Promise<PriceResponse> {
  const response = await client.post<PriceResponse>("/api/pricing", config);

  return response.data;
}

export async function addToShopify(
  config: ProductConfiguration,
  price: PriceResponse,
) {
  const response = await client.post("/api/shopify/cart", {
    configuration: config,
    price,
  });

  return response.data;
}
