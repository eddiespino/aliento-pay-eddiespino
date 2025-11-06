import { c as createComponent, a as createAstro, m as maybeRenderHead, b as addAttribute, s as spreadAttributes, r as renderSlot, e as renderScript, d as renderTemplate, f as renderComponent } from './astro/server_DTs-x8oe.mjs';
import 'kleur/colors';
import 'clsx';

function getHiveAvatarUrl(userName) {
  if (userName) {
    const normalized = userName.replace("@", "").trim().toLowerCase();
    return `https://images.hive.blog/u/${normalized}/avatar`;
  } else {
    return "";
  }
}

const $$Astro$1 = createAstro();
const $$BrandNav = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$BrandNav;
  const { user, showLogo = true, fixed = true, class: className = "", ...props } = Astro2.props;
  const navClass = `${fixed ? "nav-brand" : "backdrop-blur-xl bg-brand-slate-900/20"} ${className}`;
  return renderTemplate`${maybeRenderHead()}<nav${addAttribute(navClass, "class")}${spreadAttributes(props)}> <div class="nav-content"> <!-- Logo --> ${showLogo && renderTemplate`<div class="nav-logo"> <div class="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center"></div> <span>Aliento.pay</span> </div>`} <!-- Navigation Links --> <div class="nav-links"> ${renderSlot($$result, $$slots["links"], renderTemplate` <a href="/dashboard" class="nav-link">Dashboard</a> <a href="/calculate" class="nav-link">Calculate</a> <a href="/payments" class="nav-link">Payments</a> <!-- 
      Añadir el usrer
        --> `)} </div> <!-- User Section --> ${user && renderTemplate`<div class="nav-user"> <div class="flex items-center gap-2 mr-4"> <img id="user-avatar-img"${addAttribute(getHiveAvatarUrl(user), "src")} alt="User Avatar" class="w-8 h-8 rounded-full"> <span id="user-greeting" class="hidden md:inline text-brand-slate-300 text-sm">
@${user} </span> </div> <button id="logout-btn" class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200">
Logout
</button> </div>`} <!-- Mobile Menu Button --> <button id="mobile-menu-btn" class="md:hidden text-brand-slate-400 hover:text-white transition-colors duration-200 p-2" aria-label="Menu"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg> </button> </div> <!-- Mobile Menu --> <div id="mobile-menu" class="md:hidden border-t border-brand-slate-700/30 hidden"> <div class="px-4 py-4 space-y-2"> <a href="/dashboard" class="block py-2 text-brand-slate-300 hover:text-white transition-colors duration-200">
Dashboard
</a> <a href="/calculate" class="block py-2 text-brand-slate-300 hover:text-white transition-colors duration-200">
Calculate
</a> <a href="/payments" class="block py-2 text-brand-slate-300 hover:text-white transition-colors duration-200">
Payments
</a> </div> </div> </nav> ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/base/BrandNav.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/base/BrandNav.astro", void 0);

const $$Astro = createAstro();
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Header;
  const { username, showStats = true } = Astro2.props;
  return renderTemplate`<!-- Brand Navigation with transparent background -->${renderComponent($$result, "BrandNav", $$BrandNav, { "user": username })} <!-- Spacer para compensar el nav fijo --> ${maybeRenderHead()}<div class="h-14"></div> ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/header.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/header.astro", void 0);

export { $$Header as $ };
