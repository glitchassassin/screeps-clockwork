export function cpuTime(fn: () => void, iterations = 1) {
  const start = Game.cpu.getUsed();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = Game.cpu.getUsed();
  return Math.max(0, end - start);
}
