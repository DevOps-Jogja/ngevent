# Setup Email Notifications - Ngevent

## Overview
Ngevent menggunakan Supabase Edge Functions untuk mengirim email notifications kepada users.

## Setup Instructions

### 1. Install Supabase CLI

\`\`\`bash
npm install -g supabase
\`\`\`

### 2. Create Email Edge Function

Buat folder untuk edge functions:

\`\`\`bash
mkdir -p supabase/functions/send-email
\`\`\`

### 3. Email Templates

Email notifications yang perlu dibuat:

#### A. Confirmation Email (Setelah Registrasi)

\`\`\`typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { type, email, eventTitle, eventDate, userName } = await req.json()

  let subject = ''
  let htmlContent = ''

  if (type === 'registration_confirmation') {
    subject = \`Konfirmasi Pendaftaran: \${eventTitle}\`
    htmlContent = \`
      <h1>Pendaftaran Berhasil!</h1>
      <p>Halo \${userName},</p>
      <p>Terima kasih telah mendaftar untuk event <strong>\${eventTitle}</strong></p>
      <p>Detail Event:</p>
      <ul>
        <li>Tanggal: \${eventDate}</li>
      </ul>
      <p>Kami akan mengirimkan reminder sebelum event dimulai.</p>
    \`
  } else if (type === 'event_reminder') {
    subject = \`Reminder: \${eventTitle} Besok!\`
    htmlContent = \`
      <h1>Jangan Lupa!</h1>
      <p>Halo \${userName},</p>
      <p>Event <strong>\${eventTitle}</strong> akan dimulai besok.</p>
      <p>Tanggal: \${eventDate}</p>
      <p>Jangan sampai ketinggalan!</p>
    \`
  }

  // Send email using your preferred email service
  // Example with SendGrid, Resend, or SMTP

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
\`\`\`

### 4. Alternative: Using Supabase Triggers

Buat database trigger untuk auto-send emails:

\`\`\`sql
-- Create function to send registration email
CREATE OR REPLACE FUNCTION send_registration_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call your edge function or external email service
  -- This is a placeholder - implement based on your email provider
  
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object(
      'type', 'registration_confirmation',
      'email', (SELECT email FROM auth.users WHERE id = NEW.user_id),
      'eventTitle', (SELECT title FROM events WHERE id = NEW.event_id),
      'eventDate', (SELECT start_date FROM events WHERE id = NEW.event_id)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_registration_created
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION send_registration_email();
\`\`\`

### 5. Email Service Options

#### Option A: Resend (Recommended)

\`\`\`bash
npm install resend
\`\`\`

\`\`\`typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Ngevent <notifications@ngevent.com>',
  to: userEmail,
  subject: subject,
  html: htmlContent,
});
\`\`\`

#### Option B: SendGrid

\`\`\`bash
npm install @sendgrid/mail
\`\`\`

#### Option C: Nodemailer (SMTP)

\`\`\`bash
npm install nodemailer
\`\`\`

### 6. Environment Variables

Tambahkan ke \`.env.local\`:

\`\`\`env
# Email Service
RESEND_API_KEY=your-resend-api-key
# or
SENDGRID_API_KEY=your-sendgrid-api-key
# or for SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

### 7. Testing Email Notifications

\`\`\`bash
# Test locally
curl -X POST http://localhost:3000/api/send-email \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "registration_confirmation",
    "email": "test@example.com",
    "eventTitle": "Test Event",
    "eventDate": "2025-12-01",
    "userName": "Test User"
  }'
\`\`\`

## Email Reminder Cron Job

### Setup Cron Job di Supabase

\`\`\`sql
-- Create function to send reminders
CREATE OR REPLACE FUNCTION send_event_reminders()
RETURNS void AS $$
DECLARE
  event_record RECORD;
BEGIN
  -- Find events starting tomorrow
  FOR event_record IN
    SELECT e.*, u.email, p.full_name
    FROM events e
    JOIN registrations r ON r.event_id = e.id
    JOIN auth.users u ON u.id = r.user_id
    JOIN profiles p ON p.id = r.user_id
    WHERE e.start_date::date = CURRENT_DATE + INTERVAL '1 day'
      AND r.status = 'registered'
  LOOP
    -- Send reminder email
    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-email',
      body := jsonb_build_object(
        'type', 'event_reminder',
        'email', event_record.email,
        'eventTitle', event_record.title,
        'eventDate', event_record.start_date,
        'userName', event_record.full_name
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
-- SELECT cron.schedule('send-event-reminders', '0 9 * * *', 'SELECT send_event_reminders()');
\`\`\`

## Production Checklist

- [ ] Setup email service provider (Resend/SendGrid)
- [ ] Add API keys to environment variables
- [ ] Test email delivery
- [ ] Setup email templates
- [ ] Configure SPF/DKIM records
- [ ] Test reminder cron job
- [ ] Monitor email delivery rates
- [ ] Setup email bounce handling

## Notes

- Email notifications require a paid email service in production
- Test thoroughly in development before deploying
- Monitor email delivery rates and bounces
- Keep email templates professional and branded
- Include unsubscribe links for compliance

---

Untuk implementasi lengkap, pilih salah satu email service provider dan ikuti dokumentasi mereka.
