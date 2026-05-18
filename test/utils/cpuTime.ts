export interface CpuTimeOptions {
  iterations: number;
  batchSize?: number;
}

export interface CpuTimeStats {
  iterations: number;
  batchSize: number;
  samples: number;
  mean: number;
  median: number;
  stddev: number;
  p90: number;
  min: number;
  max: number;
}

const DEFAULT_MAX_SAMPLES = 10;

export function cpuTime(fn: () => void, options: CpuTimeOptions): CpuTimeStats {
  const { iterations } = options;
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`cpuTime iterations must be a positive integer, received ${iterations}`);
  }

  const batchSize = options.batchSize ?? Math.ceil(iterations / DEFAULT_MAX_SAMPLES);
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error(`cpuTime batchSize must be a positive integer, received ${batchSize}`);
  }

  const sampleMeans: number[] = [];
  let total = 0;

  for (let remainingIterations = iterations; remainingIterations > 0; remainingIterations -= batchSize) {
    const sampleIterations = Math.min(batchSize, remainingIterations);
    const start = Game.cpu.getUsed();
    for (let i = 0; i < sampleIterations; i++) {
      fn();
    }
    const end = Game.cpu.getUsed();
    const elapsed = Math.max(0, end - start);
    total += elapsed;
    sampleMeans.push(elapsed / sampleIterations);
  }

  const mean = total / iterations;
  const variance =
    sampleMeans.reduce((sum, sampleMean) => sum + (sampleMean - mean) * (sampleMean - mean), 0) / sampleMeans.length;
  const sortedSamples = [...sampleMeans].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedSamples.length / 2);
  const median =
    sortedSamples.length % 2 === 0
      ? (sortedSamples[middleIndex - 1] + sortedSamples[middleIndex]) / 2
      : sortedSamples[middleIndex];
  const p90Index = Math.ceil(sortedSamples.length * 0.9) - 1;

  return {
    iterations,
    batchSize,
    samples: sampleMeans.length,
    mean,
    median,
    stddev: Math.sqrt(variance),
    p90: sortedSamples[p90Index],
    min: sortedSamples[0],
    max: sortedSamples[sortedSamples.length - 1]
  };
}

export function formatCpuTime({
  iterations,
  batchSize,
  samples,
  mean,
  median,
  stddev,
  p90,
  min,
  max
}: CpuTimeStats): string {
  return `mean=${mean.toFixed(3)}, median=${median.toFixed(3)}, stddev=${stddev.toFixed(3)}, p90=${p90.toFixed(3)}, min=${min.toFixed(3)}, max=${max.toFixed(3)} (${samples} samples / ${iterations} iterations, batchSize=${batchSize})`;
}
