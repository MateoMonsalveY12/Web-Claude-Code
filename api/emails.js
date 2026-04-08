/**
 * api/emails.js — Consolidated email handler
 *
 * Named exports for internal import by other serverless functions:
 *   sendOrderConfirmedEmail(data)
 *   sendOrderShippedEmail(data)
 *   sendOrderDeliveredEmail(data)
 *
 * HTTP handler: POST /api/emails?type=confirmed|shipped|delivered
 */

import { Resend } from 'resend'

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtCOP(n) {
  return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO')
}

function footer() {
  return `
  <tr>
    <td style="padding:24px 40px; border-top:1px solid #eeeeee; text-align:center;">
      <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#666666;">
        Bialy Colombia &mdash; Moda femenina
      </p>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:11px; color:#aaaaaa;">
        <a href="https://bialycol.shop/privacidad" style="color:#aaaaaa;">Politica de privacidad</a>
        &nbsp;&middot;&nbsp;
        <a href="https://bialycol.shop/terminos" style="color:#aaaaaa;">Terminos y condiciones</a>
        &nbsp;&middot;&nbsp;
        <a href="https://bialycol.shop/mi-cuenta/pedidos" style="color:#aaaaaa;">Ver mis pedidos</a>
      </p>
    </td>
  </tr>`
}

function logoRow() {
  return `
  <tr>
    <td style="padding:40px 40px 24px; text-align:center; border-bottom:1px solid #eeeeee;">
      <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:400; letter-spacing:6px; color:#111111;">BIALY</h1>
    </td>
  </tr>`
}

function wrap(rows) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; max-width:600px; width:100%;">
          ${logoRow()}
          ${rows}
          ${footer()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendEmail({ to, subject, html, tag }) {
  const apiKey = process.env.RESEND_API_KEY
  console.log(`[email:${tag}] Iniciando envío — destinatario:`, to ?? 'NO EMAIL')
  console.log(`[email:${tag}] RESEND_API_KEY presente:`, !!apiKey)
  if (!apiKey) { console.error(`[email:${tag}] ERROR: RESEND_API_KEY no está configurada`); return }
  if (!to)     { console.error(`[email:${tag}] ERROR: destinatario vacío`); return }
  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({ from: 'Bialy <no-reply@bialycol.shop>', to, subject, html })
    console.log(`[email:${tag}] Respuesta de Resend:`, JSON.stringify(result))
    if (result?.error) console.error(`[email:${tag}] Error Resend:`, JSON.stringify(result.error))
    else console.log(`[email:${tag}] Email enviado. ID:`, result?.id ?? result?.data?.id)
  } catch (err) {
    console.error(`[email:${tag}] Excepción:`, err.message, err.stack)
    throw err
  }
}

// ── HTML builders ──────────────────────────────────────────────────────────

