import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';

/**
 * رفع صورة الملف الشخصي للراكب (signed URL) — على غرار رفع وثائق السائق.
 * التطبيق يستدعي `generateRiderUploadUrl` أولاً للحصول على رابط PUT موقّع،
 * يرفع الملف مباشرةً، ثم يستدعي `updateProfile(avatarUrl: publicUrl)`.
 */
@ObjectType()
export class RiderUploadUrlType {
  /** المكان الذي يجب أن يرفع إليه العميل الملف (presigned PUT). */
  @Field() uploadUrl!: string;

  /** الرابط العام للملف بعد الرفع — يُمرَّر لـ updateProfile(avatarUrl). */
  @Field() publicUrl!: string;

  /** مفتاح الكائن المُولَّد (للتشخيص/إعادة المحاولة). */
  @Field() objectKey!: string;

  /** عدد الثواني حتى انتهاء صلاحية uploadUrl. */
  @Field() expiresIn!: number;
}

@InputType()
export class GenerateRiderUploadUrlInput {
  @Field({ defaultValue: 'image/jpeg' })
  @IsString()
  @Matches(/^image\/(jpeg|jpg|png|webp)$/, {
    message: 'contentType must be image/jpeg|png|webp',
  })
  contentType!: string;
}
