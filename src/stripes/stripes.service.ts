import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import Stripe from 'stripe';
import {
  getSpecificPrice,
  getPriceIdToUpdate,
  calculateDiscountedPrice,
} from '../utils/Functions';

@Injectable()
export class StripesService {
  stripeApiKey: any = process.env.STRIPE_API;
  private stripe;
  constructor(private readonly SupabaseService: SupabaseService) {
    if (!this.stripeApiKey) {
      throw new Error(
        'Stripe API key is not defined in the environment variables.',
      );
    }
    this.stripe = new Stripe(this.stripeApiKey);
  }

  fetchOrCreateCustomer = async (email: any) => {
    try {
      console.log('Fetching or Creating Customer with Email:', email);
      const { data } = await this.SupabaseService.supabase
        .from('customer')
        .select('*')
        .eq('email', email)
        .single();

      if (data && data.stripe_id === null) {
        const customer = await this.stripe.customers.create({
          email: email,
        });
        if (customer) {
          const { data } = await this.SupabaseService.supabase
            .from('customer')
            .update({ stripe_id: customer.id })
            .eq('email', email)
            .select('*')
            .single();
          return data;
        }
      }
      return data;
    } catch (error) {
      console.error('Error fetching/creating customer:', error);
      throw error;
    }
  };

  fetchStipeProduct = async (plan_id: any, percent: any, mode: any) => {
    try {
      const { data: plan_data, error: plan_err } =
        await this.SupabaseService.supabase
          .from('plans')
          .select('*')
          .eq('plan_id', plan_id)
          .single();
      let discount_price;
      console.log(plan_data);

      if (mode === 'month') {
        discount_price = plan_data.monthly_plan_price;
      } else if (mode === 'year') {
        discount_price = plan_data.yearly_plan_price;
      }
      // if product is created
      if (!plan_err && plan_data.stripe_plan_id != null) {
        const checkPriceId = getSpecificPrice(mode, percent, plan_data);
        if (checkPriceId === null) {
          const discountedPrice: any = calculateDiscountedPrice(
            discount_price,
            percent,
          );

          const price = await this.stripe.prices.create({
            product: plan_data.stripe_plan_id,
            unit_amount: parseInt((discountedPrice * 100).toString()),
            currency: 'usd',
            recurring: {
              interval: mode,
            },
          });
          const priceIdToUpdate = getPriceIdToUpdate(mode, percent, price.id);
          let { data: plans_data } = await this.SupabaseService.supabase
            .from('plans')
            .update({ ...priceIdToUpdate })
            .eq('plan_id', plan_id)
            .select('*')
            .single();
          return plans_data;
        }
        return plan_data;
      }

      // if no product is created

      const discountedPrice: any = calculateDiscountedPrice(
        discount_price,
        percent,
      );

      const defaultPriceData = {
        unit_amount: parseInt((discountedPrice * 100).toString()),
        currency: 'usd',
        recurring: {
          interval: mode,
        },
      };
      const data = await this.stripe.products.create({
        name: plan_data.name,
        default_price_data: defaultPriceData,
        description: 'Level up',
      });
      const priceIdToUpdate = getPriceIdToUpdate(
        mode,
        percent,
        data.default_price,
      );

      let { data: plans_data, error: plans_err } =
        await this.SupabaseService.supabase
          .from('plans')
          .update({ stripe_plan_id: data.id, ...priceIdToUpdate })
          .eq('plan_id', plan_id)
          .select('*')
          .single();

      if (plans_err) {
        return null;
      }

      return plans_data;
    } catch (err) {
      console.log(err);
    }
    return null;
  };

  fetchCustomerStripeSubscriptionId = async (email: string) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('customer')
        .select('subscription_id')
        .eq('email', email)
        .single();

      if (error) {
        throw new Error(
          `Error fetching customer from database: ${error.message}`,
        );
      }

      if (!data || !data.subscription_id) {
        throw new Error(
          'No Stripe customer subscription ID found for the provided email.',
        );
      }

      return data.subscription_id;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  };

  createSubscriptionCheckoutLink = async (
    email: any,
    plan_id: any,
    success_url: any,
    cancel_url: any,
    percent: any,
    mode: any,
    trial: any,
  ) => {
    try {
      const actualPercent = percent === '1' ? 30 : 0;

      const customer = await this.fetchOrCreateCustomer(email);

      const product = await this.fetchStipeProduct(
        plan_id,
        actualPercent,
        mode,
      );

      if (customer?.stripe_id == null) {
        return {
          err: 'Input Parameters Missing. No Plan or Customer Provided....',
          data: null,
          status: 401,
        };
      }

      let session;
      let priceId = getSpecificPrice(mode, actualPercent, product);
      console.log('trial', trial);

      if (trial === true) {
        session = await this.stripe.checkout.sessions.create({
          success_url: success_url,
          cancel_url: cancel_url,
          customer: customer.stripe_id,
          allow_promotion_codes: true,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
        });
      } else {
        session = await this.stripe.checkout.sessions.create({
          success_url: success_url,
          cancel_url: cancel_url,
          customer: customer.stripe_id,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: 7,
          },
          payment_method_collection: 'if_required',
          mode: 'subscription',
        });
      }

      return {
        err: null,
        data: session.url,
        status: 200,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        err: err,
        data: null,
      };
    }
  };

  cancelSubscription = async (email: any) => {
    try {
      const stripeSubscriberId =
        await this.fetchCustomerStripeSubscriptionId(email);

      await this.stripe.subscriptions.cancel(stripeSubscriberId);

      return {
        message: 'Subscription canceled successfully.',
      };
    } catch (err) {
      console.error('Error canceling subscription:', err);
      return {
        status: 500,
        err: err,
        data: null,
      };
    }
  };
}
