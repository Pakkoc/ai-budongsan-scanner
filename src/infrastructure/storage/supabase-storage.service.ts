/**
 * Supabase Storage 서비스
 * 참조: docs/common-modules.md, docs/usecases/03-lawyer-verification-upload/spec.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '@/constants/app-config';
import { createAppError, ERROR_CODES } from '@/backend/errors/codes';

export type UploadFileOptions = {
  bucket: string;
  path: string;
  file: File | Buffer;
  contentType?: string;
};

export type UploadFileResult = {
  publicUrl: string;
  path: string;
};

/**
 * 파일 업로드
 */
export async function uploadFile(
  supabase: SupabaseClient,
  options: UploadFileOptions
): Promise<UploadFileResult> {
  const { bucket, path, file, contentType } = options;

  // 파일 크기 검증
  const fileSize = file instanceof Buffer ? file.length : file.size;
  if (fileSize > APP_CONFIG.MAX_FILE_SIZE_BYTES) {
    throw createAppError(ERROR_CODES.STORAGE_FILE_TOO_LARGE, 400);
  }

  // 파일 타입 검증
  const fileType = contentType || (file instanceof File ? file.type : 'application/octet-stream');
  if (!APP_CONFIG.ALLOWED_FILE_TYPES.includes(fileType)) {
    throw createAppError(ERROR_CODES.STORAGE_INVALID_FILE_TYPE, 400);
  }

  // 업로드
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: fileType,
      upsert: false,
    });

  if (error || !data) {
    throw createAppError(ERROR_CODES.STORAGE_UPLOAD_FAILED, 500, error);
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    publicUrl: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * 파일 삭제
 */
export async function deleteFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, error);
  }
}

/**
 * 파일 URL 생성 (서명된 URL)
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw createAppError(ERROR_CODES.DATABASE_ERROR, 500, error);
  }

  return data.signedUrl;
}

