export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry(fn, { retries = 3, delayMs = 500, shouldRetry } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (shouldRetry && !shouldRetry(err, attempt)) break;
      if (!shouldRetry && attempt >= retries) break;
      await delay(delayMs);
    }
  }
  throw lastErr;
}
