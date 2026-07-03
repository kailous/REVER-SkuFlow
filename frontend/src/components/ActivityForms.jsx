import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";

export function ActivityForm({ libraries, busy, onClose, onSave }) {
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

export function ActivitySkuForm({ sku, binding, mechanisms, fixedMechanisms, giftMap, busy, onClose, onSave }) {
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
