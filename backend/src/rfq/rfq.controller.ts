import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { RFQStatus } from '@prisma/client';

@Controller('rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post('submit')
  async submit(@Body() body: { userId: string; notes?: string; items: { productId: string; quantity: number }[] }) {
    return this.rfqService.submitRfq(body.userId, body);
  }

  @Get()
  async getAll() {
    return this.rfqService.getAllRfqs();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.rfqService.getRfqById(id);
  }

  @Patch(':id/quote')
  async updateQuote(
    @Param('id') id: string,
    @Body() body: { status: RFQStatus; items: { id: string; targetPrice: number }[] }
  ) {
    return this.rfqService.updateQuote(id, body);
  }
}
