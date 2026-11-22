// Writes site/index.html (English) and site/pt/index.html (European Portuguese) from one template,
// so the two languages cannot drift apart. Run: node tools/gen-pages.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORIGIN = 'https://streaming.tool.sovereignweb.site';
const family = readFileSync('tools/content/family-credit.html', 'utf8');
const familyPt = family.replace('>Sovereign Website<', '>Sovereign Website<').replace('Start here', 'Começar aqui').replace('Use with your AI', 'Usar com a sua IA').replace('How this site was made', 'Como este sítio foi feito').replace('href="/start/"', 'href="/pt/start/"').replace('href="/agents/"', 'href="/pt/agents/"').replace('href="/admin/"', 'href="/pt/admin/"');

const PT_LINK = 'https://data.promptugal.news/streaming/';
const L = {
  en: {
    lang: 'en-GB', locale: 'en_GB', otherName: 'Português', otherLang: 'pt-PT',
    desc: 'Your own watchlist, notes and preferences for streaming in the UK and Portugal. Kept in your browser, no account.',
    skip: 'Skip to content', nav: ['Start here', 'Use with your AI'], foot: ['How this site was made', 'How this site is governed'],
    designLabel: 'Choose a design', designBtn: 'Design', designP: 'Each design shows the same list, your own, in a different way. Your choice is kept in this browser only.', useBtn: 'Use this design', inUse: 'In use', autoBtn: 'Automatic (The shelf, light or dark as your device asks)', closeBtn: 'Close', shotAlt: '{d}, shown with made-up titles',
    designDesc: ['Every title a cover on a shelf. Tap a cover for its record.', 'Tonight\'s title in a large card, then the rest in your own order.', 'Each title an index card, with your note written large.', 'Your figures and charts, then what you have seen as dated ticket stubs.', 'A calm checklist with a small poster beside each title.'], designs: ['Automatic (The shelf)', 'The shelf', 'The queue', 'Index cards', 'Ticket stubs', 'The list'],
    h1: 'Your streaming list',
    lead: 'Your watchlist, kept in this browser. No account, no server, no cookies, no tracking.',
    addLabel: 'Add a title', addPh: 'Paste a link, or type a title', addBtn: 'Add',
    addHelp: `Find titles on <a href="${PT_LINK}" rel="noopener noreferrer">PrompTugal's streaming page</a>, then paste a link (anywhere on this page) or type a name.`,
    tabsLabel: 'Your list', search: 'Search your list', sort: 'Sort by', sortNew: 'Newest first', sortTitle: 'Title', sortRating: 'Rating',
    moreH: 'Preferences and saved views',
    moreP: `Kept here for when <a href="${PT_LINK}" rel="noopener noreferrer">PrompTugal's page</a> can open a filtered view from a link. Nothing uses them yet.`,
    services: 'Favourite services', countries: 'Countries', gb: 'United Kingdom', pt: 'Portugal',
    genres: 'Favourite genres (separated by commas)', prefsBtn: 'Save preferences',
    viewsH: 'Saved views', vname: 'Name', vlink: 'Link to the view', vbtn: 'Save view',
    dataH: 'Your data', dataP: 'Export your list as one JSON file, import it on another device, or wipe it from this browser.',
    withPics: 'Include your pictures', exportBtn: 'Export as JSON', importLabel: 'Import a JSON file', merge: 'Add to my list instead of replacing it', wipeBtn: 'Wipe everything from this browser',
    privacy: 'Your list is saved in this browser\'s own storage and goes nowhere else. Clearing your browser data removes it, so export a copy now and then. A personal, non-commercial tool.',
    js: {
      tab_watch: 'To watch', tab_seen: 'Seen', tab_hidden: 'Hidden', count_watch: '{n} to watch', count_seen: '{n} seen', count_hidden: '{n} hidden', countTag: ' tagged #{t}',
      more: 'More', newTicket: 'New ticket', allTitles: 'All titles', refineBtn: 'Search and tags', addQueue: 'Add to the queue', addTile: 'Add a title',
      edit: 'Note and tags', notePh: 'Your private note', tagsLabel: 'Your tags (separated by commas)', tagsPh: 'family, weekend',
      allTags: 'All', tagFilter: 'Filter by tag', filterTag: 'Show only #{t}', filterTagCount: 'Show only #{t} ({n} titles)',
      undo: 'Undo', undone: 'Put back.', removedT: 'Removed {t}.', hiddenT: 'Hid {t}.',
      pickBtn: 'Pick something for tonight', pickTag: 'Pick something tagged #{t}', pickTitle: 'Tonight:', pickAgain: 'Pick again', close: 'Close', picked: 'Picked {t}.',
      openRecord: 'Record', recordH: 'Record', r_status: 'Status', r_rating: 'Your rating', r_tags: 'Your tags', r_note: 'Your note', r_added: 'Added', r_seen: 'Seen on', r_link: 'Link', none: 'None',
      picAdd: 'Add your own picture', picChange: 'Change your picture', picRemove: 'Remove your picture', picNote: 'Your picture is shrunk and kept in this browser only. Without one, the title gets a poster drawn from its own words.',
      picSaved: 'Picture saved in this browser.', picFailed: 'That file could not be read as a picture.', picRemoved: 'Picture removed.', r_picture: 'Picture', picOwn: 'Your own, kept in this browser', picGenerated: 'Drawn from the title',
      noNote: 'No note yet.', addedOn: 'Added {d}', seenOn: 'seen {d}',
      moveUp: 'Move up', moveDown: 'Move down', makeTonight: 'Watch tonight', movedUp: 'Moved {t} up.', movedDown: 'Moved {t} down.', madeTonight: '{t} is up next.', upNext: 'Up next', laterH: 'After that',
      admitOne: 'Admit one', unusedH: 'Still to watch', asTable: 'Show as a table', noTags: 'No tags yet. Add some with Note and tags.',
      statsH: 'Your figures', statSeen: 'Seen', statWatch: 'To watch', statAvg: 'Average rating',
      chartMonths: 'Titles seen, last 12 months', tipMonth: '{m}: {n} seen', colMonth: 'Month', colSeen: 'Seen',
      chartRatings: 'Your ratings', tipRating: '{s}: {n}', oneStar: '1 star', nStars: '{s} stars', oneTitle: '1 title', nTitles: '{n} titles', exampleShort: 'Example list, made up.', exampleRemove: 'Remove', addOpen: 'Add a title', colRating: 'Rating', colTitles: 'Titles', chartTags: 'Your tags',
      jsonH: 'This record as JSON', copy: 'Copy JSON', copied: 'Copied.', copyFailed: 'Your browser would not copy it. Select the text and copy it instead.', download: 'Download JSON',
      markSeen: 'Mark as seen', toWatch: 'Back to watch', hide: 'Hide', unhide: 'Unhide', note: 'Add a note', editNote: 'Edit note', saveNote: 'Save note', cancel: 'Cancel',
      remove: 'Remove', open: 'Open entry', rateFor: 'Rating for {t}', star: '{n} out of 5', noteFor: 'Note for {t}', actionsFor: '{a}: {t}',
      emptyWatch: 'Your list is empty.', emptySteps: ['Find a title on PrompTugal\'s streaming page.', 'Copy its link, or just its name.', 'Paste it in the box above and press Add.'],
      emptySeen: 'Nothing marked as seen yet.', emptyHidden: 'Nothing hidden.', noMatch: 'Nothing in this list matches your search.',
      exampleBtn: 'Show an example list', exampleBanner: 'This is an example, with made-up titles. Adding your own title removes it.', exampleClear: 'Remove the example',
      examples: [
        {"title": "The Imaginary Lighthouse", "status": "watch", "rating": 0, "note": "Made up for this example.", "tags": ["family", "weekend"]},
        {"title": "Sample Harbour Nights", "status": "watch", "rating": 0, "note": "", "tags": ["weekend"]},
        {"title": "Paper Moon Over Lisbon", "status": "watch", "rating": 0, "note": "", "tags": ["family"]},
        {"title": "The Last Pretend Train", "status": "watch", "rating": 0, "note": "", "tags": ["crime"]},
        {"title": "Made-up Comedy Hour", "status": "watch", "rating": 0, "note": "", "tags": ["comedy"]},
        {"title": "Placeholder Hills", "status": "seen", "rating": 4, "note": "A made-up title. Your notes stay in this browser.", "tags": ["family"], "seenDaysAgo": 9},
        {"title": "A Fictional Coast", "status": "seen", "rating": 5, "note": "", "tags": ["documentary"], "seenDaysAgo": 20},
        {"title": "The Invented Detective", "status": "seen", "rating": 3, "note": "", "tags": ["crime"], "seenDaysAgo": 34},
        {"title": "Nowhere Station", "status": "seen", "rating": 4, "note": "", "tags": ["crime", "weekend"], "seenDaysAgo": 52},
        {"title": "Example Valley", "status": "seen", "rating": 5, "note": "", "tags": ["documentary"], "seenDaysAgo": 83},
        {"title": "Ten Imaginary Summers", "status": "seen", "rating": 2, "note": "", "tags": [], "seenDaysAgo": 110},
        {"title": "Quiet Fictional Streets", "status": "hidden", "rating": 1, "note": "", "tags": []}
      ],
      added: 'Added.', removed: 'Removed.', prefssaved: 'Preferences saved.', viewadded: 'View saved.', exported: 'Exported.', imported: 'Imported.', merged: 'Added {n} new titles.', wiped: 'Everything removed from this browser.',
      moved_seen: 'Marked as seen.', moved_watch: 'Back on your watchlist.', moved_hidden: 'Hidden.', noteSaved: 'Note saved.', rated: 'Rated {n} out of 5.', unrated: 'Rating cleared.',
      noviews: 'No saved views yet.', nostorage: 'Your browser would not save this. Export a copy to keep it.', confirmwipe: 'Remove everything from this browser?',
      err_empty: 'Type a title or paste a link first.', err_badlink: 'That link does not look right.', err_host: 'Only links to PrompTugal\'s streaming page or themoviedb.org are accepted. Type the title instead.',
      err_notitle: 'No title could be read from that link. Type the title instead.', err_duplicate: 'That title is already on your list.',
      err_noname: 'Give the view a name.', err_viewhost: 'A saved view must be a link to data.promptugal.news/streaming/.', err_import: 'That file is not a Streaming export.'
    }
  },
  pt: {
    lang: 'pt-PT', locale: 'pt_PT', otherName: 'English', otherLang: 'en-GB',
    desc: 'A sua lista, notas e preferências para streaming no Reino Unido e em Portugal. Guardadas no seu navegador, sem conta.',
    skip: 'Saltar para o conteúdo', nav: ['Começar aqui', 'Usar com a sua IA'], foot: ['Como este sítio foi feito', 'Como este sítio é governado'],
    designLabel: 'Escolher um desenho', designBtn: 'Desenho', designP: 'Cada desenho mostra a mesma lista, a sua, de outra maneira. A escolha fica só neste navegador.', useBtn: 'Usar este desenho', inUse: 'Em uso', autoBtn: 'Automático (A prateleira, clara ou escura conforme o dispositivo)', closeBtn: 'Fechar', shotAlt: '{d}, com títulos inventados',
    designDesc: ['Cada título é uma capa numa prateleira. Toque numa capa para ver a ficha.', 'O título de hoje num cartão grande e depois os outros pela sua ordem.', 'Cada título é uma ficha, com a sua nota em letra grande.', 'Os seus números e gráficos e depois o que já viu, em bilhetes datados.', 'Uma lista simples, com um pequeno cartaz ao lado de cada título.'], designs: ['Automático (A prateleira)', 'A prateleira', 'A fila', 'Fichas', 'Bilhetes', 'A lista'],
    h1: 'A sua lista de streaming',
    lead: 'A sua lista para ver, guardada neste navegador. Sem conta, sem servidor, sem cookies, sem rastreio.',
    addLabel: 'Adicionar um título', addPh: 'Ligação ou título', addBtn: 'Adicionar',
    addHelp: `Procure títulos na <a href="${PT_LINK}" rel="noopener noreferrer">página de streaming do PrompTugal</a> e depois cole uma ligação (em qualquer ponto da página) ou escreva um nome.`,
    tabsLabel: 'A sua lista', search: 'Pesquisar na sua lista', sort: 'Ordenar por', sortNew: 'Mais recentes primeiro', sortTitle: 'Título', sortRating: 'Classificação',
    moreH: 'Preferências e vistas guardadas',
    moreP: `Ficam aqui para quando a <a href="${PT_LINK}" rel="noopener noreferrer">página do PrompTugal</a> puder abrir uma vista filtrada a partir de uma ligação. Ainda nada as usa.`,
    services: 'Serviços favoritos', countries: 'Países', gb: 'Reino Unido', pt: 'Portugal',
    genres: 'Géneros favoritos (separados por vírgulas)', prefsBtn: 'Guardar preferências',
    viewsH: 'Vistas guardadas', vname: 'Nome', vlink: 'Ligação para a vista', vbtn: 'Guardar vista',
    dataH: 'Os seus dados', dataP: 'Exporte a sua lista num ficheiro JSON, importe-o noutro dispositivo ou apague-a deste navegador.',
    withPics: 'Incluir as suas imagens', exportBtn: 'Exportar em JSON', importLabel: 'Importar um ficheiro JSON', merge: 'Juntar à minha lista em vez de a substituir', wipeBtn: 'Apagar tudo deste navegador',
    privacy: 'A sua lista fica guardada no armazenamento deste navegador e não vai para mais lado nenhum. Se limpar os dados do navegador, perde-a; por isso, exporte uma cópia de vez em quando. Uma ferramenta pessoal e não comercial.',
    js: {
      tab_watch: 'Para ver', tab_seen: 'Vistos', tab_hidden: 'Ocultos', count_watch: '{n} para ver', count_seen: '{n} vistos', count_hidden: '{n} ocultos', countTag: ' com #{t}',
      more: 'Mais', newTicket: 'Novo bilhete', allTitles: 'Todos os títulos', refineBtn: 'Pesquisa e etiquetas', addQueue: 'Adicionar à fila', addTile: 'Adicionar um título',
      edit: 'Nota e etiquetas', notePh: 'A sua nota privada', tagsLabel: 'As suas etiquetas (separadas por vírgulas)', tagsPh: 'família, fim de semana',
      allTags: 'Todas', tagFilter: 'Filtrar por etiqueta', filterTag: 'Mostrar só #{t}', filterTagCount: 'Mostrar só #{t} ({n} títulos)',
      undo: 'Anular', undone: 'Reposto.', removedT: 'Removeu {t}.', hiddenT: 'Ocultou {t}.',
      pickBtn: 'Escolher algo para hoje à noite', pickTag: 'Escolher algo com #{t}', pickTitle: 'Hoje à noite:', pickAgain: 'Escolher outra vez', close: 'Fechar', picked: 'Escolhido: {t}.',
      openRecord: 'Ficha', recordH: 'Ficha', r_status: 'Estado', r_rating: 'A sua classificação', r_tags: 'As suas etiquetas', r_note: 'A sua nota', r_added: 'Adicionado', r_seen: 'Visto em', r_link: 'Ligação', none: 'Nenhuma',
      picAdd: 'Adicionar uma imagem sua', picChange: 'Mudar a sua imagem', picRemove: 'Remover a sua imagem', picNote: 'A sua imagem é reduzida e fica só neste navegador. Sem imagem, o título recebe um cartaz desenhado a partir das suas próprias palavras.',
      picSaved: 'Imagem guardada neste navegador.', picFailed: 'Não foi possível ler esse ficheiro como imagem.', picRemoved: 'Imagem removida.', r_picture: 'Imagem', picOwn: 'Sua, guardada neste navegador', picGenerated: 'Desenhada a partir do título',
      noNote: 'Ainda sem nota.', addedOn: 'Adicionado a {d}', seenOn: 'visto a {d}',
      moveUp: 'Subir', moveDown: 'Descer', makeTonight: 'Ver hoje', movedUp: '{t} subiu.', movedDown: '{t} desceu.', madeTonight: '{t} é o próximo.', upNext: 'A seguir', laterH: 'Depois',
      admitOne: 'Entrada individual', unusedH: 'Ainda por ver', asTable: 'Mostrar em tabela', noTags: 'Ainda sem etiquetas. Acrescente-as em Nota e etiquetas.',
      statsH: 'Os seus números', statSeen: 'Vistos', statWatch: 'Para ver', statAvg: 'Classificação média',
      chartMonths: 'Títulos vistos, últimos 12 meses', tipMonth: '{m}: {n} vistos', colMonth: 'Mês', colSeen: 'Vistos',
      chartRatings: 'As suas classificações', tipRating: '{s}: {n}', oneStar: '1 estrela', nStars: '{s} estrelas', oneTitle: '1 título', nTitles: '{n} títulos', exampleShort: 'Lista de exemplo, inventada.', exampleRemove: 'Remover', addOpen: 'Adicionar um título', colRating: 'Classificação', colTitles: 'Títulos', chartTags: 'As suas etiquetas',
      jsonH: 'Esta ficha em JSON', copy: 'Copiar JSON', copied: 'Copiado.', copyFailed: 'O navegador não quis copiar. Selecione o texto e copie-o.', download: 'Descarregar JSON',
      markSeen: 'Marcar como visto', toWatch: 'Voltar a para ver', hide: 'Ocultar', unhide: 'Mostrar', note: 'Adicionar nota', editNote: 'Editar nota', saveNote: 'Guardar nota', cancel: 'Cancelar',
      remove: 'Remover', open: 'Abrir ficha', rateFor: 'Classificação de {t}', star: '{n} em 5', noteFor: 'Nota sobre {t}', actionsFor: '{a}: {t}',
      emptyWatch: 'A sua lista está vazia.', emptySteps: ['Procure um título na página de streaming do PrompTugal.', 'Copie a ligação, ou só o nome.', 'Cole-o na caixa acima e prima Adicionar.'],
      emptySeen: 'Ainda não marcou nada como visto.', emptyHidden: 'Nada oculto.', noMatch: 'Nada nesta lista corresponde à sua pesquisa.',
      exampleBtn: 'Mostrar uma lista de exemplo', exampleBanner: 'Isto é um exemplo, com títulos inventados. Ao adicionar um título seu, o exemplo desaparece.', exampleClear: 'Remover o exemplo',
      examples: [
        {"title": "O Farol Imaginário", "status": "watch", "rating": 0, "note": "Inventado para este exemplo.", "tags": ["família", "fim de semana"]},
        {"title": "Noites no Porto de Exemplo", "status": "watch", "rating": 0, "note": "", "tags": ["fim de semana"]},
        {"title": "Lua de Papel sobre Lisboa", "status": "watch", "rating": 0, "note": "", "tags": ["família"]},
        {"title": "O Último Comboio a Fingir", "status": "watch", "rating": 0, "note": "", "tags": ["policial"]},
        {"title": "Hora da Comédia Inventada", "status": "watch", "rating": 0, "note": "", "tags": ["comédia"]},
        {"title": "As Colinas Fictícias", "status": "seen", "rating": 4, "note": "Um título inventado. As suas notas ficam neste navegador.", "tags": ["família"], "seenDaysAgo": 9},
        {"title": "Uma Costa Inventada", "status": "seen", "rating": 5, "note": "", "tags": ["documentário"], "seenDaysAgo": 20},
        {"title": "O Detetive Inventado", "status": "seen", "rating": 3, "note": "", "tags": ["policial"], "seenDaysAgo": 34},
        {"title": "Estação de Lado Nenhum", "status": "seen", "rating": 4, "note": "", "tags": ["policial", "fim de semana"], "seenDaysAgo": 52},
        {"title": "Vale de Exemplo", "status": "seen", "rating": 5, "note": "", "tags": ["documentário"], "seenDaysAgo": 83},
        {"title": "Dez Verões Imaginários", "status": "seen", "rating": 2, "note": "", "tags": [], "seenDaysAgo": 110},
        {"title": "Ruas Fictícias e Calmas", "status": "hidden", "rating": 1, "note": "", "tags": []}
      ],
      added: 'Adicionado.', removed: 'Removido.', prefssaved: 'Preferências guardadas.', viewadded: 'Vista guardada.', exported: 'Exportado.', imported: 'Importado.', merged: 'Foram adicionados {n} títulos novos.', wiped: 'Tudo foi removido deste navegador.',
      moved_seen: 'Marcado como visto.', moved_watch: 'De volta à sua lista para ver.', moved_hidden: 'Oculto.', noteSaved: 'Nota guardada.', rated: 'Classificado com {n} em 5.', unrated: 'Classificação removida.',
      noviews: 'Ainda não há vistas guardadas.', nostorage: 'O navegador não quis guardar isto. Exporte uma cópia para o conservar.', confirmwipe: 'Remover tudo deste navegador?',
      err_empty: 'Escreva primeiro um título ou cole uma ligação.', err_badlink: 'Essa ligação não parece correta.', err_host: 'Só são aceites ligações para a página de streaming do PrompTugal ou para themoviedb.org. Escreva antes o título.',
      err_notitle: 'Não foi possível ler um título dessa ligação. Escreva antes o título.', err_duplicate: 'Esse título já está na sua lista.',
      err_noname: 'Dê um nome à vista.', err_viewhost: 'Uma vista guardada tem de ser uma ligação para data.promptugal.news/streaming/.', err_import: 'Esse ficheiro não é uma exportação do Streaming.'
    }
  }
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function shell(k, o) {
  const t = L[k], url = ORIGIN + o.path, pre = k === 'pt' ? '/pt' : '';
  const designs = ['auto', 'shelf', 'queue', 'cards', 'stubs', 'list'].map((d, i) => `<option value="${d}">${t.designs[i]}</option>`).join('');
  const meta = (a, b) => `<meta ${a} content="${esc(b)}">`;
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Streaming">
<meta property="og:locale" content="${t.locale}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:image" content="${ORIGIN}/assets/share/card-1200x630.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Streaming">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/share/card-1200x630.jpg">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-GB" href="${ORIGIN}${o.en}">
<link rel="alternate" hreflang="pt-PT" href="${ORIGIN}${o.pt}">
<link rel="stylesheet" href="/assets/streaming.css">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#2f6b4f">
<link rel="icon" href="/assets/icons/icon-192.png" type="image/png">
<script src="/assets/design.js"></script>
<script src="/assets/pwa.js" defer></script>
<script src="/assets/design-control.js" defer></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
${k === 'pt' ? familyPt : family}
<header class="top">
  <a class="name" href="${pre}/">Streaming</a>
  <button type="button" id="design-open" class="design-open" aria-haspopup="dialog" hidden>${t.designBtn}</button>
  <nav class="own" aria-label="Streaming">
    <a href="${pre}/start/">${t.nav[0]}</a>
    <a href="${pre}/agents/">${t.nav[1]}</a>
    <a href="${k === 'pt' ? o.en : o.pt}" hreflang="${t.otherLang}" lang="${t.otherLang}">${t.otherName}</a>
  </nav>
</header>
<dialog id="design-dialog" class="design-dialog" aria-labelledby="design-dialog-h" data-in-use="${t.inUse}">
  <h2 id="design-dialog-h">${t.designLabel}</h2>
  <p>${t.designP}</p>
  <ul class="design-cards">
${['shelf', 'queue', 'cards', 'stubs', 'list'].map((d, i) => `    <li><img src="/assets/designs/${d}.jpg" alt="${esc(t.shotAlt.replace('{d}', t.designs[i + 1]))}" width="390" height="520" loading="lazy"><h3>${t.designs[i + 1]}</h3><p>${t.designDesc[i]}</p><button type="button" class="design-use" data-design="${d}">${t.useBtn}</button></li>`).join('\n')}
  </ul>
  <p class="design-foot"><button type="button" class="design-use quiet" data-design="auto">${t.autoBtn}</button> <button type="button" id="design-close" class="quiet">${t.closeBtn}</button></p>
</dialog>
<main id="main">
${o.main}
<footer>
<nav class="site-links" aria-label="About this site">
  <a href="${pre}/start/">${t.nav[0]}</a>
  <a href="${pre}/agents/">${t.nav[1]}</a>
  <a href="${pre}/admin/">${t.foot[0]}</a>
  <a href="${pre}/policy/">${t.foot[1]}</a>
</nav>
<p class="design-pick"><label for="design">${t.designLabel}</label> <select id="design" name="design">${designs}</select></p>
Sovereign Website. Source: <a href="https://github.com/SovereignWebsite/Site__Tool__Streaming">github.com/SovereignWebsite/Site__Tool__Streaming</a>.</footer>
</main>
${o.scripts || ''}
</body>
</html>
`;
}

function homeMain(k) {
  const t = L[k];
  return `<h1>${t.h1}</h1>
<p class="lead">${t.lead}</p>
<div id="add-home"></div>
<form id="add-form" class="add" aria-labelledby="add-label">
  <label id="add-label" for="add-input">${t.addLabel}</label>
  <div class="add-row">
    <input type="text" id="add-input" autocomplete="off" placeholder="${t.addPh}">
    <button type="submit">${t.addBtn}</button>
  </div>
  <p class="help" id="add-help">${t.addHelp}</p>
</form>

<section class="list" aria-labelledby="list-h">
<h2 id="list-h" class="sr">${t.tabsLabel}</h2>
<p id="msg" class="msg" role="status" aria-live="polite"></p>
<div id="hero" class="hero"></div>
<p class="ticket-row" id="ticket-row" hidden><button type="button" id="ticket-toggle" class="chip" aria-expanded="false">${t.js.newTicket}</button></p>
<div id="ticket-slot"></div>
<p class="all-row" id="all-row" hidden><button type="button" id="all-toggle" class="chip quiet-chip" aria-expanded="false" aria-controls="tabsblock">${t.js.allTitles}</button></p>
<div id="tabsblock" class="tabsblock">
<div class="tabs" role="group" aria-label="${t.tabsLabel}">
  <button type="button" class="tab" data-status="watch" aria-pressed="true">${t.js.tab_watch} <span class="n" id="n-watch">0</span></button>
  <button type="button" class="tab" data-status="seen" aria-pressed="false">${t.js.tab_seen} <span class="n" id="n-seen">0</span></button>
  <button type="button" class="tab" data-status="hidden" aria-pressed="false">${t.js.tab_hidden} <span class="n" id="n-hidden">0</span></button>
</div>
<p id="list-count" class="list-count"></p>
</div>
<div class="bar2">
  <div id="pickbar" class="pickbar" hidden><button type="button" id="pick-btn" class="quiet">${t.js.pickBtn}</button></div>
  <button type="button" id="refine-toggle" class="chip quiet-chip" aria-expanded="false" aria-controls="refine" hidden>${t.js.refineBtn}</button>
</div>
<div id="pick-card" class="pick-card" hidden></div>
<div id="refine" class="refine">
<div id="tagbar" class="tagbar" role="group" aria-label="${t.js.tagFilter}" hidden></div>
<div id="tools" class="tools" hidden>
  <div class="grow"><label for="filter-text">${t.search}</label><input type="search" id="filter-text"></div>
  <div id="sort-wrap"><label for="sort">${t.sort}</label><select id="sort"><option value="new">${t.sortNew}</option><option value="title">${t.sortTitle}</option><option value="rating">${t.sortRating}</option></select></div>
</div>
</div>
<div id="example-banner" class="banner" hidden><p>${t.js.exampleShort}</p><button type="button" id="example-clear" class="text-danger" aria-label="${t.js.exampleClear}">${t.js.exampleRemove}</button></div>
<div id="stage" class="stage"></div>
<div id="empty" class="empty" hidden></div>
<div id="add-slot"></div>
</section>

<div id="toast" class="toast" role="status" hidden><span id="toast-msg"></span> <button type="button" id="toast-undo">${t.js.undo}</button></div>

<dialog id="record" class="record" aria-labelledby="record-h">
  <div class="record-top"><div id="record-art" class="record-art"></div><div><p class="mark">${t.js.recordH}</p>
  <h2 id="record-h"></h2></div></div>
  <dl id="record-dl"></dl>
  <div class="row">
    <button type="button" id="rec-copy">${t.js.copy}</button>
    <button type="button" id="rec-download" class="quiet">${t.js.download}</button>
    <button type="button" id="rec-close" class="quiet">${t.js.close}</button>
  </div>
  <p id="rec-status" class="meta" role="status"></p>
  <h3>${t.js.jsonH}</h3>
  <pre id="record-json" tabindex="0"></pre>
</dialog>

<details class="fold">
<summary>${t.moreH}</summary>
<p>${t.moreP}</p>
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
  <p><button type="submit" class="quiet">${t.prefsBtn}</button></p>
</form>
<h3>${t.viewsH}</h3>
<ul id="views" class="plain-list"></ul>
<form id="view-form" class="row">
  <div><label for="view-name">${t.vname}</label><input type="text" id="view-name" autocomplete="off"></div>
  <div class="grow"><label for="view-link">${t.vlink}</label><input type="url" id="view-link" autocomplete="off"></div>
  <button type="submit" class="quiet">${t.vbtn}</button>
</form>
</details>

<details class="fold">
<summary>${t.dataH}</summary>
<p>${t.dataP}</p>
<div class="row">
  <div><button type="button" id="export" class="quiet">${t.exportBtn}</button>
  <label class="plain"><input type="checkbox" id="with-pics" checked> ${t.withPics}</label></div>
  <div><input type="file" id="import" class="file-input" accept="application/json,.json"><label for="import" class="button">${t.importLabel}</label>
  <label class="plain"><input type="checkbox" id="merge" checked> ${t.merge}</label></div>
</div>
<p><button type="button" id="wipe" class="text-danger">${t.wipeBtn}</button></p>
</details>

<p class="privacy">${t.privacy}</p>
`;
}
function homeScripts(k) {
  const t = L[k];
  return `<script type="application/json" id="i18n">${JSON.stringify(t.js).replace(/</g, '\\u003c')}</script>
<script src="/assets/core.js"></script>
<script src="/assets/poster.js"></script>
<script src="/assets/pictures.js"></script>
<script src="/assets/app.js"></script>
`;
}

const pages = {
  start: { en: ['Start here: Streaming', 'Where to start, for the owner of this site: connecting GitHub, the first change, and asking for more.'], pt: ['Começar aqui: Streaming', 'Por onde começar, para o dono deste sítio: ligar o GitHub, a primeira alteração e pedir mais.'] },
  agents: { en: ['Use with your AI: Streaming', 'How to use this site through your own AI agent or an LLM.'], pt: ['Usar com a sua IA: Streaming', 'Como usar este sítio através do seu próprio agente de IA.'] },
  admin: { en: ['How this site was made: Streaming', 'How this site was made: the request, the agents, the commits, the design rounds and the test runs.'], pt: ['Como este sítio foi feito: Streaming', 'Como este sítio foi feito: o pedido, os agentes, as alterações, as rondas de desenho e as execuções de teste.'] },
  policy: { en: ['How this site is governed: Streaming', 'The Agent Behaviour Policy for this site: which agents may work on it, what they may change, and what is checked before anything is published.'], pt: ['Como este sítio é governado: Streaming', 'A política de comportamento dos agentes deste sítio: que agentes podem trabalhar nele, o que podem alterar e o que é verificado antes de se publicar.'] }
};

function write(path, html) { mkdirSync(path.replace(/\/[^/]*$/, ''), { recursive: true }); writeFileSync(path, html); }
for (const k of ['en', 'pt']) {
  const pre = k === 'pt' ? '/pt' : '';
  write(`site${pre}/index.html`, shell(k, { path: `${pre}/`, en: '/', pt: '/pt/', title: 'Streaming', desc: L[k].desc, main: homeMain(k), scripts: homeScripts(k) }));
  for (const [p, v] of Object.entries(pages)) {
    write(`site${pre}/${p}/index.html`, shell(k, { path: `${pre}/${p}/`, en: `/${p}/`, pt: `/pt/${p}/`, title: v[k][0], desc: v[k][1], main: readFileSync(`tools/content/${k}/${p}.html`, 'utf8') }));
  }
}
console.log('pages written');
