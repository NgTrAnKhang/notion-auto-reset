export function timestampNow(tz = 'Asia/Ho_Chi_Minh', locale = 'vi-VN') {
  return new Date().toLocaleString(locale, { timeZone: tz });
}

export function log(message) {
  console.log(`[${timestampNow()}] ${message}`);
}

export function warn(message) {
  console.warn(`[${timestampNow()}] ${message}`);
}

export function error(message) {
  console.error(`[${timestampNow()}] ${message}`);
}
