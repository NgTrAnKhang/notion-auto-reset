import { resetData } from "./functions/resetData.js";
import { getFieldData } from "./functions/getFieldData.js";
import { notifyUsers } from "./functions/notifyUsers.js";
import { deleteChildrenOfHeading } from "./functions/deleteChildren.js";
import { testConnection } from "./utils/notionClient.js";
import { MAIN_PAGE_ID } from "./config.js";
import { writeLog } from "./utils/logger.js";

const args = process.argv.slice(2);
const action = args[0]; // ví dụ: "reset-data"

const actions = {
  "reset-data": resetData,
  "get-users": () => getFieldData("User"),
  "notify-users": () => notifyUsers(MAIN_PAGE_ID, "Thông báo:"),
  "delete-notify": () => deleteChildrenOfHeading(MAIN_PAGE_ID, "Thông báo:"),
};

(async () => {
  const connected = await testConnection?.();
  if (!connected) {
    writeLog("❌ Không kết nối được Notion. Dừng.");
    process.exit(1);
  }

  if (!actions[action]) {
    writeLog(`❌ Không tìm thấy action: "${action}"`);
    console.log("📌 Danh sách lệnh hợp lệ:", Object.keys(actions).join(", "));
    process.exit(1);
  }

  await actions[action]();
})();
