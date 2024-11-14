import { Module } from '@nestjs/common';
import { StripesController } from './stripes.controller';
import { StripesService } from './stripes.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [StripesController],
  providers: [StripesService]
})
export class StripesModule {}
