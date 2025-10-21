import  {getAllBlocks} from "../utils/blockHelpers.js";
async function notifyUsers(pageId, headingText) {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const date = new Date(now);

  const pad = (n) => String(n).padStart(2, "0");

  const formatted = `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(
    date.getDate()
  )}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;


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
            content: `${formatted}: Vào vote đi, ${name} `,
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