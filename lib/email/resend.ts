// lib/email/resend.ts
// Minimal Resend client. Env-gated: if RESEND_API_KEY isn't set, it no-ops with
// a friendly message instead of throwing. Can't be exercised in this sandbox
// (no outbound to api.resend.com) but follows Resend's documented HTTP API.

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; message: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    return { ok: false, message: "El email no está configurado en el servidor." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      return { ok: false, message: `El proveedor de email respondió ${res.status}.` };
    }
    return { ok: true, message: "Email enviado." };
  } catch {
    return { ok: false, message: "No se pudo enviar el email." };
  }
}

export function inviteEmailHtml(opts: {
  tournamentName: string;
  joinUrl: string;
  inviterName: string;
}) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
    <h1 style="color:#138A4F">PORRAPP</h1>
    <p>${escapeHtml(opts.inviterName)} te invita a su porra
       <strong>${escapeHtml(opts.tournamentName)}</strong>.</p>
    <p><a href="${opts.joinUrl}"
       style="background:#138A4F;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block">
       Unirme a la porra</a></p>
    <p style="color:#666;font-size:13px">O copia este enlace: ${opts.joinUrl}</p>
  </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}
