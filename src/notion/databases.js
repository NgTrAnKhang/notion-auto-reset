import { notion } from './client.js';

export async function retrieveDatabase(database_id) {
  return notion.databases.retrieve({ database_id });
}

export async function updateDatabase(database_id, properties) {
  return notion.databases.update({ database_id, properties });
}

export async function queryDatabase(database_id, filter, sorts) {
  return notion.databases.query({ database_id, filter, sorts });
}
