export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const pad = (n) => String(n).padStart(2, "0");

export const formatVNTime = () => {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const date = new Date(now);
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(
    date.getDate()
  )}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};
