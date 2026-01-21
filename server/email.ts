import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendVerificationEmail(to: string, code: string, language: string = 'ru') {
  const { client, fromEmail } = await getResendClient();
  
  const subjects: Record<string, string> = {
    ru: 'Код подтверждения NeuraPix',
    uk: 'Код підтвердження NeuraPix',
    en: 'NeuraPix Verification Code'
  };
  
  const messages: Record<string, string> = {
    ru: `Ваш код подтверждения: <strong>${code}</strong><br><br>Код действителен 10 минут.<br><br>Если вы не запрашивали этот код, просто проигнорируйте это письмо.`,
    uk: `Ваш код підтвердження: <strong>${code}</strong><br><br>Код дійсний 10 хвилин.<br><br>Якщо ви не запитували цей код, просто проігноруйте цей лист.`,
    en: `Your verification code: <strong>${code}</strong><br><br>This code is valid for 10 minutes.<br><br>If you didn't request this code, please ignore this email.`
  };

  const subject = subjects[language] || subjects.en;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">NeuraPix</h1>
        <p style="color: #666; margin-top: 5px;">AI Photo Editor</p>
      </div>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          ${messages[language] || messages.en}
        </p>
        <div style="background: #6366f1; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block;">
          ${code}
        </div>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        © ${new Date().getFullYear()} NeuraPix. All rights reserved.
      </p>
    </div>
  `;

  try {
    const result = await client.emails.send({
      from: 'NeuraPix <info@neurapix.net>',
      to: [to],
      subject,
      html
    });
    
    console.log('Email sent:', result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
