# Asset Forge — All-in-One Developer Forge

A Vercel-deployable Next.js workspace with Discord OAuth sign-in, PostgreSQL persistence, Roblox Open Cloud asset uploads, asset history/search, ID-format inspection, token ledger/admin credit grants, and optional OpenAI-compatible metadata generation.

> This is a real integration scaffold, not a claim that third-party credentials have already been configured. Before production use, configure Discord, PostgreSQL, Roblox Open Cloud, and optionally an AI provider. Roblox may reject unsupported types, permission scopes, or moderated content.

## Included
- Discord OAuth through Auth.js authorization-code flow; database sessions and sign-out.
- User accounts and starting balance of 25 credits.
- Roblox Open Cloud create-asset request for supported file types, with size/type checks and credit refunds on request failure.
- User-specific upload history and searchable asset library.
- Safe ID-format checker (does not spoof IDs, forge ownership, or bypass moderation).
- Optional AI metadata generation via an OpenAI-compatible Chat Completions endpoint and daily request cap.
- Admin-only credit adjustments controlled by `ADMIN_DISCORD_IDS`, with a ledger.
- Security headers; secrets remain server-side.

## 1. Requirements
Node.js 20+, npm, a Discord Developer application, PostgreSQL (Neon/Supabase or other hosted PostgreSQL), and a Roblox Open Cloud API key with Assets API permissions.

## 2. Local setup
```bash
npm install
cp .env.example .env
```
Fill `.env`. Generate `AUTH_SECRET` using `openssl rand -base64 32`. Set `AUTH_URL=http://localhost:3000`.

In Discord Developer Portal → OAuth2, add redirect URI:
`http://localhost:3000/api/auth/callback/discord`

Set `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET`. Never expose the secret via `NEXT_PUBLIC_*`.

Create a PostgreSQL database and set `DATABASE_URL`, then run:
```bash
npx prisma db push
npm run dev
```
Open http://localhost:3000 and sign in with Discord.

## 3. Roblox Open Cloud
1. Create an API key in Creator Dashboard with the required Assets API permissions and access for the intended creator.
2. Set `ROBLOX_API_KEY` and `ROBLOX_CREATOR_ID`.
3. Set `ROBLOX_CREATOR_TYPE=user` for a user ID or `group` for a group ID.
4. Review supported types and limits: https://create.roblox.com/docs/cloud/guides/usage-assets

The upload route sends `POST https://apis.roblox.com/assets/v1/assets` with `x-api-key` and multipart fields. Supported types/limits can change; confirm key permissions and creator access. Submission does not guarantee moderation approval. The app never asks for Roblox passwords, cookies, or session tokens.

## 4. Optional AI
Set `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL`. The endpoint must accept OpenAI-compatible Chat Completions requests. Leave the key blank to disable AI. Prompts are sent to the configured provider; do not submit confidential material.

## 5. Deploy to Vercel
1. Push this folder to a private GitHub repository and import it in Vercel.
2. Add required `.env.example` values under Project Settings → Environment Variables. Never commit `.env`.
3. Use a hosted PostgreSQL URL with SSL.
4. Set `AUTH_URL` to the production HTTPS origin, e.g. `https://your-project.vercel.app`.
5. Add `https://your-project.vercel.app/api/auth/callback/discord` in Discord Developer Portal.
6. Deploy. Build runs `prisma generate && next build`; run `npx prisma db push` once against production DB from a trusted environment before first use.

## 6. Token credits
Users start with 25 credits. Upload costs 5; AI generation costs 1. This is an internal usage-credit ledger, not a payment processor. There is no automatic purchase/payment flow wired up. Before selling credits, integrate a legitimate payment provider and verify server-side webhooks; never credit users based only on a browser redirect.

Admin credit adjustment endpoint: `POST /api/tokens`, authenticated session and admin Discord ID in `ADMIN_DISCORD_IDS`.
```json
{ "discordId": "123456789012345678", "amount": 100 }
```
Negative amounts deduct credits but cannot make a balance negative. Target users must sign in once. Every change is recorded.

## Production security checklist
- Use a long random `AUTH_SECRET`; rotate any secret ever shared publicly.
- Use HTTPS and exact OAuth redirect URIs.
- Keep all Discord, Roblox, and AI secrets server-side.
- Use least-privilege Roblox permissions and a dedicated database user.
- Enable backups, connection pooling, monitoring, and distributed rate limiting/WAF before a public launch.
- Provide a user-data deletion process and review privacy obligations.
- Do not impersonate creators, falsify asset IDs, bypass moderation, or upload content without rights.

## Known scope
- OAuth and upload are real integrations once credentials and permissions are configured.
- A numeric ID check does not confirm existence, ownership, or moderation status.
- This release tracks assets submitted through this app; it does not automatically import every asset from a Roblox account.
