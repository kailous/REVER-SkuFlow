import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowsDownUp,
  CalendarBlank,
  CaretDown,
  Check,
  Cube,
  DownloadSimple,
  DotsThree,
  FolderSimple,
  GearSix,
  Gift,
  ListBullets,
  MagnifyingGlass,
  Minus,
  Package,
  PencilSimple,
  Plus,
  SignOut,
  SpinnerGap,
  Trash,
  X,
} from "@phosphor-icons/react";
import { supabase, supabaseReady } from "./supabase";

const DEMO_SERIES = [
  { id: "demo-series-1", name: "面部护理", sort_order: 1, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-series-2", name: "身体护理", sort_order: 2, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-series-3", name: "香氛家居", sort_order: 3, created_at: "2026-06-18T00:00:00Z" },
];

const DEMO_PRODUCTS = [
  { id: "demo-product-1", product_number: 1, series_id: "demo-series-1", name: "温和洁面乳", specification: "120ml / 瓶", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-2", product_number: 2, series_id: "demo-series-1", name: "修护精华液", specification: "30ml / 瓶", shelf_life_days: 730, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-3", product_number: 3, series_id: "demo-series-2", name: "柔润身体乳", specification: "250ml / 瓶", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-4", product_number: 4, series_id: "demo-series-2", name: "净澈沐浴露", specification: "300ml / 瓶", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-5", product_number: 5, series_id: "demo-series-3", name: "雪松香氛蜡烛", specification: "180g / 盒", shelf_life_days: null, created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-product-6", product_number: 6, series_id: "demo-series-3", name: "无火香薰", specification: "100ml / 盒", shelf_life_days: 1095, created_at: "2026-06-18T00:00:00Z" },
];

const DEMO_GIFTS = [
  { id: "demo-gift-1", gift_number: 1, name: "旅行分装瓶", specification: "30ml × 2", created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-gift-2", gift_number: 2, name: "品牌棉布袋", specification: "1 个", created_at: "2026-06-18T00:00:00Z" },
];

const DEMO_MECHANISMS = [
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

const DEMO_MECHANISM_LIBRARIES = [
  { id: "demo-library-1", name: "五一活动", created_at: "2026-06-18T00:00:00Z" },
  { id: "demo-library-2", name: "618 活动", created_at: "2026-06-18T00:00:00Z" },
];

const DEMO_SKUS = [
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

const DEMO_ACTIVITIES = [];

const DEFAULT_SKU_NAME_FIELDS = ["series", "name", "specification"];
const DEFAULT_DUPLICATE_SETTINGS = { skus: false, products: false, series: false, gifts: false };
const SKU_NAME_FIELD_LABELS = {
  series: "系列",
  name: "产品名称",
  specification: "规格",
};

function readDemo(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatShelfLife(days) {
  if (!days) return "—";
  if (days % 365 === 0) return `${days / 365} 年`;
  if (days % 30 === 0) return `${days / 30} 个月`;
  return `${days} 天`;
}

function generateSkuName(items, products, series, fields = DEFAULT_SKU_NAME_FIELDS) {
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

function getCompositionKey(items) {
  return (items || [])
    .filter((item) => item.product_id && Number(item.quantity) > 0)
    .map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }))
    .sort((a, b) => a.product_id.localeCompare(b.product_id))
    .map((item) => `${item.product_id}:${item.quantity}`)
    .join("|");
}

function getMechanismDuplicateKey(mechanismCopy, items) {
  const copyKey = String(mechanismCopy || "").trim().toLowerCase();
  const giftKey = (items || [])
    .filter((item) => item.gift_id && Number(item.quantity) > 0)
    .map((item) => ({ gift_id: item.gift_id, quantity: Number(item.quantity) }))
    .sort((a, b) => a.gift_id.localeCompare(b.gift_id))
    .map((item) => `${item.gift_id}:${item.quantity}`)
    .join("|");
  return copyKey && giftKey ? `${copyKey}::${giftKey}` : "";
}

function getEffectiveProductSellingPoints(product, series) {
  if (!product) return "";
  if (product.selling_points !== null && product.selling_points !== undefined) return product.selling_points;
  return series.find((item) => item.id === product.series_id)?.selling_points || "";
}

function normalizeSellingCopy(value) { return Array.isArray(value) ? value.join("\n") : (value || ""); }

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function safeFilename(value) {
  return String(value || "表格预览").trim().replace(/[\\/:*?"<>|]/g, "-") || "表格预览";
}

function getAuthErrorMessage(error) {
  if (!error) return "操作失败，请稍后再试。";
  const message = error.message || String(error);
  if (/failed to fetch|networkerror|load failed|fetch/i.test(message)) {
    return "无法连接认证服务。请检查网络后重试，或稍后再试。";
  }
  return message;
}

function AuthView({ onDemo, recoveryMode = false, notice = "", onRecoveryComplete }) {
  const [mode, setMode] = useState(recoveryMode ? "updatePassword" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(notice);

  useEffect(() => {
    if (recoveryMode) setMode("updatePassword");
  }, [recoveryMode]);

  useEffect(() => {
    setMessage(notice);
  }, [notice]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setPasswordConfirm("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!supabaseReady) {
      setMessage("Supabase 环境变量尚未配置，请使用本地演示模式。");
      return;
    }
    if (mode === "updatePassword" && password !== passwordConfirm) {
      setMessage("两次输入的新密码不一致。");
      return;
    }
    setBusy(true);
    setMessage("");

    let data;
    let error;
    try {
      if (mode === "login") {
        ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
      } else if (mode === "register") {
        ({ data, error } = await supabase.auth.signUp({ email, password }));
      } else if (mode === "forgot") {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}${window.location.pathname}`,
          }),
        });
        data = await response.json().catch(() => ({}));
        if (!response.ok) error = new Error(data.error || "重置邮件发送失败，请稍后再试。");
      } else {
        ({ data, error } = await supabase.auth.updateUser({ password }));
      }
    } catch (authError) {
      error = authError;
    }

    setBusy(false);
    if (error) {
      setMessage(getAuthErrorMessage(error));
      return;
    }
    if (mode === "register" && !data.session) {
      setMessage("注册成功。请检查邮箱并完成验证后登录。");
    } else if (mode === "forgot") {
      setMessage("重置邮件已发送。请打开邮箱里的链接继续设置新密码。");
    } else if (mode === "updatePassword") {
      setMessage("密码已更新。请使用新密码重新登录。");
      setPassword("");
      setPasswordConfirm("");
      await supabase.auth.signOut();
      onRecoveryComplete?.("密码已更新。请使用新密码重新登录。");
    }
  }

  const title = {
    login: "登录工作台",
    register: "创建测试账号",
    forgot: "重置密码",
    updatePassword: "设置新密码",
  }[mode];
  const intro = {
    login: "管理产品资料、系列与保质期。数据通过 Supabase 安全同步。",
    register: "创建账号后即可开始同步管理商品资料。",
    forgot: "输入账号邮箱，我们会发送一封密码重置邮件。",
    updatePassword: "请输入新密码，保存后使用新密码重新登录。",
  }[mode];
  const needsEmail = mode !== "updatePassword";
  const needsPassword = mode !== "forgot";

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-mark"><Cube weight="duotone" size={22} /></div>
        <p className="eyebrow">REVER SkuFlow</p>
        <h1>{title}</h1>
        <p className="auth-intro">{intro}</p>
        <form onSubmit={submit} className="auth-form">
          {needsEmail && <label>邮箱<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required /></label>}
          {needsPassword && <label>{mode === "updatePassword" ? "新密码" : "密码"}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" minLength={6} required /></label>}
          {mode === "updatePassword" && <label>确认新密码<input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="再次输入新密码" minLength={6} required /></label>}
          {message && <p className="form-message">{message}</p>}
          <button className="button primary full" disabled={busy} type="submit">
            {busy && <SpinnerGap className="spin" />}
            {mode === "login" && "登录"}
            {mode === "register" && "注册"}
            {mode === "forgot" && "发送重置邮件"}
            {mode === "updatePassword" && "保存新密码"}
          </button>
        </form>
        {mode === "login" && (
          <div className="auth-links">
            <button className="text-button" onClick={() => switchMode("forgot")}>忘记密码？</button>
            <button className="text-button" onClick={() => switchMode("register")}>没有账号？注册一个</button>
          </div>
        )}
        {mode === "register" && <button className="text-button" onClick={() => switchMode("login")}>已有账号？返回登录</button>}
        {mode === "forgot" && <button className="text-button" onClick={() => switchMode("login")}>想起密码？返回登录</button>}
        {mode !== "updatePassword" && (
          <>
            <div className="auth-divider"><span>或</span></div>
            <button className="button secondary full" onClick={onDemo}>进入本地演示</button>
            <p className="auth-note">演示模式只保存在当前浏览器，不会写入线上数据库。</p>
          </>
        )}
      </section>
    </main>
  );
}

function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button className="drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer-header">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="icon-button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </header>
        {children}
      </aside>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = "确认删除", busy, onCancel, onConfirm }) {
  return (
    <div className="dialog-layer" role="alertdialog" aria-modal="true">
      <button className="dialog-backdrop" aria-label="取消" onClick={onCancel} />
      <div className="confirm-dialog">
        <div className="danger-icon"><Trash size={20} /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="button secondary" onClick={onCancel}>取消</button>
          <button className="button danger" disabled={busy} onClick={onConfirm}>{busy && <SpinnerGap className="spin" />}{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ product, series, busy, onClose, onSave }) {
  const [values, setValues] = useState({
    series_id: product?.series_id || series[0]?.id || "",
    name: product?.name || "",
    specification: product?.specification || "",
    shelf_life_days: product?.shelf_life_days ?? "",
    selling_points: product ? (product.selling_points === null ? null : normalizeSellingCopy(product.selling_points)) : null,
  });

  function update(key, value) { setValues((current) => ({ ...current, [key]: value })); }
  function submit(event) {
    event.preventDefault();
    onSave({
      ...values,
      name: values.name.trim(),
      specification: values.specification.trim() || null,
      shelf_life_days: values.shelf_life_days === "" ? null : Number(values.shelf_life_days),
    });
  }

  return (
    <Drawer title={product ? "编辑产品" : "新建产品"} subtitle={product ? `编号 #${String(product.product_number).padStart(4, "0")}` : "编号与 UUID 将由系统自动生成"} onClose={onClose}>
      <form className="drawer-form" onSubmit={submit}>
        <div className="form-fields">
          <label>系列<select value={values.series_id} onChange={(e) => update("series_id", e.target.value)} required><option value="" disabled>请选择系列</option>{series.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label>产品名称<input value={values.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：温和洁面乳" required autoFocus /></label>
          <label>规格<input value={values.specification} onChange={(e) => update("specification", e.target.value)} placeholder="例如：120ml / 瓶" /></label>
          <label>保质期（天）<input type="number" min="1" value={values.shelf_life_days} onChange={(e) => update("shelf_life_days", e.target.value)} placeholder="例如：1095" /><small>留空表示不适用或暂未设置</small></label>
          <label className="inherit-toggle"><input type="checkbox" checked={values.selling_points === null} onChange={(e) => update("selling_points", e.target.checked ? null : [])} />使用系列卖点</label>
          {values.selling_points !== null && <label>产品卖点文案<textarea value={values.selling_points} onChange={(e) => update("selling_points", e.target.value)} placeholder="输入一段完整的卖点文案" /></label>}
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || !values.series_id} type="submit">{busy && <SpinnerGap className="spin" />}保存产品</button></footer>
      </form>
    </Drawer>
  );
}

function GiftForm({ gift, busy, onClose, onSave }) {
  const [values, setValues] = useState({
    name: gift?.name || "",
    specification: gift?.specification || "",
  });

  function update(key, value) { setValues((current) => ({ ...current, [key]: value })); }
  function submit(event) {
    event.preventDefault();
    onSave({
      name: values.name.trim(),
      specification: values.specification.trim() || null,
    });
  }

  return (
    <Drawer title={gift ? "编辑赠品" : "新建赠品"} subtitle={gift ? `编号 #${String(gift.gift_number).padStart(4, "0")}` : "编号与 UUID 将由系统自动生成"} onClose={onClose}>
      <form className="drawer-form" onSubmit={submit}>
        <div className="form-fields">
          <label>赠品名称<input value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：旅行分装瓶" required autoFocus /></label>
          <label>规格<input value={values.specification} onChange={(event) => update("specification", event.target.value)} placeholder="例如：30ml × 2" /></label>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy} type="submit">{busy && <SpinnerGap className="spin" />}保存赠品</button></footer>
      </form>
    </Drawer>
  );
}

function MechanismForm({ mechanism, gifts, busy, onClose, onSave }) {
  const [items, setItems] = useState(
    mechanism?.mechanism_gifts?.length
      ? mechanism.mechanism_gifts.map((item) => ({ ...item }))
      : [{ gift_id: gifts[0]?.id || "", quantity: 1 }],
  );
  const [mechanismCopy, setMechanismCopy] = useState(mechanism?.mechanism_copy || "");
  const [isFixed, setIsFixed] = useState(Boolean(mechanism?.is_fixed));
  const selectedIds = new Set(items.map((item) => item.gift_id).filter(Boolean));

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }
  function addItem() {
    const nextGift = gifts.find((gift) => !selectedIds.has(gift.id));
    if (nextGift) setItems((current) => [...current, { gift_id: nextGift.id, quantity: 1 }]);
  }
  function submit(event) {
    event.preventDefault();
    onSave({
      mechanism_copy: mechanismCopy.trim(),
      items: items.filter((item) => item.gift_id).map((item) => ({ gift_id: item.gift_id, quantity: Number(item.quantity) })),
      is_fixed: isFixed,
    });
  }

  return (
    <Drawer title={mechanism?.id ? "编辑机制" : "新建机制"} subtitle={mechanism?.id ? `编号 #${String(mechanism.mechanism_number).padStart(4, "0")}` : "编号与 UUID 将由系统自动生成"} onClose={onClose}>
      <form className="drawer-form" onSubmit={submit}>
        <div className="form-fields">
          <fieldset className="composition-fieldset">
            <legend>赠品组合</legend>
            <div className="composition-list">
              {items.map((item, index) => (
                <div className="composition-row" key={`${item.gift_id}-${index}`}>
                  <select aria-label={`赠品 ${index + 1}`} value={item.gift_id} onChange={(event) => updateItem(index, "gift_id", event.target.value)} required>
                    <option value="" disabled>选择赠品</option>
                    {gifts.map((gift) => <option key={gift.id} value={gift.id} disabled={gift.id !== item.gift_id && selectedIds.has(gift.id)}>#{String(gift.gift_number).padStart(4, "0")} · {gift.name}{gift.specification ? ` · ${gift.specification}` : ""}</option>)}
                  </select>
                  <label className="quantity-input"><span>数量</span><input aria-label={`赠品数量 ${index + 1}`} type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} required /></label>
                  <button className="icon-button remove-composition" type="button" aria-label={`移除赠品 ${index + 1}`} disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Minus size={17} /></button>
                </div>
              ))}
            </div>
            <button className="add-composition" type="button" disabled={selectedIds.size >= gifts.length} onClick={addItem}><Plus size={15} />添加赠品</button>
          </fieldset>
          <label>机制文案<textarea value={mechanismCopy} onChange={(event) => setMechanismCopy(event.target.value)} placeholder="输入一段完整的机制说明" required /></label>
          <label className="toggle-row compact-toggle"><span><strong>固定机制</strong><small>开启后，这一条机制会自动应用到使用本库的所有活动 SKU</small></span><input type="checkbox" checked={isFixed} onChange={(event) => setIsFixed(event.target.checked)} /></label>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || items.length === 0 || !mechanismCopy.trim()} type="submit">{busy && <SpinnerGap className="spin" />}保存机制</button></footer>
      </form>
    </Drawer>
  );
}

function MechanismLibraryForm({ library, busy, onClose, onSave }) {
  const [name, setName] = useState(library?.name || "");
  return (
    <Drawer title={library ? "编辑机制库" : "新建机制库"} subtitle="每个机制库拥有独立的机制表和编号" onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); onSave({ name: name.trim() }); }}>
        <div className="form-fields"><label>机制库名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：五一活动" required autoFocus /></label></div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || !name.trim()} type="submit">{busy && <SpinnerGap className="spin" />}保存机制库</button></footer>
      </form>
    </Drawer>
  );
}

function CopyMechanismLibraryForm({ library, mechanismCount, busy, onClose, onCopy }) {
  const [name, setName] = useState(`${library.name} 副本`);
  return (
    <Drawer title="复制机制库" subtitle="库内全部机制、赠品组合与数量都会一起复制" onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); onCopy(name.trim()); }}>
        <div className="form-fields">
          <label>新机制库名称<input value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label>
          <div className="generated-name-field"><span>复制内容</span><output>{library.name}</output><small>包含 {mechanismCount} 个机制；副本创建后可独立修改</small></div>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || !name.trim()} type="submit">{busy && <SpinnerGap className="spin" />}复制机制库</button></footer>
      </form>
    </Drawer>
  );
}

