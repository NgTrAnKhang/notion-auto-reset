import { notion } from '../notion/client.js';
import { getAllBlocks } from '../notion/blocks.js';
import { MEMBER_USERS } from './members.js';
import { formatNowHHmmDDMMYYYY } from '../utils/time.js';
import { log } from '../utils/logger.js';

export async function notifyUsersUnderHeading(pageId, headingText) {
  const formatted = formatNowHHmmDDMMYYYY();

  const blocks = await getAllBlocks(pageId);
  const headingBlock = blocks.find((block) => {
    const type = block.type;
    const richText = block[type]?.rich_text;
    if (!richText || !Array.isArray(richText)) return false;
    const content = richText.map((rt) => rt.plain_text).join('');
    return (
      ['heading_1', 'heading_2', 'heading_3'].includes(type) &&
      content.trim().toLowerCase() === headingText.trim().toLowerCase()
    );
  });

  if (!headingBlock) {
    log(`Heading not found: ${headingText}`);
    return false;
  }

  const headingId = headingBlock.id;
  log(`Found heading '${headingText}' (ID: ${headingId})`);

  const newBlocks = MEMBER_USERS.map(({ name, id }) => ({
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${formatted}: Vào vote đi, ${name} ` } },
        { type: 'mention', mention: { type: 'user', user: { id } }, plain_text: `(@${name})` },
      ],
    },
  }));

  await notion.blocks.children.append({ block_id: headingId, children: newBlocks });
  log('Notifications appended under heading.');
  return true;
}

export async function logAllBlocks(pageId) {
  try {
    const blocks = await getAllBlocks(pageId);
    console.log(`Page has ${blocks.length} blocks:`);

    blocks.forEach((block, index) => {
      const id = block.id;
      const type = block.type;
      let content = '[No content]';
      const data = block[type];
      if (data?.rich_text && Array.isArray(data.rich_text) && data.rich_text.length) {
        content = data.rich_text.map((rt) => rt.plain_text).join('');
      } else if (data?.title && Array.isArray(data.title) && data.title.length) {
        content = data.title.map((rt) => rt.plain_text).join('');
      } else if (typeof data?.text === 'string') {
        content = data.text;
      }

      console.log(`\nBlock #${index + 1}`);
      console.log(`ID: ${id}`);
      console.log(`Type: ${type}`);
      console.log(`Content: ${content}`);
    });
  } catch (err) {
    console.error('Error listing blocks:', err);
  }
}
