/* empty css                                     */
import { c as createComponent, a as createAstro, m as maybeRenderHead, b as addAttribute, e as renderScript, d as renderTemplate, f as renderComponent } from '../chunks/astro/server_DTs-x8oe.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_8Z7cByMN.mjs';
import 'clsx';
import { f as formatHP, d as formatHive, e as formatPercentage, h as decodeFilters, c as calculateCurationDistribution, a as getPaymentConfigForAccount, b as calculateDynamicPayments } from '../chunks/payment-calculator_Bl_B6joU.mjs';
/* empty css                                     */
import { $ as $$BrandCard } from '../chunks/BrandCard_IAK74zIN.mjs';
import { g as getAuthenticatedUser } from '../chunks/middleware_BdI7ZZ7X.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro$2 = createAstro();
const $$CurationCalculateTable = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$CurationCalculateTable;
  const { delegators, totalHP, totalHiveToDistribute, isLoading = false } = Astro2.props;
  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  return renderTemplate`${maybeRenderHead()}<div id="curation-table-container" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"${addAttribute(totalHiveToDistribute, "data-total-hive-to-distribute")} data-astro-cid-m6lzxnbi> <!-- Header de la tabla --> <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700" data-astro-cid-m6lzxnbi> <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-astro-cid-m6lzxnbi> <div data-astro-cid-m6lzxnbi> <h2 class="text-xl font-semibold text-gray-900 dark:text-white" data-astro-cid-m6lzxnbi>
Distribución de Curación
</h2> <p class="text-sm text-gray-600 dark:text-gray-400 mt-1" data-astro-cid-m6lzxnbi> ${delegators.length} delegadores válidos
</p> </div> <div class="flex flex-col sm:flex-row gap-4 text-sm" data-astro-cid-m6lzxnbi> <div class="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg" data-astro-cid-m6lzxnbi> <span class="text-blue-600 dark:text-blue-400 font-medium" data-astro-cid-m6lzxnbi>
Total HP: ${formatHP(totalHP)} </span> </div> <div class="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg" data-astro-cid-m6lzxnbi> <span id="total-hive-display" class="text-green-600 dark:text-green-400 font-medium" data-astro-cid-m6lzxnbi>
Total Hive: ${formatHive(totalHiveToDistribute)} </span> </div> </div> </div> </div> ${isLoading ? renderTemplate`<!-- Estado de carga -->
    <div class="px-6 py-12 text-center" data-astro-cid-m6lzxnbi> <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4" data-astro-cid-m6lzxnbi> <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" data-astro-cid-m6lzxnbi> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-astro-cid-m6lzxnbi></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-astro-cid-m6lzxnbi></path> </svg> </div> <p class="text-gray-600 dark:text-gray-400" data-astro-cid-m6lzxnbi>Calculando distribución...</p> </div>` : delegators.length === 0 ? renderTemplate`<!-- Estado vacío -->
    <div class="px-6 py-12 text-center" data-astro-cid-m6lzxnbi> <div class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4" data-astro-cid-m6lzxnbi> <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-m6lzxnbi> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" data-astro-cid-m6lzxnbi></path> </svg> </div> <p class="text-gray-600 dark:text-gray-400" data-astro-cid-m6lzxnbi>No hay delegadores que cumplan los criterios especificados</p> </div>` : renderTemplate`<!-- Tabla de delegadores -->
    <div class="overflow-x-auto" data-astro-cid-m6lzxnbi> <table class="w-full divide-y divide-gray-200 dark:divide-gray-700" data-astro-cid-m6lzxnbi> <thead class="bg-gray-50 dark:bg-gray-700" data-astro-cid-m6lzxnbi> <tr data-astro-cid-m6lzxnbi> <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" data-astro-cid-m6lzxnbi>
