# 🎨 Aliento.pay Design System

Sistema de diseño unificado basado en Tailwind CSS que replica el estilo del login exitoso en toda la aplicación.

## 🏗️ Arquitectura

### Design Tokens
- **Colores**: `brand-slate-*`, `brand-sky-*`, `brand-emerald-*`
- **Gradientes**: `bg-brand-gradient`, `bg-brand-bg`
- **Sombras**: `shadow-brand-*`, `shadow-glow-*`
- **Animaciones**: `animate-glow`, `animate-float`

### Componentes Base

#### 📦 BrandContainer
```astro
<!-- Layout principal de página -->
<BrandContainer variant="page" class="py-8">
  <slot />
</BrandContainer>

<!-- Centrado completo (como login) -->
<BrandContainer variant="center">
  <slot />
</BrandContainer>

<!-- Full width con patrón de fondo -->
<BrandContainer variant="full" withPattern={true}>
  <slot />
</BrandContainer>
```

#### 🃏 BrandCard
```astro
<!-- Card principal con glow -->
<BrandCard class="p-6">
  <slot />
</BrandCard>

<!-- Card simple sin efectos -->
<BrandCard variant="simple" class="p-4">
  <slot />
</BrandCard>

<!-- Card glassmorphism -->
<BrandCard variant="glass" class="p-6">
  <slot />
</BrandCard>

<!-- Sin glow animation -->
<BrandCard withGlow={false}>
  <slot />
</BrandCard>
```

#### 🔘 BrandButton
```astro
<!-- Botón primary (gradiente) -->
<BrandButton>Confirmar</BrandButton>

<!-- Botón secondary -->
<BrandButton variant="secondary">Cancelar</BrandButton>

<!-- Botón ghost -->
<BrandButton variant="ghost">Ver más</BrandButton>

<!-- Con loading -->
<BrandButton loading={true}>Guardando...</BrandButton>

<!-- Tamaños -->
<BrandButton size="sm">Pequeño</BrandButton>
<BrandButton size="lg">Grande</BrandButton>
```

#### 📝 BrandInput
```astro
<!-- Input básico -->
<BrandInput 
  type="text" 
  placeholder="Ingresa tu texto"
  label="Etiqueta" 
/>

<!-- Con icono -->
<BrandInput 
  icon="user" 
  placeholder="Usuario"
  label="Usuario de Hive" 
/>

<!-- Con error -->
<BrandInput 
  label="Email"
  error="Email inválido"
  value="email-invalido" 
/>

<!-- Required -->
<BrandInput 
  label="Campo obligatorio"
  required={true} 
/>
```

#### 📊 BrandGrid
```astro
<!-- Grid responsive automático -->
<BrandGrid>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</BrandGrid>

<!-- Grid con columnas específicas -->
<BrandGrid variant="fixed" cols={2}>
  <div>Item 1</div>
  <div>Item 2</div>
</BrandGrid>

<!-- Grid auto-fit -->
<BrandGrid variant="auto" gap="lg">
  <div>Item 1</div>
  <div>Item 2</div>
</BrandGrid>
```

#### 🎯 BrandHeader
```astro
<!-- Header básico -->
<BrandHeader 
  title="Título de página"
  subtitle="Descripción opcional" 
/>

<!-- Con logo -->
<BrandHeader 
  title="Aliento.pay"
  subtitle="Sistema de pagos Hive"
  showLogo={true}
  logoIcon="shield" 
/>
```

#### 🚨 BrandAlert
```astro
<!-- Alert de error -->
<BrandAlert variant="error" title="Error">
  Ocurrió un problema al procesar la solicitud.
</BrandAlert>

<!-- Alert de éxito -->
<BrandAlert variant="success" dismissible={true}>
  Datos guardados correctamente.
</BrandAlert>

<!-- Alert de información -->
<BrandAlert variant="info">
  Esta acción no se puede deshacer.
</BrandAlert>
```

## 🎨 Utility Classes

### Efectos Visuales
```html
<!-- Glassmorphism -->
<div class="glass-brand p-4">Contenido</div>

<!-- Hover effects -->
<div class="hover-lift">Se eleva al hover</div>
<div class="hover-glow">Brilla al hover</div>
<div class="hover-float">Flota al hover</div>

<!-- Text gradients -->
<h1 class="text-brand-gradient">Texto con gradiente</h1>
<h2 class="text-brand-gradient-primary">Gradiente primary</h2>
```

### Animaciones
```html
<!-- Animaciones de entrada -->
<div class="animate-fade-in">Fade in</div>
<div class="animate-slide-up">Slide up</div>
<div class="animate-scale-in">Scale in</div>

<!-- Animaciones continuas -->
<div class="animate-glow">Resplandor</div>
<div class="animate-float">Flotando</div>
<div class="animate-pulse-slow">Pulse lento</div>
```

### Patrones de Fondo
```html
<!-- Patrón de puntos -->
<div class="bg-pattern-dots">Contenido</div>

<!-- Patrón de grid -->
<div class="bg-pattern-grid">Contenido</div>
```

## 🔄 Migración de Componentes Existentes

### Ejemplo: Dashboard
```astro
<!-- ANTES -->
<div class="flex flex-col w-full max-w-6xl mx-auto px-4">
  <div class="bg-[#18181b] rounded-2xl border border-[#232329] shadow-xl p-6">
    <Filters />
  </div>
</div>

<!-- DESPUÉS -->
<BrandContainer variant="page">
  <BrandCard class="p-6">
    <Filters />
  </BrandCard>
</BrandContainer>
```

### Ejemplo: Botones
```astro
<!-- ANTES -->
<button class="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl">
  Confirmar
</button>

<!-- DESPUÉS -->
<BrandButton>Confirmar</BrandButton>
```

### Ejemplo: Inputs
```astro
<!-- ANTES -->
<input class="rounded-xl border border-[#232329] bg-[#232329] text-white px-4 py-3" />

<!-- DESPUÉS -->
<BrandInput placeholder="Ingresa tu texto" />
```

## 🎯 Mejores Prácticas

1. **Usar componentes base** siempre que sea posible
2. **No modificar IDs/clases existentes** - usar wrappers
3. **Aprovechar las utility classes** para efectos rápidos
4. **Mantener consistencia** en espaciado y colores
5. **Usar animaciones con moderación** para no sobrecargar

## 🔧 Personalización

### Colores
```javascript
// tailwind.config.js
colors: {
  brand: {
    // Personalizar colores aquí
  }
}
```

### Componentes
```css
/* global.css */
@layer components {
  .mi-componente-custom {
    @apply card-brand p-4 hover-lift;
  }
}
```

## 📱 Responsive

Todos los componentes son **mobile-first** y completamente **responsivos**:

- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **Grid automático**: Se adapta según el espacio disponible
- **Espaciado responsivo**: Padding/margin se ajusta automáticamente
- **Tipografía fluida**: Tamaños de fuente escalables

---

✨ **El sistema está diseño para ser extensible y mantenible, permitiendo cambios centralizados que se propagan a toda la aplicación.**