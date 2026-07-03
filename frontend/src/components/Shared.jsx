import { X, Trash, SpinnerGap, ArrowsDownUp, ArrowUp, ArrowDown } from "@phosphor-icons/react";

export function Drawer({ title, subtitle, onClose, children }) {
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

export function ConfirmDialog({ title, message, confirmLabel = "确认删除", busy, onCancel, onConfirm }) {
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

export function SortIcon({ active, direction }) {
  if (!active) return <ArrowsDownUp size={14} />;
  return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}
