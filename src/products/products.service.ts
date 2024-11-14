import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class ProductsService {
  constructor(private readonly SupabaseService: SupabaseService) {}

  isUrlAccessible = async (url: string) => {
    try {
      const response = await fetch(url);
      const headers: { [key: string]: string } = {};

      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        accessible: response.ok,
        headers: response.ok ? headers : null,
      };
    } catch (error) {
      console.error(`Error checking URL accessibility: ${error}`);
      return { accessible: false, headers: null };
    }
  };

  getWordpressProductData = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      return data.map((item: any) => ({
        name: item.title.rendered,
        description: item.excerpt.rendered,
        image: item.yoast_head_json?.og_image?.[0]?.url || 'No image available',
        productLink: item.link,
        status: item.status,
      }));
    } catch (error) {
      console.error(`Error fetching WordPress product data: ${error}`);
      return null;
    }
  };

  getCustomUrlProductData = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error(`Error fetching custom product data: ${error}`);
      return null;
    }
  };

  getShopifyAccessToken = async (shop: string, code: string) => {
    const shopifyClientApiKey = process.env.SHOPIFY_CLIENT_API_KEY;
    const shopifyClientSecret = process.env.SHOPIFY_CLIENT_API_SECRET;
    const accessTokenUrl = `https://${shop}.myshopify.com/admin/oauth/access_token`;
    const shopifyApiKey = shopifyClientApiKey;
    const shopifyApiSecret = shopifyClientSecret;

    try {
      const response = await fetch(accessTokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: shopifyApiKey,
          client_secret: shopifyApiSecret,
          code,
        }),
      });

      if (!response.ok) throw new Error('Failed to get Shopify access token');

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error(`Error fetching Shopify access token: ${error}`);
      throw error;
    }
  };

  getShopifyProductData = async (shop: string, accessToken: string) => {
    try {
      const response = await fetch(
        `https://${shop}.myshopify.com/admin/api/2023-01/products.json`,
        {
          headers: { 'X-Shopify-Access-Token': accessToken },
        },
      );

      if (!response.ok) throw new Error('Failed to fetch Shopify products');

      const data = await response.json();
      return data.products.map((item: any) => ({
        name: item.title,
        description: item.body_html,
        image: item.image?.src || 'No image available',
        productLink: `https://${shop}.myshopify.com/products/${item.handle}`,
        status: item.status,
      }));
    } catch (error) {
      console.error(`Error fetching Shopify product data: ${error}`);
      return null;
    }
  };

  saveProductData = async (
    url: string | undefined,
    type: string | undefined,
    accessToken: string | undefined,
    shop: string | undefined,
    isAccessible: boolean | undefined,
    headers: any,
    chatbotId: string | undefined,
  ) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('products')
        .insert([
          {
            chatbot_id: chatbotId,
            url,
            isAccessible,
            headers: JSON.stringify(headers),
            type,
            shopifyAccessToken: accessToken || null,
            shopifyShop: shop || null,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`Error saving data to Supabase: ${error}`);
    }
  };

  fetchAllProducts = async (
    url?: string,
    chatbotId?: string,
    isFromChatbot = false,
    type?: string,
    shop?: string,
    accessToken?: string,
    code?: string,
  ) => {
    let token = accessToken || undefined;

    if (type === 'shopify' && shop && code && !token) {
      token = await this.getShopifyAccessToken(shop, code);
    }

    let products = [];

    if (isFromChatbot) {
      switch (type) {
        case 'shopify':
          products = await this.getShopifyProductData(
            shop as string,
            token as string,
          );
          break;
        case 'wordpress':
          products = await this.getWordpressProductData(url as string);
          break;
        case 'custom':
          products = await this.getCustomUrlProductData(url as string);
          break;
      }
      return products;
    }

    if (!isFromChatbot) {
      let data;
      if (url) {
        const { accessible, headers } = await this.isUrlAccessible(url);
        if (!accessible) return [];
        data = await this.saveProductData(
          url,
          type,
          token,
          shop,
          accessible,
          headers,
          chatbotId,
        );
      } else {
        data = await this.saveProductData(
          url,
          type,
          token,
          shop,
          true,
          null,
          chatbotId,
        );
      }

      return {
        message: 'Product data saved successfully',
        productId: data?.id,
      };
    }

    return [];
  };

  // Generate Shopify login URL for OAuth
  redirectToShopifyLogin = (shop: string) => {
    const shopifyClientApiKey = process.env.SHOPIFY_CLIENT_API_KEY;
    const shopifyRedirectUri = process.env.SHOPIFY_REDIRECT_URI;

    return `https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${shopifyClientApiKey}&scope=read_products&redirect_uri=${shopifyRedirectUri}`;
  };

  deleteProduct = async (productId: string, botId: string) => {
    try {
      const { data, error } = await this.SupabaseService.supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('chatbot_id', botId);

      if (error) {
        throw new Error('Error deleting: ' + error.message);
      }

      return data;
    } catch (err) {
      console.log(err);
      throw new Error('Error in deleting: ' + err);
    }
  };
}