function buildConfirmedHtml(data) {
  const {
    customerName = 'Estimada clienta',
    wompiReference = '',
    items = [],
    subtotal, shippingCost, totalAmount,
    shippingAddress = {},
    shippingOption = '',
  } = data

  const addr = [shippingAddress.address, shippingAddress.apt, shippingAddress.city, shippingAddress.state]
    .filter(Boolean).join(', ')

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111;">
        ${item.product_name ?? item.name ?? ''}
        ${item.size  ? `<br><span style="color:#666666; font-size:12px;">Talla: ${item.size}</span>` : ''}
        ${item.color ? `<br><span style="color:#666666; font-size:12px;">Color: ${item.color}</span>` : ''}
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; text-align:center;">${item.quantity ?? 1}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; text-align:right;">${fmtCOP(item.unit_price ?? item.price)}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; text-align:right; font-weight:600;">${fmtCOP(item.subtotal ?? (item.unit_price ?? item.price) * (item.quantity ?? 1))}</td>
    </tr>`).join('')

  const shippingRow = shippingCost != null ? `
    <tr>
      <td colspan="3" style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; text-align:right;">Envío</td>
      <td style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; text-align:right;">${shippingCost === 0 ? 'Gratis' : fmtCOP(shippingCost)}</td>
    </tr>` : ''

  return wrap(`
  <tr>
    <td style="padding:36px 40px 8px; text-align:center;">
      <div style="margin-bottom:24px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="display:inline-block;">
          <circle cx="12" cy="12" r="11" stroke="#111111" stroke-width="1.5"/>
          <polyline points="7 12 10.5 15.5 17 9" stroke="#111111" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 style="margin:0 0 8px; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:400; color:#111111;">
        Gracias por tu compra, ${customerName.split(' ')[0]}
      </h2>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.6;">
        Hemos recibido tu pedido y estamos preparandolo con mucho cuidado.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px;">
      <div style="background:#f9f9f9; border:1px solid #eeeeee; padding:14px 18px; text-align:center;">
        <p style="margin:0 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Referencia del pedido</p>
        <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:18px; color:#111111; letter-spacing:1px;">${wompiReference || 'Ver en tu cuenta'}</p>
      </div>
    </td>
  </tr>
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  <tr>
    <td style="padding:28px 40px 8px;">
      <p style="margin:0 0 16px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Resumen del pedido</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #111111;">
            <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:left;">Producto</th>
            <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:center;">Cant.</th>
            <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:right;">Precio</th>
            <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
          ${shippingRow}
          <tr style="border-top:2px solid #111111;">
            <td colspan="3" style="padding:12px 12px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:#111111; text-align:right;">Total pagado</td>
            <td style="padding:12px 12px; font-family:Georgia,'Times New Roman',serif; font-size:16px; font-weight:700; color:#111111; text-align:right;">${fmtCOP(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </td>
  </tr>
  <tr><td style="padding:8px 40px 0;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  ${addr || shippingOption ? `
  <tr>
    <td style="padding:24px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${addr ? `<td style="width:50%; vertical-align:top; padding-right:16px;">
          <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Direccion de envio</p>
          <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; line-height:1.6;">${addr}</p>
        </td>` : ''}
        ${shippingOption ? `<td style="width:50%; vertical-align:top;">
          <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Metodo de envio</p>
          <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; line-height:1.6;">${shippingOption}</p>
        </td>` : ''}
      </tr></table>
    </td>
  </tr>` : ''}
  <tr><td style="padding:24px 40px 0;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  <tr>
    <td style="padding:32px 40px; text-align:center;">
      <p style="margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.7;">
        Te avisaremos cuando tu pedido este en camino. Puedes seguir el estado en cualquier momento.
      </p>
      <a href="https://bialycol.shop/mi-cuenta/pedidos"
         style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">
        Ver mi pedido
      </a>
    </td>
  </tr>`)
}

function buildShippedHtml(data) {
  const {
    customerName = 'Estimada clienta',
    wompiReference = '',
    trackingNumber = '',
    trackingUrl = '',
    items = [],
    shippingAddress = {},
  } = data

  const addr = [shippingAddress.address, shippingAddress.apt, shippingAddress.city, shippingAddress.state]
    .filter(Boolean).join(', ')

  const itemsList = items.map(item => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111;">
        ${item.product_name ?? item.name ?? ''}
        ${item.size  ? `<br><span style="color:#666666; font-size:12px;">Talla: ${item.size}</span>` : ''}
        ${item.color ? `<br><span style="color:#666666; font-size:12px;">Color: ${item.color}</span>` : ''}
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; text-align:center;">${item.quantity ?? 1}</td>
    </tr>`).join('')

  return wrap(`
  <tr>
    <td style="padding:36px 40px 8px; text-align:center;">
      <div style="margin-bottom:24px;">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style="display:inline-block;">
          <rect x="1" y="3" width="15" height="13" stroke="#111111" stroke-width="1.5" stroke-linejoin="round"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="#111111" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="5.5" cy="18.5" r="2.5" stroke="#111111" stroke-width="1.5"/>
          <circle cx="18.5" cy="18.5" r="2.5" stroke="#111111" stroke-width="1.5"/>
        </svg>
      </div>
      <h2 style="margin:0 0 8px; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:400; color:#111111;">Tu pedido esta en camino</h2>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.6;">
        Hola ${customerName.split(' ')[0]}, tu pedido ha sido despachado y esta en camino hacia ti.
      </p>
    </td>
  </tr>
  ${wompiReference ? `
  <tr>
    <td style="padding:20px 40px;">
      <div style="background:#f9f9f9; border:1px solid #eeeeee; padding:10px 18px; text-align:center;">
        <p style="margin:0 0 2px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Referencia</p>
        <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#111111;">${wompiReference}</p>
      </div>
    </td>
  </tr>` : ''}
  ${trackingNumber ? `
  <tr>
    <td style="padding:0 40px 24px;">
      <div style="background:#fff8f2; border:1px solid #fde5cc; padding:20px 24px; text-align:center;">
        <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#e07b2a;">Numero de guia</p>
        <p style="margin:0 0 16px; font-family:Georgia,'Times New Roman',serif; font-size:20px; color:#111111; letter-spacing:2px;">${trackingNumber}</p>
        ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:12px 28px;">Rastrear mi envio</a>` : ''}
      </div>
    </td>
  </tr>` : ''}
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  ${items.length > 0 ? `
  <tr>
    <td style="padding:24px 40px 0;">
      <p style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Productos enviados</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead><tr style="border-bottom:2px solid #111111;">
          <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:left;">Producto</th>
          <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:center;">Cant.</th>
        </tr></thead>
        <tbody>${itemsList}</tbody>
      </table>
    </td>
  </tr>` : ''}
  ${addr ? `
  <tr>
    <td style="padding:20px 40px 0;">
      <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Direccion de entrega</p>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; line-height:1.6;">${addr}</p>
    </td>
  </tr>` : ''}
  <tr><td style="padding:24px 40px 0;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  <tr>
    <td style="padding:32px 40px; text-align:center;">
      <p style="margin:0 0 20px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.7;">
        Puedes ver el estado de tu pedido en tu cuenta de Bialy en cualquier momento.
      </p>
      <a href="https://bialycol.shop/mi-cuenta/pedidos"
         style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">
        Ver mi pedido
      </a>
    </td>
  </tr>`)
}

