

export interface XupAttribute {
  data_type: string;
}

export interface AlarmAttribute {
  checkin: number;
  threshold: string;
  comparison: "<" | ">" | "=";
  xup: XupAttribute;
}

export interface AlarmProduct {
  id: number;
  attributes: AlarmAttribute[];
}

export interface AlarmState {
  products: AlarmProduct[];
  setProducts: (products: AlarmProduct[]) => void;
  isAlarm: (packet: Record<string, any>, passedProduct?: AlarmProduct | null) => boolean;
}