const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return result;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendInvitationEmail(email, invitationToken, companyName) {
    const invitationUrl = `${process.env.FRONTEND_URL}/invite?token=${invitationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited to Join ${companyName}</h2>
        <p>You've been invited to join the feedback platform for ${companyName}.</p>
        <p>Click the link below to accept the invitation and set up your account:</p>
        <a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Accept Invitation</a>
        <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Invitation to join ${companyName}`,
      html,
      text: `You're invited to join ${companyName}. Visit ${invitationUrl} to accept the invitation.`,
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    });
  }
}

module.exports = new EmailService();
