// reset.js
import { Client } from "@notionhq/client";
const notificationPageId = "2916d882db6d80408466c2146b15a9dd";
const mainPageId = "2916d882db6d804eaa96e6c338ab1bea";

const MEMBER_USERS = [
  { name: "Khang lớn", id: "291d872b-594c-8197-90f0-0002ee26f5aa" },
  { name: "Bờm", id: "292d872b-594c-81c4-8334-00029b03970f" },
  { name: "Luân", id: "292d872b-594c-810b-a245-00024185a41c" },
  { name: "Huy Vũ", id: "292d872b-594c-810a-a915-00020cc29e5f" },
  { name: "Danh", id: "292d872b-594c-8152-ae38-000244d0abed" },
  { name: "Huyo1", id: "292d872b-594c-8139-954e-0002159195af" },
];

// 🔐 Lấy biến môi trường từ GitHub Secrets
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.DATABASE_ID;
const listUserDB_ID = "2926d882db6d8030ad27cacffeb6edde";
const notion = new Client({ auth: NOTION_TOKEN });

// 🧩 Danh sách thành viên cố định
// const MEMBER_OPTIONS = [
//   "Khang lớn",
//   "Bờm",
//   "Bếu",
//   "Huy Vũ",
//   "Hải",
//   "Luân",
//   "Danh",
// ];

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
    writeLog("🔄 Đang cập nhật danh sách 'Thành viên' kèm màu...");

    const db = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });

    // Tạo danh sách options có màu
    const newOptions = MEMBER_USERS.map(user => ({
      name: user.name,
      color: user.color || "default", // fallback nếu không có màu
    }));

    // Cập nhật field "Thành viên" với options mới
    await notion.databases.update({
      database_id: DATABASE_ID,
      properties: {
        "Thành viên": {
          multi_select: {
            options: newOptions,
          },
        },
      },
    });

    writeLog("✅ Đã cập nhật xong danh sách 'Thành viên' có màu.");
  } catch (err) {
    writeLog("❌ Lỗi khi cập nhật danh sách thành viên: " + err.message);
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
  writeLog("📥 Đang lấy dữ liệu từ cột 'User'...");

  try {
    const pages = await notion.databases.query({
      database_id: listUserDB_ID,
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

        writeLog(`👥 Dữ liệu 'User' trong page ${page.id}:`);
        peopleList.forEach((p) => {
          writeLog(`   - ${p.name} (ID: ${p.id})`);
        });
      } else {
        writeLog(
          `⚠️ Không tìm thấy dữ liệu hợp lệ trong 'User' cho page ${page.id}`
        );
      }
    }
  } catch (err) {
    writeLog("❌ Lỗi khi lấy dữ liệu 'User': " + err.message);
  }
}

async function notifyUsers(pageId, headingText) {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });

  // Lấy tất cả block trong page
  const blocks = await getAllBlocks(pageId);

  // Tìm heading theo nội dung
  const headingBlock = blocks.find((block) => {
    const type = block.type;
    const richText = block[type]?.rich_text;
    if (!richText || !Array.isArray(richText)) return false;
    const content = richText.map((rt) => rt.plain_text).join("");
    return (
      ["heading_1", "heading_2", "heading_3"].includes(type) &&
      content.trim().toLowerCase() === headingText.trim().toLowerCase()
    );
  });

  if (!headingBlock) {
    writeLog(`❌ Không tìm thấy heading "${headingText}" trong page.`);
    return;
  }

  const headingId = headingBlock.id;
  writeLog(`✅ Tìm thấy heading "${headingText}" (ID: ${headingId})`);

  // Xoá tất cả block con của heading
  const children = await getAllBlocks(headingId);
  for (const child of children) {
    await notion.blocks.delete({ block_id: child.id });
    writeLog(`🗑️ Đã xoá block con: ${child.id}`);
  }

  // Tạo các block mới để thông báo
  const newBlocks = MEMBER_USERS.map(({ name, id }) => ({
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: `${now}: Vào vote đi, ${name} `,
          },
        },
        {
          type: "mention",
          mention: {
            type: "user",
            user: { id },
          },
          plain_text: `(@${name})`,
        },
      ],
    },
  }));

  // Thêm các block con mới dưới heading
  await notion.blocks.children.append({
    block_id: headingId,
    children: newBlocks,
  });

  writeLog("✅ Đã gửi thông báo mới");
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
        content = block[type].rich_text.map((rt) => rt.plain_text).join("");
      } else if (block[type]?.title?.length) {
        content = block[type].title.map((rt) => rt.plain_text).join("");
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
// Hàm delay giúp "nghỉ" giữa các thao tác API
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hàm xóa block an toàn có retry
async function safeDeleteBlock(blockId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await notion.blocks.delete({ block_id: blockId });
      console.log(`🗑️ Đã xoá block con: ${blockId}`);
      return;
    } catch (err) {
      if (err.code === "conflict_error" && attempt < retries) {
        console.warn(
          `⚠️ Xung đột khi xoá block ${blockId}, thử lại lần ${attempt}...`
        );
        await delay(500); // chờ 0.5s rồi thử lại
      } else {
        console.error(`❌ Không thể xoá block ${blockId}:`, err.message);
        break;
      }
    }
  }
}

// Hàm chính
async function deleteChildrenOfHeading(pageId, headingText) {
  const blocks = await getAllBlocks(pageId);

  // Tìm heading
  const headingBlock = blocks.find((block) => {
    const type = block.type;
    const richText = block[type]?.rich_text;
    if (!richText || !Array.isArray(richText)) return false;
    const content = richText.map((rt) => rt.plain_text).join("");
    return (
      ["heading_1", "heading_2", "heading_3"].includes(type) &&
      content.trim().toLowerCase() === headingText.trim().toLowerCase()
    );
  });

  if (!headingBlock) {
    console.log(`❌ Không tìm thấy heading với nội dung: "${headingText}"`);
    return;
  }

  console.log(`✅ Tìm thấy heading "${headingText}" (id: ${headingBlock.id})`);

  // Lấy các block con
  const children = await getAllBlocks(headingBlock.id);

  if (children.length === 0) {
    console.log("ℹ️ Heading không có block con.");
    return;
  }

  console.log(`🧹 Đang xoá ${children.length} block con:`);

  // Xoá lần lượt từng block con một cách an toàn
  for (const child of children) {
    await safeDeleteBlock(child.id);
    await delay(300); // nghỉ giữa mỗi lần xoá
  }

  console.log(`✅ Đã xoá xong toàn bộ con của heading "${headingText}"`);
}

// 🚀 Chạy chương trình chính ngay khi workflow chạy
(async () => {
  const connected = await testConnection();
  if (!connected) {
    writeLog("⚠️ Dừng chương trình vì không kết nối được với Notion.");
    process.exit(1);
  }
  await getFieldData("User"); //Lấy id user
  await resetData(); //Reset data
  // await logAllBlocks(mainPageId); //Lấy các block trong page
  // await deleteChildrenOfHeading(mainPageId,"Thông báo:"); //Xóa thông báo cũ
  // await notifyUsers(mainPageId,"Thông báo:"); //Thông báo đến tất cả thành viên
})();
