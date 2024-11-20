export function cpuTime(fn: () => void) {
  const start = Game.cpu.getUsed();
  fn();
  const end = Game.cpu.getUsed();
  return Math.max(0, end - start);
}
