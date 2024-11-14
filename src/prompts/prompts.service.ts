import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PromptsService {
  constructor(private readonly SupabaseService: SupabaseService) {}

  getAllPrompts = async (user_id: string, chatbot_id: string) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('prompts')
        .select()
        .match({ userid: user_id, botid: chatbot_id });

      if (error) {
        throw new Error('Error fetching prompts: ' + error.message);
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching prompts: ' + err);
    }
  };

  addPrompt = async (
    userid: string,
    botid: string,
    name: string,
    type: string,
    action: any,
    prompt: string,
    color: any,
  ) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('prompts')
        .insert([
          { userid, botid, name, type, action, prompt, highlight_color: color },
        ]);

      if (error) {
        throw new Error('Error adding prompt: ' + error.message);
      }

      return data;
    } catch (err) {
      console.error(err);
      throw new Error('Error in adding prompt: ' + err);
    }
  };

  deletePrompt = async (userid: string, promptid: string) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('prompts')
        .delete()
        .eq('id', promptid)
        .eq('userid', userid);

      if (error) {
        throw new Error('Error deleting prompt: ' + error.message);
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in deleting prompt: ' + err);
    }
  };
}
