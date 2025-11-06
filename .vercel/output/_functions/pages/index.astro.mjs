/* empty css                                     */
import { c as createComponent, m as maybeRenderHead, e as renderScript, d as renderTemplate, a as createAstro, f as renderComponent } from '../chunks/astro/server_DTs-x8oe.mjs';
import 'kleur/colors';
import 'clsx';
import { $ as $$Layout } from '../chunks/Layout_8Z7cByMN.mjs';
import { g as getAuthenticatedUser } from '../chunks/middleware_BdI7ZZ7X.mjs';
export { renderers } from '../renderers.mjs';

const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`<!-- Main container with full screen centering -->${maybeRenderHead()}<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"> <!-- Background pattern --> <div class="absolute inset-0 opacity-5"> <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div> </div> <!-- Login card --> <div class="relative z-10 w-full max-w-md"> <!-- Animated background glow --> <div class="absolute -inset-1 bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-75 animate-pulse"></div> <!-- Main card --> <div class="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 space-y-6"> <!-- Header section --> <div class="text-center space-y-4"> <!-- Logo/Icon --> <div class="mx-auto w-16 h-16 bg-gradient-to-br from-sky-400 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg"> <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"></path> </svg> </div> <!-- Title and subtitle --> <div class="space-y-2"> <h1 class="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
Aliento.pay
</h1> <p class="text-slate-400 text-sm font-medium">
Conecta con tu wallet Hive Keychain
</p> </div> </div> <!-- Login form --> <form id="login-form" class="space-y-6"> <!-- Username input --> <div class="space-y-2"> <label for="username" class="block text-sm font-medium text-slate-300">
Usuario de Hive
</label> <div class="relative"> <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <svg class="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path> </svg> </div> <input id="username" type="text" placeholder="tu-usuario-hive" class="block w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all duration-200 backdrop-blur-sm" required> </div> </div> <!-- Login button --> <button id="login-button" type="submit" class="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"> <span id="login-button-text" class="flex items-center gap-2"> <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"> <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"></path> </svg>
Conectar con Hive Keychain
</span> <div id="login-spinner" class="hidden flex items-center justify-center"> <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <span id="loading-text" class="text-sm">Conectando...</span> </div> </button> </form> <!-- Loading states --> <div id="loading-states" class="hidden space-y-4"> <div class="space-y-3"> <!-- Step 1: Keychain --> <div id="step-keychain" class="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 opacity-50 transition-all duration-300"> <div class="loading-step-icon"> <div class="h-6 w-6 rounded-full bg-slate-600"></div> </div> <div class="flex-1"> <p class="text-sm text-slate-200 font-medium">Verificando Hive Keychain</p> <p class="text-xs text-slate-400">Comprobando la extensión del navegador</p> </div> </div> <!-- Step 2: Account --> <div id="step-account" class="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 opacity-50 transition-all duration-300"> <div class="loading-step-icon"> <div class="h-6 w-6 rounded-full bg-slate-600"></div> </div> <div class="flex-1"> <p class="text-sm text-slate-200 font-medium">Verificando cuenta en Hive</p> <p class="text-xs text-slate-400">Consultando la blockchain</p> </div> </div> <!-- Step 3: Signature --> <div id="step-signature" class="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 opacity-50 transition-all duration-300"> <div class="loading-step-icon"> <div class="h-6 w-6 rounded-full bg-slate-600"></div> </div> <div class="flex-1"> <p class="text-sm text-slate-200 font-medium">Firmando mensaje</p> <p class="text-xs text-slate-400">Confirma en la ventana de Keychain</p> </div> </div> <!-- Step 4: Session --> <div id="step-session" class="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 opacity-50 transition-all duration-300"> <div class="loading-step-icon"> <div class="h-6 w-6 rounded-full bg-slate-600"></div> </div> <div class="flex-1"> <p class="text-sm text-slate-200 font-medium">Creando sesión</p> <p class="text-xs text-slate-400">Configurando tu acceso seguro</p> </div> </div> </div> </div> <!-- Error message --> <div id="login-error" class="hidden"> <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm"> <div class="flex items-center gap-3"> <svg class="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path> </svg> <p class="text-sm text-red-300 font-medium" id="error-text"></p> </div> </div> </div> <!-- Info section --> <div class="pt-4 border-t border-slate-700/50"> <div class="text-center space-y-3"> <p class="text-xs text-slate-400">
¿No tienes Hive Keychain?
</p> <a href="https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 transition-colors duration-200"> <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path> </svg>
Descargar extensión
</a> </div> </div> </div> </div> </div> ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/Login.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/Login.astro", void 0);

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const user = getAuthenticatedUser(Astro2);
  if (user) {
    return Astro2.redirect("/dashboard");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Login", $$Login, {})} ` })}`;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/pages/index.astro", void 0);

const $$file = "/Users/eddiespino/aliento-pay-eddiespino/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
