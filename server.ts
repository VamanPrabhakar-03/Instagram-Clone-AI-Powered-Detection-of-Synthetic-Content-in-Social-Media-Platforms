import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const db = new Database("instagram.db");
const JWT_SECRET = process.env.JWT_SECRET || "insta-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'image' or 'video'
    url TEXT,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS followers (
    follower_id INTEGER,
    following_id INTEGER,
    PRIMARY KEY(follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER,
    post_id INTEGER,
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS saved_posts (
    user_id INTEGER,
    post_id INTEGER,
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    post_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { username, password, full_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const stmt = db.prepare("INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)");
      const info = stmt.run(username, hashedPassword, full_name);
      const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, username, full_name } });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, avatar_url: user.avatar_url } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/me", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, username, full_name, bio, avatar_url FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.get("/api/posts", authenticateToken, (req: any, res) => {
    const posts = db.prepare(`
      SELECT posts.*, users.username, users.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND user_id = ?) as is_liked,
      (SELECT COUNT(*) FROM saved_posts WHERE post_id = posts.id AND user_id = ?) as is_saved,
      (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments_count
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY posts.created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(posts);
  });

  app.post("/api/posts", authenticateToken, upload.single('file'), (req: any, res) => {
    const { type, caption } = req.body;
    let url = req.body.url;

    if (req.file) {
      url = `/uploads/${req.file.filename}`;
    }

    const stmt = db.prepare("INSERT INTO posts (user_id, type, url, caption) VALUES (?, ?, ?, ?)");
    const info = stmt.run(req.user.id, type, url, caption);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/posts/:id", authenticateToken, (req: any, res) => {
    const post: any = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    // Optionally delete file - uncomment to enable
    if (post.url && post.url.startsWith('/uploads/')) {
      const filePath = path.join(uploadDir, path.basename(post.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Database cleanup
    db.transaction(() => {
      db.prepare("DELETE FROM likes WHERE post_id = ?").run(req.params.id);
      db.prepare("DELETE FROM comments WHERE post_id = ?").run(req.params.id);
      db.prepare("DELETE FROM saved_posts WHERE post_id = ?").run(req.params.id);
      db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    })();

    res.json({ success: true });
  });

  app.post("/api/posts/:id/like", authenticateToken, (req: any, res) => {
    try {
      db.prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)").run(req.user.id, req.params.id);
      res.json({ liked: true });
    } catch (e) {
      db.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(req.user.id, req.params.id);
      res.json({ liked: false });
    }
  });

  app.post("/api/posts/:id/save", authenticateToken, (req: any, res) => {
    try {
      db.prepare("INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)").run(req.user.id, req.params.id);
      res.json({ saved: true });
    } catch (e) {
      db.prepare("DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?").run(req.user.id, req.params.id);
      res.json({ saved: false });
    }
  });

  app.get("/api/posts/:id/comments", authenticateToken, (req: any, res) => {
    const comments = db.prepare(`
      SELECT comments.*, users.username, users.avatar_url 
      FROM comments 
      JOIN users ON comments.user_id = users.id 
      WHERE post_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.id);
    res.json(comments);
  });

  app.post("/api/posts/:id/comments", authenticateToken, (req: any, res) => {
    const { content } = req.body;
    const stmt = db.prepare("INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)");
    const info = stmt.run(req.user.id, req.params.id, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/users/suggestions", authenticateToken, (req: any, res) => {
    const suggestions = db.prepare(`
      SELECT id, username, full_name, avatar_url 
      FROM users 
      WHERE id != ? 
      AND id NOT IN (SELECT following_id FROM followers WHERE follower_id = ?)
      LIMIT 5
    `).all(req.user.id, req.user.id);
    res.json(suggestions);
  });

  app.get("/api/users/search", authenticateToken, (req: any, res) => {
    const query = req.query.q;
    const users = db.prepare(`
      SELECT id, username, full_name, avatar_url 
      FROM users 
      WHERE username LIKE ? OR full_name LIKE ?
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`);
    res.json(users);
  });

  app.get("/api/explore", authenticateToken, (req: any, res) => {
    const posts = db.prepare(`
      SELECT posts.*, users.username, users.avatar_url
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY RANDOM() 
      LIMIT 30
    `).all();
    res.json(posts);
  });

  app.get("/api/users", authenticateToken, (req: any, res) => {
    const users = db.prepare("SELECT id, username, full_name, avatar_url FROM users LIMIT 20").all();
    res.json(users);
  });

  app.get("/api/users/:username", authenticateToken, (req: any, res) => {
    const user: any = db.prepare("SELECT id, username, full_name, bio, avatar_url FROM users WHERE username = ?").get(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = db.prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
    const followersCount = db.prepare("SELECT COUNT(*) as count FROM followers WHERE following_id = ?").get(user.id);
    const followingCount = db.prepare("SELECT COUNT(*) as count FROM followers WHERE follower_id = ?").get(user.id);
    const isFollowing = db.prepare("SELECT * FROM followers WHERE follower_id = ? AND following_id = ?").get(req.user.id, user.id);

    res.json({
      ...user,
      posts,
      followers_count: (followersCount as any).count,
      following_count: (followingCount as any).count,
      is_following: !!isFollowing
    });
  });

  app.get("/api/users/:username/saved", authenticateToken, (req: any, res) => {
    const user: any = db.prepare("SELECT id FROM users WHERE username = ?").get(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.id !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    const posts = db.prepare(`
      SELECT posts.*, users.username, users.avatar_url
      FROM posts 
      JOIN saved_posts ON posts.id = saved_posts.post_id
      JOIN users ON posts.user_id = users.id
      WHERE saved_posts.user_id = ?
      ORDER BY posts.created_at DESC
    `).all(user.id);
    res.json(posts);
  });

  app.put("/api/me", authenticateToken, (req: any, res) => {
    const { full_name, bio, avatar_url } = req.body;
    db.prepare("UPDATE users SET full_name = ?, bio = ?, avatar_url = ? WHERE id = ?")
      .run(full_name, bio, avatar_url, req.user.id);
    res.json({ success: true });
  });

  app.post("/api/users/:id/follow", authenticateToken, (req: any, res) => {
    if (req.user.id === parseInt(req.params.id)) return res.status(400).json({ error: "Cannot follow yourself" });
    try {
      db.prepare("INSERT INTO followers (follower_id, following_id) VALUES (?, ?)").run(req.user.id, req.params.id);
      res.json({ following: true });
    } catch (e) {
      db.prepare("DELETE FROM followers WHERE follower_id = ? AND following_id = ?").run(req.user.id, req.params.id);
      res.json({ following: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
