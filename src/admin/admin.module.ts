import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SupabaseModule } from 'src/supabase/supabase.module';


@Module({
  imports: [SupabaseModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
