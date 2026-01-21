import { z } from 'zod';
import { insertImageSchema, insertEditSchema, images, edits, TOOL_TYPES } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  images: {
    create: {
      method: 'POST' as const,
      path: '/api/images',
      input: insertImageSchema,
      responses: {
        201: z.custom<typeof images.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/images/:id',
      responses: {
        200: z.custom<typeof images.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  edits: {
    create: {
      method: 'POST' as const,
      path: '/api/edits',
      input: insertEditSchema,
      responses: {
        201: z.custom<typeof edits.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/edits/:id',
      responses: {
        200: z.custom<typeof edits.$inferSelect & { originalImage?: typeof images.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    process: {
      method: 'POST' as const,
      path: '/api/edits/:id/process',
      responses: {
        200: z.custom<typeof edits.$inferSelect>(),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    }
  },
  // Direct Replicate proxy endpoints
  replicate: {
    upscale: {
      method: 'POST' as const,
      path: '/api/replicate/upscale',
      input: z.object({ image: z.string() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    enhance: {
      method: 'POST' as const,
      path: '/api/replicate/enhance',
      input: z.object({ image: z.string() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    faceRestore: {
      method: 'POST' as const,
      path: '/api/replicate/face-restore',
      input: z.object({ image: z.string() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    portraitEnhance: {
      method: 'POST' as const,
      path: '/api/replicate/portrait-enhance',
      input: z.object({ image: z.string() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    oldPhotoRestore: {
      method: 'POST' as const,
      path: '/api/replicate/old-photo-restore',
      input: z.object({ image: z.string() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    oldPhotoRestorePro: {
      method: 'POST' as const,
      path: '/api/replicate/old-photo-restore-pro',
      input: z.object({ image: z.string() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    objectRemoval: {
      method: 'POST' as const,
      path: '/api/replicate/object-removal',
      input: z.object({ image: z.string(), mask: z.string().optional() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
    backgroundChange: {
      method: 'POST' as const,
      path: '/api/replicate/background-change',
      input: z.object({ image: z.string(), prompt: z.string().optional() }),
      responses: {
        200: z.object({ output: z.string() }),
        500: errorSchemas.internal,
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
