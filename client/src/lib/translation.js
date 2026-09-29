const CACHE_PREFIX = "heritageQuest:translation:v3";
const GOOGLE_BATCH_BYTES = 1600;
const MYMEMORY_BATCH_BYTES = 340;
const REQUEST_TIMEOUT_MS = 9000;
const MAX_CONCURRENT_REQUESTS = 3;
const BATCH_MARKER = "\uE000\uE001\uE002";

const pendingRequests = new Map();
const requestQueue = [];
let activeRequests = 0;

const myMemoryCodeOverrides = {
  "mni-Mtei": "mni",
};

function byteLength(value) {
  return new TextEncoder().encode(String(value || "")).length;
}

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function cacheKey(source, target) {
  return `${CACHE_PREFIX}:${target}:${source.length}:${hashText(source)}`;
}

function normalized(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function isUsableTranslation(value, source) {
  if (typeof value !== "string" || !value.trim()) return false;
  const upper = value.toUpperCase();
  if (
    upper.includes("MYMEMORY WARNING") ||
    upper.includes("QUERY LENGTH LIMIT") ||
    /<html[\s>]/i.test(value)
  ) {
    return false;
  }
  return normalized(value) !== normalized(source);
}

function readCache(source, target) {
  try {
    const cached = window.localStorage.getItem(cacheKey(source, target));
    if (isUsableTranslation(cached, source)) return cached;
    if (cached) window.localStorage.removeItem(cacheKey(source, target));
  } catch {
    // Translation still works when storage is unavailable.
  }
  return null;
}

function writeCache(source, target, translated) {
  if (!isUsableTranslation(translated, source)) return;
  try {
    window.localStorage.setItem(cacheKey(source, target), translated);
  } catch {
    // The cache is optional (private browsing and full storage can reject it).
  }
}

function drainQueue() {
  while (
    activeRequests < MAX_CONCURRENT_REQUESTS &&
    requestQueue.length > 0
  ) {
    const { task, resolve, reject } = requestQueue.shift();
    activeRequests += 1;
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        activeRequests -= 1;
        drainQueue();
      });
  }
}

function runLimited(task) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ task, resolve, reject });
    drainQueue();
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestGoogle(source, target) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: target,
    dt: "t",
    q: source,
  });
  const response = await fetchWithTimeout(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
  );
  if (!response.ok) throw new Error(`Google translation failed: ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    throw new Error("Google translation returned an unexpected response");
  }

  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part) => part?.[0] || "").join("")
    : "";
  if (!isUsableTranslation(translated, source)) {
    throw new Error("Google translation did not translate the text");
  }
  return translated;
}

async function requestMyMemory(source, target) {
  const fallbackTarget = myMemoryCodeOverrides[target] || target;
  const params = new URLSearchParams({
    q: source,
    langpair: `en|${fallbackTarget}`,
  });
  const response = await fetchWithTimeout(
    `https://api.mymemory.translated.net/get?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`MyMemory translation failed: ${response.status}`);
  }

  const payload = await response.json();
  const translated = payload?.responseData?.translatedText;
  if (
    Number(payload?.responseStatus || 200) !== 200 ||
    !isUsableTranslation(translated, source)
  ) {
    throw new Error(payload?.responseDetails || "MyMemory did not translate the text");
  }
  return translated;
}

function sharedRequest(provider, source, target) {
  const key = `${provider}:${target}:${source.length}:${hashText(source)}`;
  if (pendingRequests.has(key)) return pendingRequests.get(key);

  const request = runLimited(() =>
    provider === "google"
      ? requestGoogle(source, target)
      : requestMyMemory(source, target),
  ).finally(() => pendingRequests.delete(key));

  pendingRequests.set(key, request);
  return request;
}

