// src/services/settingsService.ts

import { get, post } from "../api/apiHelper";

export const fetchTilesApi = async () => {
  return await get("/api/user-products");
};

export const saveToggleVisibility = async (xups: any[]) => {
  return await post(
    "/api/attributes/toggle-visibility",
    { type: "tile", xups },
    {},
    true
  );
};