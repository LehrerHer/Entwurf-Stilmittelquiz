'use strict';

const sanitizeHtml = require('sanitize-html');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape plain text for safe HTML insertion. */
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Sanitise Quill-generated HTML – allow only safe formatting tags. */
function sanitizeContent(html) {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li', 'br', 'blockquote', 'pre', 'code',
      'a', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['class', 'style'],
    },
    allowedStyles: {
      span: { color: [/.*/] },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
    },
  });
}

/** Strip HTML tags and truncate for preview text. */
function preview(html, len = 160) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > len ? text.slice(0, len) + ' …' : text;
}

/** Format a date string in German locale. */
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Generate 1-2 uppercase initials from a name. */
function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Consistent hue for an avatar from a string (deterministic). */
function avatarHue(name) {
  let h = 0;
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h % 360;
}

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary:   #667eea;
    --primary-d: #5a67d8;
    --primary-2: #764ba2;
    --bg:        #f0f4f8;
    --card:      #ffffff;
    --border:    #e2e8f0;
    --text:      #1a202c;
    --muted:     #718096;
    --success:   #38a169;
    --danger:    #e53e3e;
    --warn:      #d69e2e;
    --radius:    0.75rem;
    --shadow:    0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -1px rgba(0,0,0,.05);
    --shadow-lg: 0 10px 25px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05);
  }

  html { font-size: 16px; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                 Ubuntu, Cantarell, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.6;
  }

  a { color: var(--primary); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* ── Header ── */
  .site-header {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%);
    color: #fff;
    padding: 2.5rem 1.5rem 2rem;
    text-align: center;
  }
  .site-header h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; letter-spacing: -.02em; }
  .site-header .subtitle { margin-top: .4rem; opacity: .85; font-size: 1rem; }
  .site-header .header-actions { margin-top: 1.25rem; display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }

  /* ── Admin header ── */
  .site-header.admin-header {
    background: linear-gradient(135deg, #c53030 0%, #742a2a 100%);
  }

  /* ── Container ── */
  .container { max-width: 1120px; margin: 0 auto; padding: 2rem 1.25rem; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .6rem 1.25rem; border-radius: .5rem; border: 2px solid transparent;
    cursor: pointer; font-size: .9rem; font-weight: 600;
    text-decoration: none; transition: all .18s; line-height: 1.4;
  }
  .btn:hover { transform: translateY(-1px); text-decoration: none; }
  .btn:active { transform: translateY(0); }

  .btn-primary   { background: var(--primary);  color: #fff; border-color: var(--primary); }
  .btn-primary:hover { background: var(--primary-d); border-color: var(--primary-d); }
  .btn-outline   { background: transparent; color: #fff; border-color: rgba(255,255,255,.7); }
  .btn-outline:hover { background: rgba(255,255,255,.15); }
  .btn-danger    { background: var(--danger); color: #fff; border-color: var(--danger); }
  .btn-danger:hover  { background: #c53030; border-color: #c53030; }
  .btn-success   { background: var(--success); color: #fff; border-color: var(--success); }
  .btn-success:hover { background: #276749; border-color: #276749; }
  .btn-ghost     { background: transparent; color: var(--muted); border-color: var(--border); }
  .btn-ghost:hover   { background: var(--bg); color: var(--text); }
  .btn-sm        { padding: .35rem .8rem; font-size: .8rem; }

  /* ── Cards grid ── */
  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .post-card {
    background: var(--card);
    border-radius: var(--radius);
    padding: 1.5rem;
    box-shadow: var(--shadow);
    transition: transform .2s, box-shadow .2s;
    display: flex; flex-direction: column;
    border: 1px solid var(--border);
  }
  .post-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .card-meta { display: flex; align-items: center; gap: .75rem; margin-bottom: 1rem; }
  .avatar {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: .8rem; color: #fff;
  }
  .card-author-info .author-name { font-weight: 600; font-size: .9rem; }
  .card-author-info .post-date   { font-size: .78rem; color: var(--muted); }

  .card-title    { font-size: 1.1rem; font-weight: 700; margin-bottom: .5rem; color: var(--text); }
  .card-preview  { color: var(--muted); font-size: .88rem; line-height: 1.65; flex: 1; margin-bottom: 1.1rem; }
  .card-footer   { display: flex; justify-content: space-between; align-items: center; padding-top: .9rem; border-top: 1px solid var(--border); }
  .card-badge    { font-size: .75rem; padding: .25rem .6rem; border-radius: 999px; font-weight: 600; }
  .badge-file    { background: #ebf4ff; color: #3182ce; }
  .badge-text    { background: #f0fff4; color: #276749; }
  .badge-pending { background: #fffbeb; color: #b7791f; }

  /* ── Empty state ── */
  .empty-state { text-align: center; padding: 4rem 2rem; color: var(--muted); }
  .empty-state .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
  .empty-state h2 { font-size: 1.3rem; color: var(--text); margin-bottom: .5rem; }

  /* ── Forms ── */
  .form-card {
    background: var(--card); border-radius: var(--radius);
    padding: 2rem; box-shadow: var(--shadow); border: 1px solid var(--border);
    max-width: 780px; margin: 0 auto;
  }
  .form-group { margin-bottom: 1.25rem; }
  .form-group label { display: block; font-weight: 600; margin-bottom: .4rem; font-size: .9rem; }
  .form-control {
    width: 100%; padding: .65rem .9rem;
    border: 1.5px solid var(--border); border-radius: .5rem;
    font-size: .95rem; font-family: inherit; background: #fff;
    color: var(--text); transition: border-color .18s;
  }
  .form-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(102,126,234,.15); }
  .form-hint { font-size: .8rem; color: var(--muted); margin-top: .3rem; }

  /* Editor type tabs */
  .tab-bar { display: flex; gap: .5rem; margin-bottom: 1rem; }
  .tab-btn {
    padding: .5rem 1.1rem; border-radius: .5rem; border: 1.5px solid var(--border);
    background: transparent; font-size: .88rem; font-weight: 600;
    cursor: pointer; color: var(--muted); transition: all .18s;
  }
  .tab-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* Quill overrides */
  .ql-container { border-radius: 0 0 .5rem .5rem !important; font-size: .95rem; min-height: 180px; }
  .ql-toolbar  { border-radius: .5rem .5rem 0 0 !important; }
  .ql-editor   { min-height: 180px; }

  /* File upload drop zone */
  .file-drop {
    border: 2px dashed var(--border); border-radius: .5rem;
    padding: 2rem; text-align: center; cursor: pointer;
    transition: border-color .18s, background .18s; color: var(--muted);
  }
  .file-drop:hover, .file-drop.dragover { border-color: var(--primary); background: rgba(102,126,234,.04); }
  .file-drop .drop-icon { font-size: 2.5rem; margin-bottom: .5rem; }
  .file-drop input[type=file] { display: none; }
  #file-name { margin-top: .75rem; font-size: .85rem; color: var(--success); font-weight: 600; }

  /* ── Single post ── */
  .post-full {
    background: var(--card); border-radius: var(--radius);
    padding: 2.5rem; box-shadow: var(--shadow); border: 1px solid var(--border);
    max-width: 780px; margin: 0 auto;
  }
  .post-full-meta { display: flex; align-items: center; gap: .9rem; margin-bottom: 1.75rem; }
  .post-full-meta .avatar { width: 48px; height: 48px; font-size: .9rem; }
  .post-full-meta .author-name { font-weight: 700; font-size: 1rem; }
  .post-full-meta .post-date   { font-size: .82rem; color: var(--muted); }
  .post-full h1 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; letter-spacing: -.02em; margin-bottom: 1.5rem; line-height: 1.25; }
  .post-content { font-size: 1rem; line-height: 1.75; }
  .post-content h1,
  .post-content h2,
  .post-content h3 { margin: 1.5rem 0 .5rem; line-height: 1.25; }
  .post-content p       { margin-bottom: 1rem; }
  .post-content ul,
  .post-content ol      { margin: .75rem 0 1rem 1.5rem; }
  .post-content li      { margin-bottom: .25rem; }
  .post-content blockquote {
    border-left: 4px solid var(--primary); padding: .75rem 1.25rem;
    background: #f7f8ff; border-radius: 0 .4rem .4rem 0; margin: 1rem 0;
    color: var(--muted); font-style: italic;
  }
  .post-content pre     { background: #1a202c; color: #e2e8f0; padding: 1rem; border-radius: .5rem; overflow-x: auto; margin: 1rem 0; }
  .post-content code    { font-family: 'Courier New', monospace; font-size: .9em; }

  /* File attachment display */
  .file-embed { margin-top: 1.5rem; }
  .file-embed iframe { width: 100%; height: 600px; border: 1px solid var(--border); border-radius: .5rem; }
  .download-card {
    display: flex; align-items: center; gap: 1rem;
    background: #ebf8ff; border: 1px solid #bee3f8; border-radius: .5rem;
    padding: 1.25rem; margin-top: 1rem;
  }
  .download-card .doc-icon { font-size: 2.5rem; }
  .download-card .doc-info { flex: 1; }
  .download-card .doc-info strong { display: block; font-size: .95rem; }
  .download-card .doc-info span   { font-size: .8rem; color: var(--muted); }

  /* ── Admin table ── */
  .admin-stats { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .stat-card   {
    background: var(--card); border-radius: var(--radius);
    padding: 1rem 1.5rem; border: 1px solid var(--border);
    box-shadow: var(--shadow); flex: 1; min-width: 150px;
  }
  .stat-card .stat-num  { font-size: 2rem; font-weight: 800; color: var(--primary); line-height: 1; }
  .stat-card .stat-lbl  { font-size: .82rem; color: var(--muted); margin-top: .25rem; }

  .section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: .5rem; }

  .admin-posts-list { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 2rem; }
  .admin-post-row {
    background: var(--card); border-radius: .6rem;
    padding: 1rem 1.25rem; border: 1px solid var(--border);
    display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap;
  }
  .admin-post-row.pending { border-color: #f6e05e; background: #fffff0; }
  .admin-post-row .row-info { flex: 1; min-width: 200px; }
  .admin-post-row .row-title    { font-weight: 700; font-size: .95rem; }
  .admin-post-row .row-meta     { font-size: .8rem; color: var(--muted); margin-top: .2rem; }
  .admin-post-row .row-actions  { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }

  /* ── Alert / feedback ── */
  .alert { border-radius: .5rem; padding: 1rem 1.25rem; margin-bottom: 1rem; font-size: .9rem; }
  .alert-error   { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
  .alert-success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }

  /* ── Feedback page ── */
  .feedback-page {
    min-height: 80vh; display: flex; align-items: center; justify-content: center;
  }
  .feedback-box {
    background: var(--card); border-radius: var(--radius);
    padding: 3rem 2.5rem; box-shadow: var(--shadow-lg);
    text-align: center; max-width: 460px; width: 100%;
    border: 1px solid var(--border);
  }
  .feedback-box .fb-icon  { font-size: 3.5rem; margin-bottom: 1rem; }
  .feedback-box h2        { font-size: 1.4rem; font-weight: 700; margin-bottom: .75rem; }
  .feedback-box p         { color: var(--muted); margin-bottom: 1.75rem; line-height: 1.6; }

  /* ── Back nav ── */
  .back-nav { margin-bottom: 1.5rem; }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .post-full { padding: 1.5rem; }
    .form-card  { padding: 1.5rem; }
    .admin-post-row .row-actions { width: 100%; justify-content: flex-end; }
  }
`;

/** Wrap any page in the shared HTML shell. */
function shell(title, headerHtml, bodyHtml, extraHead = '') {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>${SHARED_CSS}</style>
  ${extraHead}
</head>
<body>
  ${headerHtml}
  ${bodyHtml}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Blog overview
// ---------------------------------------------------------------------------

function renderBlogOverview(posts, studentPath) {
  const header = `
    <header class="site-header">
      <h1>📝 Klassen-Blog 10d</h1>
      <p class="subtitle">Hier teilen wir unsere Gedanken, Erlebnisse und Ideen</p>
      <div class="header-actions">
        <a href="/${studentPath}/neu" class="btn btn-outline">✏️ Neuen Beitrag schreiben</a>
      </div>
    </header>`;

  let grid;
  if (posts.length === 0) {
    grid = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h2>Noch keine Beiträge</h2>
        <p>Sei die Erste oder der Erste – schreib jetzt einen Beitrag!</p>
        <br>
        <a href="/${studentPath}/neu" class="btn btn-primary" style="margin-top:.5rem">✏️ Ersten Beitrag schreiben</a>
      </div>`;
  } else {
    const cards = posts.map(p => {
      const hue = avatarHue(p.author);
      const isFile = !p.content && p.file_path;
      const previewText = isFile ? `📎 ${esc(p.original_filename || 'Datei-Anhang')}` : esc(preview(p.content));
      const badge = isFile
        ? `<span class="card-badge badge-file">📎 Datei</span>`
        : `<span class="card-badge badge-text">📄 Text</span>`;
      return `
        <article class="post-card">
          <div class="card-meta">
            <div class="avatar" style="background:hsl(${hue},60%,50%)">${esc(initials(p.author))}</div>
            <div class="card-author-info">
              <div class="author-name">${esc(p.author)}</div>
              <div class="post-date">${fmtDate(p.created_at)}</div>
            </div>
          </div>
          <h2 class="card-title">${esc(p.title)}</h2>
          <p class="card-preview">${previewText}</p>
          <div class="card-footer">
            ${badge}
            <a href="/${studentPath}/beitrag/${esc(p.id)}" class="btn btn-primary btn-sm">Weiterlesen →</a>
          </div>
        </article>`;
    }).join('\n');
    grid = `<div class="posts-grid">${cards}</div>`;
  }

  return shell(
    'Klassen-Blog 10d',
    header,
    `<main class="container">${grid}</main>`
  );
}

// ---------------------------------------------------------------------------
// Single post
// ---------------------------------------------------------------------------

function renderSinglePost(post, studentPath) {
  const hue = avatarHue(post.author);

  let contentHtml = '';
  if (post.content) {
    contentHtml = `<div class="post-content">${sanitizeContent(post.content)}</div>`;
  }

  let fileHtml = '';
  if (post.file_path) {
    if (post.file_type === '.pdf') {
      fileHtml = `
        <div class="file-embed">
          <p style="margin-bottom:.5rem;font-weight:600;font-size:.9rem">📄 PDF-Dokument</p>
          <iframe src="/uploads/${esc(post.file_path)}" title="${esc(post.original_filename)}"></iframe>
          <p style="margin-top:.5rem;font-size:.82rem;color:var(--muted)">
            <a href="/uploads/${esc(post.file_path)}" download="${esc(post.original_filename)}">PDF herunterladen</a>
          </p>
        </div>`;
    } else {
      fileHtml = `
        <div class="file-embed">
          <div class="download-card">
            <div class="doc-icon">📝</div>
            <div class="doc-info">
              <strong>${esc(post.original_filename)}</strong>
              <span>Word-Dokument (.docx)</span>
            </div>
            <a href="/uploads/${esc(post.file_path)}" download="${esc(post.original_filename)}" class="btn btn-primary btn-sm">
              ⬇ Herunterladen
            </a>
          </div>
        </div>`;
    }
  }

  if (!contentHtml && !fileHtml) {
    contentHtml = `<p style="color:var(--muted);font-style:italic">Kein Inhalt verfügbar.</p>`;
  }

  const header = `
    <header class="site-header">
      <h1>📝 Klassen-Blog 10d</h1>
    </header>`;

  const body = `
    <main class="container">
      <div class="back-nav">
        <a href="/${studentPath}" class="btn btn-ghost btn-sm">← Zurück zur Übersicht</a>
      </div>
      <article class="post-full">
        <div class="post-full-meta">
          <div class="avatar" style="background:hsl(${hue},60%,50%)">${esc(initials(post.author))}</div>
          <div>
            <div class="author-name">${esc(post.author)}</div>
            <div class="post-date">${fmtDate(post.created_at)}</div>
          </div>
        </div>
        <h1>${esc(post.title)}</h1>
        ${contentHtml}
        ${fileHtml}
      </article>
    </main>`;

  return shell(esc(post.title) + ' – Klassen-Blog 10d', header, body);
}

// ---------------------------------------------------------------------------
// Submission form
// ---------------------------------------------------------------------------

function renderSubmitForm(studentPath, errorMsg = '') {
  const header = `
    <header class="site-header">
      <h1>✏️ Neuen Beitrag schreiben</h1>
      <p class="subtitle">Schreib einen Text oder lade eine Datei hoch</p>
    </header>`;

  const quillCss = `<link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">`;
  const quillJs  = `<script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>`;

  const errorHtml = errorMsg
    ? `<div class="alert alert-error">⚠️ ${esc(errorMsg)}</div>`
    : '';

  const body = `
    <main class="container">
      <div class="back-nav">
        <a href="/${studentPath}" class="btn btn-ghost btn-sm">← Zurück zur Übersicht</a>
      </div>
      <div class="form-card">
        ${errorHtml}
        <form id="submit-form" method="POST" action="/${studentPath}/neu" enctype="multipart/form-data">

          <div class="form-group">
            <label for="author">Dein Name / Pseudonym <span style="color:var(--danger)">*</span></label>
            <input type="text" id="author" name="author" class="form-control"
                   placeholder="z.B. Anna oder Anon123" maxlength="100" required>
          </div>

          <div class="form-group">
            <label for="title">Titel des Beitrags <span style="color:var(--danger)">*</span></label>
            <input type="text" id="title" name="title" class="form-control"
                   placeholder="Gib deinem Beitrag einen Titel" maxlength="200" required>
          </div>

          <!-- Tab switcher -->
          <div class="form-group">
            <label>Inhalt <span style="color:var(--danger)">*</span></label>
            <div class="tab-bar">
              <button type="button" class="tab-btn active" data-tab="text">📝 Text schreiben</button>
              <button type="button" class="tab-btn" data-tab="file">📎 Datei hochladen</button>
            </div>

            <!-- Text editor panel -->
            <div id="tab-text" class="tab-panel active">
              <div id="quill-editor"></div>
              <input type="hidden" id="content" name="content">
              <p class="form-hint">Formatierung: Fett, Kursiv, Überschriften, Listen, Zitate</p>
            </div>

            <!-- File upload panel -->
            <div id="tab-file" class="tab-panel">
              <div class="file-drop" id="file-drop" onclick="document.getElementById('file-input').click()">
                <div class="drop-icon">📁</div>
                <p style="font-weight:600">Klicke hier oder ziehe eine Datei hierher</p>
                <p style="font-size:.85rem;margin-top:.25rem">PDF oder Word (.docx) – max. 10 MB</p>
                <input type="file" id="file-input" name="file" accept=".pdf,.doc,.docx">
              </div>
              <div id="file-name"></div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:.8rem">
            🚀 Beitrag veröffentlichen
          </button>
        </form>
      </div>
    </main>

    ${quillJs}
    <script>
    // Init Quill
    const quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: 'Schreib hier deinen Beitrag …',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['clean'],
        ],
      },
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        // Clear irrelevant input when switching
        if (btn.dataset.tab === 'text') {
          document.getElementById('file-input').value = '';
          document.getElementById('file-name').textContent = '';
        } else {
          quill.setText('');
        }
      });
    });

    // File name display
    document.getElementById('file-input').addEventListener('change', function() {
      const name = this.files[0] ? this.files[0].name : '';
      document.getElementById('file-name').textContent = name ? '✅ Ausgewählt: ' + name : '';
    });

    // Drag-and-drop
    const dropZone = document.getElementById('file-drop');
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length) {
        document.getElementById('file-input').files = files;
        document.getElementById('file-name').textContent = '✅ Ausgewählt: ' + files[0].name;
      }
    });

    // On submit: copy Quill HTML to hidden input
    document.getElementById('submit-form').addEventListener('submit', function(e) {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      if (activeTab === 'text') {
        const html = quill.root.innerHTML;
        // Treat empty editor as no content
        if (quill.getText().trim().length === 0) {
          e.preventDefault();
          alert('Bitte schreibe etwas oder lade eine Datei hoch.');
          return;
        }
        document.getElementById('content').value = html;
      } else {
        document.getElementById('content').value = '';
        if (!document.getElementById('file-input').files.length) {
          e.preventDefault();
          alert('Bitte wähle eine Datei aus oder wechsle zum Texteditor.');
          return;
        }
      }
    });
    </script>`;

  return shell('Neuen Beitrag schreiben – Klassen-Blog 10d', header, body, quillCss);
}

// ---------------------------------------------------------------------------
// Admin overview
// ---------------------------------------------------------------------------

function renderAdminOverview(posts, adminPath, studentPath, pendingCount) {
  const totalCount = posts.length;
  const approvedCount = totalCount - pendingCount;

  const pending  = posts.filter(p => !p.approved);
  const approved = posts.filter(p =>  p.approved);

  function row(p) {
    const isPending = !p.approved;
    return `
      <div class="admin-post-row ${isPending ? 'pending' : ''}">
        <div class="row-info">
          <div class="row-title">${esc(p.title)}</div>
          <div class="row-meta">
            von <strong>${esc(p.author)}</strong> · ${fmtDate(p.created_at)}
            ${p.file_path ? ` · 📎 ${esc(p.original_filename)}` : ''}
            ${isPending ? ' · <span style="color:var(--warn);font-weight:600">⏳ Ausstehend</span>' : ''}
          </div>
        </div>
        <div class="row-actions">
          <a href="/${studentPath}/beitrag/${esc(p.id)}" class="btn btn-ghost btn-sm" target="_blank">👁 Ansehen</a>
          ${isPending
            ? `<form method="POST" action="/${adminPath}/freigeben/${esc(p.id)}" style="display:inline">
                 <button class="btn btn-success btn-sm" type="submit">✓ Freigeben</button>
               </form>`
            : `<form method="POST" action="/${adminPath}/zurueckziehen/${esc(p.id)}" style="display:inline">
                 <button class="btn btn-ghost btn-sm" type="submit" title="Freigabe entziehen">↩ Entfernen</button>
               </form>`
          }
          <form method="POST" action="/${adminPath}/loeschen/${esc(p.id)}" style="display:inline"
                onsubmit="return confirm('Beitrag von ${esc(p.author.replace(/'/g, "\\'"))} wirklich löschen?')">
            <button class="btn btn-danger btn-sm" type="submit">🗑 Löschen</button>
          </form>
        </div>
      </div>`;
  }

  const pendingSection = pending.length > 0 ? `
    <div class="section-title">⏳ Ausstehende Beiträge <span class="card-badge badge-pending">${pending.length}</span></div>
    <div class="admin-posts-list">${pending.map(row).join('\n')}</div>
  ` : '';

  const approvedSection = approved.length > 0 ? `
    <div class="section-title">✅ Veröffentlichte Beiträge <span class="card-badge badge-text">${approved.length}</span></div>
    <div class="admin-posts-list">${approved.map(row).join('\n')}</div>
  ` : '';

  const noPostsHtml = totalCount === 0 ? `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <h2>Noch keine Beiträge</h2>
      <p>Wenn Schüler:innen Beiträge einreichen, erscheinen sie hier.</p>
    </div>` : '';

  const header = `
    <header class="site-header admin-header">
      <h1>🔒 Admin-Bereich</h1>
      <p class="subtitle">Klassen-Blog 10d – Beiträge verwalten</p>
      <div class="header-actions">
        <a href="/${studentPath}" class="btn btn-outline" target="_blank">📚 Blog ansehen</a>
      </div>
    </header>`;

  const body = `
    <main class="container">
      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-num">${totalCount}</div>
          <div class="stat-lbl">Beiträge gesamt</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--success)">${approvedCount}</div>
          <div class="stat-lbl">Veröffentlicht</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:var(--warn)">${pendingCount}</div>
          <div class="stat-lbl">Ausstehend</div>
        </div>
      </div>
      ${pendingSection}
      ${approvedSection}
      ${noPostsHtml}
    </main>`;

  return shell('Admin-Bereich – Klassen-Blog 10d', header, body);
}

// ---------------------------------------------------------------------------
// Feedback pages
// ---------------------------------------------------------------------------

function renderSuccess(message, backUrl, backLabel = '← Zurück zum Blog') {
  const body = `
    <main class="container feedback-page">
      <div class="feedback-box">
        <div class="fb-icon">🎉</div>
        <h2>Erfolgreich!</h2>
        <p>${esc(message)}</p>
        <a href="${esc(backUrl)}" class="btn btn-primary">← Zurück zum Blog</a>
      </div>
    </main>`;
  return shell('Erfolgreich – Klassen-Blog 10d',
    `<header class="site-header"><h1>📝 Klassen-Blog 10d</h1></header>`,
    body);
}

function renderError(message, backUrl = '/') {
  const body = `
    <main class="container feedback-page">
      <div class="feedback-box">
        <div class="fb-icon">⚠️</div>
        <h2>Fehler</h2>
        <p>${esc(message)}</p>
        <a href="${esc(backUrl)}" class="btn btn-ghost">← Zurück</a>
      </div>
    </main>`;
  return shell('Fehler – Klassen-Blog 10d',
    `<header class="site-header"><h1>📝 Klassen-Blog 10d</h1></header>`,
    body);
}

function render404() {
  const body = `
    <main class="container feedback-page">
      <div class="feedback-box">
        <div class="fb-icon">🔍</div>
        <h2>Seite nicht gefunden</h2>
        <p>Diese Seite existiert leider nicht.</p>
      </div>
    </main>`;
  return shell('404 – Klassen-Blog 10d',
    `<header class="site-header"><h1>📝 Klassen-Blog 10d</h1></header>`,
    body);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  sanitizeContent,
  renderBlogOverview,
  renderSinglePost,
  renderSubmitForm,
  renderAdminOverview,
  renderSuccess,
  renderError,
  render404,
};
