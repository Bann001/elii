# Cloudflare Worker AI Setup

This project includes a Worker in `cloudflare-worker/` for chatbot AI replies.

## 1) Deploy the Worker

```bash
cd cloudflare-worker
npm create cloudflare@latest . -- --ts --no-deploy
npx wrangler deploy
```

If prompted, keep `main = "src/index.ts"` and use the existing `wrangler.toml`.

## 2) Configure CORS origin

Edit `cloudflare-worker/wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "https://bann001.github.io"
```

If your Pages URL differs, update it.

## 3) Connect frontend to the Worker

In your repo root, create `.env`:

```env
VITE_CHAT_API_URL=https://<your-worker-subdomain>.workers.dev/chat
```

For production on GitHub Pages, add `VITE_CHAT_API_URL` as a repository secret/variable in your build workflow or hardcode it in your frontend if preferred.

## 4) Test

- Open the chatbot in your portfolio.
- Ask a question like: `What tech stack do you use?`
- It should show `AI mode` in the chat header.

