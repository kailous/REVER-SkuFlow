import { createClient } from "@supabase/supabase-js";

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    sendJson(response, 500, { error: "Supabase 环境变量尚未配置。" });
    return;
  }

  let body = request.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      sendJson(response, 400, { error: "请求格式不正确。" });
      return;
    }
  }
  const email = String(body.email || "").trim();
  const redirectTo = String(body.redirectTo || "").trim();
  if (!email) {
    sendJson(response, 400, { error: "请输入邮箱。" });
    return;
  }

  try {
    const supabase = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
    if (error) {
      sendJson(response, 400, { error: error.message });
      return;
    }
    sendJson(response, 200, { ok: true });
  } catch {
    sendJson(response, 502, { error: "无法连接认证服务。请稍后再试。" });
  }
}
