'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'blog.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id           TEXT PRIMARY KEY,
    author       TEXT NOT NULL,
    title        TEXT NOT NULL,
    content      TEXT,
    file_path    TEXT,
    file_type    TEXT,
    original_filename TEXT,
    approved     INTEGER NOT NULL DEFAULT 1,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepared statements
const stmts = {
  getApproved:  db.prepare('SELECT * FROM posts WHERE approved = 1 ORDER BY created_at DESC'),
  getAll:       db.prepare('SELECT * FROM posts ORDER BY created_at DESC'),
  getById:      db.prepare('SELECT * FROM posts WHERE id = ?'),
  insert:       db.prepare(`
    INSERT INTO posts (id, author, title, content, file_path, file_type, original_filename, approved)
    VALUES (@id, @author, @title, @content, @file_path, @file_type, @original_filename, @approved)
  `),
  delete:       db.prepare('DELETE FROM posts WHERE id = ?'),
  approve:      db.prepare('UPDATE posts SET approved = 1 WHERE id = ?'),
  unapprove:    db.prepare('UPDATE posts SET approved = 0 WHERE id = ?'),
  countPending: db.prepare('SELECT COUNT(*) AS n FROM posts WHERE approved = 0'),
};

module.exports = {
  getApprovedPosts:  ()     => stmts.getApproved.all(),
  getAllPosts:        ()     => stmts.getAll.all(),
  getPostById:       (id)   => stmts.getById.get(id),
  createPost:        (post) => stmts.insert.run(post),
  deletePost:        (id)   => stmts.delete.run(id),
  approvePost:       (id)   => stmts.approve.run(id),
  unapprovePost:     (id)   => stmts.unapprove.run(id),
  countPending:      ()     => stmts.countPending.get().n,
};
