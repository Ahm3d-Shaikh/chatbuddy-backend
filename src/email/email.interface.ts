export interface SecuritySettings {
    contactEmailForLimit?: string;
}

export interface ChatbotSettings {
    model?: string;
    domain?: string;
    leadForm?: any; // Adjust type as needed
    security?: SecuritySettings;
    interface?: any; // Adjust type as needed
    notifications?: any; // Adjust type as needed
}

export interface Chatbot {
    id: string;
    settings: ChatbotSettings;
    // Add other properties as needed
}

export interface Lead {
    lead_id: string;
    // Add other properties as needed
}
