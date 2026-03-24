import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { B2bService } from './b2b.service';

@Controller('b2b')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  @Post('apply')
  async apply(@Body() body: { userId: string; companyName: string; gstin?: string; billingAddress?: string }) {
    return this.b2bService.applyForB2b(body.userId, body);
  }

  @Get('applications')
  async getApplications() {
    return this.b2bService.getPendingApplications();
  }

  @Patch('applications/:id/approve')
  async approveApplication(@Param('id') id: string) {
    return this.b2bService.approveApplication(id);
  }
}
