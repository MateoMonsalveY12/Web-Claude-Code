# Template System — Estilo Adrissa

Sistema de 9 secciones HTML independientes que puedes copiar y pegar en cualquier landing page o sitio web. Cada archivo es autocontenido y está documentado.

---

## Inicio rápido

Copia este bloque `<head>` en cualquier página HTML nueva:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu Página</title>

  <!-- 1. CSS compilado (genera con: npm run build) -->
  <link rel="stylesheet" href="path/to/dist/assets/index-HASH.css" />

  <!-- 2. AOS (animaciones de scroll) -->
  <link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css" />
</head>
<body>

  <!-- Pega aquí los snippets de templates/ -->

  <!-- 3. AOS init -->
  <script src="https://unpkg.com/aos@2.3.4/dist/aos.umd.js"></script>
  <script>
    AOS.init({ duration: 700, once: true, offset: 60 })
  </script>
</body>
</html>
```

> **Nota:** Para las animaciones de barra de anuncios y nav scroll-aware, también necesitas incluir el JS compilado: `<script type="module" src="path/to/dist/assets/index-HASH.js"></script>`

---

## Templates disponibles

| Archivo | Sección | Imágenes requeridas | JS |
|---|---|---|---|
| `01-announcement-bar.html` | Barra superior rotativa | Ninguna | `announcement-bar.js` |
| `02-nav.html` | Navegación sticky | Ninguna | `nav.js` |
| `03-hero.html` | Hero full-viewport | `hero-main.jpg` | AOS |
| `04-featured-collections.html` | Grid 3 colecciones | `collection-1..3.jpg` | AOS |
| `05-promo-editorial.html` | Split imagen + texto | `promo-editorial.jpg` | AOS |
| `06-product-grid.html` | Grid 4 productos | `product-1..4.jpg` | AOS |
| `07-testimonials.html` | 3 reseñas | Ninguna | AOS |
| `08-instagram-grid.html` | Grid 6 fotos | `instagram-1..6.jpg` | AOS |
| `09-footer.html` | Footer completo | Ninguna | Ninguno |

---

## Tokens de diseño

Estos son los valores de diseño del sistema. Están definidos en `tailwind.config.js`.

### Colores

| Clase Tailwind | Hex | Uso |
|---|---|---|
| `bg-brand-black` / `text-brand-black` | `#000000` | Texto principal, botones, nav |
| `bg-brand-white` / `text-brand-white` | `#FFFFFF` | Fondos, texto sobre oscuro |
| `bg-brand-gray` | `#F3F3F3` | Secciones alternas |
| `bg-brand-red` | `#E32C2B` | Badges de oferta |
| `border-brand-border` | `#E0E0E0` | Bordes de cards |

### Tipografía

| Clase | Fuente | Uso |
|---|---|---|
| `font-sans` | Jost | Todo el cuerpo, nav, botones |
| `font-display` | Playfair Display | Títulos, hero, logo |
| `tracking-heading` | 0.02em | Todos los títulos |
| `tracking-button` | 0.15em | Botones (siempre uppercase) |

### Componentes reutilizables

```html
<!-- Botones -->
<a href="#" class="btn-primary">Texto del botón</a>
<a href="#" class="btn-ghost">Texto del botón</a>
<a href="#" class="btn-hero">Sobre fondo oscuro</a>

<!-- Badges -->
<span class="badge-promo">−20%</span>
<span class="badge-new">Nuevo</span>

<!-- Título de sección -->
<h2 class="section-title">Título</h2>

<!-- Label eyebrow (encima del título) -->
<p class="eyebrow">Categoría</p>

<!-- Contenedor con padding responsivo -->
<div class="container-brand"> ... </div>

<!-- Input claro (sobre fondo blanco) -->
<input class="input-brand" type="email" placeholder="tu@email.com" />

<!-- Input oscuro (sobre fondo negro) -->
<input class="input-brand-dark" type="email" placeholder="tu@email.com" />
```

---

## Breakpoints

| Nombre | Valor | Cambios de layout |
|---|---|---|
| `sm` | 700px | Nav desktop visible, grids 3 col |
| `md` | 1000px | Sección promo split, grid 4 col |
| `lg` | 1150px | Padding container aumenta a 3rem |
| `xl` | 1400px | Tipografías máximas |

---

## Animaciones AOS

Todos los elementos animables usan atributos `data-aos`. Para stagger en grids:

```html
<article data-aos="fade-up" data-aos-delay="0">...</article>
<article data-aos="fade-up" data-aos-delay="100">...</article>
<article data-aos="fade-up" data-aos-delay="200">...</article>
```

Patrones de animación por tipo de elemento:

| Elemento | `data-aos` | Delay |
|---|---|---|
| Títulos | `fade-up` | 0 |
| Cards (grid) | `fade-up` | 0, 100, 200, 300 |
| Imagen izquierda | `fade-right` | 0 |
| Texto derecha | `fade-left` | 150 |

---

## Personalización

### Cambiar colores de marca
En `tailwind.config.js`, edita los valores en `theme.extend.colors.brand`:
```js
brand: {
  black: '#1A1A2E',   // ← cambia a tu color principal
  red:   '#FF6B6B',   // ← cambia a tu acento
}
```

### Cambiar tipografía
En `tailwind.config.js`:
```js
fontFamily: {
  sans:    ['Tu Fuente', 'system-ui', 'sans-serif'],
  display: ['"Tu Fuente Display"', 'serif'],
},
```
Y actualiza el `@import` de Google Fonts en `src/css/main.css`.

### Agregar nueva sección
1. Crea `templates/10-mi-seccion.html`
2. Añade el HTML usando las clases de la sección anterior
3. Pega en `src/index.html` donde lo necesites
4. Corre `npm run build` para regenerar el CSS

---

## Comandos

```bash
npm run dev      # Dev server en localhost:3000 (hot reload)
npm run build    # Build de producción en dist/
npm run preview  # Preview del build en localhost:4173
```
