import { DATABASE_ID } from '../config/env.js';
import { queryDatabase, retrieveDatabase, updateDatabase } from '../notion/databases.js';
import { updatePage } from '../notion/pages.js';
import { MEMBER_USERS } from './members.js';
import { log } from '../utils/logger.js';

export async function ensureMemberOptions() {
  try {
    log("Updating 'Thành viên' options with colors...");

    await retrieveDatabase(DATABASE_ID); // sanity check exists

    const newOptions = MEMBER_USERS.map((user) => ({
      name: user.name,
      color: user.color || 'default',
    }));

    await updateDatabase(DATABASE_ID, {
      'Thành viên': {
        multi_select: { options: newOptions },
      },
    });

    log("Updated 'Thành viên' options.");
  } catch (err) {
    log('Error updating member options: ' + err.message);
  }
}

export async function resetMembersProperty() {
  log('Starting reset of members property...');
  try {
    await ensureMemberOptions();

    const pages = await queryDatabase(DATABASE_ID);
    for (const page of pages.results) {
      await updatePage(page.id, { 'Thành viên': { multi_select: [] } });
      log(`Cleared 'Thành viên' for page: ${page.id}`);
    }
    log("Finished resetting 'Thành viên'.");
  } catch (err) {
    log('Error during reset: ' + err.message);
  }
}
