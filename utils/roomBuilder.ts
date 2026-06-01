
export function buildPrivateRoom(xnidA: string, xnidB: string): string {
  return [xnidA, xnidB].sort().join("--");
}

export function buildMarinaRoom(marinaXNID: string, slipId: string): string {
  return `marina-${marinaXNID}-slip-${slipId}`;
}

export function buildSupportRoom(ticketId: string): string {
  return `support-${ticketId}`;
}


export function buildBuildingRoom(
  buildingXNID: string,
  unitId: string,
): string {
  return `bldg-${buildingXNID}-unit-${unitId}`;
}
