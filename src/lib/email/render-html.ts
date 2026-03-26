export type BrandingRow = {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  header_logo_url: string | null;
  header_logo_width: number;
  font_family: string;
  button_style: "rounded" | "square" | "pill";
  footer_company_name: string | null;
  footer_address: string | null;
  footer_links_json: unknown;
  social_links_json: unknown;
  email_signature: string | null;
  preview_text_prefix: string | null;
};

export type StructuredEmail = {
  subject: string;
  preview_text: string;
  greeting: string;
  body_html_content: string;
  cta_text: string;
  cta_url: string;
  ps_line?: string | null;
};

function buttonRadius(style: BrandingRow["button_style"]) {
  if (style === "square") return "0";
  if (style === "pill") return "50px";
  return "6px";
}

function renderFooterLinks(footer_links_json: unknown): string {
  if (!Array.isArray(footer_links_json)) return "";
  return footer_links_json
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const label = "label" in item ? String((item as { label?: string }).label ?? "") : "";
      const url = "url" in item ? String((item as { url?: string }).url ?? "#") : "#";
      if (!label) return "";
      return `<a href="${escapeAttr(url)}">${escapeHtml(label)}</a>`;
    })
    .filter(Boolean)
    .join(" · ");
}

function renderSocialIcons(social: unknown): string {
  if (!social || typeof social !== "object") return "";
  const o = social as Record<string, string>;
  const parts: string[] = [];
  for (const [key, url] of Object.entries(o)) {
    if (!url) continue;
    parts.push(
      `<a href="${escapeAttr(url)}">${escapeHtml(key)}</a>`,
    );
  }
  return parts.join(" ");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replaceAll("\n", " ");
}

export type Personalisation = Record<string, string | undefined>;

export function applyPersonalisation(html: string, tokens: Personalisation) {
  let out = html;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.replaceAll(`{{${k}}}`, escapeHtml(v ?? ""));
  }
  return out;
}

export function renderMasterEmailTemplate(params: {
  productName: string;
  branding: BrandingRow;
  structured: StructuredEmail;
  unsubscribeUrl: string;
  personalisation?: Personalisation;
  darkMode?: boolean;
}) {
  const { branding, structured, productName, unsubscribeUrl } = params;
  const pers = params.personalisation ?? {};
  const bodyInner = applyPersonalisation(structured.body_html_content, pers);
  const safeGreeting = applyPersonalisation(structured.greeting, pers)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const psBlock =
    structured.ps_line && structured.ps_line.trim().length > 0
      ? `<p style="font-size:13px;color:#64748B;margin-top:24px;"><em>${applyPersonalisation(
          structured.ps_line,
          pers,
        )
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")}</em></p>`
      : "";

  const darkBlock = params.darkMode
    ? `
  @media (prefers-color-scheme: dark) {
    body{background:#0f172a!important;}
    .email-body{background:#1e293b!important;color:#e2e8f0!important;}
    .email-footer{background:#0f172a!important;color:#94a3b8!important;}
  }`
    : "";

  const logoUrl = branding.header_logo_url ?? "";
  const footerCompany = branding.footer_company_name ?? "";
  const footerAddr = branding.footer_address ?? "";
  const sig = branding.email_signature ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(structured.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings>
</xml></noscript><![endif]-->
<style>
  body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  body{margin:0;padding:0;background:${branding.background_color};}
  :root{
    --primary:   ${branding.primary_color};
    --secondary: ${branding.secondary_color};
    --text:      ${branding.text_color};
    --bg:        ${branding.background_color};
    --font:      ${branding.font_family};
  }
  .email-wrapper{max-width:600px;margin:0 auto;font-family:var(--font);}
  .email-header{background:var(--primary);padding:28px 40px;text-align:center;}
  .email-header img{width:${branding.header_logo_width}px;max-width:100%;height:auto;}
  .email-body{background:#ffffff;padding:36px 40px;color:var(--text);
    font-size:15px;line-height:1.7;}
  .email-greeting{font-size:16px;font-weight:600;margin-bottom:16px;}
  .cta-button{display:inline-block;margin:24px 0;padding:14px 28px;
    background:var(--primary);color:#ffffff;text-decoration:none;
    font-weight:600;font-size:15px;
    border-radius:${buttonRadius(branding.button_style)};}
  .email-footer{background:#F1F5F9;padding:24px 40px;text-align:center;
    font-size:12px;color:#64748B;line-height:1.6;}
  .footer-links a{color:#64748B;text-decoration:none;margin:0 8px;}
  .social-icons a{margin:0 6px;}
  .unsubscribe-line{margin-top:16px;font-size:11px;color:#94A3B8;}
  @media only screen and (max-width:600px){
    .email-body,.email-header,.email-footer{padding:20px 24px!important;}
  }
  ${darkBlock}
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;">
  ${escapeHtml(branding.preview_text_prefix ?? "")} ${escapeHtml(structured.preview_text)}
</div>
<div class="email-wrapper">
  <div class="email-header">
    ${logoUrl ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(productName)}" />` : `<span style="color:#fff;font-size:20px;">${escapeHtml(productName)}</span>`}
  </div>
  <div class="email-body">
    <p class="email-greeting">${safeGreeting}</p>
    ${bodyInner}
    <div style="text-align:center;">
      <a class="cta-button" href="${escapeAttr(structured.cta_url)}">${escapeHtml(structured.cta_text)}</a>
    </div>
    ${psBlock}
    <p style="margin-top:32px;font-size:14px;color:#475569;">${escapeHtml(sig)}</p>
  </div>
  <div class="email-footer">
    <div class="footer-links">${renderFooterLinks(branding.footer_links_json)}</div>
    <div class="social-icons" style="margin:12px 0;">${renderSocialIcons(branding.social_links_json)}</div>
    <p>${escapeHtml(footerCompany)} · ${escapeHtml(footerAddr)}</p>
    <p class="unsubscribe-line">
      You received this because you're a potential fit for ${escapeHtml(productName)}.
      <a href="${escapeAttr(unsubscribeUrl)}" style="color:#94A3B8;">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

export function listUnsubscribeHeaders(oneClickUrl: string) {
  return {
    "List-Unsubscribe": `<${oneClickUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  } as Record<string, string>;
}
