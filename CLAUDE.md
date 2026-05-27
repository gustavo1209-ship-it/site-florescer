# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Dois arquivos HTML standalone — sem bundler, sem npm, sem dependências locais. Basta abrir no navegador ou servir com qualquer servidor estático.

| Arquivo | Uso |
|---|---|
| `mapa-lotes-florescer.html` | Versão de referência estável (não editar sem criar nova versão) |
| `mapa-lotes-florescer-v2.html` | Versão com mobile fix: rotação, fitAndCenter, safe-area, contain |
| `mapa-lotes-florescer-v3.html` | **Versão atual em uso** — igual à v2 + footer 20px mais alto para iOS Safari |
| `mapa-lotes-florescer-mobile-fix.html` | Cópia de backup sempre atualizada com a versão mais recente |
| `editor-ids.html` | Ferramenta interna para editar IDs e status dos lotes; gera JSON para copiar no mapa |

> **Regra de versioning:** nunca sobrescrever versões aprovadas. Criar `vN+1` e manter as anteriores.

---

## Dependências externas (CDN)

Apenas em `mapa-lotes-florescer*.html`:
- **qrcodejs** `1.0.0` — gera o QR code do Instagram no canto inferior direito
- **@panzoom/panzoom** `4.5.1` — pan/zoom do mapa SVG
- **Google Fonts** — Bebas Neue + Raleway

---

## Arquitetura do mapa

### Dados dos lotes — `LOT_DATA`

`LOT_DATA` é um objeto JS inline. Cada entrada tem:
```js
"A01": { id, quadra, status, sts, area, pts, centroid }
```
- `sts` é numérico 1–5 (Livre=1, Vendido=2, Reservado=3, Não Disponível=4, Projeto=5)
- `pts` são os vértices do polígono SVG em coordenadas do canvas (1920×1080 base)
- O SVG renderiza cada lote como `<polygon class="lote sts-N" data-id="...">` + `<text class="lot-label">` para o ID

### Sincronização com Google Sheets

`syncFromSheet()` busca a planilha "Espelho de Vendas" via endpoint `gviz/CSV` a cada 5 minutos. Atualiza `status`, `sts` e `area` nos objetos do `LOT_DATA` e recolore os polígonos SVG diretamente no DOM. O `LOT_DATA` inline age como fallback.

**IDs da planilha:**
- `SHEET_ID = '1o4-YxN0ujoNQ52Nu7MkM_d6usSMkhTl8z939m7JVBSw'`
- `SHEET_GID = '1375840424'`

---

## Mobile — comportamento crítico

### Rotação do SVG

O SVG base é 1920×1080 (landscape). No mobile (`innerWidth ≤ 640`) o conteúdo é rotacionado 90° antes de inicializar o panzoom:

```js
const MOB = window.innerWidth <= 640;
if (MOB) {
  const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  wrap.setAttribute('transform', 'translate(0,1920) rotate(-90)');
  while (svgEl.firstChild) wrap.appendChild(svgEl.firstChild);
  svgEl.appendChild(wrap);
  svgEl.setAttribute('viewBox', '0 0 1080 1920');
  svgEl.setAttribute('width', '1080');
  svgEl.setAttribute('height', '1920');
}
const svgW = MOB ? 1080 : 1920, svgH = MOB ? 1920 : 1080;
```

O `focusLot()` também corrige as coordenadas do centróide para o espaço rotacionado:
```js
if (MOB) { const t = cy; cy = 1920 - cx; cx = t; }
```

### fitAndCenter

Calcula a escala "contain" (Math.min) e posiciona o mapa. No mobile ancora no canto superior esquerdo; no desktop centraliza:

