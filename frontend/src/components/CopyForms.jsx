import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Drawer } from "./Shared";

export function CopyMechanismLibraryForm({ library, mechanismCount, busy, onClose, onCopy }) {
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

export function CopyMechanismForm({ mechanism, libraries, currentLibraryId, busy, onClose, onCopy }) {
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
