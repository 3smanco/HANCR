import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsIn, IsString, Matches } from 'class-validator';

/**
 * K4 — Driver document upload (signed URL).
 * The driver app calls `generateDocumentUploadUrl` first to get a writable
 * URL, uploads the file directly (PUT), then calls `uploadDriverDocument`
 * with the resulting publicUrl.
 */
@ObjectType()
export class DocumentUploadUrlType {
  /** Where the client must PUT the file (presigned). */
  @Field() uploadUrl!: string;

  /** Where the file will live once uploaded — pass back to uploadDriverDocument. */
  @Field() publicUrl!: string;

  /** Server-generated object key (for diagnostics / re-tries). */
  @Field() objectKey!: string;

  /** Seconds until uploadUrl expires (clients should retry past this). */
  @Field() expiresIn!: number;
}

@InputType()
export class GenerateUploadUrlInput {
  @Field()
  @IsString()
  @IsIn([
    'national_id',
    'license',
    'vehicle_registration',
    'insurance',
    'criminal_record',
  ])
  type!: string;

  @Field({ defaultValue: 'image/jpeg' })
  @IsString()
  @Matches(/^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/, {
    message: 'contentType must be image/jpeg|png|webp or application/pdf',
  })
  contentType!: string;
}