function CopyMechanismForm({ mechanism, libraries, currentLibraryId, busy, onClose, onCopy }) {
  const targets = libraries.filter((library) => library.id !== currentLibraryId);
  const [targetId, setTargetId] = useState(targets[0]?.id || "");
  return (
    <Drawer title="复制机制" subtitle={`复制机制 #${String(mechanism.mechanism_number).padStart(4, "0")}，副本可独立修改`} onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); onCopy(targetId); }}>
        <div className="form-fields"><label>目标机制库<select value={targetId} onChange={(event) => setTargetId(event.target.value)} required><option value="" disabled>选择机制库</option>{targets.map((library) => <option key={library.id} value={library.id}>{library.name}</option>)}</select></label><div className="generated-name-field"><span>复制内容</span><output>{mechanism.mechanism_copy}</output><small>赠品组合和数量会一起复制</small></div></div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || !targetId} type="submit">{busy && <SpinnerGap className="spin" />}复制机制</button></footer>
      </form>
    </Drawer>
  );
}

function ActivityForm({ libraries, busy, onClose, onSave }) {
  const [libraryId, setLibraryId] = useState(libraries[0]?.id || "");
  const [name, setName] = useState(libraries[0]?.name || "");

  function changeLibrary(nextId) {
    const currentLibrary = libraries.find((library) => library.id === libraryId);
    const nextLibrary = libraries.find((library) => library.id === nextId);
    setLibraryId(nextId);
    if (!name.trim() || name === currentLibrary?.name) setName(nextLibrary?.name || "");
  }

  return (
    <Drawer title="新建活动" subtitle="选择机制库后，系统会建立包含全部 SKU 的活动表" onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); onSave({ name: name.trim(), mechanism_library_id: libraryId }); }}>
        <div className="form-fields">
          <label>机制库<select value={libraryId} onChange={(event) => changeLibrary(event.target.value)} required><option value="" disabled>请选择机制库</option>{libraries.map((library) => <option key={library.id} value={library.id}>{library.name}</option>)}</select><small>活动中只能选择这个库里的机制</small></label>
          <label>活动名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：618 活动" required /></label>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || !libraryId || !name.trim()} type="submit">{busy && <SpinnerGap className="spin" />}建立活动表</button></footer>
      </form>
    </Drawer>
  );
}

function ActivitySkuForm({ sku, binding, mechanisms, fixedMechanisms, giftMap, busy, onClose, onSave }) {
  const [mechanismId, setMechanismId] = useState(binding?.mechanism_id || "");
  const [mechanismCopy, setMechanismCopy] = useState(binding?.mechanism_copy || "");

  return (
    <Drawer title="绑定活动机制" subtitle={`SKU #${String(sku.sku_number).padStart(4, "0")} · ${sku.name}`} onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); onSave({ mechanism_id: mechanismId || null, mechanism_copy: mechanismCopy.trim() }); }}>
        <div className="form-fields">
          <label>活动机制文案<textarea value={mechanismCopy} onChange={(event) => setMechanismCopy(event.target.value)} placeholder="可为这个 SKU 单独填写一段机制文案" /><small>这是活动内的独立文案，不会修改机制库中的原机制</small></label>
          {fixedMechanisms.length > 0 && <fieldset className="mechanism-picker fixed-mechanism-preview"><legend>固定机制 · 自动生效</legend>{fixedMechanisms.map((mechanism) => <div className="mechanism-option fixed" key={mechanism.id}><span className="mechanism-option-content"><span className="mechanism-option-heading"><strong>{mechanism.mechanism_copy}</strong><small>#{String(mechanism.mechanism_number).padStart(4, "0")}</small></span><span className="mechanism-gift-summary">{mechanism.mechanism_gifts?.map((item) => `${giftMap[item.gift_id]?.name || "未知赠品"} ×${item.quantity}`).join(" + ") || "无赠品"}</span></span></div>)}</fieldset>}
          <fieldset className="mechanism-picker">
            <legend>选择附加机制</legend>
            <div className="mechanism-options-scroll">
              <label className={`mechanism-option ${mechanismId === "" ? "selected" : ""}`}>
                <input type="radio" name="activity-mechanism" value="" checked={mechanismId === ""} onChange={() => setMechanismId("")} />
                <span><strong>暂不绑定机制</strong><small>只保存上方的活动机制文案</small></span>
              </label>
              {mechanisms.map((mechanism) => (
                <label className={`mechanism-option ${mechanismId === mechanism.id ? "selected" : ""}`} key={mechanism.id}>
                  <input type="radio" name="activity-mechanism" value={mechanism.id} checked={mechanismId === mechanism.id} onChange={() => setMechanismId(mechanism.id)} />
                  <span className="mechanism-option-content">
                    <span className="mechanism-option-heading"><strong>{mechanism.mechanism_copy}</strong><small>#{String(mechanism.mechanism_number).padStart(4, "0")}</small></span>
                    <span className="mechanism-gift-summary">{mechanism.mechanism_gifts?.map((item) => `${giftMap[item.gift_id]?.name || "未知赠品"} ×${item.quantity}`).join(" + ") || "无赠品"}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy} type="submit">{busy && <SpinnerGap className="spin" />}保存绑定</button></footer>
      </form>
    </Drawer>
  );
}

function SeriesForm({ item, nextSortOrder, busy, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? nextSortOrder);
  const [sellingPoints, setSellingPoints] = useState(normalizeSellingCopy(item?.selling_points));
  return (
    <Drawer title={item ? "编辑系列" : "新建系列"} subtitle="系列用于组织与筛选产品" onClose={onClose}>
      <form className="drawer-form" onSubmit={(e) => { e.preventDefault(); onSave({ name: name.trim(), sort_order: Number(sortOrder), selling_points: sellingPoints }); }}>
        <div className="form-fields">
          <label>系列名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：面部护理" required autoFocus /></label>
          <label>排序<input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} required /><small>数字越小，显示越靠前</small></label>
          <label>系列卖点文案<textarea value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} placeholder="输入一段完整的卖点文案" /></label>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy} type="submit">{busy && <SpinnerGap className="spin" />}保存系列</button></footer>
      </form>
    </Drawer>
  );
}

