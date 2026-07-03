import { useState } from "react";
import { Minus, Plus, SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";

export function MechanismForm({ mechanism, gifts, busy, onClose, onSave }) {
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

export function MechanismLibraryForm({ library, busy, onClose, onSave }) {
  const [name, setName] = useState(library?.name || "");
  return (
    <Drawer title={library ? "编辑机制库" : "新建机制库"} subtitle={library ? undefined : "编号与 UUID 将由系统自动生成"} onClose={onClose}>
      <form className="drawer-form" onSubmit={(event) => { event.preventDefault(); onSave({ name: name.trim() }); }}>
        <div className="form-fields">
          <label>机制库名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：五一活动" required autoFocus /></label>
        </div>
        <footer className="drawer-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy || !name.trim()} type="submit">{busy && <SpinnerGap className="spin" />}保存机制库</button></footer>
      </form>
    </Drawer>
  );
}
