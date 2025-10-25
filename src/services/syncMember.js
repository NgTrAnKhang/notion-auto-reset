// src/services/syncMembers.js
import fs from "fs";
import path from "path";

// Đường dẫn tới file members.js
const membersFilePath = path.resolve(__dirname, "members.js");

// Hàm để load current members (assumes members.js exports an array named `members`)
function loadMembers() {
  const content = fs.readFileSync(membersFilePath, "utf8");
  // giả sử file có dạng: export const members = [ ... ];
  const match = content.match(/export\s+const\s+members\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error("Không tìm thấy định dạng export const members = [...] trong members.js");
  }
  const arrayLiteral = match[1];
  const members = JSON.parse(arrayLiteral);
  return members;
}

// Hàm để save lại members vào file
function saveMembers(members) {
  const newContent = `export const members = ${JSON.stringify(members, null, 2)};\n`;
  fs.writeFileSync(membersFilePath, newContent, "utf8");
  console.log(`✅ Đã cập nhật members.js với tổng số thành viên: ${members.length}`);
}

// Ví dụ: nguồn user mới (đây bạn sẽ thay bằng nguồn thực tế)
const newUsers = [
  { id: "3", name: "Minh" },
  { id: "4", name: "Tuấn" },
  { id: "5", name: "Quân" }
];

// Hàm chính để sync
function syncMembers() {
  const current = loadMembers();
  const existingIds = new Set(current.map(m => m.id));
  const additions = [];

  for (const user of newUsers) {
    if (!existingIds.has(user.id)) {
      console.log(`🆕 Thêm thành viên mới: id=${user.id}, name=${user.name}`);
      current.push({ id: user.id, name: user.name });
      additions.push(user);
    }
  }

  if (additions.length > 0) {
    saveMembers(current);
  } else {
    console.log("✅ Không có thành viên mới cần thêm");
  }

  return additions;
}

// Nếu chạy file này trực tiếp
if (require.main === module) {
  syncMembers();
}

// Export hàm nếu bạn muốn gọi từ chỗ khác
export { syncMembers };
