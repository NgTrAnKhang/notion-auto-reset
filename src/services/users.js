import { LIST_USER_DB_ID } from '../config/env.js';
import { queryDatabase } from '../notion/databases.js';
import { log } from '../utils/logger.js';

export async function getFieldData(column) {
  log("Fetching 'User' people data...");
  try {
    const pages = await queryDatabase(LIST_USER_DB_ID);

    for (const page of pages.results) {
      const properties = page.properties;
      const asdField = properties[column];
      const peopleList = [];

      if (asdField && asdField.type === 'people') {
        asdField.people.forEach((person) => {
          if (person.object === 'user') {
            peopleList.push({ id: person.id, name: person.name });
          }
        });

        log(`Users in page ${page.id}:`);
        peopleList.forEach((p) => log(` - ${p.name} (ID: ${p.id})`));
      } else {
        log(`No valid 'User' data for page ${page.id}`);
      }
    }
  } catch (err) {
    log("Error fetching 'User' data: " + err.message);
  }
}
