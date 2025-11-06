import { c as createComponent, a as createAstro, m as maybeRenderHead, b as addAttribute, s as spreadAttributes, r as renderSlot, d as renderTemplate } from './astro/server_DTs-x8oe.mjs';
import 'clsx';

const $$Astro = createAstro();
const $$BrandCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BrandCard;
  const {
    variant = "default",
    class: className = "",
    withGlow = true,
    ...props
  } = Astro2.props;
  const getCardClass = () => {
    const baseClass = variant === "simple" ? "card-brand-simple" : variant === "glass" ? "card-brand-glass" : "card-brand";
    return `${baseClass} ${!withGlow && variant === "default" ? "[&::before]:hidden" : ""} ${className}`;
  };
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(getCardClass(), "class")}${spreadAttributes(props)}> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/base/BrandCard.astro", void 0);

export { $$BrandCard as $ };
