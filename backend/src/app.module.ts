import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BlogModule } from './blog/blog.module';
import { ProductsModule } from './products/products.module';
import { B2bModule } from './b2b/b2b.module';
import { RfqModule } from './rfq/rfq.module';

@Module({
  imports: [PrismaModule, BlogModule, ProductsModule, B2bModule, RfqModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
