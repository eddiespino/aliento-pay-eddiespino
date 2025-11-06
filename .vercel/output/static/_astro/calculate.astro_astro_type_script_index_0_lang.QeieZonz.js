const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/Container.WlziK8FN.js","_astro/index.BYO3pZyk.js","_astro/preload-helper.BlTxHScW.js","_astro/HiveAccountService.D7iZ8Fsv.js"])))=>i.map(i=>d[i]);
import{_ as V}from"./preload-helper.BlTxHScW.js";(function(){console.log("🚀 Calculate - Script del cliente iniciado");let k=!1,E=0,C=0;const v=new URLSearchParams(window.location.search).get("filters");if(console.log("🔍 Parámetros URL (cliente):",v),v){console.log("✅ Filtros encontrados en URL");try{const e=JSON.parse(decodeURIComponent(v));if(console.log("📋 Filtros decodificados:",e),e&&e.applied){U(e);return}}catch(e){console.error("❌ Error decodificando filtros:",e)}}console.log("🔍 Buscando en sessionStorage...");const I=sessionStorage.getItem("appliedFilters");if(I)try{const e=JSON.parse(I);if(console.log("📦 Filtros desde sessionStorage:",e),e&&e.applied){const a=encodeURIComponent(JSON.stringify(e));console.log("↩️ Redirigiendo con filtros..."),window.location.href=`/calculate?filters=${a}`;return}}catch(e){console.error("❌ Error procesando sessionStorage:",e)}console.log("🔙 No hay filtros, redirigiendo al dashboard..."),setTimeout(()=>{window.location.href="/dashboard"},2e3);function U(e){console.log("🎨 Actualizando UI con filtros:",e);const a=document.getElementById("loading-message");a&&(a.style.display="none");const t=document.getElementById("filters-section");if(t&&(t.style.display="block"),p("filter-time-period",`${e.timePeriod} días`),p("filter-minimum-hp",`${e.minimumHP} HP`),p("filter-curation-period",e.curationPeriod),p("filter-excluded-users",`${e.excludedUsers.length} usuarios`),e.curationValue&&e.curationValue>0){if(p("filter-curation-value",`${e.curationValue.toFixed(4)} HP`),console.log("✅ curationValue ya disponible desde filtros:",e.curationValue),e.excludedUsers.length>0){const o=document.getElementById("excluded-users-list");o&&(o.style.display="block")}h(),w(e)}else if(console.log("🔄 Intentando obtener curationValue del Dashboard..."),D(e)){if(console.log("✅ curationValue obtenido del Dashboard"),p("filter-curation-value",`${e.curationValue.toFixed(4)} HP`),e.excludedUsers.length>0){const i=document.getElementById("excluded-users-list");i&&(i.style.display="block")}h(),w(e)}else{if(console.warn("⚠️ No se pudo obtener curationValue del Dashboard, usando API"),e.excludedUsers.length>0){const i=document.getElementById("excluded-users-list");i&&(i.style.display="block")}h(),w(e)}console.log("✅ UI actualizada con filtros")}function D(e){try{if(console.log("🔍 Intentando obtener curationValue del Dashboard mejorado..."),typeof window.getCurationStatsData=="function"){const t=window.getCurationStatsData();if(t&&!t.error){switch(e.curationPeriod){case"24h":e.curationValue=t.curation24h;break;case"7d":e.curationValue=t.curation7d;break;case"30d":default:e.curationValue=t.curation30d;break}return console.log(`✅ curationValue establecido desde Dashboard (${t.source}): ${e.curationValue} HP`),!0}}const a=localStorage.getItem("dashboard_curation_stats");if(a){const t=JSON.parse(a);if(console.log("📦 Datos encontrados en localStorage:",t),t&&t.timestamp&&!t.error&&Date.now()-t.timestamp<10*60*1e3){switch(e.curationPeriod){case"24h":e.curationValue=t.curation24h||0;break;case"7d":e.curationValue=t.curation7d||0;break;case"30d":default:e.curationValue=t.curation30d||0;break}const o=Math.round((Date.now()-t.timestamp)/(1e3*60));return console.log(`✅ curationValue obtenido desde localStorage (${o}m): ${e.curationValue} HP`),!0}else console.log("⚠️ Datos en localStorage inválidos o expirados"),localStorage.removeItem("dashboard_curation_stats")}if(typeof window.getDashboardCacheInfo=="function"){const t=window.getDashboardCacheInfo();console.log("📋 Información del caché del Dashboard:",t),!t.needsUpdate&&t.hasCurationData&&(console.log("🔄 Intentando refrescar datos del Dashboard..."),typeof window.refreshCurationStats=="function"&&window.refreshCurationStats().then(()=>{console.log("🔄 Datos refrescados, reintentando..."),setTimeout(()=>{D(e)},1e3)}).catch(o=>{console.warn("⚠️ Error refrescando datos:",o)}))}return console.log("❌ No se pudieron obtener datos válidos del Dashboard"),!1}catch(a){return console.warn("⚠️ Error obteniendo curationValue del Dashboard:",a),!1}}function h(){const e=document.getElementById("loading-data-section");e&&(e.style.display="block")}function H(){const e=document.getElementById("loading-data-section");e&&(e.style.display="none")}async function w(e){try{console.log("📡 Haciendo petición API para calcular datos...");const a=await fetch("/api/calculate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!a.ok)throw new Error(`HTTP error! status: ${a.status}`);const t=await a.json();if(t.success)console.log("✅ Datos de cálculo recibidos:",t),H(),F(t);else throw new Error(t.error||"Error en el cálculo")}catch(a){console.error("❌ Error en petición API:",a),H(),S(a.message||"Error al obtener datos de cálculo")}}function S(e){const a=document.getElementById("error-section"),t=document.getElementById("error-message");a&&t&&(t.textContent=e,a.style.display="block")}function F(e){console.log("📊 Actualizando UI con resultados...");const{calculationResult:a,filters:t}=e;R(a);const o=document.getElementById("results-section");o&&(o.style.display="block");const i=document.getElementById("calculation-info-section");i&&(i.style.display="block",p("cutoff-date",new Date(a.cutoffDate).toLocaleDateString("es-ES")),p("processed-operations",a.processedOperations.toLocaleString()),p("valid-delegators",a.delegators.length.toString()));const g=document.getElementById("payment-button-section");if(g){g.style.display="block",p("delegators-count-message",`Distribución lista para ${a.delegators.length} delegadores`);const n=document.getElementById("payment-button");n&&(window.basePaymentData={calculationResult:a,filters:t,curationValue:e.curationValue,dynamicPaymentConfig:e.dynamicPaymentConfig,defaultInterestPercentage:e.defaultInterestPercentage||10},console.log("💾 [CALCULATE] Guardando basePaymentData:",{"calculationResult.totalHiveToDistribute":a.totalHiveToDistribute,"calculationResult.delegators.length":a.delegators.length,"filters.curationValue":t.curationValue,"data.curationValue":e.curationValue,"filters.curationPeriod":t.curationPeriod,defaultInterestPercentage:e.defaultInterestPercentage||10}),n.removeAttribute("href"),n.style.cursor="pointer",n.replaceWith(n.cloneNode(!0)),document.getElementById("payment-button").addEventListener("click",function(c){c.preventDefault(),$()}))}B(e);const d=document.getElementById("calculation-params-section");d&&(d.style.display="block"),window.calculationResult=a,window.updatedFilters=t,console.log("✅ UI actualizada con resultados completos")}function $(){if(console.log("🚀 Procediendo a pagos con valores actualizados..."),!window.basePaymentData){console.error("❌ No hay datos base para pagos");return}const{calculationResult:e,filters:a,curationValue:t,dynamicPaymentConfig:o,defaultInterestPercentage:i}=window.basePaymentData,g=C||0,d=E||0;let n=g;document.getElementById("subtract-user-hp")?.checked&&d>0&&(n+=d),n=Math.min(n,90);const c=a.curationValue||t||0,u=c*((100-n)/100),b=e.totalHiveToDistribute,x=u/b;console.log("🔍 [CALCULATE] Ejemplo de delegator:",e.delegators[0]),console.log("🔍 [CALCULATE] Valores de curación:",{"filters.curationValue":a.curationValue,curationValue:t,safeCurationValue:c,totalDiscountPercentage:n,newTotalAmount:u,originalTotal:b,ratio:x});const y=e.delegators.map((r,l)=>{let f=0;return r.hiveToReceive&&typeof r.hiveToReceive=="number"&&!isNaN(r.hiveToReceive)&&r.hiveToReceive>0?f=Number((r.hiveToReceive*x).toFixed(3)):console.warn(`⚠️ [CALCULATE] Delegator ${r.delegator} tiene hiveToReceive inválido:`,r.hiveToReceive),{username:r.delegator,payment:f}});console.log("💰 [CALCULATE] Distributions a guardar:",{total:y.length,withPayments:y.filter(r=>r.payment>0).length,withoutPayments:y.filter(r=>r.payment===0).length,firstWithPayment:y.find(r=>r.payment>0),firstWithoutPayment:y.find(r=>r.payment===0)});const s={distributions:y,period:a.curationPeriod,totalAmount:u,calculationMetadata:{filters:a,originalCurationValue:t,dynamicPercentage:o?.dynamicReturnPercentage||i,totalHP:e.totalHP,calculatedAt:new Date().toISOString(),userHPPercentage:d,sliderPercentage:g,totalDiscountPercentage:n,adjustedFromSlider:!0}};console.log("💰 Datos de pago actualizados:",{originalTotal:b,newTotal:u,totalDiscountPercentage:n,distributionsCount:y.length,sliderPercentage:g,userHPPercentage:d});try{console.log("💾 [CALCULATE] Guardando datos en sessionStorage..."),console.log("📄 [CALCULATE] Datos a guardar:",{distributionsCount:s.distributions?.length||0,totalAmount:s.totalAmount,period:s.period,hasMetadata:!!s.calculationMetadata}),sessionStorage.removeItem("payment_data"),sessionStorage.setItem("payment_data",JSON.stringify(s)),console.log("✅ [CALCULATE] Datos guardados exitosamente en sessionStorage"),console.log("🔄 [CALCULATE] Redirigiendo a /payments..."),window.location.href="/payments"}catch(r){console.error("❌ [CALCULATE] Error guardando datos de pago en sessionStorage:",r),window.location.href="/payments"}}function B(e){const{calculationResult:a,filters:t,dynamicPaymentConfig:o,defaultInterestPercentage:i}=e,g=document.getElementById("calculation-params-section");if(!g)return;const d=t.curationValue||0,n=o?.dynamicReturnPercentage||i,m=d*((100-n)/100),c=`
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Parámetros de Cálculo</h3>
          
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div class="text-center">
              <div class="flex items-center justify-center gap-4 text-lg font-semibold">
                <!-- Cantidad base -->
                <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <span class="text-2xl font-bold" id="base-curation-value">
                    ${d.toFixed(3)}
                  </span>
                  <span class="text-sm font-medium">HIVE</span>
                </div>
                
                <!-- Operador -->
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span class="text-sm">menos</span>
                  <span class="text-xl font-bold" id="discount-percentage-display">
                    ${n.toFixed(0)}%
                  </span>
                </div>
                
                <!-- Flecha -->
                <div class="text-gray-500 dark:text-gray-400">→</div>
                
                <!-- Resultado final -->
                <div class="flex items-center gap-2 text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border-2 border-green-300 dark:border-green-600">
                  <span class="text-2xl font-bold" id="final-amount-display">
                    ${m.toFixed(3)}
                  </span>
                  <span class="text-sm font-medium">HIVE</span>
                </div>
              </div>
              
              <div class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium">Total final a distribuir entre delegadores</span>
              </div>
              
              ${o?`
                <div class="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Porcentaje dinámico calculado automáticamente
                </div>
              `:""}
            </div>
          </div>
          
          <!-- Calculadora de porcentaje -->
          <div class="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              Elige tu % de retorno
            </h4>
            
            <div class="space-y-4">
              <!-- Opción para restar HP del usuario logueado -->
              <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" id="subtract-user-hp" class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400" />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      Restar mi porcentaje de HP del total
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Se restará automáticamente tu porcentaje de HP del total a distribuir
                    </div>
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-1" id="user-hp-percentage">
                      Cargando porcentaje...
                    </div>
                  </div>
                </label>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" for="percentage-slider">
                  Porcentaje de descuento: <span class="text-blue-600 dark:text-blue-400 font-bold" id="percentage-value">${n.toFixed(1)}%</span>
                </label>
                <input type="range" id="percentage-slider" min="0" max="50" step="0.1" value="${n}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider" />
                <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>
              
              <!-- Resultado actualizado -->
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Nuevo total a distribuir:</div>
                <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="updated-amount">
                  ${m.toFixed(3)} HIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      `;g.innerHTML=c,j(d,a.totalHiveToDistribute)}function j(e,a){const t=document.getElementById("percentage-slider"),o=document.getElementById("percentage-value"),i=document.getElementById("updated-amount"),g=document.getElementById("discount-percentage-display"),d=document.getElementById("final-amount-display"),n=document.getElementById("subtract-user-hp"),m=document.getElementById("user-hp-percentage");let c=0,u=parseFloat(t?.value||"0");async function b(){try{const s=x();if(console.log("🔍 Username obtenido:",s),!s){console.error("❌ No se pudo obtener el username"),m.textContent="Usuario no encontrado";return}m.textContent="Calculando...",console.log("🚀 Calculando porcentaje de HP para:",s);const{HiveAccountService:r}=await V(async()=>{const{HiveAccountService:f}=await import("./HiveAccountService.D7iZ8Fsv.js");return{HiveAccountService:f}},[]),l=await r.calculateHPPercentage(s);if(!l.success){console.error("❌ Error del servicio:",l.error.message),m.textContent="Error al calcular porcentaje";return}c=l.data,console.log("🧮 Porcentaje calculado:",c),m.textContent=`Tu porcentaje de HP: ${c.toFixed(2)}%`}catch(s){console.error("Error calculando porcentaje de HP:",s),m.textContent="Error al calcular porcentaje"}}function x(){const s=document.getElementById("authenticated-user-meta");if(s){const l=s.getAttribute("content");if(console.log("🔍 Server user desde meta tag:",l),l&&l!=="undefined"&&l!=="")return console.log("✅ Usando usuario del servidor:",l),l}const r=localStorage.getItem("authenticated_user");if(console.log("🔍 Auth user from localStorage:",r),r)try{const l=r.trim();return console.log("✅ Usando usuario del localStorage:",l),l}catch(l){console.error("Error parsing auth user:",l)}return console.error("❌ No se encontró usuario en servidor ni en localStorage"),null}function y(){let s=u;n?.checked&&c>0&&(s+=c),s=Math.min(s,90);const r=e*((100-s)/100);i&&(i.textContent=r.toFixed(3)+" HIVE"),d&&(d.textContent=r.toFixed(3));const l=new CustomEvent("percentageChange",{detail:{percentage:s,newAmount:r,userHPPercentage:c,sliderPercentage:u}});window.dispatchEvent(l),E=c,C=u;const f=document.getElementById("payment-button");if(f&&window.calculationResult&&window.updatedFilters){const q=window.calculationResult.totalHiveToDistribute,W=r/q,G={distributions:window.calculationResult.delegators.map(A=>({username:A.delegator,payment:Number((A.hiveToReceive*W).toFixed(3))})),period:window.updatedFilters.curationPeriod,totalAmount:r,calculationMetadata:Object.assign({},window.updatedFilters,{sliderPercentage:u,userHPPercentage:c})};f.href=`/payments?data=${encodeURIComponent(JSON.stringify(G))}`}}b(),t&&o&&t.addEventListener("input",s=>{u=parseFloat(s.target.value),o.textContent=u.toFixed(1)+"%",g&&(g.textContent=u.toFixed(0)+"%"),y()}),n&&n.addEventListener("change",y)}function R(e){const a=document.getElementById("results-section");if(!a)return;const t=`
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Header de la tabla -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  Distribución de Curación
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ${e.delegators.length} delegadores válidos
                </p>
              </div>
              <div class="flex flex-col sm:flex-row gap-4 text-sm">
                <div class="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                  <span class="text-blue-600 dark:text-blue-400 font-medium">
                    Total HP: ${P(e.totalHP)}
                  </span>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <span class="text-green-600 dark:text-green-400 font-medium" id="total-hive-display">
                    Total Hive: ${L(e.totalHiveToDistribute)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tabla de delegadores -->
          <div class="overflow-x-auto">
            <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Delegador
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    HP Delegado
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Participación
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hive a Recibir
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Delegación
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${e.delegators.map((o,i)=>`
                  <tr class="delegator-row hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      data-percentage="${o.percentage}"
                      data-base-hive="${o.hiveToReceive}"
                      data-delegator="${o.delegator}">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="relative flex-shrink-0 w-8 h-8">
                          <!-- Avatar con fallback integrado -->
                          <img 
                            src="https://images.hive.blog/u/${o.delegator.replace("@","").trim().toLowerCase()}/avatar" 
                            alt="@${o.delegator}"
                            class="w-8 h-8 rounded-full object-cover"
                            onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden'); this.nextElementSibling.classList.add('flex');"
                            onload="this.nextElementSibling.classList.add('hidden'); this.nextElementSibling.classList.remove('flex');"
                          />
                          <!-- Fallback que aparece solo si falla la imagen -->
                          <div class="hidden w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center">
                            <span class="text-white text-sm font-medium">
                              ${o.delegator.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div class="ml-3">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            @${o.delegator}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            #${i+1}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        ${P(o.hp)} HP
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        ${M(o.percentage)}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        de ${P(e.totalHP)} HP
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="hive-to-receive text-sm font-medium text-green-600 dark:text-green-400 transition-all duration-300">
                        ${L(o.hiveToReceive)} HIVE
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="text-sm text-gray-900 dark:text-white">
                        ${N(o.timestamp)}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        Bloque #${o.blockNum.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          
          <!-- Footer de la tabla -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando ${e.delegators.length} delegadores válidos
              </div>
              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-gray-600 dark:text-gray-400">HP Delegado</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="text-gray-600 dark:text-gray-400">Hive a Recibir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;a.innerHTML=t,_(e.totalHiveToDistribute),console.log(`✅ Calculate: Tabla renderizada con ${e.delegators.length} delegadores y avatares integrados`)}function P(e){return e.toFixed(2)}function M(e){return`${e.toFixed(2)}%`}function L(e){return e.toFixed(3)}function N(e){return new Date(e).toLocaleDateString("es-ES",{year:"numeric",month:"short",day:"numeric"})}function _(e){k||(window.addEventListener("percentageChange",a=>{const{percentage:t,newAmount:o,userHPPercentage:i,sliderPercentage:g}=a.detail,d=document.getElementById("total-hive-display");d&&(d.textContent=`Total Hive: ${o.toFixed(3)}`),document.querySelectorAll(".delegator-row").forEach(m=>{const c=parseFloat(m.getAttribute("data-base-hive")||"0"),u=o/e,b=c*u,x=m.querySelector(".hive-to-receive");x&&(x.textContent=`${b.toFixed(3)} HIVE`,x.classList.add("animate-pulse"),setTimeout(()=>{x.classList.remove("animate-pulse")},500))})}),k=!0)}function p(e,a){const t=document.getElementById(e);t&&(t.textContent=a)}function O(){const a=new URLSearchParams(window.location.search).get("source"),t=sessionStorage.getItem("calculate_loading");return a==="dashboard"||t==="true"}function z(){const e=document.getElementById("loading-message");e&&(e.innerHTML=`
          <div class="flex items-center justify-center mb-4">
            <svg class="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🚀 Procesando desde Dashboard...
          </h3>
          <div class="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <div class="flex items-center justify-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Cargando filtros aplicados</span>
            </div>
            <div id="loading-step-2" class="flex items-center justify-center gap-2 opacity-50">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Obteniendo datos de curación</span>
            </div>
            <div id="loading-step-3" class="flex items-center justify-center gap-2 opacity-50">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Calculando distribución</span>
            </div>
          </div>
          <p class="text-blue-600 dark:text-blue-400 text-xs mt-3">
            ⚡ Navegación rápida activada
          </p>
        `,e.style.display="block")}function T(e){const a={2:document.getElementById("loading-step-2"),3:document.getElementById("loading-step-3")};if(a[e]){a[e].classList.remove("opacity-50");const t=a[e].querySelector(".w-2");t&&(t.classList.add("animate-pulse"),t.classList.remove("bg-yellow-500","bg-blue-500"),t.classList.add("bg-green-500"))}}async function J(){console.log("🔄 Iniciando procesamiento progresivo...");try{z(),T(2);const e=await loadFiltersFromClient();if(!e)throw new Error("No se pudieron cargar los filtros");await new Promise(t=>setTimeout(t,300)),T(3);const a=await calculateAndProcess(e);return sessionStorage.removeItem("calculate_loading"),sessionStorage.removeItem("calculate_source"),a}catch(e){throw console.error("❌ Error en procesamiento progresivo:",e),sessionStorage.removeItem("calculate_loading"),S("Error procesando los cálculos: "+e.message),e}}document.addEventListener("DOMContentLoaded",async function(){console.log("📋 DOM cargado, inicializando página...");try{const{container:e}=await V(async()=>{const{container:o}=await import("./Container.WlziK8FN.js");return{container:o}},__vite__mapDeps([0,1,2,3])),t=e.getAuthenticationUseCase().getCurrentUser();if(t){console.log(`👤 Usuario autenticado: @${t}`);const o=document.getElementById("user-subtitle");o&&(o.textContent=`Distribución de recompensas entre delegadores de @${t}`),O()?(console.log("⚡ Navegación desde Dashboard detectada - procesamiento progresivo"),await J()):(console.log("🔄 Procesamiento normal"),await processClientFilters())}else console.warn("⚠️ No hay usuario autenticado"),setTimeout(()=>window.location.href="/",2e3)}catch(e){console.error("❌ Error inicializando página:",e)}}),console.log("✅ Calculate: Avatares integrados directamente en el HTML - no requiere JavaScript adicional")})();
