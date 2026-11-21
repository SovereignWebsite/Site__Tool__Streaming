// Writes site/index.html (English) and site/pt/index.html (European Portuguese) from one template,
// so the two languages cannot drift apart. Run: node tools/gen-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORIGIN = 'https://streaming.tool.sovereignweb.site';
const family = readFileSync('site/start/index.html', 'utf8').match(/<details class="family-credit">[\s\S]*?<\/details>/)[0];

const L = {
  en: {
    lang: 'en-GB', locale: 'en_GB', path: '/', other: '/pt/', otherName: 'Português', otherLang: 'pt-PT',
    desc: 'Your own watchlist, notes and preferences for streaming in the UK and Portugal. Kept in your browser, no account.',
    skip: 'Skip to content', h1: 'Your streaming list',
    intro: 'Your own watchlist, seen and hidden titles, ratings, notes and preferences. Everything stays in this browser: no account, no server, no cookies, no tracking.',
    data: 'This site holds no catalogue data. To find out what is streaming, use <a href="https://data.promptugal.news/streaming/" rel="noopener noreferrer">PrompTugal\'s streaming page</a>, then add a title here by pasting its link or typing its name.',
    addH: 'Add a title', addLabel: 'A link to its entry (PrompTugal or themoviedb.org), or its title', addBtn: 'Add',
    listH: 'Your list', fstatus: 'Show', fall: 'All (not hidden)', ftext: 'Search your list', empty: 'Nothing here yet.',
    prefsH: 'Your preferences', services: 'Favourite services', countries: 'Countries', gb: 'United Kingdom', pt: 'Portugal',
    genres: 'Favourite genres (separated by commas)', prefsBtn: 'Save preferences',
    viewsH: 'Saved views', viewsP: 'A saved view is a name and a link to a filtered view on PrompTugal\'s page.', vname: 'Name', vlink: 'Link (data.promptugal.news/streaming/...)', vbtn: 'Save view',
    dataH: 'Your data', dataP: 'Export your list as one JSON file, import it on another device, or wipe it from this browser.', exportBtn: 'Export as JSON', importLabel: 'Import a JSON file', wipeBtn: 'Wipe everything from this browser',
    designLabel: 'Choose a design', designs: ['Paper', 'Night', 'Cinema', 'Coast', 'High contrast'],
    privacyH: 'Privacy', privacy: 'Your list is saved in this browser\'s own storage and goes nowhere else. Clearing your browser data removes it, so export a copy now and then. A personal, non-commercial tool.',
    nav: ['Start here', 'Use with your AI'], foot: ['How this site was made', 'How this site is governed'],
    js: {
      empty: 'Nothing here yet.', open: 'Open entry', remove: 'Remove', norating: 'No rating', noteph: 'Your private note',
      statusfor: 'Status for', ratingfor: 'Rating for', notefor: 'Note for', s_watch: 'To watch', s_seen: 'Seen', s_hidden: 'Hidden',
      added: 'Added.', removed: 'Removed.', prefssaved: 'Preferences saved.', viewadded: 'View saved.', exported: 'Exported.', imported: 'Imported.', wiped: 'Everything removed from this browser.',
      noviews: 'No saved views yet.', nostorage: 'Your browser would not save this. Export a copy to keep it.', confirmwipe: 'Remove everything from this browser?',
      err_empty: 'Type a title or paste a link first.', err_badlink: 'That link does not look right.', err_host: 'Only links to PrompTugal\'s streaming page or themoviedb.org are accepted. Type the title instead.',
      err_notitle: 'No title could be read from that link. Type the title instead.', err_duplicate: 'That title is already on your list.',
      err_noname: 'Give the view a name.', err_viewhost: 'A saved view must be a link to data.promptugal.news/streaming/.', err_import: 'That file is not a Streaming export.'
    }
  },
  pt: {
    lang: 'pt-PT', locale: 'pt_PT', path: '/pt/', other: '/', otherName: 'English', otherLang: 'en-GB',
    desc: 'A sua lista, notas e preferências para streaming no Reino Unido e em Portugal. Guardadas no seu navegador, sem conta.',
    skip: 'Saltar para o conteúdo', h1: 'A sua lista de streaming',
    intro: 'A sua lista para ver, títulos vistos e ocultos, classificações, notas e preferências. Tudo fica neste navegador: sem conta, sem servidor, sem cookies, sem rastreio.',
    data: 'Este sítio não tem dados de catálogo. Para saber o que está em streaming, use a <a href="https://data.promptugal.news/streaming/" rel="noopener noreferrer">página de streaming do PrompTugal</a> e depois acrescente aqui um título, colando a ligação ou escrevendo o nome.',
    addH: 'Acrescentar um título', addLabel: 'Uma ligação para a ficha (PrompTugal ou themoviedb.org) ou o título', addBtn: 'Acrescentar',
    listH: 'A sua lista', fstatus: 'Mostrar', fall: 'Todos (exceto ocultos)', ftext: 'Pesquisar na sua lista', empty: 'Ainda não há nada aqui.',
    prefsH: 'As suas preferências', services: 'Serviços favoritos', countries: 'Países', gb: 'Reino Unido', pt: 'Portugal',
    genres: 'Géneros favoritos (separados por vírgulas)', prefsBtn: 'Guardar preferências',
    viewsH: 'Vistas guardadas', viewsP: 'Uma vista guardada é um nome e uma ligação para uma vista filtrada na página do PrompTugal.', vname: 'Nome', vlink: 'Ligação (data.promptugal.news/streaming/...)', vbtn: 'Guardar vista',
    dataH: 'Os seus dados', dataP: 'Exporte a sua lista num ficheiro JSON, importe-o noutro dispositivo ou apague-a deste navegador.', exportBtn: 'Exportar em JSON', importLabel: 'Importar um ficheiro JSON', wipeBtn: 'Apagar tudo deste navegador',
    designLabel: 'Escolher um desenho', designs: ['Papel', 'Noite', 'Cinema', 'Costa', 'Alto contraste'],
    privacyH: 'Privacidade', privacy: 'A sua lista fica guardada no armazenamento deste navegador e não vai para mais lado nenhum. Se limpar os dados do navegador, perde-a; por isso, exporte uma cópia de vez em quando. Uma ferramenta pessoal e não comercial.',
    nav: ['Começar aqui', 'Usar com a sua IA'], foot: ['Como este sítio foi feito', 'Como este sítio é governado'],
    js: {
      empty: 'Ainda não há nada aqui.', open: 'Abrir ficha', remove: 'Remover', norating: 'Sem classificação', noteph: 'A sua nota privada',
      statusfor: 'Estado de', ratingfor: 'Classificação de', notefor: 'Nota sobre', s_watch: 'Para ver', s_seen: 'Visto', s_hidden: 'Oculto',
      added: 'Acrescentado.', removed: 'Removido.', prefssaved: 'Preferências guardadas.', viewadded: 'Vista guardada.', exported: 'Exportado.', imported: 'Importado.', wiped: 'Tudo foi removido deste navegador.',
      noviews: 'Ainda não há vistas guardadas.', nostorage: 'O navegador não quis guardar isto. Exporte uma cópia para o conservar.', confirmwipe: 'Remover tudo deste navegador?',
      err_empty: 'Escreva primeiro um título ou cole uma ligação.', err_badlink: 'Essa ligação não parece correta.', err_host: 'Só são aceites ligações para a página de streaming do PrompTugal ou para themoviedb.org. Escreva antes o título.',
      err_notitle: 'Não foi possível ler um título dessa ligação. Escreva antes o título.', err_duplicate: 'Esse título já está na sua lista.',
      err_noname: 'Dê um nome à vista.', err_viewhost: 'Uma vista guardada tem de ser uma ligação para data.promptugal.news/streaming/.', err_import: 'Esse ficheiro não é uma exportação do Streaming.'
    }
  }
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page(k) {
  const t = L[k], url = ORIGIN + t.path, other = ORIGIN + t.other;
  const designs = ['paper', 'night', 'cinema', 'coast', 'contrast'].map((d, i) => `<option value="${d}">${t.designs[i]}</option>`).join('');
  const meta = (a, b) => `<meta ${a} content="${esc(b)}">`;
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Streaming</title>
<meta name="description" content="${esc(t.desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Streaming">
<meta property="og:locale" content="${t.locale}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Streaming">
<meta property="og:description" content="${esc(t.desc)}">
<meta property="og:image" content="${ORIGIN}/assets/share/card-1200x630.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Streaming">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Streaming">
<meta name="twitter:description" content="${esc(t.desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/share/card-1200x630.jpg">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-GB" href="${ORIGIN}/">
<link rel="alternate" hreflang="pt-PT" href="${ORIGIN}/pt/">
<link rel="stylesheet" href="/assets/streaming.css">
<script src="/assets/design.js"></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
${family}
<header class="top">
  <a class="name" href="${t.path}">Streaming</a>
  <nav class="own" aria-label="Streaming">
    <a href="/start/">${t.nav[0]}</a>
    <a href="/agents/">${t.nav[1]}</a>
    <a href="${t.other}" hreflang="${t.otherLang}" lang="${t.otherLang}">${t.otherName}</a>
    <span><label class="sr" for="design">${t.designLabel}</label><select id="design" name="design">${designs}</select></span>
  </nav>
</header>
<main id="main">
<div class="mark">streaming.tool.sovereignweb.site</div>
<h1>${t.h1}</h1>
<p>${t.intro}</p>
<p>${t.data}</p>
<p id="msg" class="msg" role="status" aria-live="polite"></p>

<section class="panel" aria-labelledby="add-h">
<h2 id="add-h">${t.addH}</h2>
<form id="add-form" class="row">
  <div class="grow"><label for="add-input">${t.addLabel}</label><input type="text" id="add-input" autocomplete="off"></div>
  <button type="submit">${t.addBtn}</button>
</form>
</section>

<section class="panel" aria-labelledby="list-h">
<h2 id="list-h">${t.listH} <span id="count" class="meta"></span></h2>
<div class="row">
  <div><label for="filter-status">${t.fstatus}</label><select id="filter-status"><option value="">${t.fall}</option><option value="watch">${t.js.s_watch}</option><option value="seen">${t.js.s_seen}</option><option value="hidden">${t.js.s_hidden}</option></select></div>
  <div class="grow"><label for="filter-text">${t.ftext}</label><input type="search" id="filter-text"></div>
</div>
<ul id="items" class="items"></ul>
</section>

<section class="panel" aria-labelledby="prefs-h">
<h2 id="prefs-h">${t.prefsH}</h2>
<form id="prefs-form">
  <fieldset><legend>${t.services}</legend>
    <label><input type="checkbox" id="svc-0"> Netflix</label>
    <label><input type="checkbox" id="svc-1"> Disney+</label>
    <label><input type="checkbox" id="svc-2"> Prime Video</label>
    <label><input type="checkbox" id="svc-3"> Apple TV+</label>
  </fieldset>
  <fieldset><legend>${t.countries}</legend>
    <label><input type="checkbox" id="cty-GB"> ${t.gb}</label>
    <label><input type="checkbox" id="cty-PT"> ${t.pt}</label>
  </fieldset>
  <label for="genres">${t.genres}</label><input type="text" id="genres" autocomplete="off">
  <p><button type="submit">${t.prefsBtn}</button></p>
</form>
</section>

<section class="panel" aria-labelledby="views-h">
<h2 id="views-h">${t.viewsH}</h2>
<p>${t.viewsP}</p>
<ul id="views" class="items"></ul>
<form id="view-form" class="row">
  <div><label for="view-name">${t.vname}</label><input type="text" id="view-name" autocomplete="off"></div>
  <div class="grow"><label for="view-link">${t.vlink}</label><input type="url" id="view-link" autocomplete="off"></div>
  <button type="submit">${t.vbtn}</button>
</form>
</section>

<section class="panel" aria-labelledby="data-h">
<h2 id="data-h">${t.dataH}</h2>
<p>${t.dataP}</p>
<div class="row">
  <button type="button" id="export">${t.exportBtn}</button>
  <div><label for="import">${t.importLabel}</label><input type="file" id="import" accept="application/json,.json"></div>
  <button type="button" id="wipe" class="quiet">${t.wipeBtn}</button>
</div>
</section>

<section aria-labelledby="priv-h">
<h2 id="priv-h">${t.privacyH}</h2>
<p>${t.privacy}</p>
</section>

<footer>
<nav class="site-links" aria-label="About this site">
  <a href="/start/">${t.nav[0]}</a>
  <a href="/agents/">${t.nav[1]}</a>
  <a href="/admin/">${t.foot[0]}</a>
  <a href="/policy/">${t.foot[1]}</a>
</nav>
Sovereign Website. Source: <a href="https://github.com/SovereignWebsite/Site__Tool__Streaming">github.com/SovereignWebsite/Site__Tool__Streaming</a>.</footer>
</main>
<script type="application/json" id="i18n">${JSON.stringify({ ...t.js, empty: t.js.empty }).replace(/</g, '\\u003c')}</script>
<script src="/assets/core.js"></script>
<script src="/assets/app.js"></script>
</body>
</html>
`;
}

mkdirSync('site/pt', { recursive: true });
writeFileSync('site/index.html', page('en'));
writeFileSync('site/pt/index.html', page('pt'));
console.log('pages written');
