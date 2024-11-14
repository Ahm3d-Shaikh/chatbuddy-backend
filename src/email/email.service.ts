import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Email_Lead_joined } from './templates';
import * as nodemailer from 'nodemailer';
import {
  ChatbotSettings,
  Chatbot,
  Lead,
  SecuritySettings,
} from './email.interface';

@Injectable()
export class EmailService {
  private transporter;
  constructor(private readonly supabaseService: SupabaseService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASS,
      },
    });
  }

  async LimitReachEmail(chatbot_id: string, lead_id: string) {
    const chatbotResponse = await this.supabaseService.supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbot_id)
      .single();

    const leadResponse = await this.supabaseService.supabase
      .from('leads')
      .select('*')
      .eq('lead_id', lead_id)
      .single();

    const chatbot = chatbotResponse.data as unknown as Chatbot | null;
    const lead = leadResponse.data as unknown as Lead | null;

    if (!chatbot?.settings?.security?.contactEmailForLimit) {
      return;
    }
    const mailOptions = {
      from: process.env.MAILER_EMAIL,
      to: chatbot.settings.security.contactEmailForLimit,
      subject: 'Lead has Reached the Limit.',
      html: Email_Lead_joined(lead, chatbot_id),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
