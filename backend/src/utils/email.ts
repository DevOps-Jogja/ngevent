import { Resend } from 'resend';
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
  getEventNotificationTemplate,
  getEventRegistrationTemplate,
} from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

const getFromEmail = () => process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send email verification to user
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const frontendUrl = getFrontendUrl();
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: 'Verifikasi Email Anda - NGEvent',
      html: getVerificationEmailTemplate({ verificationUrl, frontendUrl }),
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email to user
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const frontendUrl = getFrontendUrl();
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: 'Reset Password Anda - NGEvent',
      html: getPasswordResetEmailTemplate({ resetUrl, frontendUrl }),
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Send event notification/update to user
 */
export const sendEventNotification = async (email: string, eventTitle: string, message: string) => {
  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Update Event: ${eventTitle}`,
      html: getEventNotificationTemplate({ eventTitle, message }),
    });
  } catch (error) {
    console.error('Failed to send event notification:', error);
    throw error;
  }
};

/**
 * Send welcome email to new user on first login
 */
export const sendWelcomeEmail = async (email: string, fullName: string) => {
  const frontendUrl = getFrontendUrl();
  const dashboardUrl = `${frontendUrl}/dashboard`;
  const profileUrl = `${frontendUrl}/profile`;

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: 'Selamat Datang di NGEvent! 🎉',
      html: getWelcomeEmailTemplate({
        fullName: fullName || 'Pengguna Baru',
        dashboardUrl,
        profileUrl,
        frontendUrl,
      }),
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

/**
 * Send event registration confirmation email to participant
 */
export const sendEventRegistrationEmail = async (
  email: string,
  fullName: string,
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
  }
) => {
  const frontendUrl = getFrontendUrl();
  const eventUrl = `${frontendUrl}/event/${event.id}`;

  // Format date and time
  let eventDateFormatted = event.startDate;
  let eventTimeFormatted = '';

  try {
    const date = new Date(event.startDate);
    eventDateFormatted = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    eventTimeFormatted = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    // Keep original if parsing fails
  }

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: `Konfirmasi Pendaftaran: ${event.title}`,
      html: getEventRegistrationTemplate({
        fullName,
        eventTitle: event.title,
        eventDate: eventDateFormatted,
        eventTime: eventTimeFormatted,
        eventLocation: event.location || 'TBA',
        eventId: event.id,
        eventUrl,
        frontendUrl,
      }),
    });
  } catch (error) {
    console.error('Failed to send event registration email:', error);
    throw error;
  }
};

/**
 * Send batch event notifications to multiple users
 */
export const sendBatchEventNotifications = async (
  emails: {
    to: string;
    subject: string;
    html: string;
  }[]
) => {
  try {
    // Map to Resend batch format
    const batchEmails = emails.map(email => ({
      from: getFromEmail(),
      to: email.to,
      subject: email.subject,
      html: email.html,
    }));

    const { data, error } = await resend.batch.send(batchEmails);

    if (error) {
      console.error('Failed to send batch emails:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send batch emails:', error);
    throw error;
  }
};
