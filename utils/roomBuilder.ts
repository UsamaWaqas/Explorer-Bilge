export function buildPrivateRoom(xnidA: string, xnidB: string): string {
  return [xnidA, xnidB].sort().join("--");
}

// Har naye call ke liye unique room banata hai (purana static room na use ho,
// taake purani/zombie Jitsi session se conflict na ho dobara call karte waqt)
export function buildNewCallRoom(xnidA: string, xnidB: string): string {
  const base = buildPrivateRoom(xnidA, xnidB);
  const sessionId = Date.now().toString(36);
  return `${base}--${sessionId}`;
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