import { useEffect, useState } from "react";
import { supabaseReady } from "../supabase";
import { getAuthErrorMessage } from "../utils";
import { SpinnerGap } from "@phosphor-icons/react";

export function AuthView({ onDemo, recoveryMode = false, notice = "", onRecoveryComplete }) {
  const [mode, setMode] = useState(recoveryMode ? "updatePassword" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(notice);

  useEffect(() => {
    if (recoveryMode) setMode("updatePassword");
  }, [recoveryMode]);

  useEffect(() => {
    setMessage(notice);
  }, [notice]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setPasswordConfirm("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!supabaseReady) {
      setMessage("Supabase 环境变量尚未配置，请使用本地演示模式。");
      return;
    }
    if (mode === "updatePassword" && password !== passwordConfirm) {
      setMessage("两次输入的新密码不一致。");
      return;
    }
    setBusy(true);
    setMessage("");

    let data;
    let error;
    try {
      if (mode === "login") {
        ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
      } else if (mode === "register") {
        ({ data, error } = await supabase.auth.signUp({ email, password }));
      } else if (mode === "forgot") {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}${window.location.pathname}`,
          }),
        });
        data = await response.json().catch(() => ({}));
        if (!response.ok) error = new Error(data.error || "重置邮件发送失败，请稍后再试。");
      } else {
        ({ data, error } = await supabase.auth.updateUser({ password }));
      }
    } catch {
      error = new Error("网络连接失败，请检查网络后重试。");
    }

    if (error) {
      setMessage(getAuthErrorMessage(error));
    } else if (mode === "forgot") {
      setMessage("重置邮件已发送，请查收邮箱。");
    } else if (mode === "updatePassword") {
      setMessage("密码已更新。");
      if (onRecoveryComplete) onRecoveryComplete();
    }
    setBusy(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <div className="brand-mark">R</div>
        <p className="eyebrow">REVER SkuFlow</p>
        <h1>{mode === "login" ? "登录" : mode === "register" ? "创建账户" : mode === "forgot" ? "重置密码" : "更新密码"}</h1>
        <p className="auth-intro">
          {mode === "login"
            ? "登录以访问线上商品数据。"
            : mode === "register"
              ? "注册新账户以开始管理商品数据。"
              : mode === "forgot"
                ? "输入注册邮箱，我们将发送重置链接。"
                : "设置新的账户密码。"}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {mode !== "forgot" && mode !== "updatePassword" && (
            <label>邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoFocus /></label>
          )}
          {mode === "forgot" && (
            <label>注册邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoFocus /></label>
          )}
          {mode !== "forgot" && <label>{mode === "updatePassword" ? "新密码" : "密码"}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "updatePassword" ? "至少 6 位" : "输入密码"} minLength={6} required /></label>}
          {mode === "updatePassword" && <label>确认新密码<input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} placeholder="再次输入新密码" minLength={6} required /></label>}
          {message && <p className={`auth-message ${message.includes("已发送") || message.includes("已更新") ? "success" : ""}`}>{message}</p>}
          <button className="button primary full" type="submit" disabled={busy}>{busy && <SpinnerGap className="spin" />}{mode === "login" ? "登录" : mode === "register" ? "注册" : mode === "forgot" ? "发送重置链接" : "更新密码"}</button>
        </form>
        <section className="auth-switch">
          {mode === "login" && <button className="text-button" onClick={() => switchMode("register")}>没有账户？注册</button>}
          {mode === "login" && <button className="text-button" onClick={() => switchMode("forgot")}>忘记密码？</button>}
          {mode === "register" && <button className="text-button" onClick={() => switchMode("login")}>已有账户？登录</button>}
          {mode === "forgot" && <button className="text-button" onClick={() => switchMode("login")}>想起密码？返回登录</button>}
          {mode !== "updatePassword" && (
            <>
              <div className="auth-divider"><span>或</span></div>
              <button className="button secondary full" onClick={onDemo}>进入本地演示</button>
              <p className="auth-note">演示模式只保存在当前浏览器，不会写入线上数据库。</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
