# Office Calendar — setup guide

This plain HTML, CSS, and JavaScript calendar uses Supabase for sign-in and private data and Vercel for hosting. Optional email reminders are sent by a private Vercel function using a Gmail account. Supabase Cron calls the function every five minutes, even when the calendar is closed.

The navy, green, blue, and light green design follows the supplied City of Imus visual reference, with Montserrat typography. This is not an official City of Imus app or logo.

## What you need

- A Supabase project
- A Vercel account and a Git repository for this folder
- A Gmail account you control, with [2-Step Verification](https://support.google.com/accounts/answer/185839) and an [App Password](https://support.google.com/accounts/answer/185833)

The Gmail account is the **sender**. Each event can specify a different **recipient** address. Do not enter your normal Gmail password in this project.

## 1. Set up Supabase

1. Create a project at [Supabase](https://supabase.com/dashboard). Keep its database password private.
2. Open **SQL Editor**. Open [`supabase/schema.sql`](supabase/schema.sql) from the extracted app, copy **all the SQL text inside the file**, paste it into a new Supabase query, and click **Run**. Then do the same for [`supabase/email-reminders.sql`](supabase/email-reminders.sql). Paste the SQL statements, not the Markdown link such as `[supabase/schema.sql](supabase/schema.sql)`. The first file creates private events and image Storage; the second adds email choices and a private delivery log.
3. If you already ran `schema.sql` for the earlier version, run only `email-reminders.sql`. It adds columns to existing events without deleting them.
4. In **Authentication → Providers**, enable Email. Choose whether users must confirm their email. After you know the production Vercel URL, set it as the Site URL in **Authentication → URL Configuration** and add it to the allowed redirect URLs if confirmation is enabled.
5. In **Project Settings → API Keys**, copy the project URL, a **publishable** key (`sb_publishable_...`) for the browser, and a **secret** key (`sb_secret_...`) for the Vercel function. The secret key bypasses row-level security. Never put it in `config.js`, the browser, or Git.

Row-level security restricts signed-in users to their own events. The image bucket is private. The delivery log is accessible only to the server key.

## 2. Set up Gmail

1. Sign in to the Gmail account that will send reminders. Turn on [2-Step Verification](https://support.google.com/accounts/answer/185839).
2. Open [Google App Passwords](https://myaccount.google.com/apppasswords). Create one for **Office Calendar** and copy it. If App Passwords is unavailable, your Workspace administrator or account security configuration may restrict it.
3. Keep the sending Gmail address and App Password ready for Vercel. Do not paste the App Password into Supabase SQL, `config.js`, or any source file.

Gmail may limit or block automated SMTP sending, especially from unfamiliar server locations. This suits a small personal or office calendar; a dedicated email service is more dependable for high-volume sending.

## 3. Deploy on Vercel

1. Extract `office-calendar.zip`. Put the **contents of the inner `office-calendar` folder** in the root of a Git repository and push it to GitHub, GitLab, or Bitbucket. Do not commit `node_modules/`, `dist/`, or secret values.
2. In [Vercel](https://vercel.com/dashboard), choose **Add New → Project**, import the repository, and choose **Other** as the framework if asked. `vercel.json` runs `npm run build`, serves `dist/`, and deploys `api/send-reminders.js` as a server function.
3. In the project's **Settings → Environment Variables**, add these values for **Production** before deploying:

   | Name | Value | Used where |
   | --- | --- | --- |
   | `SUPABASE_URL` | Your Supabase project URL | Browser build and server |
   | `SUPABASE_ANON_KEY` | Supabase publishable key | Browser build |
   | `SUPABASE_SECRET_KEY` | Supabase secret key | Server only |
   | `GMAIL_USER` | Complete sending Gmail address | Server only |
   | `GMAIL_APP_PASSWORD` | Gmail App Password | Server only |
   | `CRON_SECRET` | A random secret of at least 32 characters | Server only |

4. Deploy. If you set variables after deployment, **redeploy** so the browser configuration and server function receive them. Copy the stable production URL, such as `https://your-calendar.vercel.app`.
5. Return to Supabase Auth URL Configuration and set the production URL as described in step 1.

Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are written into the public browser configuration. The secret key, Gmail App Password, and cron secret stay in server environment variables.

## 4. Schedule reminders in Supabase

Vercel Hobby cron runs at most once daily, which is too slow for the 5-, 15-, 30-, or 60-minute reminder choices. Supabase Cron calls the Vercel function every five minutes:

1. In the Supabase Dashboard, enable **Cron (`pg_cron`)**, **pg_net**, and **Vault** in the Database integrations/extensions area if they are not already enabled.
2. In **Vault**, create two named secrets:

   | Secret name | Secret value |
   | --- | --- |
   | `office_calendar_reminder_url` | Your full production URL ending in `/api/send-reminders`, for example `https://your-calendar.vercel.app/api/send-reminders` |
   | `office_calendar_cron_secret` | The **same** `CRON_SECRET` value set in Vercel |

3. In **SQL Editor**, open [`supabase/email-cron.sql`](supabase/email-cron.sql), copy all its SQL text into a new query, and click **Run**. It creates the five-minute job. The command reads secrets from Vault at run time and does not contain their values.
4. In Supabase **Cron**, check that `office-calendar-email-reminders` is listed and enabled. Check its job history after the first run. In Vercel, check **Runtime Logs** for `/api/send-reminders` if a run fails.

Use the stable production domain, not a preview deployment URL. If the domain or `CRON_SECRET` changes, update the matching Vault secret. To stop email, disable the job in Supabase Cron.

## 5. Try an email reminder

1. Sign up in the deployed app and confirm your email if required.
2. Create an event in Philippine time, preferably 20–30 minutes in the future. Choose **15 minutes before** in **Reminder**.
3. Check **Email me a reminder**, enter the inbox of your choosing in **Send to email address**, and save.
4. Check the inbox and Spam folder. The message includes title, start date/time, and location. It does not send private notes, attendees, or image attachments.
5. If nothing arrives, check Supabase Cron's run history, Vercel function logs, and `public.email_deliveries` in Supabase Table Editor. A failed row has a short error message. Visiting `/api/send-reminders` without the cron secret should return **401 Unauthorized**.

The sender runs every five minutes with a 15-minute catch-up window. All-day events use **9:00 AM Philippine time** as their reminder time. Repeating series can send once per occurrence. Delivery records prevent normal repeat runs from sending the same scheduled reminder twice; an interruption after Gmail accepts a message but before the record is updated may rarely produce a duplicate.

## Using the calendar

- Month, week, day, and agenda views; on mobile, tap a date for its agenda, use bottom navigation, and tap the floating **+** to add an event.
- Event details include location, attendees, agenda, preparation notes, private notes, category, priority, status, follow-up due date, and images.
- Search and filter events; print daily or weekly schedules. Press **N** for quick add on a keyboard.
- Daily, weekly, and monthly repeat settings edit or delete the whole series. Monthly repeats from the 31st use the last day in shorter months.
- The in-app reminder appears only while the app is open. Email requires the complete Supabase, Vercel, Gmail, and Cron setup above.

## Local preview and checks

Opening `index.html` with blank `config.js` uses labeled local demo mode. Demo data is stored in that browser; **demo mode never sends email**. To connect a local copy to Supabase, copy `config.example.js` to `config.js` and fill in only the project URL and publishable key. Serve the folder with a static server if your browser restricts local files.

Run `npm ci`, `npm test`, and `npm run build` in this folder. The build produces `dist/`; a Vercel build fails if the public Supabase variables are missing. The server function needs its private environment variables and is not exercised by the local static preview.
