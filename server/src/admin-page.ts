export const ADMIN_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sorter admin</title>
<style>
  :root { color-scheme: light dark; --bg: #f6f6f7; --card: #ffffff; --fg: #1d1d20; --muted: #6b6b73; --line: #e2e2e6; --accent: #d63a91; --danger: #c62d2d; }
  @media (prefers-color-scheme: dark) { :root { --bg: #151518; --card: #1f1f23; --fg: #ececf0; --muted: #9b9ba5; --line: #33333a; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  p.lead { margin: 0 0 24px; color: var(--muted); }
  form { display: flex; gap: 8px; margin-bottom: 16px; }
  input { flex: 1; min-width: 0; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--fg); font: inherit; }
  button { padding: 9px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--fg); font: inherit; cursor: pointer; }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button.danger { color: var(--danger); }
  button:disabled { opacity: .5; cursor: default; }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  #status { color: var(--muted); margin: 8px 0 16px; min-height: 1.5em; }
  #stats { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 24px; color: var(--muted); font-size: 14px; }
  #stats b { color: var(--fg); font-variant-numeric: tabular-nums; }
  article { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
  article header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-weight: 600; }
  article time { color: var(--muted); font-weight: 400; font-size: 14px; }
  .reason { margin: 6px 0 10px; }
  ol { margin: 0 0 12px; padding-left: 22px; color: var(--muted); font-size: 14px; columns: 2; column-gap: 24px; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
</head>
<body>
<main>
  <h1>Sorter admin</h1>
  <p class="lead">Results the server held back for a closer look. Keep counts them in the rankings; Delete removes them. Unreviewed results are deleted after 30 days.</p>
  <form id="login">
    <input id="token" type="password" autocomplete="off" placeholder="Admin token" aria-label="Admin token">
    <button class="primary" type="submit">Load</button>
  </form>
  <div id="stats"></div>
  <div id="status" role="status"></div>
  <section id="list"></section>
</main>
<script>
  const reasons = {
    identical_ranking: 'Identical to another result from a different network in the last 24 hours',
    burst: 'Several results from one network within 10 minutes'
  };
  const tokenInput = document.getElementById('token');
  const statusEl = document.getElementById('status');
  const list = document.getElementById('list');
  const statsEl = document.getElementById('stats');
  tokenInput.value = sessionStorage.getItem('sorter-admin-token') || '';

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };

  const api = async (path, method = 'GET') => {
    const res = await fetch(path, { method, headers: { Authorization: 'Bearer ' + tokenInput.value } });
    if (res.status === 401) throw new Error('That token was not accepted.');
    if (!res.ok) throw new Error('The server returned ' + res.status + '.');
    return res.json();
  };

  const renderStats = async () => {
    try {
      const stats = await (await fetch('/stats')).json();
      statsEl.replaceChildren();
      for (const row of stats.totals) {
        const item = el('span', row.kind + ' / ' + row.mode + ': ');
        item.append(el('b', String(row.submissions)));
        statsEl.append(item);
      }
      const pending = el('span', 'Waiting for review: ');
      pending.append(el('b', String(stats.pendingReview)));
      statsEl.append(pending);
    } catch {}
  };

  const renderList = (items) => {
    list.replaceChildren();
    statusEl.textContent = items.length === 0 ? 'Nothing is waiting for review.' : items.length + ' waiting for review.';
    for (const item of items) {
      const card = el('article');
      const header = el('header');
      header.append(el('span', item.kind + ' / ' + item.mode));
      header.append(el('time', new Date(item.createdAt).toLocaleString()));
      card.append(header, el('div', reasons[item.reason] || item.reason, 'reason'));
      const ranking = el('ol');
      for (const group of item.ranking.slice(0, 20)) {
        ranking.append(el('li', group.map((id) => item.names[id] || id).join(' = ')));
      }
      card.append(ranking);
      const actions = el('div', undefined, 'actions');
      const keep = el('button', 'Keep', 'primary');
      const remove = el('button', 'Delete', 'danger');
      const act = async (path, method) => {
        keep.disabled = remove.disabled = true;
        try {
          await api(path, method);
          card.remove();
          await refresh();
        } catch (error) {
          statusEl.textContent = error.message;
          keep.disabled = remove.disabled = false;
        }
      };
      keep.addEventListener('click', () => act('/admin/reviews/' + item.id + '/keep', 'POST'));
      remove.addEventListener('click', () => act('/admin/reviews/' + item.id, 'DELETE'));
      actions.append(remove, keep);
      card.append(actions);
      list.append(card);
    }
  };

  const refresh = async () => {
    statusEl.textContent = 'Loading…';
    try {
      renderList(await api('/admin/reviews'));
      sessionStorage.setItem('sorter-admin-token', tokenInput.value);
    } catch (error) {
      list.replaceChildren();
      statusEl.textContent = error.message;
    }
    await renderStats();
  };

  document.getElementById('login').addEventListener('submit', (event) => {
    event.preventDefault();
    refresh();
  });
  renderStats();
  if (tokenInput.value) refresh();
</script>
</body>
</html>`;
