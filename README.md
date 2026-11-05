# BrainBurst

Quiz & trivia platform. Frontend: HTML5 + Tailwind (CDN) + vanilla JS. Backend: Node.js (no npm packages) with a JSON file as the database.

## Run
    node server.js            # http://localhost:3000   (admin panel: /#admin)
Optional env vars: PORT, ADMIN_USER, ADMIN_PASSWORD (used only on first start, before data/db.json exists).
Default login: admin / admin123 - change it in Admin > Settings straight away.

## Structure
    server.js            REST API, auth (scrypt + tokens), analytics, static hosting
    data/seed.json       demo quizzes; data/db.json is created automatically
    public/index.html    page shell, OG tags
    public/css/style.css theme tokens + components
    public/js/api.js     API client, state, helpers
    public/js/ads.js     AdSense-ready ad slots
    public/js/ui.js      home, quiz player, result page
    public/js/admin.js   login, dashboard, quiz manager, settings
    public/js/app.js     render, events, boot

## API
    GET  /api/bootstrap          public: categories, quizzes, ad/timer settings
    POST /api/track              {type: view|play|done|share, quizId, score}
    POST /api/login              {user, password} -> {token}
    GET/PUT /api/admin/data      (Bearer token) read stats / save quizzes, categories, settings
    POST /api/admin/password     {user, password}
    POST /api/admin/reset        restore demo quizzes and zero the stats

## Before going live
- Serve over HTTPS (Nginx, Caddy, or your host) and set ADMIN_PASSWORD before first start.
- Replace og:image / og:url in public/index.html with your domain and logo.
- Tailwind CDN is fine to start; for production build a static CSS file with the Tailwind CLI.
- Put your AdSense IDs in Admin > Settings and add ads.txt to public/.
- Behind a proxy, back up data/db.json regularly.
