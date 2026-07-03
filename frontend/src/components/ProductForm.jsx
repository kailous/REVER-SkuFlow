import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";
import { normalizeSellingCopy } from "../utils";

export function ProductForm({ product, series, busy, onClose, onSave }) {
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
