import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
@Injectable()
export class AdminService {
  constructor(private readonly supabaseService: SupabaseService) {}
  getAllSubscribers = async () => {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('customer')
        .select();

      if (error) {
        throw new Error('Error fetching subscribers: ' + error.message);
      }

      console.log(`\n\ndata in admin service: ${data}`);
      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in fetching subscribers: ' + err);
    }
  };

  updateSubscriberPlan = async (subscriber_id: any, plan: any) => {
    try {
      const { data: planData, error: planError } =
        await this.supabaseService.supabase
          .from('plans')
          .select('plan_id')
          .eq('name', plan)
          .single();

      if (planError) {
        throw new Error('Error fetching plan ID: ' + planError.message);
      }

      const plan_id = planData?.plan_id;
      console.log(`update Subscriber plan result: ${planData}, ${plan_id}`);

      const { data, error } = await this.supabaseService.supabase
        .from('customer')
        .update({ plan_id: plan_id })
        .eq('uuid', subscriber_id);

      if (error) {
        throw new Error('Error updating subscriber plan: ' + error.message);
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in updating subscriber: ' + err);
    }
  };
}
