'use strict';

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

const db    = require('./database');
const views = require('./views');

// ---------------------------------------------------------------------------
// Configuration  (override with environment variables)
// ---------------------------------------------------------------------------

const PORT          = process.env.PORT           || 3000;
const STUDENT_PATH  = process.env.STUDENT_PATH   || 'klasse10d-xk92m';
const ADMIN_PATH    = process.env.ADMIN_PATH      || 'lehrer-admin-xk92m';
// Set REQUIRE_APPROVAL=true to hold posts for manual review before publishing
const REQUIRE_APPROVAL = process.env.REQUIRE_APPROVAL === 'true';

// ---------------------------------------------------------------------------
// Uploads directory
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Multer – file upload configuration
// ---------------------------------------------------------------------------

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req,  file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = `${uuidv4()}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF- und Word-Dokumente (.docx) sind erlaubt.'));
    }
  },
});

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// ---------------------------------------------------------------------------
// Root – redirect to class blog (optional: show 404 to avoid revealing paths)
// ---------------------------------------------------------------------------

app.get('/', (_req, res) => {
  // Return a generic 404 so the secret path isn't discoverable from root.
  res.status(404).send('Seite nicht gefunden.');
});

// ---------------------------------------------------------------------------
// STUDENT ROUTES
// ---------------------------------------------------------------------------

// Blog overview
app.get(`/${STUDENT_PATH}`, (_req, res) => {
  const posts = db.getApprovedPosts();
  res.send(views.renderBlogOverview(posts, STUDENT_PATH));
});

// Submission form – GET
app.get(`/${STUDENT_PATH}/neu`, (_req, res) => {
  res.send(views.renderSubmitForm(STUDENT_PATH));
});

// Submission form – POST
app.post(`/${STUDENT_PATH}/neu`, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send(
        views.renderSubmitForm(STUDENT_PATH, 'Die Datei ist zu groß. Maximal 10 MB erlaubt.')
      );
    }
    if (err) {
      return res.status(400).send(views.renderSubmitForm(STUDENT_PATH, err.message));
    }

    try {
      const author  = (req.body.author  || '').trim().slice(0, 100);
      const title   = (req.body.title   || '').trim().slice(0, 200);
      const content = (req.body.content || '').trim();

      if (!author) {
        return res.status(400).send(
          views.renderSubmitForm(STUDENT_PATH, 'Bitte gib einen Namen oder ein Pseudonym ein.')
        );
      }
      if (!title) {
        return res.status(400).send(
          views.renderSubmitForm(STUDENT_PATH, 'Bitte gib einen Titel für deinen Beitrag ein.')
        );
      }
      if (!content && !req.file) {
        return res.status(400).send(
          views.renderSubmitForm(STUDENT_PATH, 'Bitte schreibe einen Text oder lade eine Datei hoch.')
        );
      }

      // Reject if both provided (shouldn't happen via the form, but be safe)
      const postContent = content && content !== '<p><br></p>' ? content : null;

      const post = {
        id:                uuidv4(),
        author,
        title,
        content:           postContent,
        file_path:         req.file ? req.file.filename          : null,
        file_type:         req.file ? path.extname(req.file.originalname).toLowerCase() : null,
        original_filename: req.file ? req.file.originalname      : null,
        approved:          REQUIRE_APPROVAL ? 0 : 1,
      };

      db.createPost(post);

      const msg = REQUIRE_APPROVAL
        ? 'Dein Beitrag wurde eingereicht und wird nach Prüfung durch die Lehrperson freigeschaltet. 🎓'
        : 'Dein Beitrag wurde erfolgreich veröffentlicht! 🎉';

      res.send(views.renderSuccess(msg, `/${STUDENT_PATH}`));
    } catch (e) {
      next(e);
    }
  });
});

// Single post view
app.get(`/${STUDENT_PATH}/beitrag/:id`, (req, res) => {
  const post = db.getPostById(req.params.id);

  if (!post) {
    return res.status(404).send(views.render404());
  }
  // Hide pending posts from students when approval is required
  if (!post.approved && REQUIRE_APPROVAL) {
    return res.status(404).send(views.render404());
  }

  res.send(views.renderSinglePost(post, STUDENT_PATH));
});

// ---------------------------------------------------------------------------
// ADMIN ROUTES
// ---------------------------------------------------------------------------

// Admin overview
app.get(`/${ADMIN_PATH}`, (_req, res) => {
  const posts        = db.getAllPosts();
  const pendingCount = db.countPending();
  res.send(views.renderAdminOverview(posts, ADMIN_PATH, STUDENT_PATH, pendingCount));
});

// Approve post
app.post(`/${ADMIN_PATH}/freigeben/:id`, (req, res) => {
  db.approvePost(req.params.id);
  res.redirect(`/${ADMIN_PATH}`);
});

// Withdraw approval (hide post without deleting)
app.post(`/${ADMIN_PATH}/zurueckziehen/:id`, (req, res) => {
  db.unapprovePost(req.params.id);
  res.redirect(`/${ADMIN_PATH}`);
});

// Delete post (and associated file)
app.post(`/${ADMIN_PATH}/loeschen/:id`, (req, res) => {
  const post = db.getPostById(req.params.id);
  if (post && post.file_path) {
    const filePath = path.join(UPLOADS_DIR, post.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  db.deletePost(req.params.id);
  res.redirect(`/${ADMIN_PATH}`);
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).send(views.renderError('Ein interner Fehler ist aufgetreten. Bitte versuche es erneut.'));
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  const base = `http://localhost:${PORT}`;
  console.log('\n================================================');
  console.log('  📝 Klassen-Blog 10d');
  console.log('================================================');
  console.log(`\n  📚 Schüler-Blog:   ${base}/${STUDENT_PATH}`);
  console.log(`  ✏️  Beitrag neu:    ${base}/${STUDENT_PATH}/neu`);
  console.log(`  🔒 Admin-Bereich:  ${base}/${ADMIN_PATH}`);
  console.log(`\n  ⚙️  Freigabe nötig: ${REQUIRE_APPROVAL ? 'JA' : 'NEIN (sofort veröffentlicht)'}`);
  console.log('\n================================================\n');
});
