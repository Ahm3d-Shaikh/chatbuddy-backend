import { Injectable } from '@nestjs/common';
import { contextualizeQSystemPrompt, getChatPrompt } from './ChatbotPrompts';
import { HelperFunctionsClass } from './helper_functions';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class PureChain {
  constructor(
    private readonly SupabaseService: SupabaseService,
    private readonly HelperFunctionsClass: HelperFunctionsClass,
  ) {}

  PureChainFn = async (
    modelData: any,
    table_id: string,
    streaming: boolean,
    summary: string,
    user_question: string,
    msgs: any[],
    chatbot_id: string,
  ) => {
    const temperature = this.HelperFunctionsClass.squashTemperature(
      modelData?.temperature,
    );

    const { data: instructions } = await this.SupabaseService.supabase
      .from('instructions')
      .select('description,type')
      .eq('chatbot_id', chatbot_id);
    let finalInstructions = '';
    let finalPersona = '';
    let finalPurpose = '';
    if (instructions) {
      instructions?.forEach((item) => {
        if (item.type === 'instructions') {
          finalInstructions += `${item.description} `;
        } else if (item.type === 'persona') {
          finalPersona += `${item.description} `;
        } else if (item.type === 'purpose') {
          finalPurpose += `${item.description} `;
        }
      });
      finalInstructions = finalInstructions.trim();
      finalPersona = finalPersona.trim();
      finalPurpose = finalPurpose.trim();
    }
    const instructionToUse = finalInstructions
      ? finalInstructions
      : modelData.instruction;
    const personaToUse = finalPersona ? finalPersona : modelData.persona;
    // const purposeToUse = finalPurpose ? finalPurpose : modelData.purpose;

    const contextualizeResponse =
      await this.SupabaseService.openai.chat.completions.create({
        model: modelData.model,
        messages: [
          { role: 'system', content: contextualizeQSystemPrompt },
          { role: 'user', content: user_question },
        ],
        temperature: temperature,
      });

    const contextualizedQuestion =
      contextualizeResponse.choices[0].message.content;
    const embedding = await this.HelperFunctionsClass.getEmbedding(
      contextualizedQuestion as string,
    );
    const relevantDocs: any = await this.HelperFunctionsClass.searchVectorStore(
      embedding,
      table_id,
    );
    const context = relevantDocs.map((doc: any) => doc.content).join('\n');
    const SourcesToReturn = [
      ...new Set(relevantDocs.map((item: any) => item?.metadata?.source)),
    ];
    const prompt = getChatPrompt(
      instructionToUse,
      personaToUse,
      modelData.constraints,
      modelData.defaultLanguage,
      summary,
      user_question,
    );

    // console.log("\nContextualized-Question:"+contextualizedQuestion);
    let chat_history = msgs.filter((msg) => {
      if (
        !(msg.content && msg.content?.length > 0 && msg.content.length < 1000)
      ) {
        return false;
      }
      return msg.role === 'user' || msg.role === 'assistant';
    });
    chat_history = chat_history.map((msg) => {
      return { role: msg.role, content: msg.content };
    });
    chat_history = chat_history.slice(-4);
    const FC_Permissions =
      this.HelperFunctionsClass.fetchFunctionToolCallingPermissions(
        modelData.model,
      );
    return {
      sources: SourcesToReturn,
      promise: await this.SupabaseService.openai.chat.completions.create({
        model: modelData.model,
        messages: [
          { role: 'system', content: prompt },
          ...chat_history,
          { role: 'assistant', content: `Context: ${context}` },
          { role: 'user', content: user_question },
        ],
        temperature: temperature,
        stream: streaming,
        ...(FC_Permissions && {
          tools: this.HelperFunctionsClass.tools as any,
        }),
      }),
    };
  };
}
