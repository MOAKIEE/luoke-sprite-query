import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseIndexMarkdown } from '../src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mdPath = path.join(__dirname, '../image_text_index.md');
const jsonPath = path.join(__dirname, '../data.json');

try {
  const items = parseIndexMarkdown(mdPath);
  if (!items.length) {
    throw new Error('No entries parsed from markdown table.');
  }
  fs.writeFileSync(jsonPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`✅ Successfully generated data.json with ${items.length} items`);
} catch (error) {
  console.error('❌ Failed to generate data.json:', error.message);
  process.exit(1);
}