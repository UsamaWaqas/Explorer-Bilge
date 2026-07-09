
let lastCallEndedAt = 0;

export function markCallEnded() {
  lastCallEndedAt = Date.now();
}

export function getMsSinceLastCallEnded(): number {
  if (lastCallEndedAt === 0) return Infinity;
  return Date.now() - lastCallEndedAt;
}