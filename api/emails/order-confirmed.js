/**
 * api/emails/order-confirmed.js
 *
 * Named export: sendOrderConfirmedEmail(data)  — called internally from save-order.js & wompi-webhook.js
 * Default export: handler(req, res)            — POST endpoint for external/test triggers
 *
 * data: {
 *   customerName, customerEmail,
 *   wompiReference, orderId,
 *   items: [{ product_name, size, color, quantity, unit_price, subtotal }],
 *   subtotal, shippingCost, totalAmount,
 *   shippingAddress: { address, apt, city, state },
 *   shippingOption,
 * }
 */

import { Resend } from 'resend'

function fmtCOP(n) {
  return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO')
}

function buildHtml(data) {
  const {
    customerName = 'Estimada clienta',
    wompiReference = '',
    items = [],
    subtotal, shippingCost, totalAmount,
    shippingAddress = {},
    shippingOption = '',
  } = data

  const addr = [
    shippingAddress.address,
    shippingAddress.apt,
    shippingAddress.city,
    shippingAddress.state,
  ].filter(Boolean).join(', ')

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
    </tr>
  `).join('')

  const shippingRow = shippingCost != null ? `
    <tr>
      <td colspan="3" style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; text-align:right;">Envío</td>
      <td style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; text-align:right;">${shippingCost === 0 ? 'Gratis' : fmtCOP(shippingCost)}</td>
    </tr>
  ` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido en Bialy ha sido confirmado</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; max-width:600px; width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="padding:40px 40px 24px; text-align:center; border-bottom:1px solid #eeeeee;">
              <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:400; letter-spacing:6px; color:#111111;">BIALY</h1>
            </td>
          </tr>

          <!-- Main heading -->
          <tr>
            <td style="padding:36px 40px 8px;">
              <!-- Check icon -->
              <div style="text-align:center; margin-bottom:24px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;">
                  <circle cx="12" cy="12" r="11" stroke="#111111" stroke-width="1.5"/>
                  <polyline points="7 12 10.5 15.5 17 9" stroke="#111111" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 style="margin:0 0 8px; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:400; color:#111111; text-align:center;">
                Gracias por tu compra, ${customerName.split(' ')[0]}
              </h2>
              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; text-align:center; line-height:1.6;">
                Hemos recibido tu pedido y estamos preparandolo con mucho cuidado.
              </p>
            </td>
          </tr>

          <!-- Reference -->
          <tr>
            <td style="padding:20px 40px;">
              <div style="background:#f9f9f9; border:1px solid #eeeeee; padding:14px 18px; text-align:center;">
                <p style="margin:0 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Referencia del pedido</p>
                <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:18px; color:#111111; letter-spacing:1px;">${wompiReference || 'Ver en tu cuenta'}</p>
              </div>
            </td>
          </tr>

          <!-- Separator -->
          <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- Products table -->
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
                <tbody>
                  ${itemsRows}
                </tbody>
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

          <!-- Separator -->
          <tr><td style="padding:8px 40px 0;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- Shipping address -->
          ${addr || shippingOption ? `
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${addr ? `<td style="width:50%; vertical-align:top; padding-right:16px;">
                    <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Direccion de envio</p>
                    <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; line-height:1.6;">${addr}</p>
                  </td>` : ''}
                  ${shippingOption ? `<td style="width:50%; vertical-align:top;">
                    <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Metodo de envio</p>
                    <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; line-height:1.6;">${shippingOption}</p>
                  </td>` : ''}
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Separator -->
          <tr><td style="padding:24px 40px 0;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- Closing message + CTA -->
          <tr>
            <td style="padding:32px 40px; text-align:center;">
              <p style="margin:0 0 24px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#666666; line-height:1.7;">
                Te avisaremos cuando tu pedido este en camino. Puedes seguir el estado de tu pedido en cualquier momento.
              </p>
              <a href="https://bialycol.shop/mi-cuenta/pedidos"
                 style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">
                Ver mi pedido
              </a>
            </td>
          </tr>

          <!-- Footer -->
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
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/* ── Named export — for internal use ─────────────────────────── */
export async function sendOrderConfirmedEmail(data) {
  console.log('[email:confirmed] Iniciando envío — destinatario:', data.customerEmail ?? 'NO EMAIL')
  console.log('[email:confirmed] RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email:confirmed] ERROR: RESEND_API_KEY no está configurada — email no enviado')
    return
  }
  if (!data.customerEmail) {
    console.error('[email:confirmed] ERROR: customerEmail vacío — email no enviado')
    return
  }

  let result, sendError
  try {
    console.log('[email:confirmed] Llamando a resend.emails.send()...')
    const resend = new Resend(apiKey)
    result = await resend.emails.send({
      from:    'Bialy <no-reply@bialycol.shop>',
      to:      data.customerEmail,
      subject: 'Tu pedido en Bialy ha sido confirmado',
      html:    buildHtml(data),
    })
    console.log('[email:confirmed] Respuesta de Resend:', JSON.stringify(result))
    if (result?.error) {
      console.error('[email:confirmed] Resend devolvió error:', JSON.stringify(result.error))
    } else {
      console.log('[email:confirmed] Email enviado exitosamente. ID:', result?.id ?? result?.data?.id)
    }
  } catch (err) {
    sendError = err
    console.error('[email:confirmed] Excepción al enviar:', err.message)
    console.error('[email:confirmed] Stack:', err.stack)
    throw err  // re-throw so caller can handle
  }
}

/* ── Default handler — POST endpoint ─────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  await sendOrderConfirmedEmail(body)
  return res.status(200).json({ ok: true })
}
