import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  content: string;

  @IsString()
  authorId: string;

  @IsOptional()
  @IsString()
  featuredImg?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDesc?: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
