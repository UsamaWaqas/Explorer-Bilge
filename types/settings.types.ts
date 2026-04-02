// src/types/settings.types.ts

export interface GroupedAttribute {
  id: number;
  xup_id: number;
  is_visible: boolean;
}

export interface TileItem {
  id: number;
  xup_id?: number;
  isProduct: boolean;
  name: string;
  isSelected: boolean;
  productId: number;
  groupedAttributes?: GroupedAttribute[];
}