import { z } from 'zod';

// Event category enum matching the database constraint
export const eventCategories = ['coffee', 'music', 'market', 'party', 'exhibition', 'bar', 'sports'] as const;

export const eventStatus = ['active', 'inactive', 'draft'] as const;
export const locationAccuracies = ['precise', 'area', 'unverified'] as const;

// URL validation helper that allows empty strings or valid URLs
const optionalUrl = z.string()
  .max(500, 'URL 长度不能超过 500 字符')
  .refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: '请输入有效的 URL 地址' });

// Hex color validation helper
const hexColor = z.string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, '请输入有效的十六进制颜色值');

export const eventSchema = z.object({
  title: z.string()
    .min(1, '活动标题不能为空')
    .max(200, '活动标题不能超过 200 字符'),
  
  description: z.string()
    .max(2000, '活动描述不能超过 2000 字符')
    .optional()
    .or(z.literal('')),
  
  category: z.enum(eventCategories, {
    errorMap: () => ({ message: '请选择有效的活动类别' })
  }),
  
  date: z.string()
    .min(1, '请选择活动日期')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式无效'),
  
  time: z.string()
    .min(1, '请选择活动时间')
    .regex(/^\d{2}:\d{2}$/, '时间格式无效'),
  
  address: z.string()
    .min(1, '详细地址不能为空')
    .max(500, '详细地址不能超过 500 字符'),
  
  latitude: z.number()
    .min(-90, '纬度必须在 -90 到 90 之间')
    .max(90, '纬度必须在 -90 到 90 之间'),
  
  longitude: z.number()
    .min(-180, '经度必须在 -180 到 180 之间')
    .max(180, '经度必须在 -180 到 180 之间'),
  
  district: z.string()
    .max(100, '区域名称不能超过 100 字符')
    .optional()
    .or(z.literal('')),
  
  is_free: z.boolean(),
  
  price: z.number()
    .min(0, '票价不能为负数')
    .max(999999, '票价不能超过 999999')
    .optional()
    .or(z.literal(0)),
  
  ticket_url: optionalUrl,

  cover_image: optionalUrl.optional().or(z.literal('')),
  
  organizer: z.string()
    .max(200, '主办方名称不能超过 200 字符')
    .optional()
    .or(z.literal('')),

  location_accuracy: z.enum(locationAccuracies).default('unverified'),

  location_note: z.string()
    .max(500, '位置备注不能超过 500 字符')
    .optional()
    .or(z.literal(''))
});

export const eventFormSchema = eventSchema.extend({
  status: z.enum(eventStatus, {
    errorMap: () => ({ message: '请选择有效的活动状态' })
  })
});

// Public event creation form (used in CreateEvent.tsx)
// Maps the camelCase form fields to validation schema
export const publicEventSchema = z.object({
  title: z.string()
    .min(1, '活动标题不能为空')
    .max(200, '活动标题不能超过 200 字符'),
  
  description: z.string()
    .max(2000, '活动描述不能超过 2000 字符'),
  
  category: z.enum(eventCategories, {
    errorMap: () => ({ message: '请选择有效的活动类别' })
  }),
  
  date: z.string()
    .min(1, '请选择活动日期')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式无效'),
  
  time: z.string()
    .min(1, '请选择活动时间')
    .regex(/^\d{2}:\d{2}$/, '时间格式无效'),
  
  address: z.string()
    .min(1, '详细地址不能为空')
    .max(500, '详细地址不能超过 500 字符'),
  
  district: z.string()
    .max(100, '区域名称不能超过 100 字符'),
  
  isFree: z.boolean(),
  
  price: z.number()
    .min(0, '票价不能为负数')
    .max(999999, '票价不能超过 999999'),
  
  ticketUrl: optionalUrl,
  
  organizer: z.string()
    .max(200, '主办方名称不能超过 200 字符'),
  
  tags: z.string()
    .max(500, '活动标签不能超过 500 字符')
});

export const tagSchema = z.object({
  name: z.string()
    .min(1, '标签名称不能为空')
    .max(50, '标签名称不能超过 50 字符')
    .regex(/^[^<>"]*$/, '标签名称不能包含特殊字符'),
  
  color: hexColor
});

export type EventFormData = z.infer<typeof eventFormSchema>;
export type TagFormData = z.infer<typeof tagSchema>;

// Helper to format zod errors into a readable message
export const formatZodErrors = (error: z.ZodError): string => {
  return error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join('\n');
};
