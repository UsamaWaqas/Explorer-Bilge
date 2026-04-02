export const getWindDirection = (deg: number): string => {
  const directions: string[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index: number = Math.round(deg / 45) % 8;
  return directions[index];
};