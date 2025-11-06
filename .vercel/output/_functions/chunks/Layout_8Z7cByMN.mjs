import { c as createComponent, a as createAstro, b as addAttribute, e as renderScript, d as renderTemplate, f as renderComponent, g as renderHead, r as renderSlot } from './astro/server_DTs-x8oe.mjs';
import 'kleur/colors';
/* empty css                             */
import 'clsx';

const $$Astro$1 = createAstro();
const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/eddiespino/aliento-pay-eddiespino/node_modules/astro/components/ClientRouter.astro", void 0);

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "Aliento.pay", description = "Hive Delegation Tracker" } = Astro2.props;
  return renderTemplate`<html lang="es" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title><meta name="description"${addAttribute(description, "content")}>${renderComponent($$result, "ViewTransitions", $$ClientRouter, { "data-astro-cid-sckkx6r4": true })}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">${renderHead()}</head> <body class="font-sans text-white scrollbar-brand" data-astro-cid-sckkx6r4> <!-- Fixed background that covers full viewport always --> <div class="fixed inset-0 bg-brand-bg" data-astro-cid-sckkx6r4> <!-- Background pattern overlay --> <div class="absolute inset-0 opacity-5 bg-pattern-dots" data-astro-cid-sckkx6r4></div> </div> <!-- Main content with proper z-index --> <div class="relative z-10 min-h-screen" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </div> ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")} </body></html>`;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
