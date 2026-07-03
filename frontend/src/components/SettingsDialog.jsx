import { useState, useEffect } from "react";
import { ArrowDown, ArrowUp, SpinnerGap, SignOut, X, Cube } from "@phosphor-icons/react";
import { SKU_NAME_FIELD_LABELS } from "../utils";

export function SettingsDialog({ activeTab, accountEmail, accountLabel, accountStatus, canChangePassword, fields, duplicateSettings, busy, theme, onClose, onSavePersonal, onSaveWorkspace, onSelectTab, onSignOut, onThemeChange }) {
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
                  <div className="settings-heading"><div><h2>SKU 名称字段顺序</h2><p>字段从上到下依次拼接，不添加空格；多产品使用" + "分隔。</p></div></div>
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
