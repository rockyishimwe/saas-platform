// Mock email service for testing
const logger = require('./logger');

class EmailService {
  async sendEmail(options) {
    logger.info(`Mock email sent to ${options.to}: ${options.subject}`);
    return { messageId: 'mock-message-id' };
  }

  async sendInvitationEmail(email, invitationToken, companyName) {
    logger.info(`Mock invitation email sent to ${email} for ${companyName}`);
    return this.sendEmail({
      to: email,
      subject: `Invitation to join ${companyName}`,
      html: `<p>You're invited to join ${companyName}</p>`,
      text: `You're invited to join ${companyName}`,
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    logger.info(`Mock password reset email sent to ${email}`);
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: '<p>Reset your password</p>',
      text: 'Reset your password',
    });
  }
}

module.exports = new EmailService();
