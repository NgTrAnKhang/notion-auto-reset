// reset.js
import { Client } from "@notionhq/client";
const notificationPageId = "2916d882db6d80408466c2146b15a9dd";
const MEMBER_USERS = [
  { name: "Khang", id: "2916d882-db6d-804d-a8e2-ca447c7e30d1" },
];

// 🔐 Lấy biến môi trường từ GitHub Secrets
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;

const notion = new Client({ auth: NOTION_TOKEN });

// 🧩 Danh sách thành viên cố định
const MEMBER_OPTIONS = ["Khang", "Bờm", "Bếu", "Huy", "Hải"];

// 📜 Ghi log ra console (không cần ghi file trong GitHub Actions)
function writeLog(message) {
  const timestamp = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  console.log(`[${timestamp}] ${message}`);
}

// 🧠 Kiểm tra kết nối đến Notion
async function testConnection() {
  writeLog("🔍 Kiểm tra kết nối đến Notion Database...");

  if (!NOTION_TOKEN || !DATABASE_ID) {
    writeLog("❌ Thiếu NOTION_TOKEN hoặc DATABASE_ID trong biến môi trường");
    return false;
  }

  try {
    const db = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });
    writeLog(`✅ Kết nối thành công đến database: ${db.title[0].plain_text}`);
    return true;
  } catch (err) {
    writeLog("❌ Không thể kết nối đến database: " + err.message);
    return false;
  }
}

// 🔄 Đảm bảo danh sách option “Thành viên” có đầy đủ
async function ensureMemberOptions() {
  try {
    const db = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });

    const currentOptions =
      db.properties["Thành viên"].multi_select.options.map(
        (opt) => opt.name
      );

    const missing = MEMBER_OPTIONS.filter(
      (name) => !currentOptions.includes(name)
    );

    if (missing.length > 0) {
      writeLog("➕ Thêm các thành viên còn thiếu: " + missing.join(", "));
      await notion.databases.update({
        database_id: DATABASE_ID,
        properties: {
          "Thành viên": {
            multi_select: {
              options: [
                ...db.properties["Thành viên"].multi_select.options,
                ...missing.map((name) => ({ name })),
              ],
            },
          },
        },
      });
    } else {
      writeLog("✅ Danh sách thành viên đã đầy đủ.");
    }
  } catch (err) {
    writeLog("❌ Lỗi khi kiểm tra danh sách thành viên: " + err.message);
  }
}

// 🧹 Reset dữ liệu cột “Thành viên”
async function resetData() {
  writeLog("🕓 Bắt đầu reset dữ liệu...");

  try {
    await ensureMemberOptions();

    const pages = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    for (const page of pages.results) {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          "Thành viên": { multi_select: [] },
        },
      });
      writeLog(`✅ Đã xoá 'Thành viên' trong page: ${page.id}`);
    }

    writeLog("🎉 Hoàn tất reset cột 'Thành viên'!");
  } catch (err) {
    writeLog("❌ Lỗi khi reset: " + err.message);
  }
}
async function notifyUsers(pageId) {
  const children = MEMBER_USERS.map(({name, id}) => ({
    type: "paragraph",
    paragraph: {
      text: [
        {
          type: "mention",
          mention: {
            type: "user",
            user: {
              id: id,
            },
          },
          plain_text: `@${name}`,
        },
        {
          type: "text",
          text: {
            content: " Đã chạy reset thành công!",
          },
        },
      ],
    },
  }));

  await notion.blocks.children.append({
    block_id: pageId,
    children,
  });

  writeLog("✅ Đã gửi thông báo đến tất cả thành viên.");
}
// 🚀 Chạy chương trình chính ngay khi workflow chạy
(async () => {
  const connected = await testConnection();
  if (!connected) {
    writeLog("⚠️ Dừng chương trình vì không kết nối được với Notion.");
    process.exit(1);
  }

  await resetData();
  await notifyUsers(notificationPageId);
})(); 
