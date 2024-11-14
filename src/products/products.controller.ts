import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly ProductsService: ProductsService) {}

  //GET -> products/auth
  @Get('auth')
  async authProduct(@Query('shop') shop: any) {
    try {
      return await this.ProductsService.redirectToShopifyLogin(shop);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //GET -> products/:botId
  @Get(':botId')
  async getProduct(
    @Query('type') type: string,
    @Query('url') url: string,
    @Query('shop') shop: any,
    @Query('code') code: any,
    @Param('botId') botId: string,
  ) {
    try {
      let accessToken;
      return await this.ProductsService.fetchAllProducts(
        url as string,
        botId as string,
        false,
        type as string,
        shop as any,
        accessToken as any,
        code as any,
      );
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  //DELETE -> products/:botId
  @Delete(':botId')
  async deleteProduct(
    @Body('productId') productId: string,
    @Param('botId') botId: string,
  ) {
    try {
      return await this.ProductsService.deleteProduct(productId, botId);
    } catch (error) {
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
}
