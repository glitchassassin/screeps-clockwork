export function testTime(label: string, fn: () => void) {
  const start = Game.cpu.getUsed();
  for (let i = 0; i < 1000; i++) {
    fn();
  }
  const end = Game.cpu.getUsed();
  console.log(`${label}: ${(end - start).toFixed(3)} for 1000 iterations`);
}