Delegador
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" data-astro-cid-m6lzxnbi>
HP Delegado
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" data-astro-cid-m6lzxnbi>
Participación
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" data-astro-cid-m6lzxnbi>
Hive a Recibir
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" data-astro-cid-m6lzxnbi>
Fecha Delegación
</th> </tr> </thead> <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" data-astro-cid-m6lzxnbi> ${delegators.map((delegator, index) => renderTemplate`<tr${addAttribute(`delegator-row-${index}`, "id")} class="delegator-row hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200" data-row-type="delegator"${addAttribute(delegator.percentage, "data-percentage")}${addAttribute(delegator.hiveToReceive, "data-base-hive")}${addAttribute(delegator.delegator, "data-delegator")} data-astro-cid-m6lzxnbi> <td class="px-6 py-4 whitespace-nowrap"${addAttribute(delegator.delegator, "data-delegator")} data-astro-cid-m6lzxnbi> <div class="flex items-center" data-astro-cid-m6lzxnbi> <div class="avatar-fallback w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium" data-astro-cid-m6lzxnbi> ${delegator.delegator.charAt(0).toUpperCase()} </div> <div class="avatar-img ml-[-2rem]" data-astro-cid-m6lzxnbi></div> <div class="ml-3" data-astro-cid-m6lzxnbi> <div class="text-sm font-medium text-gray-900 dark:text-white" data-astro-cid-m6lzxnbi>
@${delegator.delegator} </div> <div class="text-sm text-gray-500 dark:text-gray-400" data-astro-cid-m6lzxnbi>
#${index + 1} </div> </div> </div> </td> <td class="px-6 py-4 whitespace-nowrap text-right" data-astro-cid-m6lzxnbi> <div class="text-sm font-medium text-gray-900 dark:text-white" data-astro-cid-m6lzxnbi> ${formatHP(delegator.hp)} HP
</div> </td> <td class="px-6 py-4 whitespace-nowrap text-right" data-astro-cid-m6lzxnbi> <div class="text-sm font-medium text-gray-900 dark:text-white" data-astro-cid-m6lzxnbi> ${formatPercentage(delegator.percentage)} </div> <div class="text-xs text-gray-500 dark:text-gray-400" data-astro-cid-m6lzxnbi>
de ${formatHP(totalHP)} HP
</div> </td> <td class="px-6 py-4 whitespace-nowrap text-right" data-astro-cid-m6lzxnbi> <div${addAttribute(`hive-amount-${index}`, "id")} class="hive-to-receive text-sm font-medium text-green-600 dark:text-green-400 transition-all duration-300" data-astro-cid-m6lzxnbi> ${formatHive(delegator.hiveToReceive)} HIVE
</div> </td> <td class="px-6 py-4 whitespace-nowrap text-right" data-astro-cid-m6lzxnbi> <div class="text-sm text-gray-900 dark:text-white" data-astro-cid-m6lzxnbi> ${formatDate(delegator.timestamp)} </div> <div class="text-xs text-gray-500 dark:text-gray-400" data-astro-cid-m6lzxnbi>
Bloque #${delegator.blockNum.toLocaleString()} </div> </td> </tr>`)} </tbody> </table> </div>

    <!-- Footer de la tabla -->
    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600" data-astro-cid-m6lzxnbi> <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-astro-cid-m6lzxnbi> <div class="text-sm text-gray-600 dark:text-gray-400" data-astro-cid-m6lzxnbi>