function buildDeliveredHtml(data) {
  const {
    customerName = 'Estimada clienta',
    wompiReference = '',
    items = [],
  } = data

  const STAR = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#111111" style="display:inline-block; vertical-align:middle;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  const stars5 = Array.from({ length: 5 }).map(() => STAR).join(' ')

  const itemsList = items.map(item => `
    <li style="font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; padding:6px 0; border-bottom:1px solid #eeeeee;">
      ${item.product_name ?? item.name ?? ''}
      ${item.size ? `<span style="color:#666666; font-size:12px;"> &mdash; Talla ${item.size}</span>` : ''}
    </li>`).join('')

  return wrap(`
  <tr>
    <td style="padding:36px 40px 16px; text-align:center;">
      <div style="margin-bottom:24px;">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style="display:inline-block;">
          <circle cx="12" cy="12" r="11" fill="#111111"/>
          <polyline points="7 12 10.5 15.5 17 9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 style="margin:0 0 10px; font-family:Georgia,'Times New Roman',serif; font-size:24px; font-weight:400; color:#111111;">Tu pedido ha llegado</h2>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.7;">
        Hola ${customerName.split(' ')[0]}, esperamos que estes disfrutando tu nueva prenda de Bialy.
      </p>
    </td>
  </tr>
  ${items.length > 0 ? `
  <tr>
    <td style="padding:0 40px 24px;">
      <p style="margin:0 0 10px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Productos recibidos</p>
      <ul style="margin:0; padding:0; list-style:none;">${itemsList}</ul>
    </td>
  </tr>` : ''}
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  <tr>
    <td style="padding:36px 40px; text-align:center; background:#fafafa;">
      <p style="margin:0 0 10px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Tu opinion importa</p>
      <h3 style="margin:0 0 10px; font-family:Georgia,'Times New Roman',serif; font-size:18px; font-weight:400; color:#111111;">Califica tu compra</h3>
      <p style="margin:0 0 20px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; line-height:1.7;">
        Tu experiencia ayuda a otras mujeres a elegir mejor.
      </p>
      <div style="margin-bottom:24px;">${stars5}</div>
      <a href="https://bialycol.shop/mi-cuenta/pedidos"
         style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">
        Calificar mi compra
      </a>
    </td>
  </tr>
  <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>
  <tr>
    <td style="padding:32px 40px; text-align:center;">
      <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:16px; font-weight:400; color:#111111; line-height:1.8; font-style:italic;">
        "Gracias por elegir Bialy. Cada prenda esta hecha con amor<br>para que te sientas extraordinaria."
      </p>
    </td>
  </tr>`)
}

// ── Named exports — imported directly by other serverless functions ─────────

export async function sendOrderConfirmedEmail(data) {
  await sendEmail({
    to:      data.customerEmail,
    subject: 'Tu pedido en Bialy ha sido confirmado',
    html:    buildConfirmedHtml(data),
    tag:     'confirmed',
  })
}

export async function sendOrderShippedEmail(data) {
  await sendEmail({
    to:      data.customerEmail,
    subject: 'Tu pedido de Bialy esta en camino',
    html:    buildShippedHtml(data),
    tag:     'shipped',
  })
}

export async function sendOrderDeliveredEmail(data) {
  await sendEmail({
    to:      data.customerEmail,
    subject: 'Tu pedido de Bialy ha sido entregado',
    html:    buildDeliveredHtml(data),
    tag:     'delivered',
  })
}

// ── Welcome discount email ─────────────────────────────────────────────────

