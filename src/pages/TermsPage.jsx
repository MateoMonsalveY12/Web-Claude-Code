import { useEffect } from 'react'
import { Link } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-brand-black/40 mb-3">{title}</h2>
      <div className="font-sans text-sm text-brand-black/70 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  useEffect(() => { document.title = 'Términos y Condiciones — Bialy Colombia' }, [])

  return (
    <div className="bg-brand-white min-h-screen">
      <section className="bg-brand-gray border-b border-brand-border -mt-24 md:-mt-28">
        <div className="container-brand pt-28 md:pt-36 pb-10 md:pb-14">
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="section-title mb-2">Términos y Condiciones</h1>
          <p className="font-sans text-sm text-brand-black/40">Última actualización: Abril de 2026</p>
        </div>
      </section>

      <div className="container-brand py-12 md:py-16 max-w-2xl">

        <p className="font-sans text-sm text-brand-black/60 leading-relaxed mb-8">
          Al acceder y utilizar el sitio web <strong>bialycol.shop</strong> y realizar compras, aceptas los presentes Términos y Condiciones de uso y venta. Te recomendamos leerlos detenidamente. Si no estás de acuerdo con alguno de estos términos, te pedimos que no realices compras en nuestra tienda.
        </p>

        <Section title="1. Condiciones de uso">
          <p>El acceso y uso del sitio web bialycol.shop es libre y gratuito. El usuario se compromete a:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Proporcionar información veraz y completa al registrarse o realizar un pedido.</li>
            <li>No usar el sitio para actividades ilícitas, fraudulentas o que afecten los derechos de terceros.</li>
            <li>No intentar acceder a sistemas, cuentas o datos que no le correspondan.</li>
            <li>Ser mayor de 18 años para realizar compras, o contar con autorización de un adulto responsable.</li>
          </ul>
          <p>Bialy se reserva el derecho de suspender o cancelar cuentas que incumplan estas condiciones, sin previo aviso.</p>
        </Section>

        <Section title="2. Proceso de compra">
          <p>Para realizar una compra en bialycol.shop, el usuario debe seguir el siguiente proceso:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Seleccionar el producto, talla y color deseados y agregarlos al carrito.</li>
            <li>Proceder al checkout, ingresando datos de contacto y dirección de envío.</li>
            <li>Seleccionar el método de envío y revisar el resumen del pedido.</li>
            <li>Completar el pago a través de Wompi.</li>
            <li>Recibirás un email de confirmación con el resumen y número de referencia del pedido.</li>
          </ol>
          <p>El contrato de compraventa se perfecciona una vez que Wompi confirma el pago exitoso y Bialy envía la confirmación por email.</p>
        </Section>

        <Section title="3. Precios y pagos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Todos los precios están expresados en <strong>pesos colombianos (COP)</strong> e incluyen IVA cuando aplica.</li>
            <li>Los precios pueden cambiar sin previo aviso. El precio vigente en el momento del pago es el que aplica para tu pedido.</li>
            <li>Los pagos se procesan a través de <strong>Wompi</strong>. Aceptamos: tarjeta de crédito/débito (Visa, Mastercard, Amex), PSE, Nequi, Bancolombia y pago en efectivo en puntos autorizados.</li>
            <li>Bialy no almacena información de tarjetas de crédito. Wompi cumple con el estándar PCI-DSS.</li>
            <li>En caso de error en el precio publicado, nos reservamos el derecho de cancelar el pedido y reintegrar el pago.</li>
          </ul>
        </Section>

        <Section title="4. Envíos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Realizamos envíos a <strong>todo el territorio colombiano</strong> a través de <strong>Coordinadora</strong>.</li>
            <li>El tiempo estimado de entrega es de <strong>3 a 5 días hábiles</strong> tras la confirmación del pago, dependiendo de la ciudad de destino.</li>
            <li><strong>Envío gratis</strong> en pedidos mayores a <strong>$200.000 COP</strong>. Para pedidos de menor valor, el costo se calcula en el checkout.</li>
            <li>Una vez despachado el pedido, recibirás un email con el número de guía y enlace de rastreo.</li>
            <li>Los tiempos de entrega son estimados y pueden variar por causas ajenas a Bialy (festivos, condiciones climáticas, huelgas de transporte).</li>
            <li>Bialy no se hace responsable por demoras imputables a la empresa transportadora una vez entregado el paquete.</li>
          </ul>
        </Section>

        <Section title="5. Cambios y devoluciones">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Aceptamos cambios y devoluciones dentro de los <strong>30 días calendario</strong> siguientes a la fecha de entrega.</li>
            <li>Las prendas deben estar <strong>sin usar, sin lavar, con todas las etiquetas originales</strong> y en su empaque original.</li>
            <li>No aceptamos devoluciones de prendas que presenten signos de uso, manchas, olores o daños imputables al comprador.</li>
            <li>Para iniciar un proceso de cambio o devolución, escribe a <strong>hola@bialycol.shop</strong> con el asunto "Devolución – [número de pedido]".</li>
            <li>El reintegro se realiza por el mismo medio de pago original en un plazo de 5 a 10 días hábiles una vez recibida la prenda.</li>
            <li>El costo del envío de devolución es asumido por el cliente, salvo que el producto presente defectos de fabricación.</li>
          </ul>
        </Section>

        <Section title="6. Garantía de productos">
          <p>Todos nuestros productos cuentan con garantía legal de <strong>3 meses</strong> por defectos de fabricación, contados desde la fecha de entrega. La garantía cubre:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Costuras defectuosas o que se deshagan en condiciones normales de uso.</li>
            <li>Cierres o botones defectuosos desde la fabricación.</li>
            <li>Decoloración prematura no causada por mal lavado.</li>
          </ul>
          <p>La garantía no cubre daños por mal uso, lavado inadecuado (ignorar instrucciones de la etiqueta) o deterioro normal por uso.</p>
        </Section>

        <Section title="7. Propiedad intelectual">
          <p>Todo el contenido del sitio bialycol.shop —incluyendo textos, imágenes, logos, diseños y código— es propiedad de Bialy Colombia o de sus proveedores, y está protegido por las leyes de propiedad intelectual colombianas. Queda prohibida su reproducción total o parcial sin autorización escrita.</p>
        </Section>

        <Section title="8. Responsabilidad">
          <p>Bialy Colombia hace todo lo posible para mantener el sitio disponible y sin errores, pero no garantiza el acceso ininterrumpido. No nos hacemos responsables por daños derivados del mal funcionamiento del sitio, errores tipográficos en precios o descripciones, ni por el comportamiento de terceros proveedores (plataformas de pago, transportadoras).</p>
        </Section>

        <Section title="9. Modificaciones">
          <p>Bialy se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigencia con su publicación en el sitio. El uso continuado del sitio tras la publicación de cambios implica la aceptación de los nuevos términos.</p>
        </Section>

        <Section title="10. Ley aplicable y resolución de disputas">
          <p>Estos términos se rigen por las leyes de la <strong>República de Colombia</strong>. Cualquier controversia será resuelta preferiblemente mediante conciliación directa. De no llegarse a acuerdo, las partes se someten a los jueces y tribunales competentes de Colombia.</p>
          <p>Para reclamaciones y quejas: <a href="mailto:hola@bialycol.shop" className="underline">hola@bialycol.shop</a></p>
        </Section>

        <div className="mt-10 border-t border-brand-border pt-8 flex flex-wrap gap-4">
          <Link to="/privacidad" className="font-sans text-xs text-brand-black/50 hover:text-brand-black underline transition-colors">
            Política de privacidad
          </Link>
          <Link to="/contacto" className="font-sans text-xs text-brand-black/50 hover:text-brand-black underline transition-colors">
            Contáctanos
          </Link>
        </div>
      </div>
    </div>
  )
}
