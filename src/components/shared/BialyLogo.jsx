/**
 * BialyLogo — SVG wordmark para "Bialy Colombia"
 *
 * Usa fill="currentColor" — hereda el color del padre.
 * Funciona sobre fondos claros y oscuros sin cambios.
 *
 * Props:
 *   className  — clases Tailwind para tamaño (ej. "h-8 w-auto")
 *   width      — ancho explícito en px (opcional)
 */
export default function BialyLogo({ className = '', width, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 118 38"
      fill="currentColor"
      aria-label="Bialy Colombia"
      role="img"
      className={className}
      style={width ? { width } : undefined}
      {...props}
    >
      {/* "BIALY" — serif display, amplio tracking */}
      <text
        x="0"
        y="24"
        fontFamily="'Cormorant Garamond', Georgia, 'Times New Roman', serif"
        fontSize="24"
        fontWeight="300"
        letterSpacing="7"
        fillOpacity="1"
      >
        BIALY
      </text>
      {/* "COLOMBIA" — sans-serif, pequeño, muy trackeado */}
      <text
        x="2"
        y="35"
        fontFamily="'Jost', 'Helvetica Neue', Arial, sans-serif"
        fontSize="6.2"
        fontWeight="600"
        letterSpacing="4.5"
        fillOpacity="0.55"
      >
        COLOMBIA
      </text>
    </svg>
  )
}
