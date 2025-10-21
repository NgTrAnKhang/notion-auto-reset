import { notion } from "../utils/notionClient.js";
import { writeLog } from "../utils/logger.js";
import { DATABASE_ID, MEMBER_USERS } from "../config.js";

export async function resetData() {
  writeLog("🕓 Bắt đầu reset dữ liệu...");

  try {
    // Cập nhật danh sách thành viên
    const newOptions = MEMBER_USERS.map((user) => ({
      name: user.name,
      color: user.color || "default",
    }));

    await notion.databases.update({
      database_id: DATABASE_ID,
      properties: {
        "Thành viên": {
          multi_select: { options: newOptions },
        },
      },
    });

    const pages = await notion.databases.query({ database_id: DATABASE_ID });

    for (const page of pages.results) {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          "Thành viên": { multi_select: [] },
        },
      });
      writeLog(`✅ Đã xoá 'Thành viên' trong page: ${page.id}`);
    }

    writeLog("🎉 Reset thành công.");
  } catch (err) {
    writeLog("❌ Lỗi khi reset: " + err.message);
  }
}
