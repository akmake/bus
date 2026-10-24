# bus

Source repository for **bus**.

## Codebase layout

- `client/` — project frontend.
- `server/` — project backend.
- `python/` — project Python tooling.

## Scripts

- `npm run dev`: `npm-run-all --parallel dev:server dev:client`
- `npm run dev:server`: `cd server && npm run dev`
- `npm run dev:client`: `cd client && npm run dev`