function groupEntries(entries, maxBytes) {
  const groups = [];
  let current = [];
  let currentBytes = 0;
  const markerBytes = byteLength(`\n${BATCH_MARKER}\n`);

  entries.forEach((entry) => {
    const nextBytes = byteLength(entry.source) + (current.length ? markerBytes : 0);
    if (current.length && currentBytes + nextBytes > maxBytes) {
      groups.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(entry);
    currentBytes += byteLength(entry.source) + (current.length > 1 ? markerBytes : 0);
  });

  if (current.length) groups.push(current);
  return groups;
}

async function translateGroup(entries, target, provider) {
  const source = entries.map((entry) => entry.source).join(`\n${BATCH_MARKER}\n`);
  const translated = await sharedRequest(provider, source, target);
  const parts = entries.length === 1 ? [translated] : translated.split(BATCH_MARKER);

  if (parts.length !== entries.length) {
    throw new Error("Translation provider changed the batch boundary");
  }

  return parts.map((part) => part.trim());
}

function splitParagraph(paragraph, maxBytes = MYMEMORY_BATCH_BYTES) {
  if (byteLength(paragraph) <= maxBytes) return [paragraph];

  const words = paragraph.split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (current && byteLength(candidate) > maxBytes) {
      chunks.push(current);
      current = word;
      return;
    }
    current = candidate;
  });

  if (current) chunks.push(current);
  return chunks.length ? chunks : [paragraph];
}

async function translateLongWithMyMemory(source, target) {
  const paragraphs = source.split(/\n\s*\n/);
  const translatedParagraphs = await Promise.all(
    paragraphs.map(async (paragraph) => {
      const chunks = splitParagraph(paragraph);
      const translatedChunks = await Promise.all(
        chunks.map((chunk) => sharedRequest("mymemory", chunk, target)),
      );
      return translatedChunks.join(" ");
    }),
  );
  return translatedParagraphs.join("\n\n");
}

function assignTranslations(entries, values, target, resultMap) {
  entries.forEach((entry, index) => {
    const translated = values[index];
    const finalValue = translated?.trim() || entry.source;
    resultMap.set(entry.source, finalValue);
    writeCache(entry.source, target, finalValue);
  });
}

/**
 * Translates a collection atomically while deduplicating, batching and caching
 * requests. Failed provider responses are never cached as successful results.
 */
export async function translateTexts(texts, target) {
  const sourceTexts = texts.map((value) => String(value ?? ""));
  if (!target || target === "en") return sourceTexts;

  const resultMap = new Map();
  const uniqueMissing = [];
  const seen = new Set();

  sourceTexts.forEach((source) => {
    if (!source) {
      resultMap.set(source, source);
      return;
    }
    const cached = readCache(source, target);
    if (cached) {
      resultMap.set(source, cached);
      return;
    }
    if (!seen.has(source)) {
      seen.add(source);
      uniqueMissing.push({ source });
    }
  });

  const googleFailures = [];
  await Promise.all(
    groupEntries(uniqueMissing, GOOGLE_BATCH_BYTES).map(async (group) => {
      try {
        const values = await translateGroup(group, target, "google");
        assignTranslations(group, values, target, resultMap);
      } catch {
        googleFailures.push(...group);
      }
    }),
  );

  const shortFallbacks = googleFailures.filter(
    (entry) => byteLength(entry.source) <= MYMEMORY_BATCH_BYTES,
  );
  const longFallbacks = googleFailures.filter(
    (entry) => byteLength(entry.source) > MYMEMORY_BATCH_BYTES,
  );
  const individualFallbacks = [];

  await Promise.all(
    groupEntries(shortFallbacks, MYMEMORY_BATCH_BYTES).map(async (group) => {
      try {
        const values = await translateGroup(group, target, "mymemory");
        assignTranslations(group, values, target, resultMap);
      } catch {
        individualFallbacks.push(...group);
      }
    }),
  );

  await Promise.all(
    individualFallbacks.map(async (entry) => {
      try {
        const value = await sharedRequest("mymemory", entry.source, target);
        assignTranslations([entry], [value], target, resultMap);
      } catch {
        resultMap.set(entry.source, entry.source);
      }
    }),
  );

  await Promise.all(
    longFallbacks.map(async (entry) => {
      try {
        const value = await translateLongWithMyMemory(entry.source, target);
        assignTranslations([entry], [value], target, resultMap);
      } catch {
        resultMap.set(entry.source, entry.source);
      }
    }),
  );

  return sourceTexts.map((source) => resultMap.get(source) ?? source);
}

export async function translateText(text, target) {
  const [translated] = await translateTexts([text], target);
  return translated;
}
