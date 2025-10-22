import { assertEnv, DATABASE_ID, MAIN_PAGE_ID } from './config/env.js';
import { retrieveDatabase } from './notion/databases.js';
import { deleteChildrenOfHeading } from './notion/blocks.js';
import { resetMembersProperty } from './services/reset.js';
import { notifyUsersUnderHeading, logAllBlocks } from './services/notifications.js';
import { getFieldData } from './services/users.js';
import { log } from './utils/logger.js';

async function testConnection() {
  log('Checking connection to Notion database...');
  try {
    assertEnv();
    const db = await retrieveDatabase(DATABASE_ID);
    const title = db.title?.[0]?.plain_text || '(no title)';
    log(`Connected to database: ${title}`);
    return true;
  } catch (err) {
    log('Failed to connect to Notion: ' + err.message);
    return false;
  }
}

export async function run() {
  const connected = await testConnection();
  if (!connected) {
    log('Aborting because connection failed.');
    process.exit(1);
  }

  await getFieldData('User'); // fetch user ids
  await resetMembersProperty(); // reset member multi-select
  await logAllBlocks(MAIN_PAGE_ID); // list blocks

  const result = await deleteChildrenOfHeading(MAIN_PAGE_ID, 'Thông báo:');
  if (!result.found) {
    log("Heading 'Thông báo:' not found; nothing to delete.");
  } else {
    log(`Deleted ${result.deleted} child blocks under heading 'Thông báo:'`);
  }

  await notifyUsersUnderHeading(MAIN_PAGE_ID, 'Thông báo:');
}
