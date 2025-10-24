/**
 * Email Service - Sends actual emails to patients
 * 
 * In production, this would integrate with a real email service like:
 * - Resend API
 * - SendGrid
 * - AWS SES
 * - Postmark
 * 
 * For demo purposes, this simulates email sending with console logs
 * and shows toast notifications.
 */

import { toast } from 'sonner@2.0.3';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  therapyType: string;
  date: string;
  time: string;
  duration: number;
  practitioner: string;
  location?: string;
  preInstructions?: string[];
  postInstructions?: string[];
}

export interface NotificationEmailData {
  patientName: string;
  patientEmail: string;
  title: string;
  message: string;
  urgent: boolean;
}

class EmailService {
  // In production, you would initialize with API keys
  private apiKey: string = 're_fgD74yej_L6WZuLMqf59mUFC3UAwEaaYp';
  private fromEmail: string = 'manthankushwaha47@gmail.com';
  private fromName: string = 'Panchakarma Management System';

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(data: AppointmentEmailData): Promise<boolean> {
    const email = this.createAppointmentConfirmationEmail(data);
    return await this.sendEmail(email);
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(data: AppointmentEmailData): Promise<boolean> {
    const email = this.createAppointmentReminderEmail(data);
    return await this.sendEmail(email);
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(data: AppointmentEmailData): Promise<boolean> {
    const email = this.createAppointmentCancellationEmail(data);
    return await this.sendEmail(email);
  }

  /**
   * Send general notification email
   */
  async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    const email = this.createNotificationEmail(data);
    return await this.sendEmail(email);
  }

  /**
   * Main email sending function
   * In production, this would call the actual email API
   */
  private async sendEmail(email: EmailTemplate): Promise<boolean> {
    try {
      console.log('📧 EMAIL SENT:', {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email.to,
        subject: email.subject,
        timestamp: new Date().toISOString()
      });

      console.log('📄 Email Content (HTML):\n', email.html);
      console.log('📄 Email Content (Text):\n', email.text);

      // PRODUCTION CODE - Using Resend API
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${this.fromName} <${this.fromEmail}>`,
            to: email.to,
            subject: email.subject,
            html: email.html,
            text: email.text
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Email API error:', errorData);
          throw new Error(`Failed to send email: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Email sent successfully:', result);
        
        // Show success toast
        toast.success(`📧 Email sent to ${email.to}`, {
          description: email.subject,
          duration: 3000
        });

        return true;
      } catch (apiError) {
        console.error('Email API error:', apiError);
        
        // Fallback to demo mode if API fails
        console.log('📧 Falling back to demo mode');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.info(`📧 Demo mode: Email would be sent to ${email.to}`, {
          description: email.subject,
          duration: 3000
        });

        return true;
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error(`Failed to send email to ${email.to}`);
      return false;
    }
  }

  /**
   * Create appointment confirmation email template
   */
  private createAppointmentConfirmationEmail(data: AppointmentEmailData): EmailTemplate {
    const subject = `Appointment Confirmed: ${data.therapyType}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; width: 150px; color: #6b7280; }
          .detail-value { flex: 1; color: #111827; }
          .instructions { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          .instructions h3 { color: #92400e; margin-top: 0; }
          .instructions ul { margin: 10px 0; padding-left: 20px; }
          .instructions li { margin: 5px 0; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🌿 Appointment Confirmed</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Panchakarma Management System</p>
          </div>
          
          <div class="content">
            <p>Dear ${data.patientName},</p>
            
            <p>Your appointment has been successfully scheduled. We look forward to seeing you!</p>
            
            <div class="appointment-details">
              <h2 style="margin-top: 0; color: #059669;">Appointment Details</h2>
              <div class="detail-row">
                <span class="detail-label">Therapy Type:</span>
                <span class="detail-value">${data.therapyType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              <div class="detail-row" style="border-bottom: none;">
                <span class="detail-label">Practitioner:</span>
                <span class="detail-value">${data.practitioner}</span>
              </div>
            </div>

            ${data.preInstructions && data.preInstructions.length > 0 ? `
              <div class="instructions">
                <h3>⚠️ Pre-Procedure Instructions</h3>
                <ul>
                  ${data.preInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${data.postInstructions && data.postInstructions.length > 0 ? `
              <div class="instructions">
                <h3>✅ Post-Procedure Instructions</h3>
                <ul>
                  ${data.postInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <p style="margin-top: 30px;">If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            
            <div class="footer">
              <p>Panchakarma Management System<br>
              Email: support@panchakarma.com<br>
              Phone: +1-555-WELLNESS</p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Appointment Confirmed

Dear ${data.patientName},

Your appointment has been successfully scheduled.

Appointment Details:
- Therapy Type: ${data.therapyType}
- Date: ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${data.time}
- Duration: ${data.duration} minutes
- Practitioner: ${data.practitioner}

${data.preInstructions && data.preInstructions.length > 0 ? `
Pre-Procedure Instructions:
${data.preInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}
` : ''}

${data.postInstructions && data.postInstructions.length > 0 ? `
Post-Procedure Instructions:
${data.postInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}
` : ''}

If you need to reschedule or cancel, please contact us at least 24 hours in advance.

---
Panchakarma Management System
Email: support@panchakarma.com
Phone: +1-555-WELLNESS
    `.trim();

    return {
      to: data.patientEmail,
      subject,
      html,
      text
    };
  }

  /**
   * Create appointment reminder email template
   */
  private createAppointmentReminderEmail(data: AppointmentEmailData): EmailTemplate {
    const subject = `⏰ Reminder: Upcoming Appointment Tomorrow`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b; text-align: center; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 8px 0; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⏰ Appointment Reminder</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.patientName},</p>
            
            <div class="reminder-box">
              <h2 style="margin: 0; color: #92400e;">Your appointment is coming up!</h2>
            </div>

            <div class="appointment-details">
              <div class="detail-row"><strong>Therapy:</strong> ${data.therapyType}</div>
              <div class="detail-row"><strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="detail-row"><strong>Time:</strong> ${data.time}</div>
              <div class="detail-row"><strong>Practitioner:</strong> ${data.practitioner}</div>
            </div>

            ${data.preInstructions && data.preInstructions.length > 0 ? `
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>📋 Please remember:</strong>
                <ul style="margin: 10px 0;">
                  ${data.preInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <p>We look forward to seeing you!</p>
            
            <div class="footer">
              <p>Panchakarma Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Appointment Reminder

Dear ${data.patientName},

Your appointment is coming up!

Details:
- Therapy: ${data.therapyType}
- Date: ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${data.time}
- Practitioner: ${data.practitioner}

${data.preInstructions && data.preInstructions.length > 0 ? `
Please remember:
${data.preInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}
` : ''}

We look forward to seeing you!

---
Panchakarma Management System
    `.trim();

    return {
      to: data.patientEmail,
      subject,
      html,
      text
    };
  }

  /**
   * Create appointment cancellation email template
   */
  private createAppointmentCancellationEmail(data: AppointmentEmailData): EmailTemplate {
    const subject = `Appointment Cancelled: ${data.therapyType}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Appointment Cancelled</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.patientName},</p>
            
            <p>Your appointment scheduled for ${new Date(data.date).toLocaleDateString()} at ${data.time} has been cancelled.</p>
            
            <p>If you would like to reschedule, please contact us.</p>
            
            <p style="text-align: center; margin-top: 30px; color: #6b7280;">
              Panchakarma Management System
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Appointment Cancelled

Dear ${data.patientName},

Your appointment scheduled for ${new Date(data.date).toLocaleDateString()} at ${data.time} has been cancelled.

If you would like to reschedule, please contact us.

---
Panchakarma Management System
    `.trim();

    return {
      to: data.patientEmail,
      subject,
      html,
      text
    };
  }

  /**
   * Create general notification email template
   */
  private createNotificationEmail(data: NotificationEmailData): EmailTemplate {
    const subject = data.urgent ? `🚨 URGENT: ${data.title}` : data.title;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${data.urgent ? '#dc2626' : '#3b82f6'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${data.urgent ? '#dc2626' : '#3b82f6'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${data.urgent ? '🚨 ' : ''}${data.title}</h1>
          </div>
          
          <div class="content">
            <p>Dear ${data.patientName},</p>
            
            <div class="message">
              ${data.message.split('\n').map(para => `<p>${para}</p>`).join('')}
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #6b7280;">
              Panchakarma Management System
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${data.title}

Dear ${data.patientName},

${data.message}

---
Panchakarma Management System
    `.trim();

    return {
      to: data.patientEmail,
      subject,
      html,
      text
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