Mostrando ${delegators.length} delegadores válidos
</div> <div class="flex items-center gap-4 text-sm" data-astro-cid-m6lzxnbi> <div class="flex items-center gap-2" data-astro-cid-m6lzxnbi> <div class="w-3 h-3 bg-blue-500 rounded-full" data-astro-cid-m6lzxnbi></div> <span class="text-gray-600 dark:text-gray-400" data-astro-cid-m6lzxnbi>HP Delegado</span> </div> <div class="flex items-center gap-2" data-astro-cid-m6lzxnbi> <div class="w-3 h-3 bg-green-500 rounded-full" data-astro-cid-m6lzxnbi></div> <span class="text-gray-600 dark:text-gray-400" data-astro-cid-m6lzxnbi>Hive a Recibir</span> </div> </div> </div> </div>`} </div> ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/CurationCalculateTable.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/CurationCalculateTable.astro", void 0);

const $$Astro$1 = createAstro();
const $$CalculationParams = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$CalculationParams;
  const { curationValue, dynamicPaymentConfig, defaultInterestPercentage, onPercentageChange } = Astro2.props;
  const discountPercentage = dynamicPaymentConfig?.dynamicReturnPercentage || defaultInterestPercentage;
  const finalAmount = curationValue * ((100 - discountPercentage) / 100);
  return renderTemplate`${maybeRenderHead()}<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8" data-astro-cid-m3zeifwg> <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4" data-astro-cid-m3zeifwg>Parámetros de Cálculo</h3> <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700" data-astro-cid-m3zeifwg> <div class="text-center" data-astro-cid-m3zeifwg> <div class="flex items-center justify-center gap-4 text-lg font-semibold" data-astro-cid-m3zeifwg> <!-- Cantidad base --> <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300" data-astro-cid-m3zeifwg> <span class="text-2xl font-bold" data-astro-cid-m3zeifwg> ${curationValue.toFixed(3)} </span> <span class="text-sm font-medium" data-astro-cid-m3zeifwg>HIVE</span> </div> <!-- Operador --> <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400" data-astro-cid-m3zeifwg> <span class="text-sm" data-astro-cid-m3zeifwg>menos</span> <span class="text-xl font-bold" data-astro-cid-m3zeifwg> ${discountPercentage.toFixed(0)}%
</span> </div> <!-- Flecha --> <div class="text-gray-500 dark:text-gray-400" data-astro-cid-m3zeifwg>→</div> <!-- Resultado final --> <div class="flex items-center gap-2 text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border-2 border-green-300 dark:border-green-600" data-astro-cid-m3zeifwg> <span class="text-2xl font-bold" data-astro-cid-m3zeifwg> ${finalAmount.toFixed(3)} </span> <span class="text-sm font-medium" data-astro-cid-m3zeifwg>HIVE</span> </div> </div> <div class="mt-4 text-sm text-gray-600 dark:text-gray-300" data-astro-cid-m3zeifwg> <span class="font-medium" data-astro-cid-m3zeifwg>Total final a distribuir entre delegadores</span> </div> <!-- Información adicional si es dinámico --> ${dynamicPaymentConfig && renderTemplate`<div class="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full" data-astro-cid-m3zeifwg> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-m3zeifwg> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" data-astro-cid-m3zeifwg></path> </svg>
Porcentaje dinámico calculado automáticamente
</div>`} </div> </div> <!-- Calculadora de porcentaje --> <div class="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-6" data-astro-cid-m3zeifwg> <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2" data-astro-cid-m3zeifwg> <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-m3zeifwg> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" data-astro-cid-m3zeifwg></path> </svg>
Elige tu % de retorno
</h4> <div class="space-y-4" data-astro-cid-m3zeifwg> <div data-astro-cid-m3zeifwg> <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="percentage-slider" data-astro-cid-m3zeifwg>
Porcentaje de descuento: <span class="text-blue-600 dark:text-blue-400 font-bold" id="percentage-value" data-astro-cid-m3zeifwg>${discountPercentage.toFixed(1)}%</span> </label> <input type="range" id="percentage-slider" min="0" max="50" step="0.1"${addAttribute(discountPercentage, "value")} class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider" data-astro-cid-m3zeifwg> <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1" data-astro-cid-m3zeifwg> <span data-astro-cid-m3zeifwg>0%</span> <span data-astro-cid-m3zeifwg>25%</span> <span data-astro-cid-m3zeifwg>50%</span> </div> </div> <!-- Resultado actualizado --> <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700" data-astro-cid-m3zeifwg> <div class="text-sm text-gray-600 dark:text-gray-400 mb-2" data-astro-cid-m3zeifwg>Nuevo total a distribuir:</div> <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="updated-amount" data-astro-cid-m3zeifwg> ${finalAmount.toFixed(3)} HIVE
</div> </div> </div> </div> </div> ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/CalculationParams.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/ui/components/CalculationParams.astro", void 0);

