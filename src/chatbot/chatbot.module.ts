import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { ProductsModule } from 'src/products/products.module';
import { PureChain } from './PureChain';
import { HelperFunctionsClass } from './helper_functions';

@Module({
  imports: [SupabaseModule, ProductsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, PureChain, HelperFunctionsClass]
})
export class ChatbotModule {}
