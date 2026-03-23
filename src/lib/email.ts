import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@codentia.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Live Class Reminder ─────────────────────────────────────

export async function sendLiveClassReminder(
  studentEmail: string,
  studentName: string,
  classTitle: string,
  scheduledAt: Date,
  meetingLink: string,
  reminderType: '24h' | '1h' | '10min'
) {
  const subjects: Record<typeof reminderType, string> = {
    '24h': `Your class tomorrow: ${classTitle}`,
    '1h': `Starting soon: ${classTitle} in 1 hour`,
    '10min': `Starting now: ${classTitle}`,
  }

  const timeStr = scheduledAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const dateStr = scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: subjects[reminderType],
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Lato', Arial, sans-serif; background: #FBFBFB; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E9E3FF;">
    <!-- Header -->
    <div style="background: #8A70D6; padding: 32px 40px;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Codentia</h1>
      <p style="color: #E9E3FF; margin: 8px 0 0; font-size: 14px;">Interactive Coding Academy</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: #424040; font-size: 16px; margin: 0 0 8px;">Hi ${studentName},</p>
      <h2 style="color: #424040; font-size: 20px; margin: 0 0 24px;">${subjects[reminderType]}</h2>

      <div style="background: #F0EAFF; border-left: 4px solid #8A70D6; border-radius: 4px; padding: 20px 24px; margin-bottom: 32px;">
        <p style="color: #424040; font-weight: 600; margin: 0 0 4px; font-size: 16px;">📹 ${classTitle}</p>
        <p style="color: #8A8888; margin: 0; font-size: 14px;">${dateStr} at ${timeStr}</p>
      </div>

      <a href="${meetingLink}"
         style="display: inline-block; background: #8A70D6; color: #fff; text-decoration: none;
                padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
        Join Class →
      </a>

      <p style="color: #8A8888; font-size: 13px; margin: 32px 0 0;">
        You can also join from your <a href="${APP_URL}/live-classes" style="color: #8A70D6;">Live Classes</a> page.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #E9E3FF; padding: 20px 40px; text-align: center;">
      <p style="color: #8A8888; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Codentia. You're receiving this because you're enrolled in a live class.
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}

// ─── Assignment Deadline Reminder ────────────────────────────

export async function sendAssignmentDeadlineReminder(
  studentEmail: string,
  studentName: string,
  assignmentTitle: string,
  courseName: string,
  dueDate: Date,
  assignmentLink: string
) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: `Assignment due tomorrow: ${assignmentTitle}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #FBFBFB; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #E9E3FF; overflow: hidden;">
    <div style="background: #8A70D6; padding: 28px 40px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Codentia</h1>
    </div>
    <div style="padding: 40px;">
      <p style="color: #424040;">Hi ${studentName},</p>
      <p style="color: #424040;">Your assignment <strong>${assignmentTitle}</strong> for <strong>${courseName}</strong> is due tomorrow.</p>
      <a href="${assignmentLink}"
         style="display: inline-block; background: #8A70D6; color: #fff; text-decoration: none;
                padding: 12px 28px; border-radius: 8px; font-weight: 600;">
        Submit Assignment →
      </a>
    </div>
  </div>
</body>
</html>`,
  })
}
// ── Email Verification ────────────────────────────────────────
export async function sendVerificationEmail(
  to:    string,
  name:  string,
  token: string,
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const link    = `${APP_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from:    FROM,
    to,
    subject: 'Verify your Codentia account',
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#8A70D6,#6B52B8);padding:32px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">✉️</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Verify your email</h1>
    <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">One click and you're in</p>
  </div>
  <div style="padding:40px;">
    <p style="color:#424040;font-size:16px;margin:0 0 8px;">Hi ${name.split(' ')[0]},</p>
    <p style="color:#424040;font-size:14px;line-height:1.6;margin:0 0 28px;">
      Thanks for signing up for Codentia! Click the button below to verify your email address and activate your account.
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${link}"
         style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;
                padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;">
        Verify Email Address
      </a>
    </div>
    <p style="color:#8A8888;font-size:12px;margin:0;text-align:center;">
      This link expires in 24 hours. If you didn't sign up, you can ignore this email.
    </p>
    <p style="color:#8A8888;font-size:11px;margin:16px 0 0;text-align:center;word-break:break-all;">
      Or copy this link: ${link}
    </p>
  </div>
</div></body></html>`,
  })
}