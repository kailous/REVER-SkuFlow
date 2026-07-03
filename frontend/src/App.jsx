import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  DEMO_SERIES,
  DEMO_PRODUCTS,
  DEMO_GIFTS,
  DEMO_MECHANISMS,
  DEMO_MECHANISM_LIBRARIES,
  DEMO_SKUS,
  DEMO_ACTIVITIES,
  DEFAULT_SKU_NAME_FIELDS,
  DEFAULT_DUPLICATE_SETTINGS,
  readDemo,
  formatShelfLife,
  generateSkuName,
  getCompositionKey,
  getMechanismDuplicateKey,
  getEffectiveProductSellingPoints,
  normalizeSellingCopy,
  csvCell,
  safeFilename,
  getAuthErrorMessage,
} from "./utils";
import { AuthView } from "./components/AuthView";
import { Drawer, ConfirmDialog, SortIcon } from "./components/Shared";
import { ProductForm } from "./components/ProductForm";
import { GiftForm } from "./components/GiftForm";
import { MechanismForm, MechanismLibraryForm } from "./components/MechanismForms";
import { SkuForm } from "./components/SkuForm";
import { ActivityForm, ActivitySkuForm } from "./components/ActivityForms";
import { CopyMechanismForm, CopyMechanismLibraryForm } from "./components/CopyForms";
import { SeriesForm } from "./components/SeriesForm";
import { SettingsDialog } from "./components/SettingsDialog";

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

  // Theme initialization
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

  // Auth
  useEffect(() => {
    if (!supabaseReady) { setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setAuthChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
        setAuthNotice("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Data loading
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

  // ⌘K shortcut
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        const searchInput = document.querySelector('.workspace .search-field input');
        if (searchInput && !document.querySelector('.drawer-layer, .dialog-layer, .settings-layer')) {
          event.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    if (!menuId) return;
    function handleClick() { setMenuId(null); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuId]);

  async function loadData() {
    setLoading(true);
    if (demoMode) {
      const demoSeries = readDemo("skuflow-demo-series", DEMO_SERIES);
      const demoProducts = readDemo("skuflow-demo-products", DEMO_PRODUCTS);
      const demoGifts = readDemo("skuflow-demo-gifts", DEMO_GIFTS);
      const demoMechanismLibraries = readDemo("skuflow-demo-mechanism-libraries", DEMO_MECHANISM_LIBRARIES);
      const demoMechanisms = readDemo("skuflow-demo-mechanisms", DEMO_MECHANISMS).map((m) => ({ ...m, library_id: m.library_id || demoMechanismLibraries[0]?.id, is_fixed: Boolean(m.is_fixed) }));
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

  // Demo persistence helpers
  function saveDemo(nextProducts = products, nextSeries = series, nextSkus = skus, nextNameFields = skuNameFields, nextDuplicateSettings = duplicateSettings) {
    const namedSkus = nextSkus.map((sku) => ({
      ...sku,
      name: generateSkuName(sku.sku_products, nextProducts, nextSeries, nextNameFields) || sku.name,
    }));
    localStorage.setItem("skuflow-demo-series", JSON.stringify(nextSeries));
    localStorage.setItem("skuflow-demo-products", JSON.stringify(nextProducts));
    localStorage.setItem("skuflow-demo-skus", JSON.stringify(namedSkus));
    localStorage.setItem("skuflow-demo-name-fields", JSON.stringify(nextNameFields));
    localStorage.setItem("skuflow-demo-duplicate-settings", JSON.stringify(nextDuplicateSettings));
    setSeries(nextSeries);
    setProducts(nextProducts);
    setSkus(namedSkus);
    setSkuNameFields(nextNameFields);
    setDuplicateSettings(nextDuplicateSettings);
  }

  function saveDemoGifts(next) { localStorage.setItem("skuflow-demo-gifts", JSON.stringify(next)); setGifts(next); }
  function saveDemoMechanisms(next) { localStorage.setItem("skuflow-demo-mechanisms", JSON.stringify(next)); setMechanisms(next); }
  function saveDemoMechanismLibraries(next) { localStorage.setItem("skuflow-demo-mechanism-libraries", JSON.stringify(next)); setMechanismLibraries(next); }
  function saveDemoActivities(next) { localStorage.setItem("skuflow-demo-activities", JSON.stringify(next)); setActivities(next); }

  // CRUD operations
  async function saveGift(values, duplicateApproved = false) {
    const existing = giftEditor?.id ? giftEditor : null;
    const matches = gifts.filter((item) => item.id !== existing?.id && item.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    if (matches.length && !duplicateSettings.gifts) { setToast("设置中不允许重复赠品，无法保存"); return; }
    if (matches.length && !duplicateApproved) { setDuplicateConfirm({ type: "gift", values }); return; }
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? gifts.map((item) => item.id === existing.id ? { ...item, ...values } : item)
        : [...gifts, { ...values, id: crypto.randomUUID(), gift_number: Math.max(0, ...gifts.map((item) => item.gift_number)) + 1, created_at: new Date().toISOString() }];
      saveDemoGifts(next);
    } else {
      const request = existing ? supabase.from("gifts").update(values).eq("id", existing.id) : supabase.from("gifts").insert(values);
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
      const request = existing ? supabase.from("products").update(values).eq("id", existing.id) : supabase.from("products").insert(values);
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
      const request = existing ? supabase.from("product_series").update(values).eq("id", existing.id) : supabase.from("product_series").insert(values);
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
        ? skus.map((item) => item.id === existing.id ? { ...item, ...values, name: generatedName, sku_products: values.items } : item)
        : [...skus, { id: crypto.randomUUID(), sku_number: Math.max(0, ...skus.map((item) => item.sku_number)) + 1, name: generatedName, price: values.price, selling_points: values.selling_points, selling_points_source_product_id: values.selling_points_source_product_id, created_at: new Date().toISOString(), sku_products: values.items }];
      saveDemo(products, series, next);
    } else {
      const { error } = await supabase.rpc("save_sku_v2", { p_items: values.items, p_price: values.price, p_selling_points: values.selling_points, p_source_product_id: values.selling_points_source_product_id, p_sku_id: existing?.id || null });
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setSkuEditor(null); setToast(existing ? "SKU 已更新" : "SKU 已创建");
  }

  async function saveWorkspaceSettings(nextFields, nextDuplicateSettings) {
    setBusy(true);
    if (demoMode) {
      saveDemo(products, series, skus, nextFields, nextDuplicateSettings);
    } else {
      const { error } = await supabase.rpc("save_workspace_settings", { p_fields: nextFields, p_allow_duplicate_skus: nextDuplicateSettings.skus, p_allow_duplicate_products: nextDuplicateSettings.products, p_allow_duplicate_series: nextDuplicateSettings.series, p_allow_duplicate_gifts: nextDuplicateSettings.gifts });
      if (error) { setToast(error.message); setBusy(false); return; }
      await loadData();
    }
    setBusy(false); setToast("工作台设置已更新");
  }

  async function saveMechanismLibrary(values) {
    const existing = mechanismLibraryEditor?.id ? mechanismLibraryEditor : null;
    setBusy(true);
    if (demoMode) {
      const next = existing
        ? mechanismLibraries.map((library) => library.id === existing.id ? { ...library, ...values } : library)
        : [...mechanismLibraries, { ...values, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
      saveDemoMechanismLibraries(next);
    } else {
      const request = existing ? supabase.from("mechanism_libraries").update(values).eq("id", existing.id) : supabase.from("mechanism_libraries").insert(values);
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
        ...item, id: crypto.randomUUID(), library_id: newLibraryId, mechanism_gifts: item.mechanism_gifts.map((gift) => ({ ...gift })), created_at: new Date().toISOString(),
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

  async function createActivity(values) {
    setBusy(true);
    if (demoMode) {
      const id = crypto.randomUUID();
      const nextActivity = {
        id, activity_number: Math.max(0, ...activities.map((item) => item.activity_number || 0)) + 1,
        ...values, created_at: new Date().toISOString(),
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
    setBusy(false); setActivityEditor(null); setToast("活动表已建立");
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
    setBusy(false); setActivitySkuEditor(null); setToast("SKU 活动机制已更新");
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
      if (isProduct && skus.some((sku) => sku.sku_products?.some((item) => item.product_id === confirm.item.id))) { setToast("该产品正在被 SKU 使用，暂时无法删除"); setBusy(false); setConfirm(null); return; }
      if (isProduct) saveDemo(products.filter((item) => item.id !== confirm.item.id), series, skus);
      else if (isSeries && products.some((item) => item.series_id === confirm.item.id)) { setToast("该系列下还有产品，暂时无法删除"); setBusy(false); setConfirm(null); return; }
      else if (isSeries) saveDemo(products, series.filter((item) => item.id !== confirm.item.id), skus);
      else if (isSku) saveDemo(products, series, skus.filter((item) => item.id !== confirm.item.id));
      else if (isGift && mechanisms.some((m) => m.mechanism_gifts?.some((item) => item.gift_id === confirm.item.id))) { setToast("该赠品正在被机制使用，暂时无法删除"); setBusy(false); setConfirm(null); return; }
      else if (isGift) saveDemoGifts(gifts.filter((item) => item.id !== confirm.item.id));
      else if (isMechanism) saveDemoMechanisms(mechanisms.filter((item) => item.id !== confirm.item.id));
      else if (isActivity) saveDemoActivities(activities.filter((item) => item.id !== confirm.item.id));
      else if (isMechanismLibrary && mechanisms.some((item) => item.library_id === confirm.item.id)) { setToast("该机制库中还有机制，暂时无法删除"); setBusy(false); setConfirm(null); return; }
      else if (isMechanismLibrary) saveDemoMechanismLibraries(mechanismLibraries.filter((item) => item.id !== confirm.item.id));
    } else {
      const table = isProduct ? "products" : isSeries ? "product_series" : isGift ? "gifts" : isMechanism ? "gift_mechanisms" : isMechanismLibrary ? "mechanism_libraries" : isActivity ? "activities" : "skus";
      const { error } = await supabase.from(table).delete().eq("id", confirm.item.id);
      if (error) {
        const relationMessage = isProduct ? "该产品正在被 SKU 使用，暂时无法删除" : isGift ? "该赠品正在被机制使用，暂时无法删除" : isMechanismLibrary ? "该机制库中还有机制，暂时无法删除" : "该系列下还有产品，暂时无法删除";
        setToast(error.code === "23503" ? relationMessage : error.message);
        setBusy(false); setConfirm(null); return;
      }
      await loadData();
    }
    setBusy(false); setConfirm(null);
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
    let data; let error;
    try { ({ data, error } = await supabase.auth.updateUser(values)); } catch (authError) { error = authError; } finally { setBusy(false); }
    if (error) return { ok: false, error: getAuthErrorMessage(error) };
    if (data?.user) setSession((current) => current ? { ...current, user: data.user } : current);
    setToast(password ? "个人设置已保存，密码已更新" : "个人设置已保存");
    return { ok: true };
  }

  // Derived data
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
    const counts = skus.reduce((result, sku) => { const key = getCompositionKey(sku.sku_products); if (key) result[key] = (result[key] || 0) + 1; return result; }, {});
    return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([key]) => key));
  }, [skus]);
  const duplicateMechanismKeys = useMemo(() => {
    const counts = mechanisms.reduce((result, mechanism) => { const key = `${mechanism.library_id}::${getMechanismDuplicateKey(mechanism.mechanism_copy, mechanism.mechanism_gifts)}`; result[key] = (result[key] || 0) + 1; return result; }, {});
    return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([key]) => key));
  }, [mechanisms]);
  const giftMap = useMemo(() => Object.fromEntries(gifts.map((item) => [item.id, item])), [gifts]);

  const visibleSkus = useMemo(() => {
    const normalized = skuQuery.trim().toLowerCase();
    return skus.filter((sku) => !normalized || [sku.name, sku.sku_number, ...(sku.sku_products || []).map((item) => productMap[item.product_id]?.name)].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [skus, skuQuery, productMap]);

  const visibleGifts = useMemo(() => {
    const normalized = giftQuery.trim().toLowerCase();
    return gifts.filter((gift) => !normalized || [gift.name, gift.specification, gift.gift_number].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [gifts, giftQuery]);

  const selectedMechanismLibrary = useMemo(() => mechanismLibraries.find((item) => item.id === selectedLibraryId) || null, [mechanismLibraries, selectedLibraryId]);
  const visibleMechanisms = useMemo(() => {
    if (!selectedMechanismLibrary) return [];
    const normalized = mechanismQuery.trim().toLowerCase();
    return mechanisms.filter((item) => item.library_id === selectedLibraryId).filter((item) => !normalized || [item.mechanism_copy, item.mechanism_number, ...(item.mechanism_gifts || []).map((gift) => giftMap[gift.gift_id]?.name)].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [mechanisms, selectedMechanismLibrary, mechanismQuery, giftMap]);
  const visibleRegularMechanisms = useMemo(() => visibleMechanisms.filter((item) => !item.is_fixed), [visibleMechanisms]);
  const visibleFixedMechanisms = useMemo(() => visibleMechanisms.filter((item) => item.is_fixed), [visibleMechanisms]);

  const selectedActivity = useMemo(() => activities.find((item) => item.id === selectedActivityId) || null, [activities, selectedActivityId]);
  const activityMechanismMap = useMemo(() => {
    if (!selectedActivity) return {};
    return Object.fromEntries(mechanisms.filter((item) => item.library_id === selectedActivity.mechanism_library_id).map((item) => [item.id, item]));
  }, [mechanisms, selectedActivity]);
  const fixedActivityMechanisms = useMemo(() => {
    if (!selectedActivity) return [];
    return mechanisms.filter((item) => item.library_id === selectedActivity.mechanism_library_id && item.is_fixed);
  }, [mechanisms, selectedActivity]);
  const selectableActivityMechanisms = useMemo(() => {
    if (!selectedActivity) return [];
    return mechanisms.filter((item) => item.library_id === selectedActivity.mechanism_library_id && !item.is_fixed);
  }, [mechanisms, selectedActivity]);
  const visibleActivitySkus = useMemo(() => {
    if (!selectedActivity) return [];
    const normalized = activityQuery.trim().toLowerCase();
    return skus.map((sku) => ({ ...sku, activity_binding: selectedActivity.activity_skus?.find((item) => item.sku_id === sku.id) })).filter((sku) => !normalized || [sku.name, sku.sku_number, activityMechanismMap[sku.activity_binding?.mechanism_id]?.mechanism_copy, sku.activity_binding?.mechanism_copy].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [skus, selectedActivity, activityQuery, activityMechanismMap]);

  const previewActivity = useMemo(() => activities.find((item) => item.id === previewActivityId) || null, [activities, previewActivityId]);
  const previewRows = useMemo(() => {
    if (!previewActivity) return [];
    return skus.map((sku) => {
      const binding = previewActivity.activity_skus?.find((item) => item.sku_id === sku.id);
      const boundMechanism = activityMechanismMap[binding?.mechanism_id];
      const fixedMechanisms = mechanisms.filter((item) => item.library_id === previewActivity.mechanism_library_id && item.is_fixed);
      const appliedMechanisms = [...fixedMechanisms, ...(boundMechanism ? [boundMechanism] : [])];
      const giftTotals = new Map();
      appliedMechanisms.forEach((mechanism) => { mechanism.mechanism_gifts?.forEach((item) => { giftTotals.set(item.gift_id, (giftTotals.get(item.gift_id) || 0) + Number(item.quantity || 0)); }); });
      const productSummary = (sku.sku_products || []).map((item) => {
        const product = productMap[item.product_id];
        const seriesName = seriesMap[product?.series_id]?.name;
        return `${seriesName ? `${seriesName} / ` : ""}${product?.name || "未知产品"}${product?.specification ? ` ${product.specification}` : ""} × ${item.quantity}`;
      }).join(" + ");
      const sourceProduct = productMap[sku.selling_points_source_product_id] || productMap[sku.sku_products?.[0]?.product_id];
      return {
        activityName: previewActivity?.name || "", skuNumber: `#${String(sku.sku_number).padStart(4, "0")}`, skuName: sku.name,
        price: sku.price === null || sku.price === undefined ? "" : Number(sku.price).toFixed(2),
        products: productSummary,
        sellingPoints: sku.selling_points !== null && sku.selling_points !== undefined ? normalizeSellingCopy(sku.selling_points) : getEffectiveProductSellingPoints(sourceProduct, series),
        fixedMechanisms: fixedMechanisms.map((m) => m.mechanism_copy).join("\n"),
        boundMechanism: boundMechanism?.mechanism_copy || "",
        gifts: Array.from(giftTotals.entries()).map(([giftId, quantity]) => `${giftMap[giftId]?.name || "未知赠品"} × ${quantity}`).join(" + "),
        activityCopy: binding?.mechanism_copy || "",
      };
    });
  }, [activities, giftMap, mechanisms, previewActivity, productMap, series, seriesMap, skus]);

  const accountDisplayName = demoMode ? demoNickname || "演示用户" : session?.user?.user_metadata?.display_name || session?.user?.email?.split("@")[0] || "用户";
  const accountEmail = demoMode ? "本地演示账号" : session?.user?.email || "";

  function updateSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }

  function exportPreviewCsv() {
    if (!previewRows.length) { setToast("没有可导出的预览数据"); return; }
    const headers = ["活动名称", "SKU 编号", "SKU 名称", "价格", "产品组合", "卖点", "固定机制", "绑定机制", "赠品组合", "活动机制文案"];
    const lines = [headers.map(csvCell).join(","), ...previewRows.map((row) => [row.activityName, row.skuNumber, row.skuName, row.price, row.products, row.sellingPoints, row.fixedMechanisms, row.boundMechanism, row.gifts, row.activityCopy].map(csvCell).join(","))];
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

  // Row menu helper — unified action cell
  function RowActions({ itemId, onEdit, onDelete, extraActions }) {
    return <>
        <button className="icon-button" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === itemId ? null : itemId); }} aria-label="更多操作">
          <DotsThree size={20} weight="bold" />
        </button>
        {menuId === itemId && (
          <div className="row-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { onEdit(); setMenuId(null); }}><PencilSimple size={16} />编辑</button>
            {extraActions}
            <button className="danger-text" onClick={() => { onDelete(); setMenuId(null); }}><Trash size={16} />删除</button>
          </div>
        )}
      </>;
  }

  // Auth gate
  if (!authChecked) return <main className="loading-page"><SpinnerGap size={26} className="spin" /></main>;
  if ((passwordRecovery || !session) && !demoMode) {
    return <AuthView recoveryMode={passwordRecovery} notice={authNotice} onDemo={() => setDemoMode(true)} onRecoveryComplete={(message) => { setPasswordRecovery(false); setAuthNotice(message); }} />;
  }

  return (
    <div className="app-shell" onClick={() => menuId && setMenuId(null)}>
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark small"><Cube weight="duotone" size={18} /></div><strong>REVER SkuFlow</strong></div>
        <nav className="sidebar-nav">
          <button className={view === "skus" ? "active" : ""} onClick={() => setView("skus")}><Package size={19} /><span>SKU 组合</span></button>
          <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}><ListBullets size={19} /><span>产品</span></button>
          <button className={view === "series" ? "active" : ""} onClick={() => setView("series")}><FolderSimple size={19} /><span>系列管理</span></button>
          <button className={view === "gifts" ? "active" : ""} onClick={() => setView("gifts")}><Gift size={19} /><span>赠品管理</span></button>
          <button className={view === "mechanisms" ? "active" : ""} onClick={() => { setView("mechanisms"); setSelectedLibraryId(null); }}><ArrowsDownUp size={19} /><span>机制管理</span></button>
          <button className={view === "activities" ? "active" : ""} onClick={() => { setView("activities"); setSelectedActivityId(null); }}><CalendarBlank size={19} /><span>活动管理</span></button>
          <button className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><DownloadSimple size={19} /><span>表格预览</span></button>
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
            <header className="page-header"><div><p className="breadcrumb">商品资料</p><h1>产品</h1><p className="page-description">共 {products.length} 个产品 · {series.length} 个系列</p></div><button className="button primary" onClick={() => series.length ? setProductEditor({}) : setToast("请先创建一个系列")}><Plus size={17} weight="bold" />新建产品</button></header>
            <div className="toolbar">
              <div className="search-field"><MagnifyingGlass size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索产品名称、编号或规格" /><kbd>⌘ K</kbd></div>
              <label className="filter-select"><span>系列</span><select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)}><option value="all">全部系列</option>{series.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><CaretDown size={14} /></label>
            </div>
            <section className="table-wrap">
              {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : visibleProducts.length === 0 ? <div className="empty-state"><div className="empty-icon"><Cube size={22} /></div><h2>{query || seriesFilter !== "all" ? "没有匹配的产品" : "还没有产品"}</h2><p>{query || seriesFilter !== "all" ? "试试更换搜索词或筛选条件。" : "先创建一个系列，再添加第一件产品。"}</p></div> : (
                <table className="product-table">
                  <thead><tr><th><button onClick={() => updateSort("product_number")}>编号<SortIcon active={sort.key === "product_number"} direction={sort.direction} /></button></th><th><button onClick={() => updateSort("series")}>系列<SortIcon active={sort.key === "series"} direction={sort.direction} /></button></th><th><button onClick={() => updateSort("name")}>产品名称<SortIcon active={sort.key === "name"} direction={sort.direction} /></button></th><th>规格</th><th><button onClick={() => updateSort("shelf_life_days")}>保质期<SortIcon active={sort.key === "shelf_life_days"} direction={sort.direction} /></button></th><th aria-label="操作" /></tr></thead>
                  <tbody>{visibleProducts.map((product) => <tr key={product.id}><td className="number-cell">#{String(product.product_number).padStart(4, "0")}</td><td><span className="series-chip">{seriesMap[product.series_id]?.name || "未分类"}</span></td><td><button className="name-button" onClick={() => setProductEditor(product)}>{product.name}</button></td><td className="muted-cell">{product.specification || "—"}</td><td className="muted-cell">{formatShelfLife(product.shelf_life_days)}</td><td className="action-cell"><RowActions itemId={product.id} onEdit={() => setProductEditor(product)} onDelete={() => setConfirm({ type: "product", item: product })} /></td></tr>)}</tbody>
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
                  <tbody>{visibleGifts.map((gift) => <tr key={gift.id}><td className="number-cell">#{String(gift.gift_number).padStart(4, "0")}</td><td><button className="name-button" onClick={() => setGiftEditor(gift)}>{gift.name}</button></td><td className="muted-cell">{gift.specification || "—"}</td><td className="action-cell"><RowActions itemId={gift.id} onEdit={() => setGiftEditor(gift)} onDelete={() => setConfirm({ type: "gift", item: gift })} /></td></tr>)}</tbody>
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
                {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : mechanismLibraries.length === 0 ? <div className="empty-state"><div className="empty-icon"><FolderSimple size={22} /></div><h2>还没有机制库</h2><p>创建"五一活动"或"618 活动"等机制库。</p></div> : (
                  <table className="mechanism-library-table"><thead><tr><th>机制库名称</th><th>机制数量</th><th aria-label="操作" /></tr></thead><tbody>{mechanismLibraries.map((library) => <tr key={library.id}><td><button className="library-name-button" onClick={() => setSelectedLibraryId(library.id)}><FolderSimple size={18} />{library.name}</button></td><td className="muted-cell">{mechanisms.filter((item) => item.library_id === library.id).length} 个机制</td><td className="action-cell"><RowActions itemId={library.id} onEdit={() => setMechanismLibraryEditor(library)} onDelete={() => setConfirm({ type: "mechanism-library", item: library })} extraActions={<button onClick={() => { setCopyMechanismLibrary(library); setMenuId(null); }}><ArrowsDownUp size={16} />复制机制库</button>} /></td></tr>)}</tbody></table>
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
                  <table className="activity-table"><thead><tr><th>活动编号</th><th>活动名称</th><th>机制库</th><th>SKU 数量</th><th>已绑定机制</th><th aria-label="操作" /></tr></thead><tbody>{activities.map((activity) => <tr key={activity.id}><td className="number-cell">#{String(activity.activity_number).padStart(4, "0")}</td><td><button className="library-name-button" onClick={() => setSelectedActivityId(activity.id)}><CalendarBlank size={18} />{activity.name}</button></td><td><span className="series-chip">{mechanismLibraries.find((library) => library.id === activity.mechanism_library_id)?.name || "未知机制库"}</span></td><td className="muted-cell">{skus.length} 个</td><td className="muted-cell">{activity.activity_skus?.filter((item) => item.mechanism_id).length || 0} 个</td><td className="action-cell"><RowActions itemId={activity.id} onEdit={() => setSelectedActivityId(activity.id)} onDelete={() => setConfirm({ type: "activity", item: activity })} /></td></tr>)}</tbody></table>
                )}
              </section>
            </>
          )
        ) : view === "skus" ? (
          <>
            <header className="page-header"><div><p className="breadcrumb">商品资料</p><h1>SKU 组合</h1><p className="page-description">共 {skus.length} 个 SKU</p></div><button className="button primary" onClick={() => products.length ? setSkuEditor({}) : setToast("请先创建至少一个产品")}><Plus size={17} weight="bold" />新建 SKU</button></header>
            <div className="toolbar"><div className="search-field"><MagnifyingGlass size={18} /><input value={skuQuery} onChange={(event) => setSkuQuery(event.target.value)} placeholder="搜索 SKU 名称、编号或产品" /><kbd>⌘ K</kbd></div></div>
            <section className="table-wrap">
              {loading ? <div className="table-state"><SpinnerGap size={24} className="spin" />正在加载</div> : visibleSkus.length === 0 ? <div className="empty-state"><div className="empty-icon"><Package size={22} /></div><h2>{skuQuery ? "没有匹配的 SKU" : "还没有 SKU"}</h2><p>{skuQuery ? "试试更换搜索词。" : "新建一个 SKU，并选择它包含的产品。"}</p></div> : (
                <table className="sku-table">
                  <thead><tr><th>SKU 编号</th><th>SKU 名称</th><th>价格</th><th>产品组合</th><th>产品种类</th><th aria-label="操作" /></tr></thead>
                  <tbody>{visibleSkus.map((sku) => <tr key={sku.id}><td className="number-cell">#{String(sku.sku_number).padStart(4, "0")}</td><td><div className="sku-name-cell"><button className="name-button" onClick={() => setSkuEditor(sku)}>{sku.name}</button>{duplicateCompositionKeys.has(getCompositionKey(sku.sku_products)) && <span className="duplicate-chip">重复</span>}</div></td><td className="muted-cell">{sku.price === null || sku.price === undefined ? "—" : `¥${Number(sku.price).toFixed(2)}`}</td><td><div className="sku-products-summary">{sku.sku_products?.map((item) => <span key={item.product_id}>{productMap[item.product_id]?.name || "未知产品"} × {item.quantity}</span>)}</div></td><td className="muted-cell">{sku.sku_products?.length || 0} 种</td><td className="action-cell"><RowActions itemId={sku.id} onEdit={() => setSkuEditor(sku)} onDelete={() => setConfirm({ type: "sku", item: sku })} /></td></tr>)}</tbody>
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
        ) : <></>}
      </main>

      {settingsOpen && (
        <SettingsDialog
          activeTab={settingsTab}
          accountEmail={accountEmail}
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
      {toast && <div className="toast"><Check size={16} weight="bold" />{toast}</div>}
    </div>
  );
}
