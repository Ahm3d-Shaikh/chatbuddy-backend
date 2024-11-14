import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import Chatbot from './chatbot';
import { ProductsService } from 'src/products/products.service';
import { PureChain } from './PureChain';
import { DashboardStats } from './dashboardInterface';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly SupabaseService: SupabaseService,
    private readonly ProductsService: ProductsService,
    private readonly PureChain: PureChain,
  ) {}

  getAllBots = async (user_id: any) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('chatbots')
        .select('*,files(*)')
        .eq('userid', user_id);
      if (error) {
        throw new Error('Error in fetching chatbots: ' + error);
      }
      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching chatbots: ' + err);
    }
  };

  createBot = async (name: any, userid: any) => {
    let chatbot_id = null;
    const chatbot = new Chatbot(
      true,
      this.SupabaseService,
      this.ProductsService,
      this.PureChain,
    );

    try {
      chatbot_id = await chatbot.createChatbot({
        name,
        userid,
        settings: chatbot.settings,
      });

      if (chatbot_id) {
        const { data: customer, error: selectError } =
          await this.SupabaseService.supabase
            .from('customer')
            .select('chatbots_allowed,total_credits')
            .eq('uuid', userid)
            .single();

        if (selectError) {
          console.error('Error fetching customer:', selectError);
          return;
        }

        if (customer) {
          const chatbots = (customer.chatbots_allowed as number) - 1;
          const { error: updateError } = await this.SupabaseService.supabase
            .from('customer')
            .update({ chatbots_allowed: chatbots })
            .eq('uuid', userid);

          if (updateError) {
            console.error('Error updating chatbots_allowed:', updateError);
          }
        } else {
          console.error('Customer not found');
        }
      }

      return { chatbot_id, error: null };
    } catch (error) {
      return {
        error: (error as any)?.message,
        chatbot_id: null,
      };
    }
  };

  getAbot = async (user_id: any, chatbot_id: any) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('chatbots')
        .select('*,files(*)')
        .eq('userid', user_id)
        .eq('id', chatbot_id);
      if (error) {
        throw new Error('Error in fetching chatbots: ' + error);
      }
      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching chatbots: ' + err);
    }
  };

  getBotFiles = async (user_id: any, chatbot_id: any) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('files')
        .select('*')
        .eq('chatbot_id', chatbot_id);
      if (error) {
        console.log(error);
        throw new Error('Error in fetching chatbots: ' + error);
      }
      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching chatbots: ' + err);
    }
  };

  updateBot = async (
    user_id: any,
    chatbot_id: any,
    settings: any,
    name: any,
  ) => {
    try {
      const updateFields: any = {};
      if (settings !== undefined) updateFields.settings = settings;
      if (name !== undefined) updateFields.name = name;

      const { data, error } = await this.SupabaseService.supabase
        .from('chatbots')
        .update(updateFields)
        .eq('id', chatbot_id)
        .select('*')
        .single();

      if (error) {
        throw new Error('Error in updateChatbotName chatbots: ' + error);
      }
      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in updateChatbotName chatbots: ' + err);
    }
  };

  deleteBot = async (user_id: any, chatbot_id: any) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('chatbots')
        .delete()
        .eq('id', chatbot_id);
      if (error) {
        throw new Error('Error in Deleting chatbots: ' + error);
      }
      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in Deleting chatbots: ' + err);
    }
  };

  fetchDashboardDetails = async (botId: string) => {
    const { data: latestLead, error: latestLeadError } =
      await this.SupabaseService.supabase
        .from('leads')
        .select('submitted_at')
        .eq('chatbot_id', botId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

    if (latestLeadError) throw latestLeadError;

    const currentMonthEnd = new Date(
      latestLead?.submitted_at as string | number | Date,
    );
    const currentMonthStart = new Date(currentMonthEnd);
    currentMonthStart.setDate(currentMonthStart.getDate() - 30);

    const previousMonthEnd = new Date(currentMonthStart);
    previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);
    const previousMonthStart = new Date(previousMonthEnd);
    previousMonthStart.setDate(previousMonthStart.getDate() - 30);

    const currentMonthStats = await this.fetchMonthStats(
      botId,
      currentMonthStart,
      currentMonthEnd,
    );
    const previousMonthStats = await this.fetchMonthStats(
      botId,
      previousMonthStart,
      previousMonthEnd,
    );

    return {
      conversations: {
        value: currentMonthStats.conversations,
        percentChange: this.calculatePercentChange(
          previousMonthStats.conversations,
          currentMonthStats.conversations,
        ),
      },
      messages: {
        value:
          Math.round(
            currentMonthStats.messages / currentMonthStats.conversations,
          ) || 0,
        percentChange: this.calculatePercentChange(
          Math.round(
            previousMonthStats.messages / previousMonthStats.conversations,
          ) || 0,
          Math.round(
            currentMonthStats.messages / currentMonthStats.conversations,
          ) || 0,
        ),
      },
      messageLinkClicks: {
        value: currentMonthStats.messageLinkClicks,
        percentChange: this.calculatePercentChange(
          previousMonthStats.messageLinkClicks,
          currentMonthStats.messageLinkClicks,
        ),
      },
      positiveFeedback: {
        value: parseFloat(currentMonthStats.positiveFeedback.toFixed(1)),
        percentChange: this.calculatePercentChange(
          previousMonthStats.positiveFeedback,
          currentMonthStats.positiveFeedback,
        ),
      },
      negativeFeedback: {
        value: parseFloat(currentMonthStats.negativeFeedback.toFixed(1)),
        percentChange: this.calculatePercentChange(
          previousMonthStats.negativeFeedback,
          currentMonthStats.negativeFeedback,
        ),
      },
      avgClickRate: {
        value: currentMonthStats.avgClickRate,
        percentChange: this.calculatePercentChange(
          previousMonthStats.avgClickRate,
          currentMonthStats.avgClickRate,
        ),
      },
      countryCounts: currentMonthStats.countryCounts,
    };
  };

  fetchMonthStats = async (botId: string, startDate: Date, endDate: Date) => {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const { data: leadsData, error: leadsError } =
      await this.SupabaseService.supabase
        .from('leads')
        .select('msgs, links_click_count, bot_opened_count, country_name')
        .eq('chatbot_id', botId)
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString());

    if (leadsError) throw leadsError;

    let conversations = 0;
    let totalMessages = 0;
    let positiveFeedback = 0;
    let negativeFeedback = 0;
    let messageLinkClicks = 0;
    let avgClickRate = 0;
    const countryCounts: Record<string, number> = {};

    leadsData?.forEach(
      (lead: {
        msgs: any[];
        links_click_count: number;
        bot_opened_count: number;
        country_name: string;
      }) => {
        conversations++;
        if (Array.isArray(lead.msgs)) {
          totalMessages += lead.msgs.length;
          lead.msgs.forEach((msg: { reaction: string }) => {
            if (msg.reaction === 'liked') positiveFeedback++;
            if (msg.reaction === 'disliked') negativeFeedback++;
          });
        }
        messageLinkClicks += lead.links_click_count ?? 0;
        avgClickRate += lead.bot_opened_count ?? 0;

        const country = lead.country_name;
        if (country) {
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        }
      },
    );

    return {
      conversations,
      messages: totalMessages,
      positiveFeedback: (positiveFeedback / totalMessages) * 100 || 0,
      negativeFeedback: (negativeFeedback / totalMessages) * 100 || 0,
      messageLinkClicks,
      avgClickRate: (avgClickRate / conversations) * 100 || 0,
      countryCounts,
    };
  };

  calculatePercentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }
}
