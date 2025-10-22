import 'dotenv/config';

// IDs and constants
export const NOTIFICATION_PAGE_ID = '2916d882db6d80408466c2146b15a9dd';
export const MAIN_PAGE_ID = '2916d882db6d804eaa96e6c338ab1bea';
export const LIST_USER_DB_ID = '2926d882db6d8030ad27cacffeb6edde';

// Secrets from environment (GitHub Actions secrets or local .env)
export const NOTION_TOKEN = process.env.NOTION_TOKEN;
export const DATABASE_ID = process.env.DATABASE_ID;

export function assertEnv() {
  if (!NOTION_TOKEN || !DATABASE_ID) {
    throw new Error('Missing NOTION_TOKEN or DATABASE_ID in environment');
  }
}
