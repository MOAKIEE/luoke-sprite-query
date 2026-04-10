import fs from 'fs';

const TARGET_SECTION = '## 全部条目（单表整合）';

function parseRange(text) {
  const cleaned = String(text || '').trim();
  const numbers = cleaned.match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    throw new Error(`Cannot parse numeric range from: "${text}"`);
  }

  const first = Number(numbers[0]);
  const second = numbers[1] !== undefined ? Number(numbers[1]) : first;

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    throw new Error(`Range contains invalid number: "${text}"`);
  }

  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
  };
}

function splitMarkdownRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseIndexMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const sectionIndex = lines.findIndex((line) => line.trim() === TARGET_SECTION);
  if (sectionIndex === -1) {
    throw new Error(`Section not found: ${TARGET_SECTION}`);
  }

  const tableStart = lines.findIndex(
    (line, idx) => idx > sectionIndex && line.trim().startsWith('| 原档位 |')
  );
  if (tableStart === -1) {
    throw new Error('Table header not found in target section');
  }

  const entries = [];
  for (let i = tableStart + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      break;
    }

    if (line.startsWith('## ')) {
      break;
    }

    if (!line.startsWith('|')) {
      continue;
    }

    const cells = splitMarkdownRow(line);
    if (cells.length < 5) {
      continue;
    }

    const band = cells[0];
    const index = Number(cells[1]);
    const sizeRange = parseRange(cells[2]);
    const weightRange = parseRange(cells[3]);
    const name = cells[4];

    if (!band || !name || !Number.isFinite(index)) {
      continue;
    }

    entries.push({
      band,
      index,
      name,
      sizeRange,
      weightRange,
    });
  }

  return entries;
}

export {
  parseIndexMarkdown,
  parseRange,
};