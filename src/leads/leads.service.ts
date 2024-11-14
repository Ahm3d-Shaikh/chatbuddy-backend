import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import * as nodemailer from 'nodemailer';
import { Email_NEW_Lead_joined } from '../email/templates/index';

@Injectable()
export class LeadsService {
  constructor(private readonly SupabaseService: SupabaseService) {}

  getAllLeads = async (chatbot_id: any) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('leads')
        .select()
        .eq('chatbot_id', chatbot_id);

      if (error) {
        throw new Error('Error fetching leads: ' + error.message);
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching leads: ' + err);
    }
  };

  addLead = async (
    name: any,
    phone: any,
    email: any,
    chatbot_id: any,
    userEmailToSendLeadEmail: any,
    country_name: string,
  ) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('leads')
        .insert([{ name, phone, email, chatbot_id, country_name }])
        .select('lead_id')
        .single();

      if (error) {
        throw new Error('Error adding lead: ' + error.message);
      }

      if (
        Array.isArray(userEmailToSendLeadEmail) &&
        userEmailToSendLeadEmail.length > 0
      ) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAILER_EMAIL,
            pass: process.env.MAILER_PASS,
          },
        });

        for (const recipient of userEmailToSendLeadEmail) {
          const mailOptions = {
            from: process.env.MAILER_EMAIL,
            to: recipient,
            subject: ' New Lead has joined.',
            html: Email_NEW_Lead_joined(data),
          };

          try {
            await transporter.sendMail(mailOptions);
          } catch (error) {
            console.error('Error sending email:', error);
          }
        }
      } else {
        console.log('No valid email addresses to send the email to.');
      }

      return data;
    } catch (err) {
      console.error(err);
      throw new Error('Error in adding lead: ' + err);
    }
  };

  getLeadsByTime = async (startTime: any, endTime: any, chatbot_id: any) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('leads')
        .select()
        .eq('chatbot_id', chatbot_id)
        .gte('submitted_at', startTime)
        .lte('submitted_at', endTime);

      if (error) {
        throw new Error('Error fetching leads: ' + error.message);
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching leads: ' + err);
    }
  };

  getSingleLeadDataApi = async (lead_id: any) => {
    console.log('lead_id', lead_id);
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('leads')
        .select()
        .eq('lead_id', lead_id);

      if (error) {
        throw new Error('Error fetching lead: ' + error.message);
      }

      return data.length > 0 ? data[0] : null;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching lead: ' + err);
    }
  };

  updateLead = async (lead_id: any, updatedMessages: any) => {
    try {
      if (!lead_id) {
        throw new Error('Lead ID is required');
      }

      const { data, error: updateError } = await this.SupabaseService.supabase
        .from('leads')
        .update({ msgs: updatedMessages, notification: true })
        .eq('lead_id', lead_id)
        .select('*');

      if (updateError) {
        console.error('Error updating messages:', updateError.message);
        return;
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching leads: ' + err);
    }
  };
}
