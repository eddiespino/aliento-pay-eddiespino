(function(){console.log("� [CLIENT] Iniciando procesamiento de pagos del lado del cliente");function u(){let e=null;const s=new URLSearchParams(window.location.search).get("data");if(s){console.log("� [CLIENT] Datos encontrados en URL");try{e=JSON.parse(decodeURIComponent(s))}catch(t){console.error("❌ [CLIENT] Error decodificando datos de URL:",t)}}if(!e){console.log("🔍 [CLIENT] Buscando en sessionStorage...");const t=sessionStorage.getItem("payment_data");if(t)try{e=JSON.parse(t),console.log("✅ [CLIENT] Datos encontrados en sessionStorage")}catch(i){console.error("❌ [CLIENT] Error parsing sessionStorage:",i)}}if(!e){console.log("❌ [CLIENT] No se encontraron datos de pago"),d("No hay datos de pagos. Por favor, vuelve a calcular la distribución.");return}if(console.log("� [CLIENT] Procesando datos:",{hasDistributions:!!e.distributions,distributionsCount:e.distributions?.length||0,totalAmount:e.totalAmount,period:e.period,hasMetadata:!!e.calculationMetadata}),!e.distributions){console.log("❌ [CLIENT] No hay distribuciones en los datos"),d("No hay distribuciones para procesar.");return}if(!e.distributions.some(t=>t.payment&&t.payment>0)){console.log("❌ [CLIENT] Todos los pagos son null o 0"),d("Error: Los cálculos no generaron pagos válidos. Los valores de pago están en null.");return}const r=e.distributions.filter(t=>!t.payment||t.payment<=0?!1:Math.round(Number(t.payment)*1e3)/1e3>0);console.log("✅ [CLIENT] Distribuciones válidas:",r.length);const n=r.map((t,i)=>({id:`payment-${i}-${Date.now()}`,to:t.username,amount:Number(t.payment),currency:"HIVE",memo:"",status:"pending"}));window.currentPayments=n,window.currentPaymentData=e,window.currentPaymentBatch=null,window.isGroupView=!1,n.forEach(t=>{t.memo=c(l,t,e)}),console.log("💬 [CLIENT] Pagos procesados:",{validPayments:n.length,totalAmount:n.reduce((t,i)=>t+i.amount,0).toFixed(3),firstPayment:n[0]?{to:n[0].to,amount:n[0].amount,memo:n[0].memo}:null}),p(n)}function d(e){const o=document.getElementById("payments-content");o&&(o.innerHTML=`
        <div class="max-w-2xl mx-auto">
          <div class="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-8 text-center">
            <div class="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-amber-400 mb-2">Error en Datos de Pago</h3>
            <p class="text-amber-300 mb-6">${e}</p>
            <a href="/calculate" class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Ir a calcular distribución
            </a>
          </div>
        </div>
      `)}let l="Pago de curación {period} - Aliento.pay";function c(e,o,s){const a=s?.period||"",r=o.to||"",n=o.amount?.toFixed(3)||"0.000",t=new Date().toLocaleDateString("es-ES");return e.replace(/{period}/g,a).replace(/{username}/g,r).replace(/{amount}/g,n).replace(/{date}/g,t)}function m(){const e=window.currentPayments||[],o=window.currentPaymentData||{};e.forEach(s=>{s.memo=c(l,s,o)}),p(e),console.log("✅ Memos actualizados con template:",l)}function p(e){const o=document.getElementById("payments-content");if(!o)return;const s=e.map((a,r)=>`
        <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="relative w-8 h-8" data-username="${a.to}">
                <div class="avatar-fallback w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span class="text-blue-400 text-sm font-bold">${r+1}</span>
                </div>
                <div class="avatar-img absolute inset-0"></div>
              </div>
              <div>
                <div class="font-medium text-white">@${a.to}</div>
                <div class="text-xs text-gray-400 truncate max-w-xs">${a.memo}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-yellow-400">${a.amount.toFixed(3)} HIVE</div>
              <div class="text-xs text-gray-400 capitalize">${a.status}</div>
            </div>
          </div>
        </div>
      `).join("");o.innerHTML=`
        <!-- Memo Customization Section -->
        <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 mb-6">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-white mb-2">Personalizar Memo de Pago</h3>
              <p class="text-sm text-gray-300 mb-4">
                Edita el mensaje que aparecerá en cada transferencia. Puedes usar variables:
                <span class="text-purple-300 font-mono text-xs">{period}</span>,
                <span class="text-purple-300 font-mono text-xs">{username}</span>,
                <span class="text-purple-300 font-mono text-xs">{amount}</span>,
                <span class="text-purple-300 font-mono text-xs">{date}</span>
              </p>

              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Template del Memo:</label>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      id="memo-template-input"
                      value="${l}"
                      class="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ingresa tu memo personalizado..."
                    />
                    <button
                      id="update-memo-btn"
                      class="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Aplicar
                    </button>
                  </div>
                </div>

                <!-- Templates predefinidos -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Templates Rápidos:</label>
                  <div class="flex flex-wrap gap-2">
                    <button class="memo-template-btn px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 text-xs rounded-lg transition-colors" data-template="Pago de curación {period} - Aliento.pay">
                      Default
                    </button>
                    <button class="memo-template-btn px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 text-xs rounded-lg transition-colors" data-template="Recompensa de curación {period} para @{username} 🌱">
                      Con emoji
                    </button>
                    <button class="memo-template-btn px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 text-xs rounded-lg transition-colors" data-template="Curación {period} - {amount} HIVE - {date}">
                      Detallado
                    </button>
                    <button class="memo-template-btn px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 text-xs rounded-lg transition-colors" data-template="Gracias por tu delegación {period} - @aliento">
                      Simple
                    </button>
                  </div>
                </div>

                <!-- Preview -->
                <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30">
                  <div class="text-xs text-gray-400 mb-1">Vista Previa (primer pago):</div>
                  <div class="text-sm text-white font-mono" id="memo-preview">
                    ${e.length>0?e[0].memo:"No hay pagos para previsualizar"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de Pagos -->
        <div class="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
              Lista de Pagos
            </h3>
            <div class="text-sm text-gray-400">
              ${e.length} transferencias
            </div>
          </div>

          <div class="max-h-96 overflow-y-auto space-y-2">
            ${s}
          </div>
        </div>
      `,g()}function g(){const e=document.getElementById("update-memo-btn"),o=document.getElementById("memo-template-input"),s=document.querySelectorAll(".memo-template-btn");e&&o&&(e.addEventListener("click",()=>{l=o.value,m()}),o.addEventListener("keypress",a=>{a.key==="Enter"&&(l=o.value,m())}),o.addEventListener("input",a=>{const r=document.getElementById("memo-preview"),n=window.currentPayments||[];if(r&&n.length>0){const t=c(a.target.value,n[0],window.currentPaymentData);r.textContent=t}})),s.forEach(a=>{a.addEventListener("click",()=>{const r=a.getAttribute("data-template");o&&r&&(o.value=r,l=r,m())})})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u):u()})();
