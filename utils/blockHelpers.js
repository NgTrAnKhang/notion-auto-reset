import { notion } from "./notionClient.js";
import { delay } from "./helpers.js";

export async function getAllBlocks(pageId) {
  let blocks = [];
  let cursor;

  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  return blocks;
}

export async function safeDeleteBlock(blockId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await notion.blocks.delete({ block_id: blockId });
      return;
    } catch (err) {
      if (err.code === "conflict_error" && attempt < retries) {
        await delay(500);
      } else {
        throw err;
      }
    }
  }
}
