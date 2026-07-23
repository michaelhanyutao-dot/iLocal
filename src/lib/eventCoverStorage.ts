import { supabase } from '@/integrations/supabase/client';

export const EVENT_COVER_BUCKET = 'event-covers';
export const MAX_EVENT_COVER_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const validateEventCoverFile = (file: File) => {
  if (!allowedMimeTypes.includes(file.type)) {
    return '仅支持 JPG、PNG、WebP 或 GIF 图片';
  }

  if (file.size > MAX_EVENT_COVER_SIZE) {
    return '图片不能超过 5MB';
  }

  return null;
};

export const uploadEventCover = async (file: File, userId?: string) => {
  const validationError = validateEventCoverFile(file);
  if (validationError) throw new Error(validationError);

  const extension = getFileExtension(file);
  const folder = userId ? `operators/${userId}` : 'operators/anonymous';
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(EVENT_COVER_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(EVENT_COVER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const getFileExtension = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;

  const fallbackByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  return fallbackByType[file.type] ?? 'jpg';
};
