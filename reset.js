// reset.js
import { Client } from "@notionhq/client";
const notificationPageId = "2916d882db6d80408466c2146b15a9dd";
const MEMBER_USERS = [
  { name: "Khang lớn", id: "291d872b-594c-8197-90f0-0002ee26f5aa" },
  { name: "Bờm", id: "292d872b-594c-81c4-8334-00029b03970f" },
  { name: "Luân", id: "292d872b-594c-810b-a245-00024185a41c" },
  { name: "Huy Vũ", id: "292d872b-594c-810a-a915-00020cc29e5f" },
  { name: "Danh", id: "292d872b-594c-8152-ae38-000244d0abed" },
];

// 🔐 Lấy biến môi trường từ GitHub Secrets
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;
const TestDB = "h2926d882db6d8030ad27cacffeb6edde";

const notion = new Client({ auth: NOTION_TOKEN });

// 🧩 Danh sách thành viên cố định
const MEMBER_OPTIONS = [
  "Khang lớn",
  "Bờm",
  "Bếu",
  "Huy Vũ",
  "Hải",
  "Luân",
  "Danh",
];

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

    const currentOptions = db.properties["Thành viên"].multi_select.options.map(
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
// 📥 1. Hàm lấy dữ liệu từ cột "asd"
async function getFieldData(column) {
  writeLog("📥 Đang lấy dữ liệu từ cột 'asd'...");

  try {
    const pages = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    for (const page of pages.results) {
      const properties = page.properties;
      const asdField = properties[column];
      const peopleList = [];

      if (asdField && asdField.type === "people") {
        asdField.people.forEach((person) => {
          if (person.object === "user") {
            peopleList.push({
              id: person.id,
              name: person.name,
            });
          }
        });

        writeLog(`👥 Dữ liệu 'asd' trong page ${page.id}:`);
        peopleList.forEach((p) => {
          writeLog(`   - ${p.name} (ID: ${p.id})`);
        });
      } else {
        writeLog(
          `⚠️ Không tìm thấy dữ liệu hợp lệ trong 'asd' cho page ${page.id}`
        );
      }
    }
  } catch (err) {
    writeLog("❌ Lỗi khi lấy dữ liệu 'asd': " + err.message);
  }
}

async function notifyUsers(pageId) {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
  // const existingBlocks = await notion.blocks.children.list({
  //   block_id: pageId,
  // });

  // for (const block of existingBlocks.results) {
  //   try {
  //     await notion.blocks.delete({ block_id: block.id });
  //   } catch (err) {
  //     writeLog(`⚠️ Không thể xoá block ${block.id}: ${err.message}`);
  //   }
  // }
  const children = MEMBER_USERS.map(({ name, id }) => ({
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: ` ${now}: `,
          },
        },
        {
          type: "text",
          text: {
            content: `Vào vote đi,${name} `,
          },
        },
        {
          type: "mention",
          mention: {
            type: "user",
            user: {
              id: id,
            },
          },
          plain_text: `( @${name} )`,
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
async function getAllBlocks(pageId) {
  let blocks = [];
  let cursor = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return blocks;
}

/**
 * In ra tất cả block trong page, kèm ID, loại, và nội dung nếu có
 */
async function logAllBlocks(pageId) {
  try {
    const blocks = await getAllBlocks(pageId);
    console.log(`📋 Trang có ${blocks.length} block:`);

    blocks.forEach((block, index) => {
      const id = block.id;
      const type = block.type;

      // Lấy nội dung text nếu block có rich_text hoặc title
      let content = "[Không có nội dung]";
      if (block[type]?.rich_text?.length) {
        content = block[type].rich_text.map(rt => rt.plain_text).join("");
      } else if (block[type]?.title?.length) {
        content = block[type].title.map(rt => rt.plain_text).join("");
      }

      console.log(`\n🔹 Block #${index + 1}`);
      console.log(`🆔 ID     : ${id}`);
      console.log(`📦 Loại   : ${type}`);
      console.log(`📝 Nội dung : ${content}`);
    });

  } catch (err) {
    console.error("❌ Lỗi khi lấy block:", err);
  }
}


// 🚀 Chạy chương trình chính ngay khi workflow chạy
(async () => {
  const connected = await testConnection();
  if (!connected) {
    writeLog("⚠️ Dừng chương trình vì không kết nối được với Notion.");
    process.exit(1);
  }
  await resetData();
  logAllBlocks(notificationPageId);
  //await notifyUsers(notificationPageId);
})();
