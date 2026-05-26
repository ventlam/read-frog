import{i as e}from"./_virtual_wxt-plugins-yldq76bM.js";import{Mt as t}from"./react-dom-oBQsjVJn.js";import{d as n}from"./theme-BFU1-wDU.js";import{ri as r}from"./input-group-CJt1jyd2.js";var i=e(t(),1),a=n();function o({children:e,className:t}){let n=(0,i.useId)(),o=`<svg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'>
  <filter id='${n}'>
    <feTurbulence
      type='fractalNoise'
      baseFrequency='0.9'
      numOctaves='2'
      stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>

  <rect width='100%' height='100%' filter='url(#${n})' opacity='0.03'/>
</svg>`;return(0,a.jsx)(`div`,{className:r(`w-full py-8 flex items-center justify-center rounded-xl my-8`,t),style:{backgroundImage:[`radial-gradient(circle at 70% 10%, rgba(7 240 139 / 0.15), transparent)`,`radial-gradient(circle at 0% 80%, rgba(233 246 54 / 0.1), transparent)`,`radial-gradient(circle at 50% 50%, rgba(235 183 51 / 0.08), transparent)`,`url("data:image/svg+xml,${encodeURIComponent(o)}")`].join(`, `)},children:e})}export{o as t};