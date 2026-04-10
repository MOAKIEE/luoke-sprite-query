export interface Range {
  min: number;
  max: number;
}

export interface Item {
  band: string;
  index: number;
  name: string;
  sizeRange: Range;
  weightRange: Range;
}

export interface ResultItem extends Item {
  matched: boolean;
  score: number;
}

function inRange(value: number, range: Range) {
  return value >= range.min && value <= range.max;
}

function distanceToRange(value: number, range: Range) {
  if (value < range.min) return range.min - value;
  if (value > range.max) return value - range.max;
  return 0;
}

function createGlobalSpan(items: Item[], field: 'sizeRange' | 'weightRange') {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    min = Math.min(min, item[field].min);
    max = Math.max(max, item[field].max);
  }
  const span = max - min;
  return Number.isFinite(span) && span > 0 ? span : 1;
}

function normalizedDistance(value: number, range: Range, globalSpan: number) {
  const distance = distanceToRange(value, range);
  const localSpan = range.max - range.min;
  const denominator = Math.max(localSpan, globalSpan * 0.05, 1e-9);
  return distance / denominator;
}

export function buildMatcher(items: Item[]) {
  const sizeGlobalSpan = createGlobalSpan(items, 'sizeRange');
  const weightGlobalSpan = createGlobalSpan(items, 'weightRange');

  function scoreItem(item: Item, size: number, weight: number): number {
    const sizePart = normalizedDistance(size, item.sizeRange, sizeGlobalSpan);
    const weightPart = normalizedDistance(weight, item.weightRange, weightGlobalSpan);
    return 0.5 * sizePart + 0.5 * weightPart;
  }

  function query({ size, weight, limit = 5 }: { size: number; weight: number; limit?: number }) {
    const scored: ResultItem[] = items.map((item) => {
      const matched = inRange(size, item.sizeRange) && inRange(weight, item.weightRange);
      const rawScore = scoreItem(item, size, weight);
      const score = Number(rawScore.toFixed(6));
      return { ...item, matched, score };
    });

    const matched = scored.filter((item) => item.matched).sort((a, b) => a.score - b.score);
    const sourceForSimilar = matched.length > 0 ? scored.filter((item) => !item.matched) : scored;
    const similar = sourceForSimilar.sort((a, b) => a.score - b.score).slice(0, limit);

    return { matched, similar };
  }

  return { query };
}