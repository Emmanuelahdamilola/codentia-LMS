// PATH: src/lib/email.ts
// Email via Nodemailer + Gmail SMTP
//
// Required env vars:
//   EMAIL_HOST     = smtp.gmail.com
//   EMAIL_PORT     = 587
//   EMAIL_USER     = codentia01@gmail.com
//   EMAIL_PASS     = your-gmail-app-password  (NOT your regular password)
//   EMAIL_FROM     = Codentia <codentia01@gmail.com>
//
// Gmail setup:
//   1. Enable 2-Factor Authentication on your Gmail account
//   2. Go to Google Account → Security → App Passwords
//   3. Create an App Password for "Mail"
//   4. Use that 16-character password as EMAIL_PASS

import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Parse FROM address — supports both:
//   "Codentia <codentia01@gmail.com>"  ← correct format
//   "Codentia codentia01@gmail.com"    ← also handled
function parseFrom(raw: string): string {
  if (!raw) return 'Codentia <noreply@gmail.com>'
  // Already properly formatted
  if (raw.includes('<') && raw.includes('>')) return raw
  // Space-separated "Name email@domain.com" → convert to proper format
  const lastSpace = raw.lastIndexOf(' ')
  if (lastSpace > 0) {
    const name  = raw.slice(0, lastSpace).trim()
    const email = raw.slice(lastSpace + 1).trim()
    if (email.includes('@')) return `${name} <${email}>`
  }
  return raw
}

const FROM = parseFrom(process.env.EMAIL_FROM ?? 'Codentia <noreply@gmail.com>')

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[email] EMAIL_USER or EMAIL_PASS not set — skipping email to', to)
    return
  }
  const transporter = createTransport()
  await transporter.sendMail({ from: FROM, to, subject, html })
}

// ── Live Class Reminder ───────────────────────────────────────
export async function sendLiveClassReminder(
  studentEmail: string,
  studentName:  string,
  classTitle:   string,
  scheduledAt:  Date,
  meetingLink:  string,
  reminderType: '24h' | '1h' | '10min'
) {
  const subjects: Record<typeof reminderType, string> = {
    '24h':   `Your class tomorrow: ${classTitle}`,
    '1h':    `Starting soon: ${classTitle} in 1 hour`,
    '10min': `Starting now: ${classTitle}`,
  }

  const timeStr = scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
  const dateStr = scheduledAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  await sendMail(studentEmail, subjects[reminderType], `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#8A70D6,#6B52B8);padding:32px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">${reminderType === '10min' ? '🔴' : '📹'}</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">${subjects[reminderType]}</h1>
  </div>
  <div style="padding:40px;">
    <p style="color:#424040;font-size:15px;margin:0 0 8px;">Hi ${studentName.split(' ')[0]},</p>
    <p style="color:#424040;font-size:14px;line-height:1.6;margin:0 0 24px;">
      ${reminderType === '10min'
        ? `<strong>${classTitle}</strong> is starting right now!`
        : reminderType === '1h'
        ? `<strong>${classTitle}</strong> starts in 1 hour at ${timeStr}.`
        : `You have a live class tomorrow: <strong>${classTitle}</strong> on ${dateStr} at ${timeStr}.`}
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${meetingLink}" style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
        ${reminderType === '10min' ? 'Join Now →' : 'Join Class →'}
      </a>
    </div>
    <p style="color:#8A8888;font-size:12px;margin:0;text-align:center;">
      <a href="${APP_URL}/live-classes" style="color:#8A8888;">View all live classes</a>
    </p>
  </div>
</div></body></html>`)
}

