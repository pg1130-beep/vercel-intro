create table if not exists homepage_content (
  id int primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into homepage_content (id, content)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table homepage_content enable row level security;

drop policy if exists "Public can read homepage content" on homepage_content;
create policy "Public can read homepage content"
on homepage_content
for select
using (id = 1);

drop policy if exists "Anyone can update homepage content" on homepage_content;
create policy "Anyone can update homepage content"
on homepage_content
for update
using (id = 1)
with check (id = 1);

drop trigger if exists set_homepage_content_updated_at on homepage_content;
drop function if exists set_updated_at();

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_homepage_content_updated_at
before update on homepage_content
for each row
execute function set_updated_at();
