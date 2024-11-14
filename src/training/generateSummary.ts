import "dotenv/config";
import { LLMChain, loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { calculateCost, countTokens, TokenCost } from "./costing/index";
import { SupabaseService } from "src/supabase/supabase.service";
import { Injectable } from "@nestjs/common";


@Injectable()
export class GenerateSummary {
    constructor(private readonly SupabaseService: SupabaseService) {}

    fetchDocumentContent = async(chatbot_id: string): Promise<any> => {
        const { data, error } = await this.SupabaseService.supabase
            .from(chatbot_id)
            .select('content');
    
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No content found for this chatbot ID');
    
        return data.map(item => item.content);
    }
    
    summarizeDocuments = async(docs: Document[], model: OpenAI, summarizeChain: any, startIndex: number = 0): Promise<{ text: string; processedIndex: number; tokenCost: TokenCost }> => {
        let result = { text: "", processedIndex: startIndex, tokenCost: { tokens: { input: 0, output: 0 }, cost: 0 } };
        for (let i = startIndex; i < docs.length; i++) {
            try {
                const inputTokens = countTokens(docs[i].pageContent, model.modelName);
                const chunkResult = await summarizeChain.call({
                    input_documents: [docs[i]],
                });
                const outputTokens = countTokens(chunkResult.text, model.modelName);
                
                result.text += chunkResult.text + "\n\n";
                result.processedIndex = i + 1;
                result.tokenCost.tokens.input += inputTokens;
                result.tokenCost.tokens.output += outputTokens;
            } catch (error: any) {
                if (error.error?.type === 'tokens') {
                    console.log(`Rate limit reached. Pausing at index ${i}`);
                    return result;
                }
                throw error;
            }
        }
        result.tokenCost.cost = calculateCost(result.tokenCost.tokens, model.modelName);
        return result;
    }
    
    recursiveSummarize = async(content: string, model: OpenAI, summarizeChain: any, textSplitter: RecursiveCharacterTextSplitter, startIndex: number = 0): Promise<{ summary: string; tokenCost: TokenCost }> => {
        const chunks = await textSplitter.createDocuments([content]);
        let totalTokenCost: TokenCost = { tokens: { input: 0, output: 0 }, cost: 0 };
        
        if (chunks.length === 1) {
            const result = await this.summarizeDocuments([chunks[0]], model, summarizeChain);
            return { summary: result.text, tokenCost: result.tokenCost };
        }
    
        let summaries = "";
        let currentIndex = startIndex;
    
        while (currentIndex < chunks.length) {
            const result = await this.summarizeDocuments(chunks, model, summarizeChain, currentIndex);
            summaries += result.text;
            currentIndex = result.processedIndex;
            totalTokenCost.tokens.input += result.tokenCost.tokens.input;
            totalTokenCost.tokens.output += result.tokenCost.tokens.output;
            totalTokenCost.cost += result.tokenCost.cost;
    
            if (currentIndex < chunks.length) {
                console.log(`Waiting before resuming from index ${currentIndex}`);
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
    
        if (summaries.length > 24000) {  
            const recursiveResult = await this.recursiveSummarize(summaries, model, summarizeChain, textSplitter);
            totalTokenCost.tokens.input += recursiveResult.tokenCost.tokens.input;
            totalTokenCost.tokens.output += recursiveResult.tokenCost.tokens.output;
            totalTokenCost.cost += recursiveResult.tokenCost.cost;
            return { summary: recursiveResult.summary, tokenCost: totalTokenCost };
        }
    
        return { summary: summaries, tokenCost: totalTokenCost };
    }
    
    summaryOptimizer = async(prev_summary: string): Promise<{ optimizedSummary: string; tokenCost: TokenCost }> => {
        const model = new OpenAI({
            temperature: 0.7,
            modelName: "gpt-4",
        });
    
        const template = `
        You are an expert editor and summarizer. Your task is to optimize and perfect the following summary. 
        Please improve its clarity, conciseness, and overall quality while retaining all key information.
        It should completely focus on the brand.
    
        Original Summary:
        {original_summary}
    
        Instructions:
        1. Ensure the optimized summary is comprehensive yet concise.
        2. Improve the structure and flow of information.
        3. Enhance clarity by rephrasing complex sentences.
        4. Maintain a professional and objective tone.
        5. Ensure all key points from the original summary are retained.
        6. Add transitional phrases to improve readability if necessary.
        7. Do not include any new information that is not present in the original summary.
    
        Optimized Summary:
        `;
    
        const promptTemplate = PromptTemplate.fromTemplate(template);
    
        const chain = new LLMChain({
            llm: model,
            prompt: promptTemplate
        });
    
        try {
            const inputTokens = countTokens(prev_summary, model.modelName);
            const result = await chain.call({
                original_summary: prev_summary
            });
            const outputTokens = countTokens(result.text, model.modelName);
    
            const tokenCost: TokenCost = {
                tokens: { input: inputTokens, output: outputTokens },
                cost: calculateCost({ input: inputTokens, output: outputTokens }, model.modelName)
            };
    
            return { 
                optimizedSummary: result.text, 
                tokenCost: tokenCost
            };
        } catch (error) {
            console.error("Error in summary optimization:", error);
            throw error;
        }
    }
    
    generateSummary = async(chatbot_id: string, optimizer: boolean = false): Promise<{ summary: string; tokenCost: TokenCost }> => {
        const model = new OpenAI({
            temperature: 0,
            modelName: "gpt-3.5-turbo",
        });
    
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 10000,
            chunkOverlap: 500,
        });
    
        const summarizeChain = loadSummarizationChain(model, {
            type: "map_reduce",
            verbose: false
        });
    
        try {
            const documentContents = await this.fetchDocumentContent(chatbot_id);
            const combinedContent = documentContents.join("\n\n");
            const { summary: initialSummary, tokenCost: initialTokenCost } = await this.recursiveSummarize(combinedContent, model, summarizeChain, textSplitter);
            
            if (optimizer) {
                const { optimizedSummary, tokenCost: optimizationTokenCost } = await this.summaryOptimizer(initialSummary);
                return { 
                    summary: optimizedSummary, 
                    tokenCost: {
                        tokens: {
                            input: initialTokenCost.tokens.input + optimizationTokenCost.tokens.input,
                            output: initialTokenCost.tokens.output + optimizationTokenCost.tokens.output
                        },
                        cost: initialTokenCost.cost + optimizationTokenCost.cost
                    }
                };
            }
            
            return { 
                summary: initialSummary, 
                tokenCost: initialTokenCost
            };
        } catch (error) {
            console.error("Error generating summary:", error);
            throw error;
        }
    }
}
