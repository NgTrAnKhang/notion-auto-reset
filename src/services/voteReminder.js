// src/services/voteReminder.js
import notionClient from "./notionClient.js"; // client Notion của bạn
import { sendNotification } from "./notifications.js"; // hàm gửi thông báo

const databaseId = process.env.NOTION_DATABASE_ID;

// Danh sách tất cả thành viên trong nhóm
const allMembers = [
  "Hè",
  "Khang lớn",
  "Hùng",
  "Minh",
  "Tuấn",
  "Quân",
  "Hải",
  "Long"
];

/**
 * Lấy danh sách các thành viên đã vote trong tuần
 */
async function getVotedMembers() {
  const response = await notionClient.databases.query({
    database_id: databaseId,
  });

  const voted = new Set();

  for (const page of response.results) {
    const memberProp = page.properties["Thành viên"];
    if (memberProp && memberProp.multi_select) {
      memberProp.multi_select.forEach(m => {
        if (m.name) voted.add(m.name);
      });
    }
  }

  return voted;
}

/**
 * Gửi nhắc nhở những người chưa vote bất kỳ ngày nào trong tuần
 */
export async function remindUnvotedMembers() {
  try {
    const votedMembers = await getVotedMembers();
    const unvoted = allMembers.filter(name => !votedMembers.has(name));

    if (unvoted.length > 0) {
      const message = `⚠️ Những người chưa vote tuần này: ${unvoted.join(", ")}`;
      console.log("[Vote Reminder]", message);

      // Gửi thông báo (qua Discord, Slack, Telegram... tùy notifications.js)
      await sendNotification({ text: message });
    } else {
      console.log("[Vote Reminder] ✅ Tất cả thành viên đã vote!");
    }
  } catch (error) {
    console.error("[Vote Reminder] ❌ Lỗi khi kiểm tra:", error.message);
  }
}

// Nếu bạn muốn chạy trực tiếp file này bằng node:
// node src/services/voteReminder.js
if (import.meta.url === `file://${process.argv[1]}`) {
  remindUnvotedMembers();
}
