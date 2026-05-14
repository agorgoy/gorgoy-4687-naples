-- Run this once in your Supabase SQL editor
-- https://supabase.com/dashboard > SQL Editor

create table if not exists leads (
    id          uuid primary key default gen_random_uuid(),
    first_name  text not null,
    last_name   text,
    email       text not null,
    phone       text,
    buyer_type  text,
    message     text,
    property    text,
    created_at  timestamptz default now()
);

-- Enable Row Level Security (only your service key can read/write)
alter table leads enable row level security;

-- No public access — only server-side service key can insert
create policy "Service key only" on leads
    for all using (false);
