function inRange(value, range) {
  return value >= range.min && value <= range.max;
}

function distanceToRange(value, range) {
  if (value < range.min) {
    return range.min - value;
  }
  if (value > range.max) {
    return value - range.max;
  }
  return 0;
}

function createGlobalSpan(items, field) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    const range = item[field];
    min = Math.min(min, range.min);
    max = Math.max(max, range.max);
  }

  const span = max - min;
  return Number.isFinite(span) && span > 0 ? span : 1;
}

function normalizedDistance(value, range, globalSpan) {
  const distance = distanceToRange(value, range);
  const localSpan = range.max - range.min;
  const denominator = Math.max(localSpan, globalSpan * 0.05, 1e-9);
  return distance / denominator;
}

function buildMatcher(items) {
  const sizeGlobalSpan = createGlobalSpan(items, 'sizeRange');
  const weightGlobalSpan = createGlobalSpan(items, 'weightRange');

  function scoreItem(item, size, weight) {
    const sizePart = normalizedDistance(size, item.sizeRange, sizeGlobalSpan);
    const weightPart = normalizedDistance(weight, item.weightRange, weightGlobalSpan);

    return 0.5 * sizePart + 0.5 * weightPart;
  }

  function query({ size, weight, limit = 5 }) {
    const scored = items.map((item) => {
      const matched = inRange(size, item.sizeRange) && inRange(weight, item.weightRange);
      const score = scoreItem(item, size, weight);
      return {
        ...item,
        matched,
        score,
      };
    });

    const matched = scored.filter((item) => item.matched).sort((a, b) => a.score - b.score);
    const sourceForSimilar = matched.length > 0 ? scored.filter((item) => !item.matched) : scored;
    const similar = sourceForSimilar.sort((a, b) => a.score - b.score).slice(0, limit);

    return { matched, similar };
  }

  return {
    query,
  };
}

export {
  buildMatcher,
};