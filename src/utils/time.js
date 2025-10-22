export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatNowHHmmDDMMYYYY(tz = 'Asia/Ho_Chi_Minh') {
  const now = new Date().toLocaleString('en-US', { timeZone: tz });
  const d = new Date(now);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
