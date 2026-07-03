export const DEMO_SERIES = [
  { id: "demo-series-1", name: "面部护理", sort_order: 1, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-series-2", name: "身体护理", sort_order: 2, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-series-3", name: "香氛家居", sort_order: 3, created_at: "2026-06-18T00:00:00Z" },
];

export const DEMO_PRODUCTS = [
  { id: "demo-product-1", product_number: 1, series_id: "demo-series-1", name: "温和洁面乳", specification: "120ml / 瓶", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-2", product_number: 2, series_id: "demo-series-1", name: "修护精华液", specification: "30ml / 瓶", shelf_life_days: 730, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-3", product_number: 3, series_id: "demo-series-2", name: "柔润身体乳", specification: "250ml / 瓶", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-4", product_number: 4, series_id: "demo-series-2", name: "净澈沐浴露", specification: "300ml / 瓶", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-5", product_number: 5, series_id: "demo-series-3", name: "雪松香氛蜡烛", specification: "180g / 盒", shelf_life_days: null, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-6", product_number: 6, series_id: "demo-series-3", name: "无火香薰", specification: "100ml / 盒", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
];

export const DEMO_GIFTS = [
  { id: "demo-gift-1", gift_number: 1, name: "旅行分装瓶", specification: "30ml × 2", created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-gift-2", gift_number: 2, name: "品牌棉布袋", specification: "1 个", created_at: "2026-06-18T00:00:00Z" },
];

export const DEMO_MECHANISMS = [
  {
    id: "demo-mechanism-1",
    library_id: "demo-library-1",
    mechanism_number: 1,
    mechanism_copy: "购买指定套装，随单赠送旅行分装瓶与品牌棉布袋。",
    is_fixed: false,
    created_at: "2026-06-18T00:00:00Z",
    mechanism_gifts: [
      { gift_id: "demo-gift-1", quantity: 1 },
      { gift_id: "demo-gift-2", quantity: 1 },
    ],
  },
];

export const DEMO_MECHANISM_LIBRARIES = [
  { id: "demo-library-1", name: "五一活动", created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-library-2", name: "618 活动", created_at: "2026-06-18T00:00:00Z" },
];

export const DEMO_SKUS = [
  {
    id: "demo-sku-1",
    sku_number: 1,
    name: "温和洁面乳 × 1 + 修护精华液 × 1",
    created_at: "2026-06-18T00:00:00Z",
    sku_products: [
      { product_id: "demo-product-1", quantity: 1 },
      { product_id: "demo-product-2", quantity: 1 },
    ],
  },
  {
    id: "demo-sku-2",
    sku_number: 2,
    name: "柔润身体乳 × 1 + 净澈沐浴露 × 2",
    created_at: "2026-06-18T00:00:00Z",
    sku_products: [
      { product_id: "demo-product-3", quantity: 1 },
      { product_id: "demo-product-4", quantity: 2 },
    ],
  },
];

export const DEMO_ACTIVITIES = [];

export const DEFAULT_SKU_NAME_FIELDS = ["series", "name", "specification"];
export const DEFAULT_DUPLICATE_SETTINGS = { skus: false, products: false, series: false, gifts: false };
export const SKU_NAME_FIELD_LABELS = {
  series: "系列",
  name: "产品名称",
  specification: "规格",
};

export function readDemo(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function formatShelfLife(days) {
  if (!days) return "—";
  if (days % 365 === 0) return `${days / 365} 年`;
  if (days % 30 === 0) return `${days / 30} 个月`;
  return `${days} 天`;
}

export function generateSkuName(items, products, series, fields = DEFAULT_SKU_NAME_FIELDS) {
  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));
  const seriesMap = Object.fromEntries(series.map((item) => [item.id, item]));
  return (items || [])
    .filter((item) => item.product_id && productMap[item.product_id])
    .sort((a, b) => productMap[a.product_id].product_number - productMap[b.product_id].product_number)
    .map((item) => {
      const product = productMap[item.product_id];
      const values = {
        series: seriesMap[product.series_id]?.name || "",
        name: product.name || "",
        specification: product.specification || "",
      };
      const baseName = fields.map((field) => values[field]).join("");
      return Number(item.quantity) > 1 ? `${baseName} × ${Number(item.quantity)}` : baseName;
    })
    .join(" + ");
}

export function getCompositionKey(items) {
  return (items || [])
    .filter((item) => item.product_id && Number(item.quantity) > 0)
    .map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }))
    .sort((a, b) => a.product_id.localeCompare(b.product_id))
    .map((item) => `${item.product_id}:${item.quantity}`)
    .join("|");
}

export function getMechanismDuplicateKey(mechanismCopy, items) {
  const copyKey = String(mechanismCopy || "").trim().toLowerCase();
  const giftKey = (items || [])
    .filter((item) => item.gift_id && Number(item.quantity) > 0)
    .map((item) => ({ gift_id: item.gift_id, quantity: Number(item.quantity) }))
    .sort((a, b) => a.gift_id.localeCompare(b.gift_id))
    .map((item) => `${item.gift_id}:${item.quantity}`)
    .join("|");
  return copyKey && giftKey ? `${copyKey}::${giftKey}` : "";
}

export function getEffectiveProductSellingPoints(product, series) {
  if (!product) return "";
  if (product.selling_points !== null && product.selling_points !== undefined) return product.selling_points;
  return series.find((item) => item.id === product.series_id)?.selling_points || "";
}

export function normalizeSellingCopy(value) {
  return Array.isArray(value) ? value.join("\n") : (value || "");
}

export function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function safeFilename(value) {
  return String(value || "表格预览").trim().replace(/[\\/:*?"<>|]/g, "-") || "表格预览";
}

export function getAuthErrorMessage(error) {
  if (!error) return "操作失败，请稍后再试。";
  const message = error.message || String(error);
  if (/failed to fetch|networkerror|load failed|fetch/i.test(message)) {
    return "无法连接认证服务。请检查网络后重试，或稍后再试。";
  }
  return message;
}
