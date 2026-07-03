import { useEffect, useState } from "react";
import { Minus, Plus, SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";
import { generateSkuName, getCompositionKey, normalizeSellingCopy, getEffectiveProductSellingPoints } from "../utils";

export function SkuForm({ sku, products, series, skus, nameFields, allowDuplicate, busy, onClose, onSave }) {
  const [items, setItems] = useState(
    sku?.sku_products?.length
      ? sku.sku_products.map((item) => ({ ...item }))
      : [{ product_id: products[0]?.id || "", quantity: 1 }],
  );
  const [price, setPrice] = useState(sku?.price ?? "");
  const [sellingMode, setSellingMode] = useState(sku?.selling_points ? "custom" : "source");
  const [sourceProductId, setSourceProductId] = useState(sku?.selling_points_source_product_id || items[0]?.product_id || "");
  const [customPoints, setCustomPoints] = useState(sku?.selling_points ? normalizeSellingCopy(sku.selling_points) : "");
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);

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
                  <select aria-label={`产品 ${index + 1}`} value={item.product_id} onChange={(event) => updateItem(index, "product_id", event.target.value)} required>
                    <option value="" disabled>选择产品</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id} disabled={product.id !== item.product_id && selectedIds.has(product.id)}>
                        #{String(product.product_number).padStart(4, "0")} · {product.name}
                      </option>
                    ))}
                  </select>
                  <label className="quantity-input">
                    <span>数量</span>
                    <input aria-label={`数量 ${index + 1}`} type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} required />
                  </label>
                  <button className="icon-button remove-composition" type="button" aria-label={`移除产品 ${index + 1}`} disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                    <Minus size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button className="add-composition" type="button" disabled={selectedIds.size >= products.length} onClick={addItem}>
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
