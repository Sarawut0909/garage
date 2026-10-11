K-ROOF GARAGE — ADMIN LOGIN SETUP

Important:
- This package adds Supabase email/password sign-in and checks the signed-in user against public.admin_users.
- Do not add any service_role key to config.js.
- Create a Supabase project, copy Project URL and anon/public key into config.js.
- In Supabase Authentication, create an account for the administrator.
- Run supabase_admin_setup.sql in the Supabase SQL Editor.
- Then run:
  insert into public.admin_users(user_id)
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
  Replace YOUR_ADMIN_EMAIL with the administrator's exact email.
- Upload index.html and config.js to the same GitHub Pages folder.
- Only accounts present in admin_users can open the image/category manager through the website.

Security note:
The existing gallery content functions in this HTML currently store image/category edits in the browser's IndexedDB, not in Supabase Storage/database. This login gates the editor UI, but does not yet make gallery changes shared across visitors or enforce server-side protection for the gallery data. For complete production security and shared content, migrate image/category CRUD to Supabase tables and Storage with RLS policies.
