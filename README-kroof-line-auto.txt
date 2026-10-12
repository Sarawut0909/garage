K-ROOF LINE AUTO ESTIMATE — SETUP

Files:
- index-kroof-line-auto.html: updated site file. Rename to index.html before upload.
- kroof-line-estimate-function.ts: Supabase Edge Function source.
- kroof-estimate-requests.sql: SQL table setup.

IMPORTANT LINE LIMITATION
LINE Messaging API cannot inject an inbound message into the LINE Official Account's own inbox. This implementation sends a push notification FROM the OA bot TO a staff LINE user or group, using LINE_TARGET_ID. The target must be eligible to receive push messages (for example, the user has added the OA as a friend, or the OA is in the target group).

SETUP
1. In Supabase SQL Editor, run kroof-estimate-requests.sql.
2. Supabase Dashboard > Edge Functions > Deploy a new function > Via Editor.
   Name: kroof-line-estimate
   Paste the contents of kroof-line-estimate-function.ts and deploy.
3. In the function settings, turn OFF Verify JWT for this public website endpoint. The handler validates allowed website origins and inputs. Do not put LINE credentials in index.html/config.js.
4. Supabase Dashboard > Edge Function Secrets. Add:
   LINE_CHANNEL_ACCESS_TOKEN = the Messaging API channel access token
   LINE_TARGET_ID = destination user ID (U...) or group ID (C...)
   The Supabase runtime already supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
5. If using a custom domain, add its exact origin to ALLOWED_ORIGINS in the function source before deploying.
6. Rename index-kroof-line-auto.html to index.html and upload/commit it to GitHub repo Sarawut0909/garage, replacing the current index.html. Keep config.js unchanged.
7. Test a sample form. Confirm a row appears in public.kroof_estimate_requests and the LINE target receives a notification.

SECURITY
- Never paste LINE_CHANNEL_ACCESS_TOKEN or service-role keys into chat or public files.
- Store LINE secrets only in Supabase Edge Function Secrets.
- If LINE push fails, the estimate is still saved in the database and the site displays a warning.
