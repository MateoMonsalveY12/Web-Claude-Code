/**
 * api/emails/order-shipped.js
 *
 * Named export: sendOrderShippedEmail(data)
 * Default handler: POST /api/emails/order-shipped
 *
 * data: {
 *   customerName, customerEmail,
 *   wompiReference,
 *   trackingNumber, trackingUrl,
 *   items: [{ product_name, size, color, quantity }],
 *   shippingAddress: { address, apt, city, state },
 * }
 *
 * Triggered when order_status changes to EN_CAMINO.
 * Call this endpoint (or the named export) from your order-management logic.
 */

import { Resend } from 'resend'

function buildHtml(data) {
  const {
    customerName = 'Estimada clienta',
    wompiReference = '',
    trackingNumber = '',
    trackingUrl = '',
    items = [],
    shippingAddress = {},
  } = data

  const addr = [
    shippingAddress.address,
    shippingAddress.apt,
    shippingAddress.city,
    shippingAddress.state,
  ].filter(Boolean).join(', ')

  const itemsList = items.map(item => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111;">
        ${item.product_name ?? item.name ?? ''}
        ${item.size  ? `<br><span style="color:#666666; font-size:12px;">Talla: ${item.size}</span>` : ''}
        ${item.color ? `<br><span style="color:#666666; font-size:12px;">Color: ${item.color}</span>` : ''}
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #eeeeee; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666666; text-align:center;">${item.quantity ?? 1}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido de Bialy esta en camino</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; max-width:600px; width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:40px 40px 24px; text-align:center; border-bottom:1px solid #eeeeee;">
              <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; font-weight:400; letter-spacing:6px; color:#111111;">BIALY</h1>
            </td>
          </tr>

          <!-- Main heading + truck icon -->
          <tr>
            <td style="padding:36px 40px 8px; text-align:center;">
              <div style="margin-bottom:24px;">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;">
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

          <!-- Reference -->
          ${wompiReference ? `
          <tr>
            <td style="padding:20px 40px;">
              <div style="background:#f9f9f9; border:1px solid #eeeeee; padding:10px 18px; text-align:center;">
                <p style="margin:0 0 2px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Referencia</p>
                <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:16px; color:#111111;">${wompiReference}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Tracking -->
          ${trackingNumber ? `
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#fff8f2; border:1px solid #fde5cc; padding:20px 24px; text-align:center;">
                <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#e07b2a;">Numero de guia</p>
                <p style="margin:0 0 16px; font-family:Georgia,'Times New Roman',serif; font-size:20px; color:#111111; letter-spacing:2px;">${trackingNumber}</p>
                ${trackingUrl ? `
                <a href="${trackingUrl}"
                   style="display:inline-block; background:#000000; color:#ffffff; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:12px 28px;">
                  Rastrear mi envio
                </a>
                ` : ''}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Separator -->
          <tr><td style="padding:0 40px;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- Products -->
          ${items.length > 0 ? `
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Productos enviados</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom:2px solid #111111;">
                    <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:left;">Producto</th>
                    <th style="padding:8px 12px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#666666; text-align:center;">Cant.</th>
                  </tr>
                </thead>
                <tbody>${itemsList}</tbody>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Address -->
          ${addr ? `
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 6px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#666666;">Direccion de entrega</p>
              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#111111; line-height:1.6;">${addr}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Separator -->
          <tr><td style="padding:24px 40px 0;"><div style="height:1px; background:#eeeeee;"></div></td></tr>

          <!-- CTA -->
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

export async function sendOrderShippedEmail(data) {
  console.log('[email:shipped] Iniciando envío — destinatario:', data.customerEmail ?? 'NO EMAIL')
  console.log('[email:shipped] RESEND_API_KEY presente:', !!process.env.RESEND_API_KEY)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email:shipped] ERROR: RESEND_API_KEY no está configurada')
    return
  }
  if (!data.customerEmail) {
    console.error('[email:shipped] ERROR: customerEmail vacío')
    return
  }
  try {
    console.log('[email:shipped] Llamando a resend.emails.send()...')
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from:    'Bialy <no-reply@bialycol.shop>',
      to:      data.customerEmail,
      subject: 'Tu pedido de Bialy esta en camino',
      html:    buildHtml(data),
    })
    console.log('[email:shipped] Respuesta de Resend:', JSON.stringify(result))
    if (result?.error) {
      console.error('[email:shipped] Resend devolvió error:', JSON.stringify(result.error))
    } else {
      console.log('[email:shipped] Email enviado. ID:', result?.id ?? result?.data?.id)
    }
  } catch (err) {
    console.error('[email:shipped] Excepción:', err.message)
    throw err
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxkvwebjctxjixjitpuk.supabase.co'

  // If given order_id, fetch order data from Supabase
  if (body.order_id && serviceKey) {
    const { default: https } = await import('node:https')
    const fetchOrder = (path) => new Promise((resolve, reject) => {
      const u = new URL(`${supabaseUrl}/rest/v1${path}`)
      https.get({
        hostname: u.hostname, path: u.pathname + u.search,
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }, res => {
        let raw = ''
        res.on('data', c => raw += c)
        res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve([]) } })
      }).on('error', reject)
    })

    const [orders, items] = await Promise.all([
      fetchOrder(`/orders?id=eq.${body.order_id}&select=*`),
      fetchOrder(`/order_items?order_id=eq.${body.order_id}&select=*`),
    ])
    const order = Array.isArray(orders) ? orders[0] : null
    if (order) {
      const addr = order.shipping_address ?? {}
      await sendOrderShippedEmail({
        customerName:    order.customer_name,
        customerEmail:   order.customer_email,
        wompiReference:  order.wompi_reference,
        trackingNumber:  order.tracking_number,
        trackingUrl:     order.tracking_url,
        items:           Array.isArray(items) ? items : [],
        shippingAddress: addr,
      })
    }
  } else {
    await sendOrderShippedEmail(body)
  }

  return res.status(200).json({ ok: true })
}