const $$Astro = createAstro();
const $$Calculate = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Calculate;
  const authenticatedUser = getAuthenticatedUser(Astro2);
  if (!authenticatedUser) {
    return Astro2.redirect("/?reason=auth_required");
  }
  const userAccount = authenticatedUser;
  const defaultInterestPercentage = 10;
  let filters;
  let calculationResult = null;
  let error = null;
  let dynamicPaymentConfig = null;
  let filtersSource = "default";
  const defaultFilters = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: [],
    applied: true,
    curationPeriod: "30d",
    curationValue: 0
  };
  const url = new URL(Astro2.request.url);
  const filtersParam = url.searchParams.get("filters");
  const sourceParam = url.searchParams.get("source");
  let hasValidFiltersFromServer = false;
  let isFromDashboard = sourceParam === "dashboard";
  if (filtersParam) {
    try {
      filters = decodeFilters(filtersParam);
      filtersSource = "url";
      hasValidFiltersFromServer = true;
      console.log("\u2705 Filtros desde URL:", filters);
    } catch (err) {
      error = "Error decodificando filtros de URL";
      filters = { ...defaultFilters, applied: false };
    }
  } else {
    console.log("\u26A0\uFE0F No hay filtros en URL del servidor, configurando para procesamiento en cliente");
    filters = { ...defaultFilters, applied: false };
  }
  if (isFromDashboard) {
    console.log("\u26A1 Navegaci\xF3n desde Dashboard - c\xE1lculos diferidos al cliente");
    filters.applied = false;
  } else if (hasValidFiltersFromServer && !error && filters.curationValue && filters.curationValue > 0) {
    try {
      console.log(
        "\u{1F680} Usando curationValue desde filtros, evitando rec\xE1lculo:",
        filters.curationValue
      );
      calculationResult = await calculateCurationDistribution(
        userAccount,
        filters,
        filters.curationValue || 0,
        defaultInterestPercentage
      );
      if (calculationResult) {
        const userPaymentConfig = await getPaymentConfigForAccount(userAccount);
        dynamicPaymentConfig = await calculateDynamicPayments(
          calculationResult,
          filters,
          userPaymentConfig
        );
      }
    } catch (err) {
      console.error("Error en c\xE1lculos:", err);
      error = err instanceof Error ? err.message : "Error en c\xE1lculos";
    }
  } else if (hasValidFiltersFromServer && !error) {
    console.log("\u26A0\uFE0F curationValue no definido, necesitamos obtener estad\xEDsticas de curaci\xF3n");
  }
  const pageTitle = "Calcular distribuci\xF3n de Curaci\xF3n ";
  const pageDescription = "Calcula la distribuci\xF3n de recompensas de curaci\xF3n entre delegadores basada en filtros espec\xEDficos.";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": pageTitle, "description": pageDescription, "data-astro-cid-7r662v7d": true }, { "default": async ($$result2) => renderTemplate`  <meta name="calculate-filters" content="" id="calculate-filters-meta">  <meta name="authenticated-user"${addAttribute(userAccount, "content")} id="authenticated-user-meta"> ${maybeRenderHead()}<div class="min-h-screen max-w-7xl mx-auto" data-astro-cid-7r662v7d> <main class="container mx-auto px-4 py-8" data-astro-cid-7r662v7d> <div class="mb-8" data-astro-cid-7r662v7d> <h1 class="text-3xl font-bold text-gray-900 dark:text-white" data-astro-cid-7r662v7d> ${pageTitle} </h1> <p class="text-gray-600 dark:text-gray-400 mt-2" id="user-subtitle" data-astro-cid-7r662v7d>
