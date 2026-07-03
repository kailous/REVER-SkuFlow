import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";

export function GiftForm({ gift, busy, onClose, onSave }) {
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
