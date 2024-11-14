import { SupabaseService } from 'src/supabase/supabase.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperFunctionsClass {
  constructor(private readonly SupabaseService: SupabaseService) {}

  squashTemperature = (temperature: number) => {
    return temperature / 100;
  };

  getEmbedding = async (text: string) => {
    const embedding = await this.SupabaseService.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return embedding.data[0].embedding;
  };

  searchVectorStore = async (
    embedding: number[],
    table_id: string,
    limit: number = 5,
  ) => {
    const { data, error } = await this.SupabaseService.supabase.rpc(table_id, {
      filter: {},
      query_embedding: embedding,
      match_count: limit,
    });

    if (error) throw error;
    return data;
  };

  fetchFunctionToolCallingPermissions = async (model: string) => {
    switch (model) {
      case 'gpt-4-turbo':
        return true;
      case 'gpt-4o':
        return true;
      case 'gpt-4o-mini':
        return true;
      case 'gpt-3.5-turbo':
        return true;
      default:
        return false;
    }
  };

  /**
   * This function is used to generate a response from the model
   * @param modelData The model data
   * @param table_id The table id
   * @param streaming The streaming boolean
   * @param summary The summary
   * @param user_question The user question
   * @param msgs The messages
   * @returns The response
   */

  tools = [
    {
      type: 'function',
      function: {
        name: 'escalate_to_human_support',
        description:
          'Escalate the chat to a human support agent. Call this function when the conversation requires human intervention.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'The reason for escalation to human support.',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'show_products',
        description:
          'Display a list of products to the user. Call this function when the user requests to see available products.',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description:
                'Optional: A specific category of products to display.',
            },
          },
        },
      },
    },
  ];

  /**
   * Escalates the chat to a human support agent.
   *
   * @param {Object} params - The parameters for escalation.
   * @param {string} [params.reason] - The reason for escalating to human support.
   *
   * @returns {void} Returns Nothing
   */
  escalateToHumanSupport = async (params: any) => {
    const { reason } = params;
    if (reason) {
      console.log(`Escalating chat due to reason: ${reason}`);
    } else {
      console.log('Escalating chat without specific reason.');
    }
  };
}
