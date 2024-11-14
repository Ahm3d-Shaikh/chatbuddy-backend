import {MiddlewareConsumer ,Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatbotModule } from './chatbot/chatbot.module';
import { LeadsModule } from './leads/leads.module';
import { TrainingModule } from './training/training.module';
import { PromptsModule } from './prompts/prompts.module';
import { ProductsModule } from './products/products.module';
import { DnsModule } from './dns/dns.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { StripesModule } from './stripes/stripes.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthenticationFrontendMiddleware } from './auth.middleware';


@Module({
  imports: [ChatbotModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    LeadsModule, TrainingModule, PromptsModule, ProductsModule, DnsModule, AdminModule, EmailModule, StripesModule, SupabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
        .apply(AuthenticationFrontendMiddleware)
        .forRoutes('*'); 
}
}
