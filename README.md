# OpenExport — real deployment guide

This is a real Next.js + Supabase application — real accounts, a real
Postgres database, real Row Level Security, real-time chat over an
actual WebSocket connection. It is not wired up to any live service
yet because that requires *your* accounts and credentials, not mine —
I can't create a Supabase project or a Vercel deployment on your
behalf. Follow these steps and you'll have a real, public URL where
real people can sign up and chat with each other. Total time: about
20–30 minutes, almost all of it clicking through free signup forms.

## 1. Create your database (Supabase — free tier)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project (pick any name/region; note the database
   password it asks you to set).
3. Once it's ready, open **SQL Editor** in the left sidebar → **New query**.
4. Paste the entire contents of `schema.sql` from this project and click
   **Run**. This creates every table, security policy, and the
   real-time subscription needed for chat — nothing left to configure
   by hand.
5. Go to **Settings → API**. You'll need two values from this page in
   step 3 below: **Project URL** and the **anon public** key.

## 2. (Recommended) Set up real email delivery

Supabase sends confirmation emails out of the box, but its built-in
sender is rate-limited and fine for testing, not for real signups at
volume. For anything beyond a handful of users:

1. In Supabase: **Authentication → Providers → Email**.
2. Under **SMTP Settings**, connect a real provider — Resend, SendGrid,
   or Postmark all work. This is the same "connect a real email
   provider" step from the standalone auth backend I built earlier;
   the difference here is Supabase handles the sending logic for you,
   you just plug in the provider.

## 3. Run it locally first (sanity check before deploying)

```bash
npm install
cp .env.example .env.local
# edit .env.local — paste in your Project URL and anon key from step 1
npm run dev
```

Open `http://localhost:3000`, sign up with a real email address you
can check, confirm it, sign in, and open `/chat`. If you can send a
message and see the Realtime subscription pick it up, the whole stack
— auth, database, security policies, live updates — is genuinely
working end to end.

## 4. Deploy it publicly (Vercel — free tier)

1. Push this project to a GitHub repository (`git init`, commit, push
   — or use GitHub Desktop if you'd rather not use the command line).
2. Go to [vercel.com](https://vercel.com), sign up with your GitHub
   account, and click **Add New → Project**, then pick this repo.
3. Before deploying, add the same two environment variables from your
   `.env.local` (Project URL, anon key) in Vercel's **Environment
   Variables** section.
4. Click **Deploy**. A few minutes later you'll have a real public URL
   like `openexport-platform.vercel.app` — that's live on the internet,
   anyone can sign up.

## 5. (Optional) Put a real domain on it

Buy a domain (Namecheap, Google Domains, etc. — usually $10–15/year),
then in Vercel: **Project → Settings → Domains → Add**. Vercel gives
you the exact DNS records to add at your registrar. Takes effect
within a few hours typically.

## What you get after these steps

- Real accounts, real password auth, real confirmation emails
- A real Postgres database with security enforced at the database
  level (not just hidden UI — someone with your public API key still
  can't read another user's private messages)
- Real-time chat: message another signed-up user and they see it
  appear instantly, no page refresh, over an actual WebSocket
- A public URL anyone in the world can sign up at

## What's deliberately NOT in this build yet

This is phase one — real accounts and real worldwide chat, matching
what you said was the actual core target. Deliberately left out so
this could ship as something complete and real rather than a bigger
pile of half-finished features:

- The marketplace/RFQ/pricing features from the earlier prototype —
  those need to be rebuilt against this real database the same way
  chat was, product by product, rather than ported wholesale
- Group chat rooms (schema already supports it — `conversations.is_group`
  — the UI just doesn't expose creating one yet)
- File/image attachments in messages
- Push or email notifications for new messages
- A public member profile page beyond the directory list

Next reasonable step, if you want to keep going in the same direction:
pick one feature from that list (or one from the original prototype)
and I'll build it against this real backend the same way — for real,
not mocked.
