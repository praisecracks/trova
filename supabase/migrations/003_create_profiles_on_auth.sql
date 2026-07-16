-- Create function to insert trova_profiles and trova_sellers when a new auth user is created
create extension if not exists "pgcrypto";

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Insert profile row if not exists
  insert into public.trova_profiles (id, email, role, display_name, created_at)
  values (new.id, new.email, 'seller', (new.raw_user_meta->>'full_name')::text, now())
  on conflict (id) do nothing;

  -- Insert seller row if not exists
  insert into public.trova_sellers (id, profile_id, business_name, created_at)
  values (new.id, new.id, (new.raw_user_meta->>'business_name')::text, now())
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_auth_user_created();
