import "dotenv/config";
import { Client } from "@notionhq/client";
import cron from "node-cron";
import fs from "fs";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// 🧩 Danh sách thành viên cố định
const MEMBER_OPTIONS = ["Khang", "Bờm", "Bếu", "Huy", "Hải"];

// 📜 Hàm ghi log ra file reset.log
function writeLog(message) {
  const timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const log = `[${timestamp}] ${message}\n`;
  fs.appendFileSync("reset.log", log);
  console.log(message);
}

// 🧠 Kiểm tra kết nối đến Notion
async function testConnection() {
  writeLog("🔍 Kiểm tra kết nối đến Notion Database...");

  if (!process.env.NOTION_TOKEN || !process.env.DATABASE_ID) {
    writeLog("❌ Thiếu NOTION_TOKEN hoặc DATABASE_ID trong file .env");
    return false;
  }

  try {
    const db = await notion.databases.retrieve({
      database_id: process.env.DATABASE_ID,
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
      database_id: process.env.DATABASE_ID,
    });

    const currentOptions = db.properties["Thành viên"].multi_select.options.map(
      (opt) => opt.name
    );

    const missing = MEMBER_OPTIONS.filter((name) => !currentOptions.includes(name));

    if (missing.length > 0) {
      writeLog("➕ Thêm các thành viên còn thiếu: " + missing.join(", "));
      await notion.databases.update({
        database_id: process.env.DATABASE_ID,
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
      database_id: process.env.DATABASE_ID,
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

// 🚀 Chạy chương trình chính
(async () => {
  const connected = await testConnection();
  if (!connected) {
    writeLog("⚠️ Dừng chương trình vì không kết nối được với Notion.");
    process.exit(1);
  }

  writeLog("🕒 Bot đang chạy — sẽ reset cột 'Thành viên' lúc 23:35 tối Chủ nhật hàng tuần...");
  cron.schedule("35 23 * * 0", resetData); 
})();
