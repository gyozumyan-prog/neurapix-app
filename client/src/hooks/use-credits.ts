import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CreditsResponse {
  credits: number;
  userId: string;
  plan: 'free' | 'standard' | 'pro';
  planExpiresAt: string | null;
}

interface CostsResponse {
  tools: Record<string, number>;
  customBackground: number;
}

export function useCredits() {
  return useQuery<CreditsResponse>({
    queryKey: ['/api/credits'],
    queryFn: async () => {
      const res = await fetch('/api/credits', { credentials: 'include' });
      if (res.status === 401) {
        return { credits: 0, userId: '', plan: 'free' as const, planExpiresAt: null };
      }
      if (!res.ok) throw new Error('Failed to fetch credits');
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });
}

export function useToolCosts() {
  return useQuery<CostsResponse>({
    queryKey: ['/api/credits/costs'],
    queryFn: async () => {
      const res = await fetch('/api/credits/costs');
      if (!res.ok) throw new Error('Failed to fetch costs');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useRefreshCredits() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
  };
}

// Tool from database
export interface DbTool {
  id: string;
  nameRu: string;
  nameUk: string | null;
  nameEn: string | null;
  category: string;
  creditCost: number;
  isActive: number;
  isPro: number;
  iconName: string | null;
}

// Load active tools from database
export function useActiveTools() {
  return useQuery<DbTool[]>({
    queryKey: ['/api/tools/active'],
    queryFn: async () => {
      const res = await fetch('/api/tools/active');
      if (!res.ok) throw new Error('Failed to fetch tools');
      return res.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
