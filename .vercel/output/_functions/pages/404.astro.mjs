/* empty css                                     */
import { c as createComponent, a as createAstro, m as maybeRenderHead, b as addAttribute, s as spreadAttributes, r as renderSlot, d as renderTemplate, f as renderComponent } from '../chunks/astro/server_DTs-x8oe.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_8Z7cByMN.mjs';
import 'clsx';
/* empty css                               */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$BrandButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BrandButton;
  const {
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    fullWidth = true,
    class: className = "",
    ...props
  } = Astro2.props;
  const getButtonClass = () => {
    let baseClass = "";
    switch (variant) {
      case "secondary":
        baseClass = "btn-brand-secondary";
        break;
      case "ghost":
        baseClass = "btn-brand-ghost";
        break;
      default:
        baseClass = "btn-brand";
    }
    const sizeClass = size === "sm" ? "py-2 px-3 text-xs" : size === "lg" ? "py-4 px-6 text-base" : "";
    const widthClass = !fullWidth ? "w-auto" : "";
    return `${baseClass} ${sizeClass} ${widthClass} ${className}`.trim();
  };
  return renderTemplate`${maybeRenderHead()}<button${addAttribute(getButtonClass(), "class")}${addAttribute(type, "type")}${addAttribute(disabled || loading, "disabled")}${spreadAttributes(props)}> ${loading && renderTemplate`<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>`} ${renderSlot($$result, $$slots["default"])} </button>`;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/base/BrandButton.astro", void 0);

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "404 - P\xE1gina no encontrada | Aliento.pay", "description": "La p\xE1gina que buscas no existe", "data-astro-cid-zetdm5md": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex items-center justify-center min-h-screen px-4" data-astro-cid-zetdm5md> <div class="text-center max-w-2xl mx-auto" data-astro-cid-zetdm5md> <!-- 404 Large Number --> <div class="mb-8" data-astro-cid-zetdm5md> <h1 class="text-9xl font-bold text-brand-purple opacity-20" data-astro-cid-zetdm5md>404</h1> </div> <!-- Error Message --> <div class="space-y-4 mb-8" data-astro-cid-zetdm5md> <h2 class="text-3xl md:text-4xl font-bold text-white" data-astro-cid-zetdm5md>
Página no encontrada
</h2> <p class="text-lg text-gray-400" data-astro-cid-zetdm5md>
Lo sentimos, la página que estás buscando no existe o ha sido movida.
</p> </div> <!-- Action Buttons --> <div class="flex flex-col sm:flex-row gap-4 justify-center items-center" data-astro-cid-zetdm5md> <a href="/dashboard" data-astro-cid-zetdm5md> ${renderComponent($$result2, "BrandButton", $$BrandButton, { "variant": "primary", "size": "lg", "data-astro-cid-zetdm5md": true }, { "default": ($$result3) => renderTemplate`
Ir al Dashboard
` })} </a> <a href="/" data-astro-cid-zetdm5md> ${renderComponent($$result2, "BrandButton", $$BrandButton, { "variant": "secondary", "size": "lg", "data-astro-cid-zetdm5md": true }, { "default": ($$result3) => renderTemplate`
Volver al Inicio
` })} </a> </div> <!-- Additional Help --> <div class="mt-12 p-6 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10" data-astro-cid-zetdm5md> <h3 class="text-lg font-semibold text-white mb-2" data-astro-cid-zetdm5md>
¿Necesitas ayuda?
</h3> <p class="text-gray-400" data-astro-cid-zetdm5md>
Si crees que esto es un error, por favor contacta al equipo de soporte o
<a href="https://github.com/eddiespino/aliento-pay" class="text-brand-purple hover:text-brand-purple-light transition-colors underline" data-astro-cid-zetdm5md>
reporta el problema en GitHub
</a>.
</p> </div> </div> </div> ` })} `;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/pages/404.astro", void 0);

const $$file = "/Users/eddiespino/aliento-pay-eddiespino/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
