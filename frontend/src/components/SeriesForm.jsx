import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";
import { normalizeSellingCopy } from "../utils";

export function SeriesForm({ item, nextSortOrder, busy, onClose, onSave }) {
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
