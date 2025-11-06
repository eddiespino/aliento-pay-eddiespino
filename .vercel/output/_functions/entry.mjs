import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_CPZ_lpoe.mjs';
import { manifest } from './manifest_CqK1n-K7.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/auth/login.astro.mjs');
const _page3 = () => import('./pages/api/auth/logout.astro.mjs');
const _page4 = () => import('./pages/api/auth/validate.astro.mjs');
const _page5 = () => import('./pages/api/calculate.astro.mjs');
const _page6 = () => import('./pages/api/curation-stats.astro.mjs');
const _page7 = () => import('./pages/api/filters.astro.mjs');
const _page8 = () => import('./pages/calculate.astro.mjs');
const _page9 = () => import('./pages/dashboard.astro.mjs');
const _page10 = () => import('./pages/payments.astro.mjs');
const _page11 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/api/auth/login.ts", _page2],
    ["src/pages/api/auth/logout.ts", _page3],
    ["src/pages/api/auth/validate.ts", _page4],
    ["src/pages/api/calculate.ts", _page5],
    ["src/pages/api/curation-stats.ts", _page6],
    ["src/pages/api/filters.ts", _page7],
    ["src/pages/calculate.astro", _page8],
    ["src/pages/dashboard.astro", _page9],
    ["src/pages/payments.astro", _page10],
    ["src/pages/index.astro", _page11]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "4aff87ce-473d-4f2e-8630-302ee2e71033",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
