# Easy Upkeep AI — Backend (Scaffold)

- Express on port 6700
- Environment-aware; request IDs (x-request-id)
- JWT cookie auth with sameSite=Lax to avoid CSRF issues on iOS/Safari (same domain)
- Ajv validation with rich 4xx error bodies
- File naming: *.controller.js / *.router.js / *.model.js
- Rate limit scaffold: 100/day per user (in-memory; replace for production)
- OpenAI prompt + schema included under /src/openai

## Dev
```
pnpm i # or npm i
pnpm dev # or npm run dev
```
Set `.env` from `.env.example`.# easy-upkeep-ai-api
