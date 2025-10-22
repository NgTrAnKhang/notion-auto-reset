import { assertEnv, DATABASE_ID, MAIN_PAGE_ID as DEFAULT_MAIN_PAGE_ID, NOTIFICATION_PAGE_ID as DEFAULT_NOTIFICATION_PAGE_ID } from './config/env.js';
import { retrieveDatabase } from './notion/databases.js';
import { deleteChildrenOfHeading } from './notion/blocks.js';
import { resetMembersProperty } from './services/reset.js';
import { notifyUsersUnderHeading, logAllBlocks } from './services/notifications.js';
import { getFieldData } from './services/users.js';
import { log } from './utils/logger.js';

function parseArgs(argv) {
  const args = new Set();
  const map = new Map();
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a;
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        map.set(key, next);
        i++;
      } else {
        args.add(key);
      }
    }
  }
  return { flags: args, params: map };
}

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
  const { flags, params } = parseArgs(process.argv);

  const runAll =
    !flags.size && params.size === 0; // default: run everything if no flags/params

  const runGetUsers = runAll || flags.has('--get-users');
  const runResetMembers = runAll || flags.has('--reset-members');
  const runListBlocks = runAll || flags.has('--list-blocks');
  const runClearNotify = runAll || flags.has('--clear-notify');
  const runNotifyUsers = runAll || flags.has('--notify-users');

  let mainPageId = params.get('--main-page-id') || DEFAULT_MAIN_PAGE_ID;
  let notificationPageId = params.get('--notification-page-id') || DEFAULT_NOTIFICATION_PAGE_ID;

  // Map special tokens from workflow to actual defaults
  if (mainPageId === 'env_default_main' || mainPageId === 'use_default') {
    mainPageId = DEFAULT_MAIN_PAGE_ID;
  }
  if (
    notificationPageId === 'env_default_notification' ||
    notificationPageId === 'use_default'
  ) {
    notificationPageId = DEFAULT_NOTIFICATION_PAGE_ID;
  }

  const connected = await testConnection();
  if (!connected) {
    log('Aborting because connection failed.');
    process.exit(1);
  }

  if (runGetUsers) await getFieldData('User');
  if (runResetMembers) await resetMembersProperty();
  if (runListBlocks) await logAllBlocks(mainPageId);

  if (runClearNotify) {
    const result = await deleteChildrenOfHeading(mainPageId, 'Thông báo:');
    if (!result.found) {
      log("Heading 'Thông báo:' not found; nothing to delete.");
    } else {
      log(`Deleted ${result.deleted} child blocks under heading 'Thông báo:'`);
    }
  }

  if (runNotifyUsers) {
    await notifyUsersUnderHeading(notificationPageId || mainPageId, 'Thông báo:');
  }
}
