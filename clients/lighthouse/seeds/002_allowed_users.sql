-- Replace with the actual 4 Google account emails before running.
insert into public.allowed_users (email, name, role) values
  ('user1@gmail.com', 'Team Member 1', 'admin'),
  ('user2@gmail.com', 'Team Member 2', 'member'),
  ('user3@gmail.com', 'Team Member 3', 'member'),
  ('user4@gmail.com', 'Team Member 4', 'member')
on conflict (email) do nothing;
