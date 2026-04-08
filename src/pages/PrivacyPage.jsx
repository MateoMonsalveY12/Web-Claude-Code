import { useEffect } from 'react'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-brand-black/40 mb-3">{title}</h2>
      <div className="font-sans text-sm text-brand-black/70 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  useEffect(() => { document.title = 'Política de Privacidad — Bialy Colombia' }, [])

  return (
    <div className="bg-brand-white min-h-screen">
      <section className="bg-brand-gray border-b border-brand-border -mt-24 md:-mt-28">
        <div className="container-brand pt-28 md:pt-36 pb-10 md:pb-14">
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="section-title mb-2">Política de Privacidad</h1>
          <p className="font-sans text-sm text-brand-black/40">Última actualización: Abril de 2026</p>
        </div>
      </section>

      <div className="container-brand py-12 md:py-16 max-w-2xl">

        <p className="font-sans text-sm text-brand-black/60 leading-relaxed mb-8">
          Bialy Colombia (en adelante, <strong>"Bialy"</strong> o <strong>"nosotros"</strong>) es responsable del tratamiento de los datos personales que recopilamos a través de nuestro sitio web <strong>bialycol.shop</strong>. Esta política describe cómo recopilamos, usamos y protegemos tu información, de conformidad con la <strong>Ley 1581 de 2012</strong> (Ley de Protección de Datos Personales) y el Decreto 1074 de 2015 de la República de Colombia.
        </p>

        <Section title="1. Datos que recopilamos">
          <p>Recopilamos los siguientes datos personales cuando realizas una compra o interactúas con nuestro sitio:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Datos de identificación:</strong> nombre completo, número de documento (cuando aplica).</li>
            <li><strong>Datos de contacto:</strong> dirección de correo electrónico, número de teléfono.</li>
            <li><strong>Datos de envío:</strong> dirección postal, ciudad, departamento.</li>
            <li><strong>Datos de pago:</strong> procesados íntegramente por Wompi — Bialy no almacena datos de tarjetas ni credenciales bancarias.</li>
            <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas (datos anónimos para análisis).</li>
          </ul>
        </Section>

        <Section title="2. Finalidad del tratamiento">
          <p>Tus datos son usados exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Procesar y gestionar tus pedidos y pagos.</li>
            <li>Coordinar el envío y entrega de tus compras.</li>
            <li>Enviar comunicaciones transaccionales: confirmación de pago, estado del pedido, número de guía.</li>
            <li>Responder solicitudes de soporte al cliente.</li>
            <li>Enviarte comunicaciones comerciales (solo si aceptas suscribirte a nuestro newsletter).</li>
            <li>Cumplir obligaciones legales y tributarias.</li>
          </ul>
        </Section>

        <Section title="3. Terceros con acceso a tus datos">
          <p>Compartimos información estrictamente necesaria con los siguientes terceros para prestar nuestros servicios:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Wompi (Bancolombia):</strong> pasarela de pagos. Gestiona el procesamiento de transacciones bajo sus propias políticas de seguridad PCI-DSS.</li>
            <li><strong>Coordinadora:</strong> empresa de mensajería para el despacho de pedidos.</li>
            <li><strong>Resend:</strong> plataforma de envío de emails transaccionales. Solo recibe nombre, email y contenido del mensaje.</li>
            <li><strong>Supabase:</strong> base de datos en la nube donde almacenamos pedidos, información de cuenta y reseñas. Los datos están cifrados en reposo.</li>
            <li><strong>Vercel:</strong> proveedor de alojamiento web. Puede procesar IPs y datos de solicitud HTTP.</li>
          </ul>
          <p>No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines comerciales.</p>
        </Section>

        <Section title="4. Derechos del titular">
          <p>De conformidad con la Ley 1581 de 2012, tienes los siguientes derechos:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Conocer</strong> los datos personales que tenemos sobre ti.</li>
            <li><strong>Actualizar y corregir</strong> información inexacta o incompleta.</li>
            <li><strong>Solicitar la supresión</strong> de tus datos cuando no sean necesarios para la finalidad del tratamiento.</li>
            <li><strong>Revocar la autorización</strong> para el tratamiento de datos.</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
          </ul>
          <p>Para ejercer estos derechos, escríbenos a <strong>hola@bialycol.shop</strong> indicando tu nombre, documento y la solicitud específica. Responderemos en un plazo máximo de 15 días hábiles.</p>
        </Section>

        <Section title="5. Seguridad de los datos">
          <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Conexión cifrada mediante SSL/TLS en todas las páginas del sitio.</li>
            <li>Contraseñas de acceso hasheadas. Bialy nunca almacena contraseñas en texto plano.</li>
            <li>Datos de pago gestionados exclusivamente por Wompi bajo estándar PCI-DSS.</li>
            <li>Acceso restringido a datos de clientes por parte del equipo interno.</li>
          </ul>
        </Section>

        <Section title="6. Cookies y tecnologías de rastreo">
          <p>Nuestro sitio utiliza cookies técnicas estrictamente necesarias para el funcionamiento del carrito de compras y la sesión de usuario. No utilizamos cookies de rastreo publicitario de terceros. Puedes configurar tu navegador para bloquear cookies, aunque esto puede afectar algunas funcionalidades del sitio.</p>
        </Section>

        <Section title="7. Vigencia de la política">
          <p>Esta política entra en vigencia a partir del <strong>1 de abril de 2026</strong>. Bialy se reserva el derecho de actualizarla periódicamente. Los cambios sustanciales serán notificados por email a los usuarios registrados.</p>
        </Section>

        <Section title="8. Contacto y responsable del tratamiento">
          <p>
            <strong>Bialy Colombia SAS</strong><br />
            NIT: (en trámite)<br />
            República de Colombia<br />
            Email de datos personales: <a href="mailto:hola@bialycol.shop" className="underline">hola@bialycol.shop</a>
          </p>
        </Section>
      </div>
    </div>
  )
}
