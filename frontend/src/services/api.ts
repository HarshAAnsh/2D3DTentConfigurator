import axios from "axios";

import type {
  PriceResponse,
  ProductConfiguration,
} from "../types/configurator";

/* -------------------------------------------------------------------------- */
/* AXIOS CLIENT                                                               */
/* -------------------------------------------------------------------------- */

const client =
  axios.create({
    baseURL:
      import.meta.env
        .VITE_API_URL ||
      "",
  });

/* -------------------------------------------------------------------------- */
/* GET PRICE                                                                  */
/* -------------------------------------------------------------------------- */

export async function getPrice(
  config: ProductConfiguration,
): Promise<PriceResponse> {
  const response =
    await client.post<PriceResponse>(
      "/api/pricing",
      config,
    );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* SHOPIFY CART                                                               */
/* -------------------------------------------------------------------------- */

export async function addToShopify(
  config: ProductConfiguration,
  price: PriceResponse,
) {
  const response =
    await client.post(
      "/api/shopify/cart",
      {
        configuration:
          config,

        price,
      },
    );

  return response.data;
}