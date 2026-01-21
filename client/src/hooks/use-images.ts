import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertImage, InsertEdit, EditResponse } from "@shared/schema";
import { z } from "zod";

// Helper to log Zod errors
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

// === IMAGES ===

export function useImage(id: number) {
  return useQuery({
    queryKey: [api.images.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.images.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch image");
      const data = await res.json();
      return parseWithLogging(api.images.get.responses[200], data, "images.get");
    },
    enabled: !!id,
  });
}

export function useCreateImage() {
  return useMutation({
    mutationFn: async (data: InsertImage) => {
      const validated = api.images.create.input.parse(data);
      const res = await fetch(api.images.create.path, {
        method: api.images.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.images.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create image record");
      }
      
      return api.images.create.responses[201].parse(await res.json());
    },
  });
}

// === EDITS ===

export function useCreateEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertEdit) => {
      const validated = api.edits.create.input.parse(data);
      const res = await fetch(api.edits.create.path, {
        method: api.edits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
         if (res.status === 400) {
          const error = api.edits.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create edit job");
      }

      return api.edits.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [api.edits.get.path, data.id] });
    }
  });
}

export function useProcessEdit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const url = buildUrl(api.edits.process.path, { id });
            
            const res = await fetch(url, {
                method: api.edits.process.method,
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 401) {
                    throw new Error(`401: Требуется авторизация`);
                }
                if (res.status === 402) {
                    throw new Error(`402: Недостаточно кредитов. Нужно: ${errorData.required}, доступно: ${errorData.available}`);
                }
                throw new Error(errorData.message || "Failed to start processing");
            }
            return api.edits.process.responses[200].parse(await res.json());
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [api.edits.get.path, data.id] });
            queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
        }
    });
}

export function useEdit(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: [api.edits.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.edits.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch edit");
      const data = await res.json();
      return parseWithLogging(api.edits.get.responses[200], data, "edits.get") as EditResponse;
    },
    enabled: !!id && enabled,
    refetchInterval: (query) => {
        const data = query.state.data as EditResponse | undefined;
        if (data && (data.status === "pending" || data.status === "processing")) {
            return 1000;
        }
        return false;
    }
  });
}
