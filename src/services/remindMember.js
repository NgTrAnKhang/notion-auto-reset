// src/services/remindMember.js
import fs from "fs";
import path from "path";
import notionClient from "./notionClient.js";
import { sendNotification } from "./notifications.js";

// === Cấu hình ===
const membersPath = path.resolve("src/services/members.js");
const databaseId = process.env.NOTION_DATABASE_ID;

// === 1️⃣ Đọc & ghi danh sách members ===
function loadMembers() {
  const content = fs.readFileSync(membersPath, "utf8");
  const match = content.match(/export\s+const\s+members\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("Không tìm thấy mảng members trong members.js");
  return JSON.parse(match[1]);
}

function saveMembers(members) {
  const newContent = `export const members = ${JSON.stringify(members, null, 2)};\n`;
  fs.writeFileSync(membersPath, newContent, "utf8");
  console.log(`✅ Đã cập nhật members.js (${members.length} thành viên)`);
}

// === 2️⃣ Lấy danh sách user hiện có trong Notion ===
async function getNotionUsers() {
  const response = await notionClient.databases.query({ database_id: databaseId });
  const users = new Set();

  for (const page of response.results) {
    const prop = page.properties["Thành viên"];
    if (prop?.multi_select) {
      prop.multi_select.forEach(u => users.add(u.name));
    }
  }

  // Giả sử Notion không có ID, ta tự sinh ID tạm
  return Array.from(users).map((name, i) => ({ id: String(i + 1), name }));
}

// === 3️⃣ Đồng bộ danh sách thành viên mới vào members.js ===
async function syncMembers() {
  const current = loadMembers();
  const existingNames = new Set(current.map(m => m.name));
  const newUsers = await getNotionUsers();
  const additions = [];

  for (const user of newUsers) {
    if (!existingNames.has(user.name)) {
      current.push(user);
      additions.push(user);
      console.log(`🆕 Thêm thành viên mới: ${user.name}`);
    }
  }

  if (additions.length > 0) saveMembers(current);
  else console.log("✅ Không có thành viên mới cần thêm");

  return current;
}

// === 4️⃣ Kiểm tra & nhắc nhở những người chưa vote ===
async function remindUnvotedMembers(members) {
  const response = await notionClient.databases.query({ database_id: databaseId });
  const voted = new Set();

  for (const page of response.results) {
    const prop = page.properties["Thành viên"];
    if (prop?.multi_select) prop.multi_select.forEach(u => voted.add(u.name));
  }

  const unvoted = members.filter(m => !voted.has(m.name));

  if (unvoted.length > 0) {
    const msg = `⚠️ Thành viên chưa vote tuần này: ${unvoted.map(u => u.name).join(", ")}`;
    console.log(msg);
    await sendNotification({ text: msg });
  } else {
    console.log("✅ Tất cả thành viên đã vote!");
  }
}

// === 5️⃣ Chạy toàn bộ quy trình ===
export async function remindMember() {
  const members = await syncMembers();
  await remindUnvotedMembers(members);
}

// === Auto-run nếu gọi trực tiếp ===
if (import.meta.url === `file://${process.argv[1]}`) {
  remindMember();
}