// ── Assignment Deadline Reminder ──────────────────────────────
export async function sendAssignmentDeadlineReminder(
  studentEmail:    string,
  studentName:     string,
  assignmentTitle: string,
  courseName:      string,
  dueDate:         Date,
  assignmentLink:  string
) {
  const dueDateStr = dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const dueTimeStr = dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  await sendMail(studentEmail, `Due tomorrow: ${assignmentTitle}`, `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:32px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">⏰</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Assignment due tomorrow</h1>
  </div>
  <div style="padding:40px;">
    <p style="color:#424040;font-size:15px;margin:0 0 8px;">Hi ${studentName.split(' ')[0]},</p>
    <p style="color:#424040;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your assignment <strong>${assignmentTitle}</strong> for <strong>${courseName}</strong> is due on ${dueDateStr} at ${dueTimeStr}. Don't forget to submit!
    </p>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${assignmentLink}" style="display:inline-block;background:#F59E0B;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
        Submit Assignment →
      </a>
    </div>
  </div>
</div></body></html>`)
}

// ── Grade / Feedback Notification ────────────────────────────
export async function sendGradeNotification(
  studentEmail:    string,
  studentName:     string,
  assignmentTitle: string,
  grade:           number,
  feedback:        string,
  courseLink:      string
) {
  const pct         = grade
  const color       = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444'
  const label       = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!'

  await sendMail(studentEmail, `Your assignment has been graded: ${assignmentTitle}`, `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#8A70D6,#6B52B8);padding:32px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">🎓</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Assignment Graded</h1>
  </div>
  <div style="padding:40px;">
    <p style="color:#424040;font-size:15px;margin:0 0 16px;">Hi ${studentName.split(' ')[0]},</p>
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:52px;font-weight:900;color:${color};">${pct}%</div>
      <div style="font-size:14px;color:${color};font-weight:600;">${label}</div>
    </div>
    <p style="color:#424040;font-size:13px;font-weight:600;margin:0 0 8px;">${assignmentTitle}</p>
    ${feedback ? `<div style="background:#F8F6FF;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="color:#6B52B8;font-size:12px;font-weight:600;margin:0 0 4px;">Instructor Feedback</p>
      <p style="color:#424040;font-size:13px;line-height:1.6;margin:0;">${feedback}</p>
    </div>` : ''}
    <div style="text-align:center;">
      <a href="${courseLink}" style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
        Continue Learning →
      </a>
    </div>
  </div>
</div></body></html>`)
}

// ── Email Verification ────────────────────────────────────────
export async function sendVerificationEmail(
  to:    string,
  name:  string,
  token: string,
) {
  const link = `${APP_URL}/verify-email?token=${token}`

  await sendMail(to, 'Verify your Codentia account', `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
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
      <a href="${link}" style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;">
        Verify Email Address
      </a>
    </div>
    <p style="color:#8A8888;font-size:12px;margin:0;text-align:center;">
      This link expires in 24 hours. If you didn't sign up, you can ignore this email.
    </p>
    <p style="color:#8A8888;font-size:11px;margin:12px 0 0;text-align:center;word-break:break-all;">
      Or copy: ${link}
    </p>
  </div>
</div></body></html>`)
}

// ── Re-engagement Email ───────────────────────────────────────
export async function sendReEngagementEmail(
  to:   string,
  name: string,
) {
  await sendMail(to, `${name.split(' ')[0]}, your learning streak is waiting! 🔥`, `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#FBFBFB;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E9E3FF;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#8A70D6,#6B52B8);padding:32px 40px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">🔥</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">We miss you!</h1>
    <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px;">Your coding journey is waiting</p>
  </div>
  <div style="padding:40px;">
    <p style="color:#424040;font-size:16px;margin:0 0 8px;">Hi ${name.split(' ')[0]},</p>
    <p style="color:#424040;font-size:14px;line-height:1.6;margin:0 0 24px;">
      You haven't logged in for 7 days. Your courses are still here — pick up right where you left off!
    </p>
    <div style="background:#F0EAFF;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="color:#6B52B8;font-size:13px;margin:0;font-weight:600;">
        💡 Even 15 minutes a day builds real skills fast.
      </p>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#8A70D6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
        Continue Learning →
      </a>
    </div>
  </div>
</div></body></html>`)
}