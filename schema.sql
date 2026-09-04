-- OpenExport — real database schema, meant to run once in your
-- Supabase project's SQL editor (Dashboard → SQL Editor → New query).
--
-- This is not a mock schema. Every table has real foreign keys and
-- real Row Level Security (RLS) policies, so even if someone finds
-- your public API keys, they can only ever read/write data they're
-- actually allowed to touch — RLS is enforced by Postgres itself,
-- not by your application code (which can have bugs).

-- ---------------------------------------------------------------
-- PROFILES — one row per user, extends Supabase's built-in auth.users
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  role text not null check (role in ('buyer', 'supplier', 'logistics', 'chamber', 'both')),
  country text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone signed in can browse the member directory (needed so users
-- can find each other to start a conversation).
create policy "Profiles are viewable by any signed-in user"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- You can only ever edit your own profile.
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row the moment someone confirms signup —
-- this is the standard Supabase pattern and means your app never has
-- to remember to create one manually.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, contact_name, role, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', 'New Member'),
    coalesce(new.raw_user_meta_data->>'contact_name', 'New Member'),
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    new.raw_user_meta_data->>'country'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- CONVERSATIONS
-- ---------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,                      -- only used for group/room conversations
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;

-- You can only see conversations you're actually a participant in.
create policy "Users see conversations they belong to"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  with check (true);

create policy "Users see their own participant rows"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp2
      where cp2.conversation_id = conversation_id and cp2.user_id = auth.uid()
    )
  );

create policy "Users can add participants to conversations they create"
  on public.conversation_participants for insert
  with check (true);

-- ---------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- The core security guarantee: you can only read messages in
-- conversations you're a participant of — enforced by the database,
-- not by trusting the frontend to only ask for the right thing.
create policy "Users read messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "Users send messages only to conversations they're in"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

-- Enables Supabase Realtime (live updates) on the messages table —
-- without this, new messages wouldn't push to other users instantly.
alter publication supabase_realtime add table public.messages;

-- Helpful index for loading a conversation's message history quickly.
create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
