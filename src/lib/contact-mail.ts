import nodemailer from 'nodemailer';

import { siteUrl } from '@/lib/site';

export type ContactFormInput = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  category: string;
  categoryTitle?: string;
  product: string;
  productTitle?: string;
  deadline?: string;
  details: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function formatOptional(value?: string): string {
  const trimmed = value?.trim() || '';
  return trimmed || 'Not provided';
}

function ensureEmailConfig() {
  const mailbox = process.env.EMAIL_USER?.trim();
  const password = process.env.EMAIL_PASS?.trim();
  const host = process.env.EMAIL_HOST?.trim();
  const portValue = Number(process.env.EMAIL_PORT || 0);

  if (!mailbox || !password || !host || !Number.isFinite(portValue) || portValue <= 0) {
    throw new Error('Email configuration is incomplete. Set EMAIL_USER, EMAIL_PASS, EMAIL_HOST, and EMAIL_PORT.');
  }

  return {
    mailbox,
    password,
    host,
    port: portValue,
    secure: portValue === 465,
  };
}

function createTransport() {
  const config = ensureEmailConfig();

  return {
    config,
    transport: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.mailbox,
        pass: config.password,
      },
    }),
  };
}

function buildMessage(input: ContactFormInput) {
  const company = formatOptional(input.company);
  const phone = formatOptional(input.phone);
  const deadline = formatOptional(input.deadline);
  const category = input.category.trim();
  const categoryTitle = formatOptional(input.categoryTitle) !== 'Not provided' ? input.categoryTitle!.trim() : category;
  const product = input.product.trim();
  const productTitle = formatOptional(input.productTitle) !== 'Not provided' ? input.productTitle!.trim() : product;
  const details = input.details.trim();

  const textLines = [
    `New contact request from ${input.name}`,
    '',
    `Name: ${input.name}`,
    `Company: ${company}`,
    `Email: ${input.email}`,
    `Phone: ${phone}`,
    `Category: ${categoryTitle}`,
    `Product: ${productTitle}`,
    `Needed by: ${deadline}`,
    '',
    'Project details:',
    details,
  ];

  const html = `
    <div style="margin:0;background:#f5f5f4;padding:24px;font-family:Arial,sans-serif;color:#1c1917;line-height:1.6">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(28,25,23,0.08)">
        <div style="background:linear-gradient(135deg,#1c1917 0%,#3f3f46 100%);color:#ffffff;padding:28px 32px">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d6d3d1">Prime Prints contact request</p>
          <h2 style="margin:0;font-size:26px;line-height:1.2">${escapeHtml(input.name)} sent a new enquiry</h2>
          <p style="margin:12px 0 0;color:#e7e5e4">Reply directly to the customer or use the summary below to prepare a quote.</p>
        </div>

        <div style="padding:28px 32px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 18px;max-width:100%">
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Customer</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(input.name)}</div>
              <div style="margin-top:4px;color:#57534e">${escapeHtml(input.email)}</div>
            </div>
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Company</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(company)}</div>
              <div style="margin-top:4px;color:#57534e">${escapeHtml(phone)}</div>
            </div>
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Category</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(categoryTitle)}</div>
            </div>
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Product</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(productTitle)}</div>
            </div>
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9;grid-column:1 / -1">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Needed by</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(deadline)}</div>
            </div>
          </div>

          <div style="margin-top:22px;padding:18px 20px;border-radius:16px;background:#fff7ed;border:1px solid #fed7aa">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9a3412">Project details</div>
            <div style="margin-top:10px;white-space:pre-wrap;color:#292524">${escapeHtml(details)}</div>
          </div>

          <p style="margin:22px 0 0;font-size:12px;color:#78716c">Sent from ${escapeHtml(siteUrl)}</p>
        </div>
      </div>
    </div>
  `;

  return {
    text: textLines.join('\n'),
    html,
  };
}

function buildAutoReply(input: ContactFormInput) {
  const category = formatOptional(input.categoryTitle) !== 'Not provided' ? input.categoryTitle!.trim() : input.category.trim();
  const product = formatOptional(input.productTitle) !== 'Not provided' ? input.productTitle!.trim() : input.product.trim();
  const details = input.details.trim();

  const text = [
    `Hi ${input.name},`,
    '',
    'Thanks for contacting Prime Prints. We have received your request and will review it shortly.',
    '',
    `Category: ${category}`,
    `Product: ${product}`,
    `Needed by: ${formatOptional(input.deadline)}`,
    '',
    'Your message:',
    details,
    '',
    `If you need to follow up, reply to this email or visit ${siteUrl}.`,
  ].join('\n');

  const html = `
    <div style="margin:0;background:#f5f5f4;padding:24px;font-family:Arial,sans-serif;color:#1c1917;line-height:1.6">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#1c1917 100%);color:#ffffff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#cbd5e1">Prime Prints</p>
          <h2 style="margin:0;font-size:26px;line-height:1.2">We received your message</h2>
        </div>

        <div style="padding:28px 32px">
          <p style="margin:0 0 16px;font-size:16px">Hi ${escapeHtml(input.name)},</p>
          <p style="margin:0 0 18px;color:#44403c">Thanks for reaching out. Our team has your request and will review it shortly.</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Category</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(category)}</div>
            </div>
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Product</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(product)}</div>
            </div>
            <div style="padding:14px 16px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9;grid-column:1 / -1">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716c">Needed by</div>
              <div style="margin-top:4px;font-size:16px;font-weight:700">${escapeHtml(formatOptional(input.deadline))}</div>
            </div>
          </div>

          <div style="margin-top:22px;padding:18px 20px;border-radius:16px;background:#f8fafc;border:1px solid #cbd5e1">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#334155">Your message</div>
            <div style="margin-top:10px;white-space:pre-wrap;color:#1e293b">${escapeHtml(details)}</div>
          </div>

          <p style="margin:22px 0 0;color:#57534e">If you need to add anything, simply reply to this email.</p>
          <p style="margin:8px 0 0;font-size:12px;color:#78716c">Visit us at ${escapeHtml(siteUrl)}</p>
        </div>
      </div>
    </div>
  `;

  return { text, html };
}

export async function sendContactEmails(input: ContactFormInput): Promise<void> {
  const { config, transport } = createTransport();
  const senderName = 'Prime Prints';
  const from = `${senderName} <${config.mailbox}>`;
  const message = buildMessage(input);
  const autoReply = buildAutoReply(input);
  const categoryTitle = formatOptional(input.categoryTitle) !== 'Not provided' ? input.categoryTitle!.trim() : input.category.trim();
  const productTitle = formatOptional(input.productTitle) !== 'Not provided' ? input.productTitle!.trim() : input.product.trim();

  await Promise.all([
    transport.sendMail({
      from,
      to: config.mailbox,
      replyTo: input.email,
      subject: `New contact request: ${categoryTitle} / ${productTitle}`,
      text: message.text,
      html: message.html,
    }),
    transport.sendMail({
      from,
      to: input.email,
      replyTo: config.mailbox,
      subject: 'Prime Prints received your request',
      text: autoReply.text,
      html: autoReply.html,
    }),
  ]);
}