export interface Model {
  last_trained: string;
  model: string;
  temperature: number;
  defaultLanguage: string;
  streaming: boolean;
  instruction: string;
  persona: string;
  constraints: string;
}
export interface ChatBotSettings {
  model: {
    last_trained: string;
    model: string;
    temperature: number;
    defaultLanguage: string;
    streaming: boolean;
    instruction: string;
    persona: string;
    constraints: string;
  };
  security: {
    visibility: string;
    permitIframeWidgetSpecificDomains: boolean;
    rateLimiting: { messages: number; seconds: number };
    limitPrompt: string;
    contactEmailForLimit: string;
  };
  notifications: {
    dailyLeadsEmail: boolean;
    dailyLeadsEmailList: Array<string>;
    dailyConversationEmail: boolean;
    dailyConversationEmailList: Array<string>;
  };

  interface: {
    initial_messages: string;
    recommended_messages: string;
    message_placeholder: string;
    theme: string;
    accentColor: string;
    textColor: string;
    update_chatbot_profile_picture: string;
    remove_chatbot_profile_picture: boolean;
    display_name: string;
    user_message_color: string;
    social_integration_appearance: object;
    button_background_color: string;
    button_text_color: string;
    chat_bubble_button_color: string;
    align_chat_bubble_button: boolean;
    launcherIcon: string;
    launcherText: string;
    greetingText: string;
    headerIcon: string;
    shareIcon: string;
    fontSize: string;
    enableSources: string;
    autoScrollToNewMessages: string;
    horizontalSmartPrompts: string;
    position: string;
    hidePoweredBy: string;
  };

  domain: {
    custom_domain_for_script_iframe_andchatbot: string;
    verified_domain: string;
    verified_domain_status: string;
    TXT_Verification: string;
    dns_verification: boolean;
  };

  leadForm: {
    showLeadForm: boolean;
    title: string;
    email: boolean;
    name: boolean;
    phone: boolean;
  };
}
