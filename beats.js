(() => {
  const grid = document.getElementById('beat-grid');
  if (!grid) return;
  const search = document.getElementById('beat-search');
  const genre = document.getElementById('beat-genre');
  const count = document.getElementById('beat-count');
  const player = document.getElementById('beat-player');
  const audio = document.getElementById('beat-audio');
  const title = document.getElementById('beat-now-title');
  const error = document.getElementById('beat-error');
  let beats = [], active = null;
  const normalized = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = () => beats.filter(beat => (genre.value === '' || beat.genre === genre.value) && normalized([beat.title, beat.genre, beat.bpm, beat.key].join(' ')).includes(normalized(search.value)));
  const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function render() {
    const filtered = visible();
    count.textContent = `${filtered.length} de ${beats.length} beats`;
    grid.replaceChildren();
    if (!filtered.length) grid.append(element('p', 'beat-empty', 'No encontramos beats con esa búsqueda. Prueba otro título o estilo.'));
    for (const beat of filtered) {
      const card = element('article', `beat-card${active?.id === beat.id ? ' is-active' : ''}`);
      const cover = element('div', 'beat-cover');
      cover.setAttribute('aria-hidden', 'true');
      cover.append(element('strong', '', '4G'), element('span', '', '✦'));
      const meta = element('div', 'beat-meta');
      for (const value of [beat.genre, beat.bpm ? `${beat.bpm} BPM` : null, beat.key]) if (value) meta.append(element('span', '', value));
      const bottom = element('div', 'beat-bottom');
      const isPlaying = active?.id === beat.id && !audio.paused;
      const button = element('button', 'beat-play', isPlaying ? 'Ⅱ Pausar' : '▶ Escuchar');
      button.type = 'button';
      button.setAttribute('aria-label', `${isPlaying ? 'Pausar' : 'Escuchar'} ${beat.title}`);
      button.addEventListener('click', () => select(beat));
      bottom.append(button, element('span', 'beat-duration', time(beat.duration || 0)));
      card.append(cover, element('h3', '', beat.title), meta, bottom);
      grid.append(card);
    }
  }
  function select(beat) {
    error.textContent = '';
    if (active?.id === beat.id && !audio.paused) { audio.pause(); return; }
    if (active?.id !== beat.id) {
      active = beat;
      audio.src = beat.src;
      title.textContent = beat.title;
      player.hidden = false;
      document.body.classList.add('has-beat-player');
      if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') navigator.mediaSession.metadata = new MediaMetadata({title: beat.title, artist: '4guila'});
    }
    audio.play().catch(() => { error.textContent = 'No se pudo iniciar el audio. Pulsa reproducir para intentarlo otra vez.'; render(); });
    render();
  }
  function step(direction) {
    const list = visible();
    if (!list.length) return;
    const i = list.findIndex(beat => beat.id === active?.id);
    select(list[(i + direction + list.length) % list.length]);
  }
  audio.addEventListener('play', () => {
    const video = document.getElementById('culigang-video');
    video?.pause();
    render();
  });
  audio.addEventListener('pause', render);
  audio.addEventListener('ended', () => step(1));
  audio.addEventListener('error', () => { error.textContent = 'Este beat no pudo cargarse. Revisa tu conexión o elige otro.'; });
  document.getElementById('beat-prev').addEventListener('click', () => step(-1));
  document.getElementById('beat-next').addEventListener('click', () => step(1));
  search.addEventListener('input', render);
  genre.addEventListener('change', render);
  fetch('beats/catalog.json').then(response => {
    if (!response.ok) throw new Error('catalog');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data)) throw new Error('catalog');
    beats = data;
    for (const value of [...new Set(beats.map(beat => beat.genre))].sort()) {
      const option = element('option', '', value);
      option.value = value;
      genre.append(option);
    }
    render();
  }).catch(() => { count.textContent = 'No pudimos cargar el catálogo. Recarga la página para volver a intentarlo.'; });
})();