function buildWelcomeDiscountHtml({ email, code }) {
  return wrap(`
  <tr>
    <td style="padding:40px 40px 8px; text-align:center;">
      <div style="display:inline-block; background:#f9f9f9; border:1px solid #eeeeee; padding:6px 16px; margin-bottom:28px;">
        <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#999999;">Bienvenida a Bialy Colombia</p>
      </div>
      <h2 style="margin:0 0 12px; font-family:Georgia,'Times New Roman',serif; font-size:26px; font-weight:400; color:#111111; line-height:1.3;">
        Aquí tienes tu<br>10% OFF
      </h2>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.7;">
        Gracias por unirte a nuestra comunidad.<br>
        Este código es exclusivo para tu primera compra.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <div style="border:2px dashed #dddddd; padding:20px; text-align:center; background:#fafafa;">
        <p style="margin:0 0 8px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#999999;">Tu código de descuento</p>
        <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; letter-spacing:4px; color:#111111; font-weight:700;">${code}</p>
        <p style="margin:8px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#999999;">Válido para un solo uso · Solo primera compra</p>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 40px; text-align:center;">
      <a href="https://bialycol.shop/collections/nueva-coleccion"
         style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:16px 40px;">
        Ir a la tienda
      </a>
      <p style="margin:20px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#aaaaaa; line-height:1.6;">
        Ingresa el código al momento de pagar.<br>
        No es acumulable con otras promociones.
      </p>
    </td>
  </tr>`)
}

export async function sendWelcomeDiscountEmail({ email, code }) {
  await sendEmail({
    to:      email,
    subject: 'Bienvenida a Bialy Colombia — aquí tienes tu 10% OFF',
    html:    buildWelcomeDiscountHtml({ email, code }),
    tag:     'welcome-discount',
  })
}

// ── Contact form email ─────────────────────────────────────────────────────

const SUBJECT_LABELS = {
  'consulta-producto': 'Consulta sobre un producto',
  'estado-pedido':     'Estado de mi pedido',
  'cambio-devolucion': 'Cambio o devolución',
  'otro':              'Otro',
}

function buildContactHtml({ name, email, subject, message }) {
  const subjectLabel = SUBJECT_LABELS[subject] || subject
  const ts = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'full', timeStyle: 'short' })
  return wrap(`
  <tr>
    <td style="padding:32px 40px 8px;">
      <h2 style="margin:0 0 4px; font-family:Georgia,'Times New Roman',serif; font-size:20px; font-weight:400; color:#111111;">
        Nuevo mensaje de contacto
      </h2>
      <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666;">${ts}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr style="border-bottom:1px solid #eeeeee;">
          <td style="padding:10px 0; width:120px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#999999; vertical-align:top;">De</td>
          <td style="padding:10px 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#111111;">${name} &lt;<a href="mailto:${email}" style="color:#111111;">${email}</a>&gt;</td>
        </tr>
        <tr style="border-bottom:1px solid #eeeeee;">
          <td style="padding:10px 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#999999; vertical-align:top;">Asunto</td>
          <td style="padding:10px 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#111111;">${subjectLabel}</td>
        </tr>
        <tr>
          <td style="padding:16px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#999999; vertical-align:top;">Mensaje</td>
          <td style="padding:16px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#111111; line-height:1.7; white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 40px 8px;">
      <a href="mailto:${email}?subject=Re: [Bialy Contacto] ${subjectLabel}"
         style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:12px 28px;">
        Responder a ${name.split(' ')[0]}
      </a>
    </td>
  </tr>`)
}

// ── HTTP handler — POST /api/emails?type=confirmed|shipped|delivered|contact ─

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const { type } = req.query
  try {
    if (type === 'confirmed') {
      await sendOrderConfirmedEmail(body)
    } else if (type === 'shipped') {
      await sendOrderShippedEmail(body)
    } else if (type === 'delivered') {
      await sendOrderDeliveredEmail(body)
    } else if (type === 'contact') {
      const { name, email, subject, message } = body
      if (!name || !email || !subject || !message)
        return res.status(400).json({ error: 'name, email, subject y message son requeridos' })
      const subjectLabel = SUBJECT_LABELS[subject] || subject
      await sendEmail({
        to:      'bialycomercial@gmail.com',
        subject: `[Bialy Contacto] ${subjectLabel} — ${name}`,
        html:    buildContactHtml({ name, email, subject, message }),
        tag:     'contact',
      })
    } else if (type === 'welcome-discount') {
      const { email, code } = body
      if (!email || !code) return res.status(400).json({ error: 'email y code son requeridos' })
      await sendWelcomeDiscountEmail({ email, code })
    } else {
      return res.status(400).json({ error: 'type must be confirmed|shipped|delivered|contact|welcome-discount' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
