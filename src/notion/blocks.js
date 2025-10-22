import { notion } from './client.js';
import { withRetry, delay } from '../utils/control.js';
import { warn } from '../utils/logger.js';

export async function getAllBlocks(blockId) {
  let blocks = [];
  let cursor = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return blocks;
}

// Get only top-level children (non-recursive)
export async function getTopLevelBlocks(blockId) {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });
  return response.results;
}

function isHeadingWithText(block, text) {
  const type = block.type;
  const richText = block[type]?.rich_text;
  if (!richText || !Array.isArray(richText)) return false;
  const content = richText.map((rt) => rt.plain_text).join('');
  return (
    ['heading_1', 'heading_2', 'heading_3'].includes(type) &&
    content.trim().toLowerCase() === text.trim().toLowerCase()
  );
}

export async function findTopLevelHeading(pageId, headingText) {
  const blocks = await getTopLevelBlocks(pageId);
  return blocks.find((b) => isHeadingWithText(b, headingText));
}

export async function findAnyHeading(pageId, headingText) {
  const blocks = await getAllBlocks(pageId);
  return blocks.find((b) => isHeadingWithText(b, headingText));
}

export async function safeDeleteBlock(blockId, retries = 3) {
  await withRetry(
    () => notion.blocks.delete({ block_id: blockId }),
    {
      retries,
      delayMs: 500,
      shouldRetry: (err, attempt) => {
        const isConflict = err && (err.code === 'conflict_error' || err.status === 409);
        if (isConflict) warn(`Conflict deleting block ${blockId}, retrying attempt ${attempt}...`);
        return isConflict && attempt < retries;
      },
    }
  );
}

export async function deleteChildrenOfHeading(pageId, headingText) {
  // Prefer top-level heading; fallback to any match
  let headingBlock = await findTopLevelHeading(pageId, headingText);
  if (!headingBlock) headingBlock = await findAnyHeading(pageId, headingText);
  if (!headingBlock) return { found: false, deleted: 0 };

  const children = await getAllBlocks(headingBlock.id);
  let count = 0;
  for (const child of children) {
    await safeDeleteBlock(child.id);
    await delay(300);
    count++;
  }
  return { found: true, deleted: count };
}
