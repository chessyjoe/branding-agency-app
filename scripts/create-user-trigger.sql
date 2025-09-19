-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, users.name),
    avatar_url = coalesce(excluded.avatar_url, users.avatar_url),
    updated_at = now();

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger that fires when a new user is created in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Also handle updates to auth.users (in case profile data changes)
drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row
  execute function public.handle_new_user();
