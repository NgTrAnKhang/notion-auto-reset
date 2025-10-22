import { notion } from './client.js';

export async function updatePage(page_id, properties) {
  return notion.pages.update({ page_id, properties });
}
