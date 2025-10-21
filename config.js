// import { Client } from "@notionhq/client";
// const notificationPageId = "2916d882db6d80408466c2146b15a9dd";
// const mainPageId = "2916d882db6d804eaa96e6c338ab1bea";

export const MEMBER_USERS = [
  { name: "Khang lớn", id: "291d872b-594c-8197-90f0-0002ee26f5aa" },
  { name: "Bờm", id: "292d872b-594c-81c4-8334-00029b03970f" },
  { name: "Luân", id: "292d872b-594c-810b-a245-00024185a41c" },
  { name: "Huy Vũ", id: "292d872b-594c-810a-a915-00020cc29e5f" },
  { name: "Danh", id: "292d872b-594c-8152-ae38-000244d0abed" },
  { name: "Huyo1", id: "292d872b-594c-8139-954e-0002159195af" },
  { name: "Hẻ", id: "292d872b-594c-81b2-8d11-0002bcbe3ba0" },
];
// 🔐 Lấy biến môi trường từ GitHub Secrets

export const NOTION_TOKEN = process.env.NOTION_TOKEN;
export const DATABASE_ID = process.env.DATABASE_ID;
export const LIST_USER_DB_ID = "2926d882db6d8030ad27cacffeb6edde";
export const MAIN_PAGE_ID = "2916d882db6d804eaa96e6c338ab1bea";
