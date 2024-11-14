import { encoding_for_model, TiktokenModel } from "@dqbd/tiktoken";

const PRICING = {
    "gpt-3.5-turbo": { input: 0.0015, output: 0.002 },
    "gpt-4": { input: 0.03, output: 0.06 },
    "gpt-4o": { input: 0.03, output: 0.06 },
};

export interface TokenCount {
    input: number;
    output: number;
}

export interface TokenCost {
    tokens: TokenCount;
    cost: number;
}

export function countTokens(text: string, model: string = "gpt-3.5-turbo"): number {
    const encoder = encoding_for_model(model as TiktokenModel);
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
}

export function calculateCost(tokens: TokenCount, model: string): number {
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING["gpt-3.5-turbo"];
    return (tokens.input * pricing.input + tokens.output * pricing.output) / 1000;
}