Distribución de recompensas entre delegadores de @${userAccount} </p> <!-- Navegación --> <nav class="flex space-x-4 mt-4" data-astro-cid-7r662v7d> <a href="/dashboard" class="text-blue-600 dark:text-blue-400 hover:underline" data-astro-cid-7r662v7d>
← Volver al Dashboard
</a> </nav> </div> <!-- Mensaje de carga cuando no hay filtros aplicados --> <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 mb-8 text-center" id="loading-message" data-filters-loading data-astro-cid-7r662v7d> <div class="flex items-center justify-center mb-4" data-astro-cid-7r662v7d> <svg class="animate-spin h-8 w-8 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-astro-cid-7r662v7d> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-astro-cid-7r662v7d></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-astro-cid-7r662v7d></path> </svg> </div> <h3 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2" data-astro-cid-7r662v7d>
Procesando filtros...
</h3> <p class="text-amber-700 dark:text-amber-300 text-sm" data-astro-cid-7r662v7d>
Verificando si hay filtros aplicados en la URL o sesión.
</p> </div> <!-- Filtros aplicados --> <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8" id="filters-section" data-filters-applied style="display: none;" data-astro-cid-7r662v7d> <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4" data-astro-cid-7r662v7d>Filtros Aplicados</h3> <!-- Indicador de fuente --> <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-full mb-4" id="filters-source-indicator" data-astro-cid-7r662v7d>
🔗 Filtros desde URL
</div> <!-- Grid de filtros --> <div class="grid grid-cols-1 md:grid-cols-4 gap-4" data-astro-cid-7r662v7d> <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg" data-astro-cid-7r662v7d> <div class="text-sm text-blue-600 dark:text-blue-400 font-medium" data-astro-cid-7r662v7d>
Período de Tiempo
</div> <div class="text-lg font-semibold text-blue-900 dark:text-blue-100" id="filter-time-period" data-filter-time-period data-astro-cid-7r662v7d> ${filters.timePeriod} días
</div> </div> <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg" data-astro-cid-7r662v7d> <div class="text-sm text-purple-600 dark:text-purple-400 font-medium" data-astro-cid-7r662v7d>HP Mínimo</div> <div class="text-lg font-semibold text-purple-900 dark:text-purple-100" id="filter-minimum-hp" data-filter-minimum-hp data-astro-cid-7r662v7d> ${filters.minimumHP} HP
</div> </div> <div class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg" data-astro-cid-7r662v7d> <div class="text-sm text-emerald-600 dark:text-emerald-400 font-medium" data-astro-cid-7r662v7d>
Período de Curación
</div> <div class="text-lg font-semibold text-emerald-900 dark:text-emerald-100" id="filter-curation-period" data-filter-curation-period data-astro-cid-7r662v7d> ${filters.curationPeriod} </div> <div class="text-xs text-emerald-700 dark:text-emerald-300 mt-1" id="filter-curation-value" data-filter-curation-value data-astro-cid-7r662v7d> ${filters.curationValue ? filters.curationValue.toFixed(4) : "0.0000"} HP
</div> </div> <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg" data-astro-cid-7r662v7d> <div class="text-sm text-orange-600 dark:text-orange-400 font-medium" data-astro-cid-7r662v7d>
Usuarios Excluidos
</div> <div class="text-lg font-semibold text-orange-900 dark:text-orange-100" id="filter-excluded-users" data-filter-excluded-users data-astro-cid-7r662v7d> ${filters.excludedUsers.length} usuarios
</div> </div> </div> <!-- Lista de usuarios excluidos --> <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg" id="excluded-users-list" style="display: none;" data-astro-cid-7r662v7d> <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2" data-astro-cid-7r662v7d>
Usuarios excluidos:
</h4> <div class="flex flex-wrap gap-2" id="excluded-users-tags" data-astro-cid-7r662v7d> ${filters.excludedUsers.map((user) => renderTemplate`<span class="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs rounded" data-astro-cid-7r662v7d>
@${user} </span>`)} </div> </div> </div> <!-- Parámetros de cálculo --> <div id="calculation-params-section" style="display: none;" data-astro-cid-7r662v7d> ${renderComponent($$result2, "CalculationParams", $$CalculationParams, { "curationValue": 0, "dynamicPaymentConfig": null, "defaultInterestPercentage": defaultInterestPercentage, "data-astro-cid-7r662v7d": true })} </div> <!-- Mensajes de estado --> <div id="error-section" style="display: none;" data-astro-cid-7r662v7d> <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8" data-astro-cid-7r662v7d> <h3 class="text-sm font-medium text-red-800 dark:text-red-200" data-astro-cid-7r662v7d>Error</h3> <p class="text-sm text-red-700 dark:text-red-300 mt-1" id="error-message" data-astro-cid-7r662v7d></p> </div> </div> <!-- Mensaje de carga para datos --> <div id="loading-data-section" style="display: none;" data-astro-cid-7r662v7d> <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 mb-8 text-center" data-astro-cid-7r662v7d> <div class="flex items-center justify-center mb-4" data-astro-cid-7r662v7d> <svg class="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-astro-cid-7r662v7d> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-astro-cid-7r662v7d></circle> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" data-astro-cid-7r662v7d></path> </svg> </div> <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2" data-astro-cid-7r662v7d>
Calculando distribución...
</h3> <p class="text-blue-700 dark:text-blue-300 text-sm" data-astro-cid-7r662v7d>
Procesando datos de delegaciones y calculando recompensas.
</p> </div> </div> <!-- Tabla de resultados --> ${renderComponent($$result2, "BrandCard", $$BrandCard, { "class": "overflow-hidden animate-slide-up", "data-astro-cid-7r662v7d": true }, { "default": async ($$result3) => renderTemplate` <div id="results-section" style="display: none;" data-astro-cid-7r662v7d> ${renderComponent($$result3, "CurationCalculateTable", $$CurationCalculateTable, { "delegators": [], "totalHP": 0, "totalHiveToDistribute": 0, "isLoading": false, "data-astro-cid-7r662v7d": true })} </div> ` })} <!-- Información del cálculo --> <div id="calculation-info-section" style="display: none;" data-astro-cid-7r662v7d> <div class="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6" data-astro-cid-7r662v7d> <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4" data-astro-cid-7r662v7d>
Información del Cálculo
</h3> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" data-astro-cid-7r662v7d> <div data-astro-cid-7r662v7d> <span class="text-gray-600 dark:text-gray-400" data-astro-cid-7r662v7d>Fecha de Corte:</span> <span class="ml-2 font-medium text-gray-900 dark:text-white" id="cutoff-date" data-astro-cid-7r662v7d>
--
</span> </div> <div data-astro-cid-7r662v7d> <span class="text-gray-600 dark:text-gray-400" data-astro-cid-7r662v7d>Operaciones Procesadas:</span> <span class="ml-2 font-medium text-gray-900 dark:text-white" id="processed-operations" data-astro-cid-7r662v7d>
--
</span> </div> <div data-astro-cid-7r662v7d> <span class="text-gray-600 dark:text-gray-400" data-astro-cid-7r662v7d>Delegadores Válidos:</span> <span class="ml-2 font-medium text-gray-900 dark:text-white" id="valid-delegators" data-astro-cid-7r662v7d>
--
</span> </div> </div> </div> </div> <!-- Botón de proceder a pagos --> <div id="payment-button-section" style="display: none;" data-astro-cid-7r662v7d> <div class="mt-8 text-center" data-astro-cid-7r662v7d> <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 shadow-xl" data-astro-cid-7r662v7d> <div class="text-white mb-6" data-astro-cid-7r662v7d> <h3 class="text-2xl font-bold mb-2" data-astro-cid-7r662v7d>¡Cálculo Completado!</h3> <p class="text-green-100 text-lg" id="delegators-count-message" data-astro-cid-7r662v7d>
Distribución lista para -- delegadores
</p> </div> <a href="#" id="payment-button" class="inline-flex items-center gap-3 bg-white text-green-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" data-astro-cid-7r662v7d>
💰 PROCEDER A PAGOS →
</a> <p class="text-green-100 text-sm mt-4" data-astro-cid-7r662v7d>
Continuar para configurar y ejecutar los pagos via Hive Keychain
</p> </div> </div> </div> </main> </div> ` })} ${renderScript($$result, "/Users/eddiespino/aliento-pay-eddiespino/src/pages/calculate.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/eddiespino/aliento-pay-eddiespino/src/pages/calculate.astro", void 0);

const $$file = "/Users/eddiespino/aliento-pay-eddiespino/src/pages/calculate.astro";
const $$url = "/calculate";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Calculate,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
