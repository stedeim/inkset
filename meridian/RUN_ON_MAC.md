# Running Meridian on your Mac

The whole app lives on GitHub. To run it locally you install three free tools,
pull the code, and run four commands. No prior setup required.

## 1. Install the three prerequisites (one-time)

1. **Node.js** — go to <https://nodejs.org>, download the **LTS** version, open the
   installer, click through. (This also installs `npm`.)
2. **Git** — open the **Terminal** app (Applications → Utilities → Terminal) and run
   `xcode-select --install`, then click Install. (Skip if Git is already there.)
3. **Postgres.app** (the database) — go to <https://postgresapp.com>, download it,
   drag it into Applications, open it, and click **Initialize / Start**. Leave it running.
   Then, so the `psql`/`createdb` commands work, run this once in Terminal:
   ```bash
   sudo mkdir -p /etc/paths.d && echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
   ```
   Close and reopen Terminal afterward.

## 2. Get the code

In Terminal:

```bash
git clone https://github.com/stedeim/inkset.git
cd inkset
git checkout claude/health-coaching-platform-l7yi8e
cd meridian
```

## 3. Create the database and settings

```bash
createdb meridian                 # makes an empty database named "meridian"
cp .env.example .env.local        # create your settings file
```

Now open `.env.local` (e.g. `open -e .env.local`) and set these two lines. Replace
`YOURNAME` with your Mac username (run `whoami` in Terminal if unsure):

```
DATABASE_URL="postgresql://YOURNAME@localhost:5432/meridian?schema=public"
AUTH_SECRET="paste-the-output-of-the-next-command-here"
```

Generate the secret and copy its output into `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 4. Install, set up the database, and run

```bash
npm install                 # downloads the app's building blocks (~1 min)
npx prisma migrate deploy   # creates all the tables
npm run db:seed             # adds a demo coach + client so there's data
npm run dev                 # starts the app
```

Open <http://localhost:3000> in your browser.

- **Try the premium flow:** click "Request membership" → pick a tier → create an
  account → walk the onboarding funnel → land on your dashboard.
- **Or log in as the demo accounts** (passwords are in `prisma/seed.ts`):
  `client@meridian.app` and `coach@meridian.app`.

To stop the app, press `Ctrl+C` in Terminal. To start it again later, just
`cd` back into `inkset/meridian` and run `npm run dev`.

## Troubleshooting

- **`createdb: command not found`** — the Postgres.app path step (1.3) didn't take;
  reopen Terminal, or run the full path:
  `/Applications/Postgres.app/Contents/Versions/latest/bin/createdb meridian`.
- **`database "meridian" already exists`** — fine, skip that step.
- **Port 3000 in use** — run `npm run dev -- -p 3001` and use `http://localhost:3001`.