```js
function fitAndCenter() {
  const cw = mapCont.clientWidth, ch = mapCont.clientHeight;
  if (!cw || !ch) return;
  const s  = Math.min(cw / svgW, ch / svgH);
  const px = MOB ? 0 : (cw - svgW * s) / 2;
  const py = MOB ? 0 : (ch - svgH * s) / 2;
  panzoom.setOptions({ minScale: s });   // impede zoom-out além do mapa completo
  panzoom.zoom(s, { animate: false });
  panzoom.pan(px, py, { animate: false });
}
```

Chamado no load:
```js
window.addEventListener('load', () => {
  requestAnimationFrame(fitAndCenter);
  setTimeout(fitAndCenter, 250); // fallback iOS
});
```

### Panzoom

```js
const panzoom = Panzoom(svgEl, {
  maxScale: 14, minScale: 0.25, step: 0.3, canvas: true,
  contain: 'outside',   // impede arrastar para além das bordas (sem bege visível)
  handleStartEvent: e => e.preventDefault(),
  touchAction: 'none'
});
```

**Atenção:** NÃO usar `contain: 'inside'` — impede zoom-in no panzoom v4.5.1.

### Armadilha do touchstart

**NÃO adicionar** este padrão — quebra os cliques no footer no mobile:
```js
// ERRADO — chama preventDefault em TODOS os toques fora do mapa
document.addEventListener('touchstart', e => {
  if (!mapCont.contains(e.target)) e.preventDefault();
}, { passive: false });
```

O listener correto para bloquear rubber-band do iOS é apenas no `touchmove`:
```js
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
```

---

## iOS Safari — safe area

O `viewport-fit=cover` é obrigatório para que `env(safe-area-inset-bottom)` funcione:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

CSS mobile (`@media (max-width: 640px)`):
```css
#footer {
  height: calc(48px + env(safe-area-inset-bottom));
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  gap: 0;
}
#map-container { top: 60px; bottom: calc(48px + env(safe-area-inset-bottom)); overflow: hidden; }
#map-controls  { bottom: calc(56px + env(safe-area-inset-bottom)); left: 6px; }
#info-panel    { bottom: calc(48px + env(safe-area-inset-bottom)); }
```

O `padding-bottom` extra de 20px (além do inset) empurra os botões do footer acima da barra compacta do Safari iOS.

---

## Layout CSS — estrutura fixa

| Elemento | Desktop | Mobile |
|---|---|---|
| `#header` | `top:0; height:86px; z-index:500` | `height:60px` |
| `#footer` | `bottom:0; height:36px; z-index:400` | `height:calc(48px + env(...))` |
| `#map-container` | `top:86px; bottom:36px` | `top:60px; bottom:calc(48px + env(...))` |
| `#map-controls` | `bottom:52px; left:14px` | `bottom:calc(56px + env(...)); left:6px` |
| `#info-panel` | `top:100px; right:14px` (painel lateral) | `bottom:calc(48px+env(...)); left:0; right:0` (bottom sheet) |

Footer desktop: links de texto. Footer mobile (`#footer-mob`): ícones de site, Instagram, YouTube e WhatsApp.

---

## Paleta de cores CSS

```
--purple:    #5B2166   --purple-dk: #3D1645   --purple-lt: #7B3A8E
--gold:      #C4A550   --gold-lt:   #D4B860
--beige:     #E8E3D5   --beige-lt:  #F2EEE4   --beige-dk:  #D4CDB8
--text:      #2C1840   --text-lt:   #6B5478
```

Classes de status: `.sts-1` verde · `.sts-2` vermelho · `.sts-3` dourado · `.sts-4` laranja · `.sts-5` roxo

---

## Fluxo de atualização

1. Abrir `editor-ids.html`, editar status, clicar **Exportar mapa**.
2. Substituir o objeto `LOT_DATA` em `mapa-lotes-florescer-v3.html`.
3. Push para `main` no repositório GitHub — GitHub Pages publica automaticamente.

> O arquivo ultrapassa 50 000 caracteres; hospedado no GitHub Pages e incorporado no Webflow via `<iframe>`.
