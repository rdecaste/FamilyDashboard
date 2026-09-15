(() => {
  const endpoint = 'https://hook.eu2.make.com/kptsvimcpfrgwxxahnq9bciqb9dlenuk';
  const cacheKey = 'familyDashboard.sluiskilBridge.v1';
  const card = document.getElementById('bridge-card');
  const title = document.getElementById('bridge-title');
  const detail = document.getElementById('bridge-detail');
  const checked = document.getElementById('bridge-checked');
  const button = document.getElementById('bridge-refresh');
  if (!card || !title || !detail || !checked || !button) return;

  const bridgeDate = value => {
    if (!value) return null;
    const date = new Date(String(value).replace(/(\.\d{3})\d+/, '$1') + (String(value).endsWith('Z') ? '' : 'Z'));
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const durationText = milliseconds => {
    const minutes = Math.max(0, Math.floor(milliseconds / 60000));
    if (minutes < 60) return minutes + ' min';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours + 'u' + (rest ? ' ' + rest + ' min' : '');
  };

  const clockText = value => new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Amsterdam'
  }).format(value);

  function render(data, checkedAt) {
    const isOpen = data && (data.isOpen === true || data.isOpen === 'true');
    card.classList.remove('open', 'closed', 'error');
    card.classList.add(isOpen ? 'open' : 'closed');
    title.textContent = isOpen ? 'SLUISKILBRUG OPEN' : 'SLUISKILBRUG DICHT';

    if (isOpen) {
      const opened = bridgeDate(data.openSince);
      detail.textContent = opened
        ? 'Open sinds ' + durationText(Date.now() - opened.getTime()) + ' · eindtijd onbekend'
        : 'Open · eindtijd onbekend';
    } else {
      detail.textContent = 'Dicht · volgende opening onbekend';
    }

    checked.textContent = 'Gecontroleerd om ' + clockText(checkedAt);
  }

  function loadCached() {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && cached.data && cached.checkedAt) render(cached.data, new Date(cached.checkedAt));
    } catch (_) {}
  }

  async function refresh() {
    button.disabled = true;
    button.textContent = 'Controleren…';
    detail.textContent = 'Actuele brugstatus ophalen';

    try {
      const response = await fetch(endpoint + '?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const checkedAt = new Date();
      localStorage.setItem(cacheKey, JSON.stringify({ data, checkedAt: checkedAt.toISOString() }));
      render(data, checkedAt);
    } catch (error) {
      card.classList.remove('open', 'closed');
      card.classList.add('error');
      title.textContent = 'BRUGSTATUS NIET BEREIKBAAR';
      detail.textContent = 'Probeer over enkele seconden opnieuw';
      checked.textContent = '';
      console.error('Bridge status unavailable', error);
    } finally {
      button.textContent = '↻ Opnieuw controleren';
      window.setTimeout(() => { button.disabled = false; }, 10000);
    }
  }

  button.addEventListener('click', refresh);
  loadCached();
})();