function SkuForm({ sku, skus, products, series, nameFields, allowDuplicate, busy, onClose, onSave }) {
  const [items, setItems] = useState(
    sku?.sku_products?.length
      ? sku.sku_products.map((item) => ({ ...item }))
      : [{ product_id: products[0]?.id || "", quantity: 1 }],
  );
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [price, setPrice] = useState(sku?.price ?? "");
  const [sellingMode, setSellingMode] = useState(sku?.selling_points !== null && sku?.selling_points !== undefined ? "custom" : "source");
  const [sourceProductId, setSourceProductId] = useState(sku?.selling_points_source_product_id || items[0]?.product_id || "");
  const [customPoints, setCustomPoints] = useState(normalizeSellingCopy(sku?.selling_points));

  const selectedIds = new Set(items.map((item) => item.product_id).filter(Boolean));
  const generatedName = generateSkuName(items, products, series, nameFields);
  const compositionKey = getCompositionKey(items);
  const duplicateSkus = skus.filter((item) => item.id !== sku?.id && getCompositionKey(item.sku_products) === compositionKey);
  const sourcePoints = getEffectiveProductSellingPoints(products.find((product) => product.id === sourceProductId), series);

  useEffect(() => setDuplicateConfirmed(false), [compositionKey]);

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )));
  }

  function addItem() {
    const nextProduct = products.find((product) => !selectedIds.has(product.id));
    if (nextProduct) setItems((current) => [...current, { product_id: nextProduct.id, quantity: 1 }]);
  }

  function submit(event) {
    event.preventDefault();
    if (duplicateSkus.length > 0 && !allowDuplicate) return;
    if (duplicateSkus.length > 0 && allowDuplicate && !duplicateConfirmed) {
      setDuplicateConfirmed(true);
      return;
    }
    const normalized = items
      .filter((item) => item.product_id)
      .map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }));
    onSave({ items: normalized, price: price === "" ? null : Number(price), selling_points: sellingMode === "custom" ? customPoints : null, selling_points_source_product_id: sellingMode === "source" ? (sourceProductId || normalized[0]?.product_id) : null });
  }

  return (
    <Drawer
      title={sku ? "编辑 SKU" : "新建 SKU"}
      subtitle={sku ? `编号 #${String(sku.sku_number).padStart(4, "0")}` : "编号与 UUID 将由系统自动生成"}
      onClose={onClose}
    >
      <form className="drawer-form" onSubmit={submit}>
        <div className="form-fields">
          <div className="generated-name-field">
            <span>SKU 名称（自动生成）</span>
            <output>{generatedName || "选择产品后自动生成"}</output>
            <small>名称会随产品组合和数量自动更新</small>
          </div>
          {duplicateSkus.length > 0 && (
            <div className={`duplicate-warning ${duplicateConfirmed ? "confirming" : ""}`} role="alert">
              <strong>发现重复组合</strong>
              <span>与 {duplicateSkus.map((item) => `#${String(item.sku_number).padStart(4, "0")}`).join("、")} 的产品和数量完全相同。</span>
              {!allowDuplicate && <small>设置中不允许重复 SKU，无法保存。</small>}
              {allowDuplicate && duplicateConfirmed && <small>请再次点击保存，确认保留这个重复 SKU。</small>}
            </div>
          )}
          <fieldset className="composition-fieldset">
            <legend>产品组合</legend>
            <div className="composition-list">
              {items.map((item, index) => (
                <div className="composition-row" key={`${item.product_id}-${index}`}>
                  <select
                    aria-label={`产品 ${index + 1}`}
                    value={item.product_id}
                    onChange={(event) => updateItem(index, "product_id", event.target.value)}
                    required
                  >
                    <option value="" disabled>选择产品</option>
                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={product.id !== item.product_id && selectedIds.has(product.id)}
                      >
                        #{String(product.product_number).padStart(4, "0")} · {product.name}
                      </option>
                    ))}
                  </select>
                  <label className="quantity-input">
                    <span>数量</span>
                    <input
                      aria-label={`数量 ${index + 1}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, "quantity", event.target.value)}
                      required
                    />
                  </label>
                  <button
                    className="icon-button remove-composition"
                    type="button"
                    aria-label={`移除产品 ${index + 1}`}
                    disabled={items.length === 1}
                    onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Minus size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-composition"
              type="button"
              disabled={selectedIds.size >= products.length}
              onClick={addItem}
            >
              <Plus size={15} />添加产品
            </button>
          </fieldset>
          <label>价格<input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" /></label>
          <label>卖点方式<select value={sellingMode} onChange={(e) => setSellingMode(e.target.value)}><option value="source">选择产品卖点</option><option value="custom">直接编辑</option></select></label>
          {sellingMode === "source" ? <label>卖点来源产品<select value={sourceProductId} onChange={(e) => setSourceProductId(e.target.value)}>{items.filter((item) => item.product_id).map((item) => <option key={item.product_id} value={item.product_id}>{products.find((p) => p.id === item.product_id)?.name}</option>)}</select><small>默认选取组合中的第一个产品</small>{sourcePoints && <output className="selling-points-preview">{normalizeSellingCopy(sourcePoints)}</output>}</label> : <label>SKU 卖点文案<textarea value={customPoints} onChange={(e) => setCustomPoints(e.target.value)} placeholder="输入一段完整的卖点文案" /></label>}
        </div>
        <footer className="drawer-actions">
          <button className="button secondary" type="button" onClick={onClose}>取消</button>
          <button className="button primary" disabled={busy || items.length === 0 || (duplicateSkus.length > 0 && !allowDuplicate)} type="submit">
            {busy && <SpinnerGap className="spin" />}{duplicateSkus.length > 0 && !allowDuplicate ? "重复 SKU 已禁止" : duplicateConfirmed ? "确认保存重复 SKU" : "保存 SKU"}
          </button>
        </footer>
      </form>
    </Drawer>
  );
}

export function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [view, setView] = useState("products");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("personal");
  const [theme, setTheme] = useState("system");
  const [demoNickname, setDemoNickname] = useState("");
  const [products, setProducts] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [mechanisms, setMechanisms] = useState([]);
  const [mechanismLibraries, setMechanismLibraries] = useState([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [previewActivityId, setPreviewActivityId] = useState("");
  const [series, setSeries] = useState([]);
  const [skus, setSkus] = useState([]);
  const [skuNameFields, setSkuNameFields] = useState(DEFAULT_SKU_NAME_FIELDS);
  const [duplicateSettings, setDuplicateSettings] = useState(DEFAULT_DUPLICATE_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [skuQuery, setSkuQuery] = useState("");
  const [giftQuery, setGiftQuery] = useState("");
  const [mechanismQuery, setMechanismQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [sort, setSort] = useState({ key: "product_number", direction: "asc" });
  const [productEditor, setProductEditor] = useState(null);
  const [giftEditor, setGiftEditor] = useState(null);
  const [mechanismEditor, setMechanismEditor] = useState(null);
  const [mechanismLibraryEditor, setMechanismLibraryEditor] = useState(null);
  const [copyMechanism, setCopyMechanism] = useState(null);
  const [copyMechanismLibrary, setCopyMechanismLibrary] = useState(null);
  const [activityEditor, setActivityEditor] = useState(null);
  const [activitySkuEditor, setActivitySkuEditor] = useState(null);
  const [seriesEditor, setSeriesEditor] = useState(null);
  const [skuEditor, setSkuEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const previewTheme = new URLSearchParams(window.location.search).get("theme");
    const savedTheme = localStorage.getItem("skuflow-theme");
    setDemoNickname(localStorage.getItem("skuflow-demo-nickname") || "");
    const nextTheme = previewTheme === "light" || previewTheme === "dark" ? previewTheme : savedTheme || "system";
    setTheme(nextTheme);
    if (nextTheme === "light" || nextTheme === "dark") document.documentElement.dataset.theme = nextTheme;
    else delete document.documentElement.dataset.theme;
  }, []);

  function updateTheme(nextTheme) {
    setTheme(nextTheme);
    localStorage.setItem("skuflow-theme", nextTheme);
    if (nextTheme === "light" || nextTheme === "dark") document.documentElement.dataset.theme = nextTheme;
    else delete document.documentElement.dataset.theme;
  }

  useEffect(() => {
    function focusPageSearch(event) {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const searchInput = document.querySelector(".workspace .search-field input");
      if (!searchInput) return;
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    window.addEventListener("keydown", focusPageSearch);
    return () => window.removeEventListener("keydown", focusPageSearch);
  }, []);

  useEffect(() => {
    if (!supabaseReady) { setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthChecked(true); });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
        setAuthNotice("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session || demoMode) loadData(); }, [session, demoMode]);
  useEffect(() => {
    setPreviewActivityId((current) => {
      if (!activities.length) return "";
      return activities.some((activity) => activity.id === current) ? current : activities[0].id;
    });
  }, [activities]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadData() {
    setLoading(true);
    if (demoMode) {
      const demoSeries = readDemo("skuflow-demo-series", DEMO_SERIES);
      const demoProducts = readDemo("skuflow-demo-products", DEMO_PRODUCTS);
      const demoGifts = readDemo("skuflow-demo-gifts", DEMO_GIFTS);
      const demoMechanismLibraries = readDemo("skuflow-demo-mechanism-libraries", DEMO_MECHANISM_LIBRARIES);
      const demoMechanisms = readDemo("skuflow-demo-mechanisms", DEMO_MECHANISMS).map((mechanism) => ({ ...mechanism, library_id: mechanism.library_id || demoMechanismLibraries[0]?.id, is_fixed: Boolean(mechanism.is_fixed) }));
      const demoActivities = readDemo("skuflow-demo-activities", DEMO_ACTIVITIES);
      const demoNameFields = readDemo("skuflow-demo-name-fields", DEFAULT_SKU_NAME_FIELDS);
      const demoDuplicateSettings = { ...DEFAULT_DUPLICATE_SETTINGS, ...readDemo("skuflow-demo-duplicate-settings", DEFAULT_DUPLICATE_SETTINGS) };
      const demoSkus = readDemo("skuflow-demo-skus", DEMO_SKUS).map((sku) => ({
        ...sku,
        name: generateSkuName(sku.sku_products, demoProducts, demoSeries, demoNameFields) || sku.name,
      }));
      setSeries(demoSeries);
      setProducts(demoProducts);
      setGifts(demoGifts);
      setMechanisms(demoMechanisms);
      setMechanismLibraries(demoMechanismLibraries);
      setActivities(demoActivities);
      localStorage.setItem("skuflow-demo-mechanisms", JSON.stringify(demoMechanisms));
      setSkus(demoSkus);
      setSkuNameFields(demoNameFields);
      setDuplicateSettings(demoDuplicateSettings);
      localStorage.setItem("skuflow-demo-skus", JSON.stringify(demoSkus));
      setLoading(false);
      return;
    }
    const [
      { data: seriesData, error: seriesError },
      { data: productData, error: productError },
      { data: giftData, error: giftError },
      { data: mechanismData, error: mechanismError },
      { data: mechanismLibraryData, error: mechanismLibraryError },
      { data: activityData, error: activityError },
      { data: skuData, error: skuError },
      { data: settingsData, error: settingsError },
    ] = await Promise.all([
      supabase.from("product_series").select("*").order("sort_order"),
      supabase.from("products").select("*").order("product_number"),
      supabase.from("gifts").select("*").order("gift_number"),
      supabase.from("gift_mechanisms").select("*, mechanism_gifts(gift_id, quantity)").order("mechanism_number"),
      supabase.from("mechanism_libraries").select("*").order("created_at"),
      supabase.from("activities").select("*, activity_skus(sku_id, mechanism_id, mechanism_copy, updated_at)").order("activity_number"),
      supabase.from("skus").select("*, sku_products(product_id, quantity)").order("sku_number"),
      supabase.from("app_settings").select("sku_name_fields, allow_duplicate_skus, allow_duplicate_products, allow_duplicate_series, allow_duplicate_gifts").eq("id", true).single(),
    ]);
    if (seriesError || productError || giftError || mechanismError || mechanismLibraryError || activityError || skuError || settingsError) setToast(seriesError?.message || productError?.message || giftError?.message || mechanismError?.message || mechanismLibraryError?.message || activityError?.message || skuError?.message || settingsError?.message || "加载失败");
    else {
      setSeries(seriesData || []);
      setProducts(productData || []);
      setGifts(giftData || []);
      setMechanisms(mechanismData || []);
      setMechanismLibraries(mechanismLibraryData || []);
      setActivities(activityData || []);
      setSkus(skuData || []);
      setSkuNameFields(settingsData?.sku_name_fields || DEFAULT_SKU_NAME_FIELDS);
      setDuplicateSettings({ skus: settingsData?.allow_duplicate_skus ?? false, products: settingsData?.allow_duplicate_products ?? false, series: settingsData?.allow_duplicate_series ?? false, gifts: settingsData?.allow_duplicate_gifts ?? false });
    }
    setLoading(false);
  }

  function saveDemo(nextProducts = products, nextSeries = series, nextSkus = skus, nextNameFields = skuNameFields, nextDuplicateSettings = duplicateSettings) {
    const namedSkus = nextSkus.map((sku) => ({
      ...sku,
      name: generateSkuName(sku.sku_products, nextProducts, nextSeries, nextNameFields) || sku.name,
    }));
    setProducts(nextProducts); setSeries(nextSeries); setSkus(namedSkus); setSkuNameFields(nextNameFields); setDuplicateSettings(nextDuplicateSettings);
    localStorage.setItem("skuflow-demo-products", JSON.stringify(nextProducts));
    localStorage.setItem("skuflow-demo-series", JSON.stringify(nextSeries));
    localStorage.setItem("skuflow-demo-skus", JSON.stringify(namedSkus));
    localStorage.setItem("skuflow-demo-name-fields", JSON.stringify(nextNameFields));
    localStorage.setItem("skuflow-demo-duplicate-settings", JSON.stringify(nextDuplicateSettings));
  }

  function saveDemoGifts(nextGifts) {
    setGifts(nextGifts);
    localStorage.setItem("skuflow-demo-gifts", JSON.stringify(nextGifts));
  }

  function saveDemoMechanisms(nextMechanisms) {
    setMechanisms(nextMechanisms);
    localStorage.setItem("skuflow-demo-mechanisms", JSON.stringify(nextMechanisms));
  }

  function saveDemoMechanismLibraries(nextLibraries) {
    setMechanismLibraries(nextLibraries);
    localStorage.setItem("skuflow-demo-mechanism-libraries", JSON.stringify(nextLibraries));
  }

  function saveDemoActivities(nextActivities) {
    setActivities(nextActivities);
    localStorage.setItem("skuflow-demo-activities", JSON.stringify(nextActivities));
  }

  async function saveMechanismLibrary(values) {
    const existing = mechanismLibraryEditor?.id ? mechanismLibraryEditor : null;
    const duplicate = mechanismLibraries.some((library) => library.id !== existing?.id && library.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    if (duplicate) { setToast("已存在同名机制库"); return; }
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? mechanismLibraries.map((library) => library.id === existing.id ? { ...library, ...values } : library)
        : [...mechanismLibraries, { ...values, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
      saveDemoMechanismLibraries(next);
    } else {
      const request = existing
        ? supabase.from("mechanism_libraries").update(values).eq("id", existing.id)
        : supabase.from("mechanism_libraries").insert(values);
      const { error } = await request;
      if (error) { setToast(error.code === "23505" ? "已存在同名机制库" : error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setMechanismLibraryEditor(null); setToast(existing ? "机制库已更新" : "机制库已创建");
  }

  async function saveMechanism(values) {
    const existing = mechanismEditor?.id ? mechanismEditor : null;
    const duplicateKey = getMechanismDuplicateKey(values.mechanism_copy, values.items);
    const duplicate = mechanisms.some((item) => item.library_id === selectedLibraryId && item.id !== existing?.id && getMechanismDuplicateKey(item.mechanism_copy, item.mechanism_gifts) === duplicateKey);
    if (duplicate) { setToast("已存在文案和赠品组合完全相同的机制"); return; }
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? mechanisms.map((item) => item.id === existing.id ? { ...item, mechanism_copy: values.mechanism_copy, mechanism_gifts: values.items, is_fixed: values.is_fixed } : item)
        : [...mechanisms, { id: crypto.randomUUID(), library_id: selectedLibraryId, mechanism_number: Math.max(0, ...mechanisms.filter((item) => item.library_id === selectedLibraryId).map((item) => item.mechanism_number)) + 1, mechanism_copy: values.mechanism_copy, mechanism_gifts: values.items, is_fixed: values.is_fixed, created_at: new Date().toISOString() }];
      saveDemoMechanisms(next);
    } else {
      const { error } = await supabase.rpc("save_gift_mechanism", { p_items: values.items, p_mechanism_copy: values.mechanism_copy, p_library_id: selectedLibraryId, p_mechanism_id: existing?.id || null, p_is_fixed: values.is_fixed });
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setMechanismEditor(null); setToast(existing ? "机制已更新" : "机制已创建");
  }

  async function copyMechanismToLibrary(targetLibraryId) {
    if (!copyMechanism) return;
    const duplicateKey = getMechanismDuplicateKey(copyMechanism.mechanism_copy, copyMechanism.mechanism_gifts);
    const duplicate = mechanisms.some((item) => item.library_id === targetLibraryId && getMechanismDuplicateKey(item.mechanism_copy, item.mechanism_gifts) === duplicateKey);
    if (duplicate) { setToast("目标机制库已存在文案和赠品组合完全相同的机制"); return; }
    setBusy(true);
    if (demoMode) {
      const nextNumber = Math.max(0, ...mechanisms.filter((item) => item.library_id === targetLibraryId).map((item) => item.mechanism_number)) + 1;
      saveDemoMechanisms([...mechanisms, { ...copyMechanism, id: crypto.randomUUID(), library_id: targetLibraryId, mechanism_number: nextNumber, mechanism_gifts: copyMechanism.mechanism_gifts.map((item) => ({ ...item })), created_at: new Date().toISOString() }]);
    } else {
      const { error } = await supabase.rpc("copy_gift_mechanism", { p_mechanism_id: copyMechanism.id, p_target_library_id: targetLibraryId });
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setCopyMechanism(null); setToast("机制已复制到目标库");
  }

  async function copyLibrary(newName) {
    if (!copyMechanismLibrary) return;
    const normalizedName = newName.trim().toLowerCase();
    if (mechanismLibraries.some((library) => library.name.trim().toLowerCase() === normalizedName)) { setToast("已存在同名机制库"); return; }
    setBusy(true);
    if (demoMode) {
      const newLibraryId = crypto.randomUUID();
      const sourceMechanisms = mechanisms.filter((item) => item.library_id === copyMechanismLibrary.id);
      const copiedMechanisms = sourceMechanisms.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        library_id: newLibraryId,
        mechanism_gifts: item.mechanism_gifts.map((gift) => ({ ...gift })),
        created_at: new Date().toISOString(),
      }));
      saveDemoMechanismLibraries([...mechanismLibraries, { id: newLibraryId, name: newName.trim(), created_at: new Date().toISOString() }]);
      saveDemoMechanisms([...mechanisms, ...copiedMechanisms]);
    } else {
      const { error } = await supabase.rpc("copy_mechanism_library", { p_library_id: copyMechanismLibrary.id, p_name: newName.trim() });
      if (error) { setToast(error.code === "23505" ? "已存在同名机制库" : error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setCopyMechanismLibrary(null); setToast("机制库及库内机制已复制");
  }

  async function saveGift(values, duplicateApproved = false) {
    const existing = giftEditor?.id ? giftEditor : null;
    const matches = gifts.filter((item) => item.id !== existing?.id && item.name.trim().toLowerCase() === values.name.trim().toLowerCase() && String(item.specification || "").trim().toLowerCase() === String(values.specification || "").trim().toLowerCase());
    if (matches.length && !duplicateSettings.gifts) { setToast("设置中不允许重复赠品，无法保存"); return; }
    if (matches.length && !duplicateApproved) { setDuplicateConfirm({ type: "gift", values }); return; }
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? gifts.map((item) => item.id === existing.id ? { ...item, ...values } : item)
        : [...gifts, { ...values, id: crypto.randomUUID(), gift_number: Math.max(0, ...gifts.map((item) => item.gift_number)) + 1, created_at: new Date().toISOString() }];
      saveDemoGifts(next);
    } else {
      const request = existing
        ? supabase.from("gifts").update(values).eq("id", existing.id)
        : supabase.from("gifts").insert(values);
      const { error } = await request;
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setGiftEditor(null); setToast(existing ? "赠品已更新" : "赠品已创建");
  }

  async function saveProduct(values, duplicateApproved = false) {
    const existing = productEditor?.id ? productEditor : null;
    const matches = products.filter((item) => item.id !== existing?.id && item.series_id === values.series_id && item.name.trim().toLowerCase() === values.name.trim().toLowerCase() && String(item.specification || "").trim().toLowerCase() === String(values.specification || "").trim().toLowerCase());
    if (matches.length && !duplicateSettings.products) { setToast("设置中不允许重复产品，无法保存"); return; }
    if (matches.length && !duplicateApproved) { setDuplicateConfirm({ type: "product", values }); return; }
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? products.map((item) => item.id === existing.id ? { ...item, ...values } : item)
        : [...products, { ...values, id: crypto.randomUUID(), product_number: Math.max(0, ...products.map((item) => item.product_number)) + 1, created_at: new Date().toISOString() }];
      saveDemo(next, series);
    } else {
      const request = existing
        ? supabase.from("products").update(values).eq("id", existing.id)
        : supabase.from("products").insert(values);
      const { error } = await request;
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setProductEditor(null); setToast(existing ? "产品已更新" : "产品已创建");
  }

  async function saveSeries(values, duplicateApproved = false) {
    const existing = seriesEditor?.id ? seriesEditor : null;
    const matches = series.filter((item) => item.id !== existing?.id && item.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    if (matches.length && !duplicateSettings.series) { setToast("设置中不允许重复系列，无法保存"); return; }
    if (matches.length && !duplicateApproved) { setDuplicateConfirm({ type: "series", values }); return; }
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? series.map((item) => item.id === existing.id ? { ...item, ...values } : item)
        : [...series, { ...values, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
      saveDemo(products, next);
    } else {
      const request = existing
        ? supabase.from("product_series").update(values).eq("id", existing.id)
        : supabase.from("product_series").insert(values);
      const { error } = await request;
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setSeriesEditor(null); setToast(existing ? "系列已更新" : "系列已创建");
  }

  async function saveSku(values) {
    setBusy(true);
    const existing = skuEditor?.id ? skuEditor : null;
    const generatedName = generateSkuName(values.items, products, series, skuNameFields);
    if (demoMode) {
      const next = existing
        ? skus.map((item) => item.id === existing.id
          ? { ...item, ...values, name: generatedName, sku_products: values.items }
          : item)
        : [
            ...skus,
            {
              id: crypto.randomUUID(),
              sku_number: Math.max(0, ...skus.map((item) => item.sku_number)) + 1,
              name: generatedName,
              price: values.price,
              selling_points: values.selling_points,
              selling_points_source_product_id: values.selling_points_source_product_id,
              created_at: new Date().toISOString(),
              sku_products: values.items,
            },
          ];
      saveDemo(products, series, next);
    } else {
      const { error } = await supabase.rpc("save_sku_v2", {
        p_items: values.items,
        p_price: values.price,
        p_selling_points: values.selling_points,
        p_source_product_id: values.selling_points_source_product_id,
        p_sku_id: existing?.id || null,
      });
      if (error) {
        setToast(error.message);
        setBusy(false);
        return;
      }
      await loadData();
    }
    setBusy(false);
    setSkuEditor(null);
    setToast(existing ? "SKU 已更新" : "SKU 已创建");
  }

  async function saveWorkspaceSettings(nextFields, nextDuplicateSettings) {
    setBusy(true);
    if (demoMode) {
      saveDemo(products, series, skus, nextFields, nextDuplicateSettings);
    } else {
      const { error } = await supabase.rpc("save_workspace_settings", { p_fields: nextFields, p_allow_duplicate_skus: nextDuplicateSettings.skus, p_allow_duplicate_products: nextDuplicateSettings.products, p_allow_duplicate_series: nextDuplicateSettings.series, p_allow_duplicate_gifts: nextDuplicateSettings.gifts });
      if (error) {
        setToast(error.message);
        setBusy(false);
        return;
      }
      await loadData();
    }
    setBusy(false);
    setToast("工作台设置已更新");
  }

  async function createActivity(values) {
    setBusy(true);
    if (demoMode) {
      const id = crypto.randomUUID();
      const nextActivity = {
        id,
        activity_number: Math.max(0, ...activities.map((item) => item.activity_number || 0)) + 1,
        ...values,
        created_at: new Date().toISOString(),
        activity_skus: skus.map((sku) => ({ sku_id: sku.id, mechanism_id: null, mechanism_copy: "" })),
      };
      saveDemoActivities([...activities, nextActivity]);
      setSelectedActivityId(id);
    } else {
      const { data, error } = await supabase.rpc("create_activity", { p_name: values.name, p_mechanism_library_id: values.mechanism_library_id });
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
      setSelectedActivityId(data);
    }
    setBusy(false);
    setActivityEditor(null);
    setToast("活动表已建立");
  }

  async function saveActivitySku(values) {
    if (!selectedActivityId || !activitySkuEditor) return;
    setBusy(true);
    if (demoMode) {
      const next = activities.map((activity) => {
        if (activity.id !== selectedActivityId) return activity;
        const currentBindings = activity.activity_skus || [];
        const existing = currentBindings.some((item) => item.sku_id === activitySkuEditor.id);
        const nextBinding = { sku_id: activitySkuEditor.id, ...values, updated_at: new Date().toISOString() };
        return { ...activity, activity_skus: existing ? currentBindings.map((item) => item.sku_id === activitySkuEditor.id ? nextBinding : item) : [...currentBindings, nextBinding] };
      });
      saveDemoActivities(next);
    } else {
      const { error } = await supabase.rpc("save_activity_sku", { p_activity_id: selectedActivityId, p_sku_id: activitySkuEditor.id, p_mechanism_id: values.mechanism_id, p_mechanism_copy: values.mechanism_copy });
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false);
    setActivitySkuEditor(null);
    setToast("SKU 活动机制已更新");
  }

  async function deleteItem() {
    if (!confirm) return;
    setBusy(true);
    const isProduct = confirm.type === "product";
    const isSeries = confirm.type === "series";
    const isSku = confirm.type === "sku";
    const isGift = confirm.type === "gift";
    const isMechanism = confirm.type === "mechanism";
    const isMechanismLibrary = confirm.type === "mechanism-library";
    const isActivity = confirm.type === "activity";
    if (demoMode) {
      if (isProduct && skus.some((sku) => sku.sku_products?.some((item) => item.product_id === confirm.item.id))) {
        setToast("该产品正在被 SKU 使用，暂时无法删除");
        setBusy(false);
        setConfirm(null);
        return;
      }
      if (isProduct) saveDemo(products.filter((item) => item.id !== confirm.item.id), series, skus);
      else if (isSeries && products.some((item) => item.series_id === confirm.item.id)) {
        setToast("该系列下还有产品，暂时无法删除");
        setBusy(false);
        setConfirm(null);
        return;
      } else if (isSeries) saveDemo(products, series.filter((item) => item.id !== confirm.item.id), skus);
      else if (isSku) saveDemo(products, series, skus.filter((item) => item.id !== confirm.item.id));
      else if (isGift && mechanisms.some((mechanism) => mechanism.mechanism_gifts?.some((item) => item.gift_id === confirm.item.id))) {
        setToast("该赠品正在被机制使用，暂时无法删除");
        setBusy(false);
        setConfirm(null);
        return;
      } else if (isGift) saveDemoGifts(gifts.filter((item) => item.id !== confirm.item.id));
      else if (isMechanism) saveDemoMechanisms(mechanisms.filter((item) => item.id !== confirm.item.id));
      else if (isActivity) saveDemoActivities(activities.filter((item) => item.id !== confirm.item.id));
      else if (isMechanismLibrary && mechanisms.some((item) => item.library_id === confirm.item.id)) {
        setToast("该机制库中还有机制，暂时无法删除");
        setBusy(false);
        setConfirm(null);
        return;
      } else if (isMechanismLibrary) saveDemoMechanismLibraries(mechanismLibraries.filter((item) => item.id !== confirm.item.id));
    } else {
      const table = isProduct ? "products" : isSeries ? "product_series" : isGift ? "gifts" : isMechanism ? "gift_mechanisms" : isMechanismLibrary ? "mechanism_libraries" : isActivity ? "activities" : "skus";
      const { error } = await supabase.from(table).delete().eq("id", confirm.item.id);
      if (error) {
        const relationMessage = isProduct ? "该产品正在被 SKU 使用，暂时无法删除" : isGift ? "该赠品正在被机制使用，暂时无法删除" : isMechanismLibrary ? "该机制库中还有机制，暂时无法删除" : "该系列下还有产品，暂时无法删除";
        setToast(error.code === "23503" ? relationMessage : error.message);
        setBusy(false);
        setConfirm(null);
        return;
      }
      await loadData();
    }
    setBusy(false);
    setConfirm(null);
    if (isMechanismLibrary && selectedLibraryId === confirm.item.id) setSelectedLibraryId(null);
    if (isActivity && selectedActivityId === confirm.item.id) setSelectedActivityId(null);
    setToast(isProduct ? "产品已删除" : isSeries ? "系列已删除" : isGift ? "赠品已删除" : isMechanism ? "机制已删除" : isMechanismLibrary ? "机制库已删除" : isActivity ? "活动已删除" : "SKU 已删除");
  }

  async function signOut() {
    if (demoMode) { setDemoMode(false); return; }
    await supabase.auth.signOut();
  }

  async function savePersonalSettings({ displayName, password }) {
    const nextDisplayName = displayName.trim();
    if (demoMode) {
      localStorage.setItem("skuflow-demo-nickname", nextDisplayName);
      setDemoNickname(nextDisplayName);
      setToast("个人设置已保存");
      return { ok: true };
    }
    if (!supabaseReady) return { ok: false, error: "Supabase 环境变量尚未配置。" };

    const currentDisplayName = session?.user?.user_metadata?.display_name || "";
    const values = {};
    if (nextDisplayName !== currentDisplayName) values.data = { ...(session?.user?.user_metadata || {}), display_name: nextDisplayName };
    if (password) values.password = password;
    if (Object.keys(values).length === 0) return { ok: true };

    setBusy(true);
    let data;
    let error;
    try {
      ({ data, error } = await supabase.auth.updateUser(values));
    } catch (authError) {
      error = authError;
    } finally {
      setBusy(false);
    }
    if (error) return { ok: false, error: getAuthErrorMessage(error) };
    if (data?.user) setSession((current) => current ? { ...current, user: data.user } : current);
    setToast(password ? "个人设置已保存，密码已更新" : "个人设置已保存");
    return { ok: true };
  }

  const seriesMap = useMemo(() => Object.fromEntries(series.map((item) => [item.id, item])), [series]);
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products
      .filter((item) => seriesFilter === "all" || item.series_id === seriesFilter)
      .filter((item) => !normalized || [item.name, item.specification, item.product_number, seriesMap[item.series_id]?.name].some((value) => String(value || "").toLowerCase().includes(normalized)))
      .sort((a, b) => {
        const aValue = sort.key === "series" ? seriesMap[a.series_id]?.name : a[sort.key];
        const bValue = sort.key === "series" ? seriesMap[b.series_id]?.name : b[sort.key];
        const result = typeof aValue === "number" ? (aValue || 0) - (bValue || 0) : String(aValue || "").localeCompare(String(bValue || ""), "zh-CN");
        return sort.direction === "asc" ? result : -result;
      });
  }, [products, query, seriesFilter, sort, seriesMap]);
  const productMap = useMemo(() => Object.fromEntries(products.map((item) => [item.id, item])), [products]);
  const duplicateCompositionKeys = useMemo(() => {
    const counts = skus.reduce((result, sku) => {
      const key = getCompositionKey(sku.sku_products);
      if (key) result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
    return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([key]) => key));
  }, [skus]);
  const duplicateMechanismKeys = useMemo(() => {
    const counts = mechanisms.reduce((result, mechanism) => {
      const key = getMechanismDuplicateKey(mechanism.mechanism_copy, mechanism.mechanism_gifts);
      const scopedKey = key ? `${mechanism.library_id}::${key}` : "";
      if (scopedKey) result[scopedKey] = (result[scopedKey] || 0) + 1;
      return result;
    }, {});
    return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([key]) => key));
  }, [mechanisms]);
  const visibleSkus = useMemo(() => {
    const normalized = skuQuery.trim().toLowerCase();
    return skus.filter((sku) => {
      if (!normalized) return true;
      const productNames = sku.sku_products?.map((item) => productMap[item.product_id]?.name).join(" ") || "";
      return [sku.name, sku.sku_number, productNames].some((value) => String(value || "").toLowerCase().includes(normalized));
    });
  }, [skus, skuQuery, productMap]);
  const visibleGifts = useMemo(() => {
    const normalized = giftQuery.trim().toLowerCase();
    return gifts.filter((gift) => !normalized || [gift.name, gift.specification, gift.gift_number].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [gifts, giftQuery]);
  const giftMap = useMemo(() => Object.fromEntries(gifts.map((item) => [item.id, item])), [gifts]);
  const visibleMechanisms = useMemo(() => {
    const normalized = mechanismQuery.trim().toLowerCase();
    return mechanisms.filter((mechanism) => mechanism.library_id === selectedLibraryId).filter((mechanism) => {
      if (!normalized) return true;
      const giftNames = mechanism.mechanism_gifts?.map((item) => giftMap[item.gift_id]?.name).join(" ") || "";
      return [mechanism.mechanism_copy, mechanism.mechanism_number, giftNames].some((value) => String(value || "").toLowerCase().includes(normalized));
    });
  }, [mechanisms, mechanismQuery, giftMap, selectedLibraryId]);
  const selectedMechanismLibrary = mechanismLibraries.find((library) => library.id === selectedLibraryId) || null;
  const visibleFixedMechanisms = visibleMechanisms.filter((mechanism) => mechanism.is_fixed);
  const visibleRegularMechanisms = visibleMechanisms.filter((mechanism) => !mechanism.is_fixed);
  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId) || null;
  const accountEmail = session?.user?.email || "";
  const accountDisplayName = demoMode ? demoNickname || "本地演示" : session?.user?.user_metadata?.display_name || accountEmail;
  const activityMechanisms = selectedActivity ? mechanisms.filter((mechanism) => mechanism.library_id === selectedActivity.mechanism_library_id) : [];
  const fixedActivityMechanisms = activityMechanisms.filter((mechanism) => mechanism.is_fixed);
  const selectableActivityMechanisms = activityMechanisms.filter((mechanism) => !mechanism.is_fixed);
  const activityMechanismMap = Object.fromEntries(selectableActivityMechanisms.map((mechanism) => [mechanism.id, mechanism]));
  const visibleActivitySkus = useMemo(() => {
    const normalized = activityQuery.trim().toLowerCase();
    if (!selectedActivity) return [];
    const bindingMap = Object.fromEntries((selectedActivity.activity_skus || []).map((item) => [item.sku_id, item]));
    return skus.filter((sku) => {
      const binding = bindingMap[sku.id];
      const mechanism = mechanisms.find((item) => item.id === binding?.mechanism_id);
      return !normalized || [sku.name, sku.sku_number, binding?.mechanism_copy, mechanism?.mechanism_copy].some((value) => String(value || "").toLowerCase().includes(normalized));
    }).map((sku) => ({ ...sku, activity_binding: bindingMap[sku.id] || null }));
  }, [activityQuery, mechanisms, selectedActivity, skus]);
  const previewActivity = activities.find((activity) => activity.id === previewActivityId) || null;
  const previewRows = useMemo(() => {
    const bindingMap = Object.fromEntries((previewActivity?.activity_skus || []).map((item) => [item.sku_id, item]));
    const libraryMechanisms = previewActivity ? mechanisms.filter((mechanism) => mechanism.library_id === previewActivity.mechanism_library_id) : [];
    const fixedMechanisms = libraryMechanisms.filter((mechanism) => mechanism.is_fixed);
    const mechanismMap = Object.fromEntries(libraryMechanisms.map((mechanism) => [mechanism.id, mechanism]));

    return skus.map((sku) => {
      const binding = bindingMap[sku.id];
      const boundMechanism = mechanismMap[binding?.mechanism_id];
      const appliedMechanisms = [...fixedMechanisms, ...(boundMechanism ? [boundMechanism] : [])];
      const giftTotals = new Map();
      appliedMechanisms.forEach((mechanism) => {
        mechanism.mechanism_gifts?.forEach((item) => {
          giftTotals.set(item.gift_id, (giftTotals.get(item.gift_id) || 0) + Number(item.quantity || 0));
        });
      });
      const productSummary = (sku.sku_products || []).map((item) => {
        const product = productMap[item.product_id];
        const seriesName = seriesMap[product?.series_id]?.name;
        return `${seriesName ? `${seriesName} / ` : ""}${product?.name || "未知产品"}${product?.specification ? ` ${product.specification}` : ""} × ${item.quantity}`;
      }).join(" + ");
      const sourceProduct = productMap[sku.selling_points_source_product_id] || productMap[sku.sku_products?.[0]?.product_id];
      return {
        activityName: previewActivity?.name || "",
        skuNumber: `#${String(sku.sku_number).padStart(4, "0")}`,
        skuName: sku.name,
        price: sku.price === null || sku.price === undefined ? "" : Number(sku.price).toFixed(2),
        products: productSummary,
        sellingPoints: sku.selling_points !== null && sku.selling_points !== undefined ? normalizeSellingCopy(sku.selling_points) : getEffectiveProductSellingPoints(sourceProduct, series),
        fixedMechanisms: fixedMechanisms.map((mechanism) => mechanism.mechanism_copy).join("\n"),
        boundMechanism: boundMechanism?.mechanism_copy || "",
        gifts: Array.from(giftTotals.entries()).map(([giftId, quantity]) => `${giftMap[giftId]?.name || "未知赠品"} × ${quantity}`).join(" + "),
        activityCopy: binding?.mechanism_copy || "",
      };
    });
  }, [activities, giftMap, mechanisms, previewActivity, productMap, series, seriesMap, skus]);

  function updateSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }

  function exportPreviewCsv() {
    if (!previewRows.length) { setToast("没有可导出的预览数据"); return; }
    const headers = ["活动名称", "SKU 编号", "SKU 名称", "价格", "产品组合", "卖点", "固定机制", "绑定机制", "赠品组合", "活动机制文案"];
    const lines = [
      headers.map(csvCell).join(","),
      ...previewRows.map((row) => [row.activityName, row.skuNumber, row.skuName, row.price, row.products, row.sellingPoints, row.fixedMechanisms, row.boundMechanism, row.gifts, row.activityCopy].map(csvCell).join(",")),
    ];
    const blob = new Blob([`\ufeff${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(previewActivity?.name || "表格预览")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("预览表格已导出");
  }

  function renderMechanismTable(items) {
    return <table className="mechanism-table">
      <thead><tr><th>机制编号</th><th>机制文案</th><th>赠品组合</th><th>赠品种类</th><th aria-label="操作" /></tr></thead>
      <tbody>{items.map((mechanism) => <tr key={mechanism.id}><td className="number-cell">#{String(mechanism.mechanism_number).padStart(4, "0")}</td><td><div className="sku-name-cell"><button className="name-button mechanism-copy-button" onClick={() => setMechanismEditor(mechanism)}>{mechanism.mechanism_copy}</button>{mechanism.is_fixed && <span className="fixed-chip">固定</span>}{duplicateMechanismKeys.has(`${mechanism.library_id}::${getMechanismDuplicateKey(mechanism.mechanism_copy, mechanism.mechanism_gifts)}`) && <span className="duplicate-chip">重复</span>}</div></td><td><div className="sku-products-summary">{mechanism.mechanism_gifts?.map((item) => <span key={item.gift_id}>{giftMap[item.gift_id]?.name || "未知赠品"} × {item.quantity}</span>)}</div></td><td className="muted-cell">{mechanism.mechanism_gifts?.length || 0} 种</td><td className="action-cell"><button className="icon-button" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === mechanism.id ? null : mechanism.id); }} aria-label="更多操作"><DotsThree size={20} weight="bold" /></button>{menuId === mechanism.id && <div className="row-menu wide-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => { setMechanismEditor(mechanism); setMenuId(null); }}><PencilSimple size={16} />编辑</button>{mechanismLibraries.length > 1 && <button onClick={() => { setCopyMechanism(mechanism); setMenuId(null); }}><ArrowsDownUp size={16} />复制到其他库</button>}<button className="danger-text" onClick={() => { setConfirm({ type: "mechanism", item: mechanism }); setMenuId(null); }}><Trash size={16} />删除</button></div>}</td></tr>)}</tbody>
    </table>;
  }

  if (!authChecked) return <main className="loading-page"><SpinnerGap size={26} className="spin" /></main>;
  if ((passwordRecovery || !session) && !demoMode) {
    return (
      <AuthView
        recoveryMode={passwordRecovery}
        notice={authNotice}
        onDemo={() => setDemoMode(true)}
        onRecoveryComplete={(message) => {
          setPasswordRecovery(false);
          setAuthNotice(message);
        }}
      />
    );
  }

  return (
    <div className="app-shell" onClick={() => menuId && setMenuId(null)}>
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small"><Cube weight="duotone" size={18} /></div><strong>REVER SkuFlow</strong></div>
        <nav className="sidebar-nav">
          <button className={view === "skus" ? "active" : ""} onClick={() => setView("skus")}><Package size={19} /><span>SKU 组合</span></button>
          <button className={view === "activities" ? "active" : ""} onClick={() => { setView("activities"); setSelectedActivityId(null); }}><CalendarBlank size={19} /><span>活动管理</span></button>
          <button className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><ListBullets size={19} /><span>表格预览</span></button>
          <button className={view === "mechanisms" ? "active" : ""} onClick={() => { setView("mechanisms"); setSelectedLibraryId(null); }}><ArrowsDownUp size={19} /><span>机制管理</span></button>
          <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}><ListBullets size={19} /><span>产品</span></button>
          <button className={view === "gifts" ? "active" : ""} onClick={() => setView("gifts")}><Gift size={19} /><span>赠品管理</span></button>
          <button className={view === "series" ? "active" : ""} onClick={() => setView("series")}><FolderSimple size={19} /><span>系列管理</span></button>
        </nav>
        <footer className="sidebar-footer" onClick={(event) => event.stopPropagation()}>
          <button className={settingsOpen ? "account active" : "account"} onClick={() => setMenuId(menuId === "__account" ? null : "__account")} aria-haspopup="menu" aria-expanded={menuId === "__account"}>
            <span className="status-dot" />
            <div><strong>{accountDisplayName}</strong><small>{demoMode ? "浏览器数据" : "已连接 Supabase"}</small></div>
            <CaretDown size={13} />
          </button>
          {menuId === "__account" && (
            <div className="account-menu" role="menu">
              <button onClick={() => { setSettingsTab("personal"); setSettingsOpen(true); setMenuId(null); }} role="menuitem"><GearSix size={16} />设置</button>
              <button className="danger-text" onClick={() => { setMenuId(null); signOut(); }} role="menuitem"><SignOut size={16} />退出</button>
            </div>
          )}
        </footer>
      </aside>

      <main className="workspace">
        {view === "preview" ? (
          <>
            <header className="page-header">
              <div><p className="breadcrumb">输出</p><h1>表格预览</h1><p className="page-description">生成活动最终预览表，并导出 CSV</p></div>
              <button className="button primary" disabled={previewRows.length === 0} onClick={exportPreviewCsv}><DownloadSimple size={17} weight="bold" />导出 CSV</button>
            </header>
            <div className="toolbar">
              <label className="filter-select"><span>活动</span><select value={previewActivityId} onChange={(event) => setPreviewActivityId(event.target.value)}><option value="">不选择活动</option>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}</select><CaretDown size={14} /></label>
              <div className="preview-summary"><span>{previewRows.length} 个 SKU</span><span>{previewActivity ? `活动：${previewActivity.name}` : "未选择活动"}</span></div>
            </div>
            <section className="table-wrap preview-table-wrap">
              {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : previewRows.length === 0 ? <div className="empty-state"><div className="empty-icon"><ListBullets size={22} /></div><h2>还没有可预览的 SKU</h2><p>先创建 SKU，必要时再建立活动和机制。</p></div> : (
                <table className="preview-table">
                  <thead><tr><th>活动</th><th>SKU 编号</th><th>SKU 名称</th><th>价格</th><th>产品组合</th><th>卖点</th><th>固定机制</th><th>绑定机制</th><th>赠品组合</th><th>活动文案</th></tr></thead>
                  <tbody>{previewRows.map((row) => <tr key={row.skuNumber}><td className="muted-cell">{row.activityName || "—"}</td><td className="number-cell">{row.skuNumber}</td><td>{row.skuName}</td><td className="muted-cell">{row.price ? `¥${row.price}` : "—"}</td><td>{row.products || "—"}</td><td>{row.sellingPoints || "—"}</td><td>{row.fixedMechanisms || "—"}</td><td>{row.boundMechanism || "—"}</td><td>{row.gifts || "—"}</td><td>{row.activityCopy || "—"}</td></tr>)}</tbody>
                </table>
              )}
            </section>
          </>
        ) : view === "products" ? (
          <>
            <header className="page-header"><div><p className="breadcrumb">商品资料</p><h1>产品</h1><p className="page-description">共 {products.length} 个产品</p></div><button className="button primary" onClick={() => series.length ? setProductEditor({}) : setToast("请先创建一个系列")}><Plus size={17} weight="bold" />新建产品</button></header>
            <div className="toolbar">
              <div className="search-field"><MagnifyingGlass size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索产品名称、编号或规格" /><kbd>⌘ K</kbd></div>
              <label className="filter-select"><span>系列</span><select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)}><option value="all">全部系列</option>{series.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><CaretDown size={14} /></label>
            </div>
            <section className="table-wrap">
              {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : visibleProducts.length === 0 ? <div className="empty-state"><div className="empty-icon"><Cube size={22} /></div><h2>{query || seriesFilter !== "all" ? "没有匹配的产品" : "还没有产品"}</h2><p>{query || seriesFilter !== "all" ? "试试更换搜索词或筛选条件。" : "先创建一个系列，再添加第一件产品。"}</p></div> : (
                <table className="product-table">
                  <thead><tr><th><button onClick={() => updateSort("product_number")}>编号<SortIcon active={sort.key === "product_number"} direction={sort.direction} /></button></th><th><button onClick={() => updateSort("series")}>系列<SortIcon active={sort.key === "series"} direction={sort.direction} /></button></th><th><button onClick={() => updateSort("name")}>产品名称<SortIcon active={sort.key === "name"} direction={sort.direction} /></button></th><th>规格</th><th><button onClick={() => updateSort("shelf_life_days")}>保质期<SortIcon active={sort.key === "shelf_life_days"} direction={sort.direction} /></button></th><th aria-label="操作" /></tr></thead>
                  <tbody>{visibleProducts.map((product) => <tr key={product.id}><td className="number-cell">#{String(product.product_number).padStart(4, "0")}</td><td><span className="series-chip">{seriesMap[product.series_id]?.name || "未分类"}</span></td><td><button className="name-button" onClick={() => setProductEditor(product)}>{product.name}</button></td><td className="muted-cell">{product.specification || "—"}</td><td className="muted-cell">{formatShelfLife(product.shelf_life_days)}</td><td className="action-cell"><button className="icon-button" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === product.id ? null : product.id); }} aria-label="更多操作"><DotsThree size={20} weight="bold" /></button>{menuId === product.id && <div className="row-menu" onClick={(e) => e.stopPropagation()}><button onClick={() => { setProductEditor(product); setMenuId(null); }}><PencilSimple size={16} />编辑</button><button className="danger-text" onClick={() => { setConfirm({ type: "product", item: product }); setMenuId(null); }}><Trash size={16} />删除</button></div>}</td></tr>)}</tbody>
                </table>
              )}
            </section>
          </>
        ) : view === "gifts" ? (
          <>
            <header className="page-header"><div><p className="breadcrumb">商品资料</p><h1>赠品管理</h1><p className="page-description">共 {gifts.length} 个赠品 · 独立于产品系列</p></div><button className="button primary" onClick={() => setGiftEditor({})}><Plus size={17} weight="bold" />新建赠品</button></header>
            <div className="toolbar">
              <div className="search-field"><MagnifyingGlass size={18} /><input value={giftQuery} onChange={(event) => setGiftQuery(event.target.value)} placeholder="搜索赠品名称、编号或规格" /><kbd>⌘ K</kbd></div>
            </div>
            <section className="table-wrap">
              {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : visibleGifts.length === 0 ? <div className="empty-state"><div className="empty-icon"><Gift size={22} /></div><h2>{giftQuery ? "没有匹配的赠品" : "还没有赠品"}</h2><p>{giftQuery ? "试试更换搜索词。" : "创建第一件独立管理的赠品。"}</p></div> : (
                <table className="gift-table">
                  <thead><tr><th>编号</th><th>赠品名称</th><th>规格</th><th aria-label="操作" /></tr></thead>
                  <tbody>{visibleGifts.map((gift) => <tr key={gift.id}><td className="number-cell">#{String(gift.gift_number).padStart(4, "0")}</td><td><button className="name-button" onClick={() => setGiftEditor(gift)}>{gift.name}</button></td><td className="muted-cell">{gift.specification || "—"}</td><td className="action-cell"><button className="icon-button" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === gift.id ? null : gift.id); }} aria-label="更多操作"><DotsThree size={20} weight="bold" /></button>{menuId === gift.id && <div className="row-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => { setGiftEditor(gift); setMenuId(null); }}><PencilSimple size={16} />编辑</button><button className="danger-text" onClick={() => { setConfirm({ type: "gift", item: gift }); setMenuId(null); }}><Trash size={16} />删除</button></div>}</td></tr>)}</tbody>
                </table>
              )}
            </section>
          </>
        ) : view === "mechanisms" ? (
          selectedMechanismLibrary ? (
            <>
              <header className="page-header"><div><p className="breadcrumb"><button onClick={() => setSelectedLibraryId(null)}>机制库</button><span> / {selectedMechanismLibrary.name}</span></p><h1>{selectedMechanismLibrary.name}</h1><p className="page-description">{visibleFixedMechanisms.length} 个固定机制 · {visibleRegularMechanisms.length} 个普通机制</p></div><button className="button primary" onClick={() => gifts.length ? setMechanismEditor({}) : setToast("请先创建至少一个赠品")}><Plus size={17} weight="bold" />新建机制</button></header>
              <div className="toolbar"><div className="search-field"><MagnifyingGlass size={18} /><input value={mechanismQuery} onChange={(event) => setMechanismQuery(event.target.value)} placeholder="搜索机制编号、文案或赠品" /><kbd>⌘ K</kbd></div></div>
              <section className="mechanism-groups">
                {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : visibleMechanisms.length === 0 ? <div className="empty-state"><div className="empty-icon"><ArrowsDownUp size={22} /></div><h2>{mechanismQuery ? "没有匹配的机制" : "这个库还没有机制"}</h2><p>{mechanismQuery ? "试试更换搜索词。" : "新建一个机制，并选择它包含的赠品。"}</p></div> : <>{visibleRegularMechanisms.length > 0 && <section><div className="mechanism-group-heading"><div><h2>普通机制</h2><p>可在活动中为每个 SKU 单独选择</p></div><span>{visibleRegularMechanisms.length}</span></div><div className="table-wrap">{renderMechanismTable(visibleRegularMechanisms)}</div></section>}{visibleFixedMechanisms.length > 0 && <section><div className="mechanism-group-heading"><div><h2>固定机制</h2><p>自动应用到使用本库的所有活动 SKU</p></div><span>{visibleFixedMechanisms.length}</span></div><div className="table-wrap">{renderMechanismTable(visibleFixedMechanisms)}</div></section>}</>}
              </section>
            </>
          ) : (
            <>
              <header className="page-header"><div><p className="breadcrumb">赠品资料</p><h1>机制库</h1><p className="page-description">共 {mechanismLibraries.length} 个机制库</p></div><button className="button primary" onClick={() => setMechanismLibraryEditor({})}><Plus size={17} weight="bold" />新建机制库</button></header>
              <section className="table-wrap library-table-wrap">
                {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : mechanismLibraries.length === 0 ? <div className="empty-state"><div className="empty-icon"><FolderSimple size={22} /></div><h2>还没有机制库</h2><p>创建“五一活动”或“618 活动”等机制库。</p></div> : (
                  <table className="mechanism-library-table"><thead><tr><th>机制库名称</th><th>机制数量</th><th aria-label="操作" /></tr></thead><tbody>{mechanismLibraries.map((library) => <tr key={library.id}><td><button className="library-name-button" onClick={() => setSelectedLibraryId(library.id)}><FolderSimple size={18} />{library.name}</button></td><td className="muted-cell">{mechanisms.filter((item) => item.library_id === library.id).length} 个机制</td><td className="action-cell"><button className="icon-button" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === library.id ? null : library.id); }} aria-label="更多操作"><DotsThree size={20} weight="bold" /></button>{menuId === library.id && <div className="row-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => { setMechanismLibraryEditor(library); setMenuId(null); }}><PencilSimple size={16} />编辑</button><button onClick={() => { setCopyMechanismLibrary(library); setMenuId(null); }}><ArrowsDownUp size={16} />复制机制库</button><button className="danger-text" onClick={() => { setConfirm({ type: "mechanism-library", item: library }); setMenuId(null); }}><Trash size={16} />删除</button></div>}</td></tr>)}</tbody></table>
                )}
              </section>
            </>
          )
        ) : view === "activities" ? (
          selectedActivity ? (
            <>
              <header className="page-header"><div><p className="breadcrumb"><button onClick={() => setSelectedActivityId(null)}>活动管理</button><span> / {selectedActivity.name}</span></p><h1>{selectedActivity.name}</h1><p className="page-description">机制库：{mechanismLibraries.find((library) => library.id === selectedActivity.mechanism_library_id)?.name || "未知机制库"} · 共 {skus.length} 个 SKU</p></div></header>
              <div className="toolbar"><div className="search-field"><MagnifyingGlass size={18} /><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="搜索 SKU、机制或活动文案" /><kbd>⌘ K</kbd></div></div>
              <section className="table-wrap">
                {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : visibleActivitySkus.length === 0 ? <div className="empty-state"><div className="empty-icon"><CalendarBlank size={22} /></div><h2>{activityQuery ? "没有匹配的 SKU" : "还没有 SKU"}</h2><p>{activityQuery ? "试试更换搜索词。" : "先在 SKU 组合中建立 SKU。"}</p></div> : (
                  <table className="activity-sku-table">
                    <thead><tr><th>SKU 编号</th><th>SKU 名称</th><th>绑定机制</th><th>赠品组合</th><th>活动机制文案</th><th aria-label="操作" /></tr></thead>
                    <tbody>{visibleActivitySkus.map((sku) => {
                      const binding = sku.activity_binding;
                      const mechanism = activityMechanismMap[binding?.mechanism_id];
                      const appliedMechanisms = [...fixedActivityMechanisms, ...(mechanism ? [mechanism] : [])];
                      return <tr key={sku.id}><td className="number-cell">#{String(sku.sku_number).padStart(4, "0")}</td><td><button className="name-button" onClick={() => setActivitySkuEditor(sku)}>{sku.name}</button></td><td><div className="activity-mechanism-stack">{fixedActivityMechanisms.length > 0 && <span className="fixed-summary">固定机制 × {fixedActivityMechanisms.length}</span>}{mechanism ? <button className="name-button mechanism-copy-button" onClick={() => setActivitySkuEditor(sku)}>#{String(mechanism.mechanism_number).padStart(4, "0")} · {mechanism.mechanism_copy}</button> : fixedActivityMechanisms.length === 0 && <span className="muted-cell">未绑定</span>}</div></td><td><div className="activity-gift-lines">{appliedMechanisms.map((applied) => <span key={applied.id}>{applied.mechanism_gifts?.map((item) => `${giftMap[item.gift_id]?.name || "未知赠品"} × ${item.quantity}`).join(" + ")}</span>)}</div></td><td className="activity-copy-cell">{binding?.mechanism_copy || "—"}</td><td className="action-cell"><button className="icon-button" onClick={() => setActivitySkuEditor(sku)} aria-label="设置活动机制"><PencilSimple size={17} /></button></td></tr>;
                    })}</tbody>
                  </table>
                )}
              </section>
            </>
          ) : (
            <>
              <header className="page-header"><div><p className="breadcrumb">营销配置</p><h1>活动管理</h1><p className="page-description">选择机制库，建立包含全部 SKU 的活动表</p></div><button className="button primary" onClick={() => mechanismLibraries.length ? setActivityEditor({}) : setToast("请先创建一个机制库")}><Plus size={17} weight="bold" />新建活动</button></header>
              <section className="table-wrap library-table-wrap">
                {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : activities.length === 0 ? <div className="empty-state"><div className="empty-icon"><CalendarBlank size={22} /></div><h2>还没有活动</h2><p>选择一个机制库，建立第一张活动 SKU 表。</p></div> : (
                  <table className="activity-table"><thead><tr><th>活动编号</th><th>活动名称</th><th>机制库</th><th>SKU 数量</th><th>已绑定机制</th><th aria-label="操作" /></tr></thead><tbody>{activities.map((activity) => <tr key={activity.id}><td className="number-cell">#{String(activity.activity_number).padStart(4, "0")}</td><td><button className="library-name-button" onClick={() => setSelectedActivityId(activity.id)}><CalendarBlank size={18} />{activity.name}</button></td><td><span className="series-chip">{mechanismLibraries.find((library) => library.id === activity.mechanism_library_id)?.name || "未知机制库"}</span></td><td className="muted-cell">{skus.length} 个</td><td className="muted-cell">{activity.activity_skus?.filter((item) => item.mechanism_id).length || 0} 个</td><td className="action-cell"><button className="icon-button" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === activity.id ? null : activity.id); }} aria-label="更多操作"><DotsThree size={20} weight="bold" /></button>{menuId === activity.id && <div className="row-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => { setSelectedActivityId(activity.id); setMenuId(null); }}><PencilSimple size={16} />打开</button><button className="danger-text" onClick={() => { setConfirm({ type: "activity", item: activity }); setMenuId(null); }}><Trash size={16} />删除</button></div>}</td></tr>)}</tbody></table>
                )}
              </section>
            </>
          )
        ) : view === "skus" ? (
          <>
            <header className="page-header">
              <div>
                <p className="breadcrumb">商品资料</p>
                <h1>SKU 组合</h1>
                <p className="page-description">共 {skus.length} 个 SKU</p>
              </div>
              <button
                className="button primary"
                onClick={() => products.length ? setSkuEditor({}) : setToast("请先创建至少一个产品")}
              >
                <Plus size={17} weight="bold" />新建 SKU
              </button>
            </header>
            <div className="toolbar">
              <div className="search-field">
                <MagnifyingGlass size={18} />
                <input
                  value={skuQuery}
                  onChange={(event) => setSkuQuery(event.target.value)}
                  placeholder="搜索 SKU 名称、编号或产品"
                />
                <kbd>⌘ K</kbd>
              </div>
            </div>
            <section className="table-wrap">
              {loading ? (
                <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div>
              ) : visibleSkus.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Package size={22} /></div>
                  <h2>{skuQuery ? "没有匹配的 SKU" : "还没有 SKU"}</h2>
                  <p>{skuQuery ? "试试更换搜索词。" : "新建一个 SKU，并选择它包含的产品。"}</p>
                </div>
              ) : (
                <table className="sku-table">
                  <thead>
                    <tr>
                      <th>SKU 编号</th>
                      <th>SKU 名称</th>
                      <th>价格</th>
                      <th>产品组合</th>
                      <th>产品种类</th>
                      <th aria-label="操作" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSkus.map((sku) => (
                      <tr key={sku.id}>
                        <td className="number-cell">#{String(sku.sku_number).padStart(4, "0")}</td>
                        <td><div className="sku-name-cell"><button className="name-button" onClick={() => setSkuEditor(sku)}>{sku.name}</button>{duplicateCompositionKeys.has(getCompositionKey(sku.sku_products)) && <span className="duplicate-chip">重复</span>}</div></td>
                        <td className="muted-cell">{sku.price === null || sku.price === undefined ? "—" : `¥${Number(sku.price).toFixed(2)}`}</td>
                        <td>
                          <div className="sku-products-summary">
                            {sku.sku_products?.map((item) => (
                              <span key={item.product_id}>
                                {productMap[item.product_id]?.name || "未知产品"} × {item.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="muted-cell">{sku.sku_products?.length || 0} 种</td>
                        <td className="action-cell">
                          <button
                            className="icon-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuId(menuId === sku.id ? null : sku.id);
                            }}
                            aria-label="更多操作"
                          >
                            <DotsThree size={20} weight="bold" />
                          </button>
                          {menuId === sku.id && (
                            <div className="row-menu" onClick={(event) => event.stopPropagation()}>
                              <button onClick={() => { setSkuEditor(sku); setMenuId(null); }}><PencilSimple size={16} />编辑</button>
                              <button className="danger-text" onClick={() => { setConfirm({ type: "sku", item: sku }); setMenuId(null); }}><Trash size={16} />删除</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : view === "series" ? (
          <>
            <header className="page-header"><div><p className="breadcrumb">商品资料</p><h1>系列管理</h1><p className="page-description">用于组织和筛选产品</p></div><button className="button primary" onClick={() => setSeriesEditor({})}><Plus size={17} weight="bold" />新建系列</button></header>
            <section className="series-list">
              <div className="series-list-header"><span>系列名称</span><span>产品数量</span><span>排序</span><span /></div>
              {series.length === 0 ? <div className="empty-state"><div className="empty-icon"><FolderSimple size={22} /></div><h2>还没有系列</h2><p>创建第一个系列后，就可以开始添加产品。</p></div> : [...series].sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                <div className="series-row" key={item.id}><div><FolderSimple size={19} /><strong>{item.name}</strong></div><span>{products.filter((product) => product.series_id === item.id).length}</span><span className="muted-cell">{item.sort_order}</span><div className="series-actions"><button className="icon-button" onClick={() => setSeriesEditor(item)} aria-label="编辑系列"><PencilSimple size={17} /></button><button className="icon-button danger-hover" onClick={() => setConfirm({ type: "series", item })} aria-label="删除系列"><Trash size={17} /></button></div></div>
              ))}
            </section>
          </>
        ) : (
          <></>
        )}
      </main>

      {settingsOpen && (
        <SettingsDialog
          activeTab={settingsTab}
          accountEmail={demoMode ? "本地演示账号" : accountEmail}
          accountLabel={accountDisplayName}
          accountStatus={demoMode ? "浏览器数据" : "已连接 Supabase"}
          canChangePassword={!demoMode}
          duplicateSettings={duplicateSettings}
          fields={skuNameFields}
          busy={busy}
          theme={theme}
          onClose={() => setSettingsOpen(false)}
          onSavePersonal={savePersonalSettings}
          onSaveWorkspace={saveWorkspaceSettings}
          onSelectTab={setSettingsTab}
          onSignOut={signOut}
          onThemeChange={updateTheme}
        />
      )}
      {productEditor && <ProductForm product={productEditor.id ? productEditor : null} series={series} busy={busy} onClose={() => setProductEditor(null)} onSave={saveProduct} />}
      {giftEditor && <GiftForm gift={giftEditor.id ? giftEditor : null} busy={busy} onClose={() => setGiftEditor(null)} onSave={saveGift} />}
      {mechanismEditor && <MechanismForm mechanism={mechanismEditor} gifts={gifts} busy={busy} onClose={() => setMechanismEditor(null)} onSave={saveMechanism} />}
      {mechanismLibraryEditor && <MechanismLibraryForm library={mechanismLibraryEditor.id ? mechanismLibraryEditor : null} busy={busy} onClose={() => setMechanismLibraryEditor(null)} onSave={saveMechanismLibrary} />}
      {copyMechanism && <CopyMechanismForm mechanism={copyMechanism} libraries={mechanismLibraries} currentLibraryId={selectedLibraryId} busy={busy} onClose={() => setCopyMechanism(null)} onCopy={copyMechanismToLibrary} />}
      {copyMechanismLibrary && <CopyMechanismLibraryForm library={copyMechanismLibrary} mechanismCount={mechanisms.filter((item) => item.library_id === copyMechanismLibrary.id).length} busy={busy} onClose={() => setCopyMechanismLibrary(null)} onCopy={copyLibrary} />}
      {activityEditor && <ActivityForm libraries={mechanismLibraries} busy={busy} onClose={() => setActivityEditor(null)} onSave={createActivity} />}
      {activitySkuEditor && selectedActivity && <ActivitySkuForm sku={activitySkuEditor} binding={activitySkuEditor.activity_binding || selectedActivity.activity_skus?.find((item) => item.sku_id === activitySkuEditor.id)} mechanisms={selectableActivityMechanisms} fixedMechanisms={fixedActivityMechanisms} giftMap={giftMap} busy={busy} onClose={() => setActivitySkuEditor(null)} onSave={saveActivitySku} />}
      {seriesEditor && <SeriesForm item={seriesEditor.id ? seriesEditor : null} nextSortOrder={Math.max(0, ...series.map((item) => item.sort_order)) + 1} busy={busy} onClose={() => setSeriesEditor(null)} onSave={saveSeries} />}
      {skuEditor && <SkuForm sku={skuEditor.id ? skuEditor : null} skus={skus} products={products} series={series} nameFields={skuNameFields} allowDuplicate={duplicateSettings.skus} busy={busy} onClose={() => setSkuEditor(null)} onSave={saveSku} />}
      {duplicateConfirm && <ConfirmDialog title={`发现重复${duplicateConfirm.type === "product" ? "产品" : duplicateConfirm.type === "gift" ? "赠品" : "系列"}`} message="设置允许继续创建，但系统仍会在每次操作时提醒。确定保留这条重复记录吗？" confirmLabel="仍然创建" busy={busy} onCancel={() => setDuplicateConfirm(null)} onConfirm={() => { const pending = duplicateConfirm; setDuplicateConfirm(null); if (pending.type === "product") saveProduct(pending.values, true); else if (pending.type === "gift") saveGift(pending.values, true); else saveSeries(pending.values, true); }} />}
      {confirm && (
        <ConfirmDialog
          title={`删除${confirm.type === "product" ? "产品" : confirm.type === "series" ? "系列" : confirm.type === "gift" ? "赠品" : confirm.type === "mechanism" ? "机制" : confirm.type === "mechanism-library" ? "机制库" : confirm.type === "activity" ? "活动" : "SKU"}？`}
          message={
            confirm.type === "product"
              ? `“${confirm.item.name}”将被永久删除；如果正在被 SKU 使用，系统会阻止删除。`
              : confirm.type === "series"
                ? `“${confirm.item.name}”删除后无法恢复；如果仍有关联产品，系统会阻止删除。`
                : confirm.type === "gift"
                  ? `“${confirm.item.name}”将被永久删除。`
                  : confirm.type === "mechanism"
                    ? `机制 #${String(confirm.item.mechanism_number).padStart(4, "0")} 及其赠品组合将被永久删除。`
                    : confirm.type === "mechanism-library"
                      ? `“${confirm.item.name}”删除后无法恢复；如果库内还有机制，系统会阻止删除。`
                      : confirm.type === "activity"
                        ? `“${confirm.item.name}”及其中所有 SKU 的机制绑定和独立文案将被永久删除。`
                      : `“${confirm.item.name}”及其产品组合将被永久删除。`
          }
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={deleteItem}
        />
      )}
      {toast && <div className="toast"><Check size={17} weight="bold" />{toast}</div>}
    </div>
  );
}

