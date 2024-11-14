import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { GenerateSummary } from './generateSummary';
import { WebsiteService } from './Content/Website/getWebsiteLinks';
@Module({
  imports: [SupabaseModule],
  controllers: [TrainingController],
  providers: [TrainingService, GenerateSummary, WebsiteService],
})
export class TrainingModule {}