function SettingsDialog({ activeTab, accountEmail, accountLabel, accountStatus, canChangePassword, fields, duplicateSettings, busy, theme, onClose, onSavePersonal, onSaveWorkspace, onSelectTab, onSignOut, onThemeChange }) {
  const [draft, setDraft] = useState(fields);
  const [duplicateDraft, setDuplicateDraft] = useState(duplicateSettings);
  const [displayNameDraft, setDisplayNameDraft] = useState(accountLabel);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirmDraft, setPasswordConfirmDraft] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  useEffect(() => setDraft(fields), [fields]);
  useEffect(() => setDuplicateDraft(duplicateSettings), [duplicateSettings]);
  useEffect(() => {
    setDisplayNameDraft(accountLabel);
    setPersonalMessage("");
  }, [accountLabel]);

  function moveField(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    setDraft((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const workspaceDirty = draft.join() !== fields.join() || JSON.stringify(duplicateDraft) !== JSON.stringify(duplicateSettings);
  const personalDirty = displayNameDraft.trim() !== accountLabel || passwordDraft.length > 0 || passwordConfirmDraft.length > 0;

  async function savePersonal() {
    if (passwordDraft || passwordConfirmDraft) {
      if (!canChangePassword) {
        setPersonalMessage("演示模式不支持修改密码。");
        return;
      }
      if (passwordDraft.length < 6) {
        setPersonalMessage("新密码至少需要 6 位。");
        return;
      }
      if (passwordDraft !== passwordConfirmDraft) {
        setPersonalMessage("两次输入的新密码不一致。");
        return;
      }
    }
    const result = await onSavePersonal({ displayName: displayNameDraft, password: passwordDraft });
    if (!result.ok) {
      setPersonalMessage(result.error || "保存失败，请稍后再试。");
      return;
    }
    setPasswordDraft("");
    setPasswordConfirmDraft("");
    setPersonalMessage("已保存。");
  }

  return (
    <div className="settings-layer" role="dialog" aria-modal="true" aria-label="设置">
      <button className="settings-backdrop" aria-label="关闭设置" onClick={onClose} />
      <section className="settings-dialog">
        <header className="settings-dialog-header">
          <h2>设置</h2>
          <button className="icon-button" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        </header>
        <div className="settings-dialog-body">
          <nav className="settings-tabs" aria-label="设置分类">
            <button className={activeTab === "personal" ? "active" : ""} onClick={() => onSelectTab("personal")}>个人设置</button>
            <button className={activeTab === "workspace" ? "active" : ""} onClick={() => onSelectTab("workspace")}>工作台设置</button>
          </nav>
          <div className="settings-content">
            {activeTab === "personal" ? (
              <section>
                <div className="settings-section-heading"><h3>个人设置</h3><p>管理当前账号和界面偏好。</p></div>
                <div className="profile-row">
                  <div className="profile-avatar"><Cube weight="duotone" size={20} /></div>
                  <div><strong>{accountLabel}</strong><small>{accountStatus}</small></div>
                </div>
                <label className="settings-input-row">
                  <span><strong>昵称</strong><small>显示在左下角账号菜单中。</small></span>
                  <input value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} placeholder="输入昵称" />
                </label>
                <label className="settings-input-row">
                  <span><strong>邮箱</strong><small>邮箱用于登录和接收密码重置邮件。</small></span>
                  <input value={accountEmail} disabled readOnly />
                </label>
                <label className="settings-select-row">
                  <span><strong>界面主题</strong><small>选择当前设备上的显示方式。</small></span>
                  <select value={theme} onChange={(event) => onThemeChange(event.target.value)}>
                    <option value="system">跟随系统</option>
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                  </select>
                </label>
                <div className="settings-password-block">
                  <div className="settings-heading"><div><h2>修改密码</h2><p>{canChangePassword ? "保存后下次登录请使用新密码。" : "本地演示模式不支持修改密码。"}</p></div></div>
                  <label>新密码<input type="password" value={passwordDraft} onChange={(event) => setPasswordDraft(event.target.value)} placeholder="至少 6 位" minLength={6} disabled={!canChangePassword} /></label>
                  <label>确认新密码<input type="password" value={passwordConfirmDraft} onChange={(event) => setPasswordConfirmDraft(event.target.value)} placeholder="再次输入新密码" minLength={6} disabled={!canChangePassword} /></label>
                </div>
                {personalMessage && <p className="settings-inline-message">{personalMessage}</p>}
                <div className="settings-save-row personal-save-row">
                  <button className="button primary" disabled={busy || !personalDirty} onClick={savePersonal}>{busy && <SpinnerGap className="spin" />}保存个人设置</button>
                </div>
                <div className="settings-danger-row">
                  <span><strong>退出登录</strong><small>退出后需要重新登录才能访问线上数据。</small></span>
                  <button className="button secondary" onClick={() => { onClose(); onSignOut(); }}><SignOut size={16} />退出</button>
                </div>
              </section>
            ) : (
              <section>
                <div className="settings-section-heading"><h3>工作台设置</h3><p>调整 SKU 自动命名和重复数据规则。</p></div>
                <div className="settings-block">
                  <div className="settings-heading"><div><h2>SKU 名称字段顺序</h2><p>字段从上到下依次拼接，不添加空格；多产品使用“ + ”分隔。</p></div></div>
                  <div className="settings-preview"><span>预览</span><strong>{draft.map((field) => ({ series: "沐浴啫喱", name: "克林特之梦", specification: "300ml" })[field]).join("")}</strong></div>
                  <div className="field-order-list">
                    {draft.map((field, index) => (
                      <div className="field-order-row" key={field}>
                        <span className="field-order-number">{index + 1}</span>
                        <strong>{SKU_NAME_FIELD_LABELS[field]}</strong>
                        <div>
                          <button className="icon-button" disabled={index === 0} onClick={() => moveField(index, -1)} aria-label={`上移${SKU_NAME_FIELD_LABELS[field]}`}><ArrowUp size={17} /></button>
                          <button className="icon-button" disabled={index === draft.length - 1} onClick={() => moveField(index, 1)} aria-label={`下移${SKU_NAME_FIELD_LABELS[field]}`}><ArrowDown size={17} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="settings-block">
                  <div className="settings-heading duplicate-settings-heading"><div><h2>重复数据规则</h2><p>默认禁止。允许后仍会在每次创建时提醒并要求确认。</p></div></div>
                  <div className="duplicate-settings-list">
                    {[['skus','允许重复 SKU'],['products','允许重复产品'],['gifts','允许重复赠品'],['series','允许重复系列']].map(([key, label]) => <label className="toggle-row" key={key}><span><strong>{label}</strong><small>{duplicateDraft[key] ? '允许，但每次提醒' : '禁止创建重复项'}</small></span><input type="checkbox" checked={duplicateDraft[key]} onChange={(event) => setDuplicateDraft((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}
                  </div>
                </div>
                <div className="settings-save-row">
                  <button className="button primary" disabled={busy || !workspaceDirty} onClick={() => onSaveWorkspace(draft, duplicateDraft)}>{busy && <SpinnerGap className="spin" />}保存设置</button>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowsDownUp size={14} />;
  return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}
