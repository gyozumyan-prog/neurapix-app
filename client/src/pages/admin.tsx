import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Users, 
  CreditCard, 
  Settings, 
  Coins, 
  Package, 
  Loader2,
  Edit2,
  Shield,
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  Search,
  Download,
  RefreshCw,
  Wrench,
  Globe,
  FileText,
  Server,
  Activity,
  Key,
  BarChart3,
  ClipboardList,
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Heart
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  credits: number;
  plan: string;
  planExpiresAt: string | null;
  isAdmin: number;
  createdAt: string;
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  credits: number;
  status: string;
  paymentMethod: string | null;
  liqpayOrderId: string | null;
  description: string | null;
  createdAt: string;
}

interface PricingPlan {
  id: string;
  name: string;
  nameUk: string | null;
  nameEn: string | null;
  planType: string;
  period: string;
  priceUah: number;
  priceUsd: number | null;
  credits: number;
  isActive: number;
  sortOrder: number;
}

interface CreditPackage {
  id: string;
  credits: number;
  priceUah: number;
  priceUsd: number | null;
  bonusCredits: number | null;
  isActive: number;
  sortOrder: number;
}

interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
}

interface Tool {
  id: string;
  nameRu: string;
  nameUk: string | null;
  nameEn: string | null;
  descriptionRu: string | null;
  descriptionUk: string | null;
  descriptionEn: string | null;
  category: string;
  creditCost: number;
  creditCostPro: number | null;
  isActive: number;
  isPro: number;
  sortOrder: number;
  iconName: string | null;
}

interface SeoSetting {
  id: string;
  page: string;
  titleRu: string | null;
  titleUk: string | null;
  titleEn: string | null;
  descriptionRu: string | null;
  descriptionUk: string | null;
  descriptionEn: string | null;
  keywordsRu: string | null;
  keywordsUk: string | null;
  keywordsEn: string | null;
  ogImage: string | null;
}

interface PageContent {
  id: string;
  page: string;
  section: string;
  contentRu: string | null;
  contentUk: string | null;
  contentEn: string | null;
  isActive: number;
}

interface Stats {
  totalUsers: number;
  totalPayments: number;
  totalRevenue: number;
  todayPayments: number;
  todayRevenue: number;
}

interface ProviderConfig {
  id: string;
  name: string;
  providerType: string;
  toolId: string;
  endpoint: string | null;
  apiKeyEnvVar: string | null;
  model: string | null;
  config: any;
  priority: number;
  isActive: number;
  isDefault: number;
  healthStatus: string | null;
  lastHealthCheck: string | null;
}

interface AiJob {
  id: string;
  userId: string | null;
  editId: number | null;
  toolId: string;
  providerId: string | null;
  status: string;
  priority: number;
  inputData: any;
  outputData: any;
  errorMessage: string | null;
  retryCount: number;
  processingTimeMs: number | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  createdAt: string;
}

interface EnvOverride {
  key: string;
  value: string;
  description: string | null;
  category: string;
  isSecret: number;
  isActive: number;
}

interface Analytics {
  revenue: { total_revenue: number; total_payments: number };
  users: { total_users: number; new_users: number };
  jobs: { total_jobs: number; completed_jobs: number; failed_jobs: number; avg_processing_time: number };
  toolUsage: Array<{ tool_id: string; usage_count: number }>;
  period: string;
}

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editingSeo, setEditingSeo] = useState<SeoSetting | null>(null);
  const [editingContent, setEditingContent] = useState<PageContent | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewPackage, setShowNewPackage] = useState(false);
  const [showNewSetting, setShowNewSetting] = useState(false);
  const [showNewTool, setShowNewTool] = useState(false);
  const [showNewSeo, setShowNewSeo] = useState(false);
  const [showNewContent, setShowNewContent] = useState(false);
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [showNewEnv, setShowNewEnv] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [editingEnv, setEditingEnv] = useState<EnvOverride | null>(null);
  
  const [newPlan, setNewPlan] = useState({
    name: "", nameUk: "", nameEn: "", planType: "standard", period: "monthly",
    priceUah: 0, priceUsd: 0, credits: 0, isActive: 1, sortOrder: 0,
  });
  
  const [newPackage, setNewPackage] = useState({
    credits: 0, priceUah: 0, priceUsd: 0, bonusCredits: 0, isActive: 1, sortOrder: 0,
  });
  
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "" });
  
  const [newTool, setNewTool] = useState({
    id: "", nameRu: "", nameUk: "", nameEn: "", category: "enhance",
    creditCost: 10, isActive: 1, sortOrder: 0, iconName: "",
  });
  
  const [newSeo, setNewSeo] = useState({
    page: "", titleRu: "", titleUk: "", titleEn: "",
    descriptionRu: "", descriptionUk: "", descriptionEn: "",
    keywordsRu: "", keywordsUk: "", keywordsEn: "", ogImage: "",
  });
  
  const [newProvider, setNewProvider] = useState({
    name: "", providerType: "runpod", toolId: "", endpoint: "", apiKeyEnvVar: "",
    model: "", priority: 1, isActive: 1, isDefault: 0,
  });
  
  const [newEnv, setNewEnv] = useState({ key: "", value: "", description: "" });

  const [newContent, setNewContent] = useState({
    id: "", page: "", section: "", contentRu: "", contentUk: "", contentEn: "", isActive: 1,
  });

  const { data: currentUser, isLoading: userLoading } = useQuery<{ id: string; isAdmin?: number }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: plans = [] } = useQuery<PricingPlan[]>({
    queryKey: ["/api/admin/plans"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: packages = [] } = useQuery<CreditPackage[]>({
    queryKey: ["/api/admin/packages"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: settings = [] } = useQuery<SystemSetting[]>({
    queryKey: ["/api/admin/settings"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: toolsList = [] } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: seoList = [] } = useQuery<SeoSetting[]>({
    queryKey: ["/api/seo"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: contentList = [] } = useQuery<PageContent[]>({
    queryKey: ["/api/content"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: providersList = [] } = useQuery<ProviderConfig[]>({
    queryKey: ["/api/admin/providers"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: jobsList = [] } = useQuery<AiJob[]>({
    queryKey: ["/api/admin/jobs"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: envList = [] } = useQuery<EnvOverride[]>({
    queryKey: ["/api/admin/env"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: currentUser?.isAdmin === 1,
  });

  const { data: auditList = [] } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit"],
    enabled: currentUser?.isAdmin === 1,
  });

  // Mutations
  const updateUser = useMutation({
    mutationFn: async (user: Partial<User> & { id: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${user.id}`, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "Пользователь обновлен" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Пользователь удален" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async (plan: Partial<PricingPlan> & { id: string }) => {
      await apiRequest("PATCH", `/api/admin/plans/${plan.id}`, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setEditingPlan(null);
      toast({ title: "Тариф обновлен" });
    },
  });

  const createPlan = useMutation({
    mutationFn: async (plan: typeof newPlan) => {
      await apiRequest("POST", `/api/admin/plans`, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setShowNewPlan(false);
      setNewPlan({ name: "", nameUk: "", nameEn: "", planType: "standard", period: "monthly", priceUah: 0, priceUsd: 0, credits: 0, isActive: 1, sortOrder: 0 });
      toast({ title: "Тариф создан" });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      await apiRequest("DELETE", `/api/admin/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "Тариф удален" });
    },
  });

  const updatePackage = useMutation({
    mutationFn: async (pkg: Partial<CreditPackage> & { id: string }) => {
      await apiRequest("PATCH", `/api/admin/packages/${pkg.id}`, pkg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setEditingPackage(null);
      toast({ title: "Пакет обновлен" });
    },
  });

  const createPackage = useMutation({
    mutationFn: async (pkg: typeof newPackage) => {
      await apiRequest("POST", `/api/admin/packages`, pkg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setShowNewPackage(false);
      setNewPackage({ credits: 0, priceUah: 0, priceUsd: 0, bonusCredits: 0, isActive: 1, sortOrder: 0 });
      toast({ title: "Пакет создан" });
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (packageId: string) => {
      await apiRequest("DELETE", `/api/admin/packages/${packageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      toast({ title: "Пакет удален" });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: { key: string; value: string }[]) => {
      await apiRequest("PATCH", "/api/admin/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Настройки сохранены" });
    },
  });

  const createSetting = useMutation({
    mutationFn: async (setting: typeof newSetting) => {
      await apiRequest("POST", "/api/admin/settings", setting);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setShowNewSetting(false);
      setNewSetting({ key: "", value: "", description: "" });
      toast({ title: "Настройка создана" });
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest("DELETE", `/api/admin/settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Настройка удалена" });
    },
  });

  // Tools mutations
  const updateTool = useMutation({
    mutationFn: async (tool: Partial<Tool> & { id: string }) => {
      const payload = {
        ...tool,
        creditCost: tool.creditCost !== undefined ? Number(tool.creditCost) : undefined,
        creditCostPro: tool.creditCostPro !== undefined && tool.creditCostPro !== null ? Number(tool.creditCostPro) : null,
        sortOrder: tool.sortOrder !== undefined ? Number(tool.sortOrder) : undefined,
        iconName: tool.iconName !== undefined ? tool.iconName : undefined,
      };
      await apiRequest("PATCH", `/api/admin/tools/${tool.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setEditingTool(null);
      toast({ title: "Инструмент обновлен" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось обновить", variant: "destructive" });
    },
  });

  const createTool = useMutation({
    mutationFn: async (tool: typeof newTool) => {
      const payload: Record<string, any> = {
        id: tool.id,
        nameRu: tool.nameRu,
        category: tool.category,
        creditCost: Number(tool.creditCost),
        sortOrder: Number(tool.sortOrder),
        isActive: tool.isActive,
      };
      if (tool.nameUk) payload.nameUk = tool.nameUk;
      if (tool.nameEn) payload.nameEn = tool.nameEn;
      if (tool.iconName) payload.iconName = tool.iconName;
      await apiRequest("POST", `/api/admin/tools`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setShowNewTool(false);
      setNewTool({ id: "", nameRu: "", nameUk: "", nameEn: "", category: "enhance", creditCost: 10, isActive: 1, sortOrder: 0, iconName: "" });
      toast({ title: "Инструмент создан" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось создать", variant: "destructive" });
    },
  });

  const deleteTool = useMutation({
    mutationFn: async (toolId: string) => {
      await apiRequest("DELETE", `/api/admin/tools/${toolId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({ title: "Инструмент удален" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось удалить", variant: "destructive" });
    },
  });

  // SEO mutations
  const updateSeo = useMutation({
    mutationFn: async (seo: Partial<SeoSetting> & { id: string }) => {
      await apiRequest("PATCH", `/api/admin/seo/${seo.id}`, seo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo"] });
      setEditingSeo(null);
      toast({ title: "SEO обновлено" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось обновить SEO", variant: "destructive" });
    },
  });

  const createSeo = useMutation({
    mutationFn: async (seo: typeof newSeo) => {
      await apiRequest("POST", `/api/admin/seo`, seo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo"] });
      setShowNewSeo(false);
      setNewSeo({ page: "", titleRu: "", titleUk: "", titleEn: "", descriptionRu: "", descriptionUk: "", descriptionEn: "", keywordsRu: "", keywordsUk: "", keywordsEn: "", ogImage: "" });
      toast({ title: "SEO создано" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось создать SEO", variant: "destructive" });
    },
  });

  const deleteSeo = useMutation({
    mutationFn: async (seoId: string) => {
      await apiRequest("DELETE", `/api/admin/seo/${seoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo"] });
      toast({ title: "SEO удалено" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось удалить SEO", variant: "destructive" });
    },
  });

  // Content mutations
  const updateContent = useMutation({
    mutationFn: async (content: Partial<PageContent> & { id: string }) => {
      const payload = { ...content, isActive: content.isActive !== undefined ? Number(content.isActive) : undefined };
      await apiRequest("PATCH", `/api/admin/content/${content.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setEditingContent(null);
      toast({ title: "Контент обновлен" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось обновить контент", variant: "destructive" });
    },
  });

  const createContent = useMutation({
    mutationFn: async (content: typeof newContent) => {
      const payload = { ...content, isActive: Number(content.isActive) };
      await apiRequest("POST", `/api/admin/content`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setShowNewContent(false);
      setNewContent({ id: "", page: "", section: "", contentRu: "", contentUk: "", contentEn: "", isActive: 1 });
      toast({ title: "Контент создан" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось создать контент", variant: "destructive" });
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (contentId: string) => {
      await apiRequest("DELETE", `/api/admin/content/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "Контент удален" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось удалить контент", variant: "destructive" });
    },
  });

  // Provider mutations
  const createProvider = useMutation({
    mutationFn: async (data: typeof newProvider) => {
      await apiRequest("POST", `/api/admin/providers`, {
        name: data.name,
        providerType: data.providerType,
        toolId: data.toolId,
        endpoint: data.endpoint || null,
        apiKeyEnvVar: data.apiKeyEnvVar || null,
        model: data.model || null,
        priority: data.priority,
        isActive: data.isActive,
        isDefault: data.isDefault,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      setShowNewProvider(false);
      setNewProvider({ name: "", providerType: "runpod", toolId: "", endpoint: "", apiKeyEnvVar: "", model: "", priority: 1, isActive: 1, isDefault: 0 });
      toast({ title: "Провайдер создан" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось создать провайдер", variant: "destructive" });
    },
  });

  const updateProvider = useMutation({
    mutationFn: async (data: Partial<ProviderConfig> & { id: string }) => {
      await apiRequest("PATCH", `/api/admin/providers/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      toast({ title: "Провайдер обновлен" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      toast({ title: "Провайдер удален" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const testProvider = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/providers/${id}/test`);
      return res.json();
    },
    onSuccess: (data: { healthy: boolean; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      if (data.healthy) {
        toast({ title: "Провайдер работает", description: data.message });
      } else {
        toast({ title: "Провайдер недоступен", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Ошибка тестирования", description: error.message, variant: "destructive" });
    },
  });

  // Job mutations
  const cancelJob = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/jobs/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "Задание отменено" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const retryJob = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/jobs/${id}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "Задание перезапущено" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  // Env mutations
  const createEnv = useMutation({
    mutationFn: async (env: typeof newEnv) => {
      await apiRequest("POST", "/api/admin/env", env);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/env"] });
      setShowNewEnv(false);
      setNewEnv({ key: "", value: "", description: "" });
      toast({ title: "Конфигурация создана" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const deleteEnv = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest("DELETE", `/api/admin/env/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/env"] });
      toast({ title: "Конфиг удален" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  // Debug: log current user state
  console.log("[Admin] userLoading:", userLoading, "currentUser:", currentUser, "isAdmin:", currentUser?.isAdmin);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.isAdmin !== 1) {
    console.log("[Admin] Redirecting: no user or not admin. isAdmin value:", currentUser?.isAdmin, "type:", typeof currentUser?.isAdmin);
    return <Redirect to="/" />;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-500">Успешно</Badge>;
      case "pending": return <Badge variant="secondary">Ожидает</Badge>;
      case "failed": return <Badge variant="destructive">Ошибка</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredUsers = userSearch
    ? users.filter(u => 
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  const handleExport = (type: "users" | "payments") => {
    window.open(`/api/admin/export/${type}`, "_blank");
  };

  const refreshAll = () => {
    refetchStats();
    refetchUsers();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    queryClient.invalidateQueries({ queryKey: ["/api/seo"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    toast({ title: "Данные обновлены" });
  };

  const categoryLabels: Record<string, string> = {
    enhance: "Улучшение",
    face: "Лицо",
    background: "Фон",
    restore: "Реставрация",
    edit: "Редактирование",
    effects: "Эффекты",
  };

  return (
    <>
      <Helmet>
        <title>Админ панель | NeuraPix</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back" className="px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">На сайт</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-sm sm:text-lg truncate">Админ панель NeuraPix</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAll} data-testid="button-refresh" className="flex-shrink-0 px-2 sm:px-3">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Обновить</span>
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Пользователей</p>
                    <p className="text-2xl font-bold" data-testid="stat-users">{stats?.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Платежей</p>
                    <p className="text-2xl font-bold" data-testid="stat-payments">{stats?.totalPayments || 0}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Доход</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="stat-revenue">{stats?.totalRevenue || 0} ₴</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Сегодня</p>
                    <p className="text-2xl font-bold" data-testid="stat-today-count">{stats?.todayPayments || 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Инструментов</p>
                    <p className="text-2xl font-bold">{toolsList.length}</p>
                  </div>
                  <Wrench className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-4">
            <div className="space-y-2 overflow-x-auto">
              <TabsList className="flex w-max min-w-full md:grid md:grid-cols-7 md:w-full">
                <TabsTrigger value="users" data-testid="tab-users" className="whitespace-nowrap">
                  <Users className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Пользователи</span>
                  <span className="sm:hidden">Юзеры</span>
                </TabsTrigger>
                <TabsTrigger value="payments" data-testid="tab-payments" className="whitespace-nowrap">
                  <CreditCard className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Платежи</span>
                  <span className="sm:hidden">Оплата</span>
                </TabsTrigger>
                <TabsTrigger value="plans" data-testid="tab-plans" className="whitespace-nowrap">
                  <Package className="w-4 h-4 mr-1 md:mr-2" />
                  Тарифы
                </TabsTrigger>
                <TabsTrigger value="packages" data-testid="tab-packages" className="whitespace-nowrap">
                  <Coins className="w-4 h-4 mr-1 md:mr-2" />
                  Пакеты
                </TabsTrigger>
                <TabsTrigger value="tools" data-testid="tab-tools" className="whitespace-nowrap">
                  <Wrench className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Инструменты</span>
                  <span className="sm:hidden">Инстр.</span>
                </TabsTrigger>
                <TabsTrigger value="providers" data-testid="tab-providers" className="whitespace-nowrap">
                  <Server className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Провайдеры</span>
                  <span className="sm:hidden">Пров.</span>
                </TabsTrigger>
                <TabsTrigger value="jobs" data-testid="tab-jobs" className="whitespace-nowrap">
                  <Activity className="w-4 h-4 mr-1 md:mr-2" />
                  Очередь
                </TabsTrigger>
              </TabsList>
              <TabsList className="flex w-max min-w-full md:grid md:grid-cols-6 md:w-full">
                <TabsTrigger value="seo" data-testid="tab-seo" className="whitespace-nowrap">
                  <Globe className="w-4 h-4 mr-1 md:mr-2" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="content" data-testid="tab-content" className="whitespace-nowrap">
                  <FileText className="w-4 h-4 mr-1 md:mr-2" />
                  Контент
                </TabsTrigger>
                <TabsTrigger value="env" data-testid="tab-env" className="whitespace-nowrap">
                  <Key className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Конфігурація</span>
                  <span className="sm:hidden">Конфіг</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics" className="whitespace-nowrap">
                  <BarChart3 className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Аналітика</span>
                  <span className="sm:hidden">Аналіт.</span>
                </TabsTrigger>
                <TabsTrigger value="audit" data-testid="tab-audit" className="whitespace-nowrap">
                  <ClipboardList className="w-4 h-4 mr-1 md:mr-2" />
                  Аудит
                </TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings" className="whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Налаштування</span>
                  <span className="sm:hidden">Налашт.</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Пользователи ({filteredUsers.length})</CardTitle>
                      <CardDescription>Управление пользователями и их кредитами</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Поиск..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-9 w-full sm:w-64"
                          data-testid="input-user-search"
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExport("users")} data-testid="button-export-users" className="flex-shrink-0">
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">CSV</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Кредиты</TableHead>
                          <TableHead>План</TableHead>
                          <TableHead>Админ</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email || "-"}</TableCell>
                            <TableCell>{user.firstName} {user.lastName}</TableCell>
                            <TableCell><Badge variant="outline">{user.credits}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={user.plan === "pro" ? "default" : user.plan === "standard" ? "secondary" : "outline"}>
                                {user.plan}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.isAdmin === 1 ? <Shield className="w-4 h-4 text-primary" /> : "-"}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setEditingUser(user)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {user.isAdmin !== 1 && (
                                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"
                                    onClick={() => confirm("Удалить?") && deleteUser.mutate(user.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Платежи ({payments.length})</CardTitle>
                      <CardDescription>История транзакций</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport("payments")} className="flex-shrink-0 w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Сума</TableHead>
                          <TableHead>Кредити</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Опис</TableHead>
                          <TableHead>Дата</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}</TableCell>
                            <TableCell>{(p.amount / 100).toFixed(2)} {p.currency}</TableCell>
                            <TableCell>{p.credits}</TableCell>
                            <TableCell>{getStatusBadge(p.status)}</TableCell>
                            <TableCell className="max-w-xs truncate">{p.description}</TableCell>
                            <TableCell>{formatDate(p.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plans Tab */}
            <TabsContent value="plans">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Тарифы ({plans.length})</CardTitle>
                      <CardDescription>Настройки подписок</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewPlan(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Назва</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead>Кредити</TableHead>
                          <TableHead>Активен</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                            <TableCell>{plan.name}</TableCell>
                            <TableCell><Badge variant={plan.planType === "pro" ? "default" : "secondary"}>{plan.planType}</Badge></TableCell>
                            <TableCell>{plan.priceUah} ₴ / ${plan.priceUsd || 0}</TableCell>
                            <TableCell>{plan.credits}</TableCell>
                            <TableCell><Badge variant={plan.isActive === 1 ? "default" : "outline"}>{plan.isActive === 1 ? "Да" : "Нет"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Удалить?") && deletePlan.mutate(plan.id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packages Tab */}
            <TabsContent value="packages">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Пакеты кредитов ({packages.length})</CardTitle>
                      <CardDescription>Разовые покупки</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewPackage(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Кредити</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead>Бонус</TableHead>
                          <TableHead>Всього</TableHead>
                          <TableHead>Активен</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="font-medium">{pkg.credits}</TableCell>
                            <TableCell>{pkg.priceUah} ₴ / ${pkg.priceUsd || 0}</TableCell>
                            <TableCell className="text-green-600">+{pkg.bonusCredits || 0}</TableCell>
                            <TableCell className="font-medium">{pkg.credits + (pkg.bonusCredits || 0)}</TableCell>
                            <TableCell><Badge variant={pkg.isActive === 1 ? "default" : "outline"}>{pkg.isActive === 1 ? "Да" : "Нет"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setEditingPackage(pkg)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Удалить?") && deletePackage.mutate(pkg.id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>AI Інструменти ({toolsList.length})</CardTitle>
                      <CardDescription>Управління інструментами і цінами</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewTool(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавити
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Назва (RU)</TableHead>
                          <TableHead>Категория</TableHead>
                          <TableHead>Кредити</TableHead>
                          <TableHead>Активен</TableHead>
                          <TableHead>PRO</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {toolsList.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell className="font-mono text-xs">{tool.id}</TableCell>
                            <TableCell className="font-medium">{tool.nameRu}</TableCell>
                            <TableCell><Badge variant="outline">{categoryLabels[tool.category] || tool.category}</Badge></TableCell>
                            <TableCell><Badge>{tool.creditCost}</Badge></TableCell>
                            <TableCell>
                              <Switch
                                checked={tool.isActive === 1}
                                onCheckedChange={(checked) => updateTool.mutate({ id: tool.id, isActive: checked ? 1 : 0 })}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={tool.isPro === 1}
                                onCheckedChange={(checked) => updateTool.mutate({ id: tool.id, isPro: checked ? 1 : 0 })}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setEditingTool(tool)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Удалить?") && deleteTool.mutate(tool.id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>SEO налаштування ({seoList.length})</CardTitle>
                      <CardDescription>Мета-теги і Open Graph для сторінок</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewSeo(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Страница</TableHead>
                          <TableHead>Title (RU)</TableHead>
                          <TableHead>Title (UK)</TableHead>
                          <TableHead>Title (EN)</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seoList.map((seo) => (
                          <TableRow key={seo.id}>
                            <TableCell className="font-medium">{seo.page}</TableCell>
                            <TableCell className="max-w-xs truncate">{seo.titleRu}</TableCell>
                            <TableCell className="max-w-xs truncate">{seo.titleUk}</TableCell>
                            <TableCell className="max-w-xs truncate">{seo.titleEn}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setEditingSeo(seo)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Удалить?") && deleteSeo.mutate(seo.id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Контент сторінок ({contentList.length})</CardTitle>
                      <CardDescription>Тексти і заголовки для редагування</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewContent(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Страница</TableHead>
                          <TableHead>Секция</TableHead>
                          <TableHead>Контент (RU)</TableHead>
                          <TableHead>Активен</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contentList.map((content) => (
                          <TableRow key={content.id}>
                            <TableCell className="font-mono text-xs">{content.id}</TableCell>
                            <TableCell>{content.page}</TableCell>
                            <TableCell><Badge variant="outline">{content.section}</Badge></TableCell>
                            <TableCell className="max-w-xs truncate">{content.contentRu?.substring(0, 50)}...</TableCell>
                            <TableCell><Badge variant={content.isActive === 1 ? "default" : "outline"}>{content.isActive === 1 ? "Да" : "Нет"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setEditingContent(content)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm("Удалить?") && deleteContent.mutate(content.id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {contentList.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              Контента пока нет. Добавьте тексты для страниц.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Системні налаштування</CardTitle>
                      <CardDescription>Конфігурація платформи</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewSetting(true)} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.map((setting) => (
                    <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label className="font-medium text-foreground">{setting.key}</Label>
                        {setting.description && <p className="text-sm text-muted-foreground">{setting.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {setting.key.includes("enabled") || setting.key.includes("mode") ? (
                          <Switch
                            checked={setting.value === "true"}
                            onCheckedChange={(checked) => updateSettings.mutate([{ key: setting.key, value: checked.toString() }])}
                          />
                        ) : (
                          <Input
                            className="w-64"
                            defaultValue={setting.value}
                            onBlur={(e) => {
                              if (e.target.value !== setting.value) {
                                updateSettings.mutate([{ key: setting.key, value: e.target.value }]);
                              }
                            }}
                          />
                        )}
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm(`Удалить "${setting.key}"?`) && deleteSetting.mutate(setting.key)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {settings.length === 0 && <p className="text-center text-muted-foreground py-8">Настроек пока нет</p>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Providers Tab */}
            <TabsContent value="providers">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>AI Провайдери</CardTitle>
                      <CardDescription>Керування провайдерами для обробки зображень</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewProvider(true)} data-testid="button-add-provider" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Додати
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Инструмент</TableHead>
                        <TableHead>Приоритет</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Активен</TableHead>
                        <TableHead>За замовч.</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providersList.map((provider: ProviderConfig) => (
                        <TableRow key={provider.id}>
                          <TableCell className="font-medium">{provider.name}</TableCell>
                          <TableCell>
                            <Badge variant={provider.providerType === 'local' ? 'secondary' : 'default'}>
                              {provider.providerType}
                            </Badge>
                          </TableCell>
                          <TableCell>{provider.toolId}</TableCell>
                          <TableCell>{provider.priority}</TableCell>
                          <TableCell>
                            {provider.healthStatus === 'healthy' && <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>}
                            {provider.healthStatus === 'unhealthy' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Unhealthy</Badge>}
                            {(!provider.healthStatus || provider.healthStatus === 'unknown') && <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>}
                          </TableCell>
                          <TableCell>
                            <Switch checked={provider.isActive === 1} onCheckedChange={(checked) => updateProvider.mutate({ id: provider.id, isActive: checked ? 1 : 0 })} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={provider.isDefault === 1} onCheckedChange={(checked) => updateProvider.mutate({ id: provider.id, isDefault: checked ? 1 : 0 })} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => testProvider.mutate(provider.id)} disabled={testProvider.isPending}>
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingProvider(provider)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm(`Удалить "${provider.name}"?`) && deleteProvider.mutate(provider.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Черга завдань</CardTitle>
                      <CardDescription>Моніторинг AI-обробки зображень</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] })}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Оновити
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Инструмент</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Час</TableHead>
                        <TableHead>Створено</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobsList.map((job: AiJob) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}...</TableCell>
                          <TableCell>{job.toolId}</TableCell>
                          <TableCell>
                            {job.status === 'done' && <Badge variant="default" className="bg-green-500">Готово</Badge>}
                            {job.status === 'processing' && <Badge variant="default" className="bg-blue-500">Обробка</Badge>}
                            {job.status === 'queued' && <Badge variant="secondary">В очереди</Badge>}
                            {job.status === 'failed' && <Badge variant="destructive">Помилка</Badge>}
                            {job.status === 'cancelled' && <Badge variant="outline">Скасовано</Badge>}
                          </TableCell>
                          <TableCell>{job.processingTimeMs ? `${(job.processingTimeMs / 1000).toFixed(1)}s` : '-'}</TableCell>
                          <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {job.status === 'failed' && (
                                <Button size="icon" variant="ghost" onClick={() => retryJob.mutate(job.id)}>
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                              {(job.status === 'queued' || job.status === 'processing') && (
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => cancelJob.mutate(job.id)}>
                                  <Square className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {jobsList.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Заданий нет</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Env Tab */}
            <TabsContent value="env">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Конфігурації</CardTitle>
                      <CardDescription>Керування змінними оточення</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowNewEnv(true)} data-testid="button-add-env" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Додати
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ключ</TableHead>
                        <TableHead>Значення</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Опис</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {envList.map((env: EnvOverride) => (
                        <TableRow key={env.key}>
                          <TableCell className="font-mono">{env.key}</TableCell>
                          <TableCell className="font-mono">{env.isSecret ? '••••••••' : env.value}</TableCell>
                          <TableCell><Badge variant="outline">{env.category}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{env.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditingEnv(env)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => confirm(`Удалить "${env.key}"?`) && deleteEnv.mutate(env.key)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {envList.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Конфігурацій немає</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Доход (30 дней)</p>
                        <p className="text-2xl font-bold">{((analytics?.revenue?.total_revenue || 0) / 100).toFixed(0)} ₴</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Новые пользователи</p>
                        <p className="text-2xl font-bold">{analytics?.users?.new_users || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Завершено завдань</p>
                        <p className="text-2xl font-bold">{analytics?.jobs?.completed_jobs || 0}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Помилок</p>
                        <p className="text-2xl font-bold">{analytics?.jobs?.failed_jobs || 0}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Использование инструментов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.toolUsage?.map((tool: { tool_id: string; usage_count: number }) => (
                      <div key={tool.tool_id} className="flex items-center justify-between">
                        <span className="font-medium">{tool.tool_id}</span>
                        <Badge variant="secondary">{tool.usage_count} раз</Badge>
                      </div>
                    ))}
                    {(!analytics?.toolUsage || analytics.toolUsage.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Данных пока нет</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Журнал аудиту</CardTitle>
                      <CardDescription>История всех административных действий</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/audit"] })}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Оновити
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Час</TableHead>
                        <TableHead>Действие</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditList.map((log: AuditLog) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            {log.action === 'create' && <Badge variant="default" className="bg-green-500">Створення</Badge>}
                            {log.action === 'update' && <Badge variant="default" className="bg-blue-500">Оновлення</Badge>}
                            {log.action === 'delete' && <Badge variant="destructive">Видалення</Badge>}
                          </TableCell>
                          <TableCell>{log.entityType}</TableCell>
                          <TableCell className="font-mono text-xs">{log.entityId || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{log.ipAddress || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {auditList.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Записей нет</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Редактирование пользователя</DialogTitle></DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div><Label>Email</Label><Input value={editingUser.email || ""} disabled /></div>
                <div><Label>Кредити</Label><Input type="number" value={editingUser.credits} onChange={(e) => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })} /></div>
                <div>
                  <Label>План</Label>
                  <Select value={editingUser.plan} onValueChange={(value) => setEditingUser({ ...editingUser, plan: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingUser.isAdmin === 1} onCheckedChange={(checked) => setEditingUser({ ...editingUser, isAdmin: checked ? 1 : 0 })} />
                  <Label>Администратор</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Отмена</Button>
              <Button onClick={() => editingUser && updateUser.mutate(editingUser)} disabled={updateUser.isPending}>
                {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Редактирование тарифа</DialogTitle></DialogHeader>
            {editingPlan && (
              <div className="space-y-4">
                <div><Label>Назва</Label><Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Цена (₴)</Label><Input type="number" value={editingPlan.priceUah} onChange={(e) => setEditingPlan({ ...editingPlan, priceUah: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Цена ($)</Label><Input type="number" value={editingPlan.priceUsd || 0} onChange={(e) => setEditingPlan({ ...editingPlan, priceUsd: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Кредити</Label><Input type="number" value={editingPlan.credits} onChange={(e) => setEditingPlan({ ...editingPlan, credits: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingPlan.isActive === 1} onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, isActive: checked ? 1 : 0 })} />
                  <Label>Активен</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPlan(null)}>Отмена</Button>
              <Button onClick={() => editingPlan && updatePlan.mutate(editingPlan)} disabled={updatePlan.isPending}>
                {updatePlan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Plan Dialog */}
        <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый тариф</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Назва (RU)</Label><Input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Тип</Label>
                  <Select value={newPlan.planType} onValueChange={(value) => setNewPlan({ ...newPlan, planType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Период</Label>
                  <Select value={newPlan.period} onValueChange={(value) => setNewPlan({ ...newPlan, period: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Месячный</SelectItem>
                      <SelectItem value="yearly">Годовой</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Цена (₴)</Label><Input type="number" value={newPlan.priceUah} onChange={(e) => setNewPlan({ ...newPlan, priceUah: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Цена ($)</Label><Input type="number" value={newPlan.priceUsd} onChange={(e) => setNewPlan({ ...newPlan, priceUsd: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Кредити</Label><Input type="number" value={newPlan.credits} onChange={(e) => setNewPlan({ ...newPlan, credits: parseInt(e.target.value) || 0 })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPlan(false)}>Отмена</Button>
              <Button onClick={() => createPlan.mutate(newPlan)} disabled={createPlan.isPending || !newPlan.name}>
                {createPlan.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Package Dialog */}
        <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Редактирование пакета</DialogTitle></DialogHeader>
            {editingPackage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Кредити</Label><Input type="number" value={editingPackage.credits} onChange={(e) => setEditingPackage({ ...editingPackage, credits: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Бонус</Label><Input type="number" value={editingPackage.bonusCredits || 0} onChange={(e) => setEditingPackage({ ...editingPackage, bonusCredits: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Цена (₴)</Label><Input type="number" value={editingPackage.priceUah} onChange={(e) => setEditingPackage({ ...editingPackage, priceUah: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Цена ($)</Label><Input type="number" value={editingPackage.priceUsd || 0} onChange={(e) => setEditingPackage({ ...editingPackage, priceUsd: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingPackage.isActive === 1} onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, isActive: checked ? 1 : 0 })} />
                  <Label>Активен</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPackage(null)}>Отмена</Button>
              <Button onClick={() => editingPackage && updatePackage.mutate(editingPackage)} disabled={updatePackage.isPending}>
                {updatePackage.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Package Dialog */}
        <Dialog open={showNewPackage} onOpenChange={setShowNewPackage}>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый пакет</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Кредити</Label><Input type="number" value={newPackage.credits} onChange={(e) => setNewPackage({ ...newPackage, credits: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Бонус</Label><Input type="number" value={newPackage.bonusCredits} onChange={(e) => setNewPackage({ ...newPackage, bonusCredits: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Цена (₴)</Label><Input type="number" value={newPackage.priceUah} onChange={(e) => setNewPackage({ ...newPackage, priceUah: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Цена ($)</Label><Input type="number" value={newPackage.priceUsd} onChange={(e) => setNewPackage({ ...newPackage, priceUsd: parseInt(e.target.value) || 0 })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPackage(false)}>Отмена</Button>
              <Button onClick={() => createPackage.mutate(newPackage)} disabled={createPackage.isPending || newPackage.credits <= 0}>
                {createPackage.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Setting Dialog */}
        <Dialog open={showNewSetting} onOpenChange={setShowNewSetting}>
          <DialogContent>
            <DialogHeader><DialogTitle>Нове налаштування</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Ключ</Label><Input value={newSetting.key} onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })} /></div>
              <div><Label>Значення</Label><Input value={newSetting.value} onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })} /></div>
              <div><Label>Опис</Label><Input value={newSetting.description} onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSetting(false)}>Отмена</Button>
              <Button onClick={() => createSetting.mutate(newSetting)} disabled={createSetting.isPending || !newSetting.key}>
                {createSetting.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Env Dialog */}
        <Dialog open={showNewEnv} onOpenChange={setShowNewEnv}>
          <DialogContent>
            <DialogHeader><DialogTitle>Нова конфігурація</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Ключ</Label><Input value={newEnv.key} onChange={(e) => setNewEnv({ ...newEnv, key: e.target.value })} placeholder="MY_CONFIG_KEY" /></div>
              <div><Label>Значення</Label><Input value={newEnv.value} onChange={(e) => setNewEnv({ ...newEnv, value: e.target.value })} /></div>
              <div><Label>Опис</Label><Input value={newEnv.description} onChange={(e) => setNewEnv({ ...newEnv, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewEnv(false)}>Отмена</Button>
              <Button onClick={() => createEnv.mutate(newEnv)} disabled={createEnv.isPending || !newEnv.key}>
                {createEnv.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Tool Dialog */}
        <Dialog open={!!editingTool} onOpenChange={() => setEditingTool(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Редактирование инструмента</DialogTitle></DialogHeader>
            {editingTool && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Назва (RU)</Label><Input value={editingTool.nameRu} onChange={(e) => setEditingTool({ ...editingTool, nameRu: e.target.value })} /></div>
                  <div><Label>Назва (UK)</Label><Input value={editingTool.nameUk || ""} onChange={(e) => setEditingTool({ ...editingTool, nameUk: e.target.value })} /></div>
                  <div><Label>Назва (EN)</Label><Input value={editingTool.nameEn || ""} onChange={(e) => setEditingTool({ ...editingTool, nameEn: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Категория</Label>
                    <Select value={editingTool.category} onValueChange={(value) => setEditingTool({ ...editingTool, category: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enhance">Покращення</SelectItem>
                        <SelectItem value="face">Обличчя</SelectItem>
                        <SelectItem value="background">Фон</SelectItem>
                        <SelectItem value="restore">Реставрация</SelectItem>
                        <SelectItem value="edit">Редактирование</SelectItem>
                        <SelectItem value="effects">Ефекти</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Цена (кредиты)</Label><Input type="number" value={editingTool.creditCost} onChange={(e) => setEditingTool({ ...editingTool, creditCost: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Иконка (Lucide)</Label><Input value={editingTool.iconName || ""} onChange={(e) => setEditingTool({ ...editingTool, iconName: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={editingTool.isActive === 1} onCheckedChange={(checked) => setEditingTool({ ...editingTool, isActive: checked ? 1 : 0 })} />
                    <Label>Активен</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingTool.isPro === 1} onCheckedChange={(checked) => setEditingTool({ ...editingTool, isPro: checked ? 1 : 0 })} />
                    <Label>Только PRO</Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTool(null)}>Отмена</Button>
              <Button onClick={() => editingTool && updateTool.mutate(editingTool)} disabled={updateTool.isPending}>
                {updateTool.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Tool Dialog */}
        <Dialog open={showNewTool} onOpenChange={setShowNewTool}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Новый инструмент</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>ID (уникальный)</Label><Input value={newTool.id} onChange={(e) => setNewTool({ ...newTool, id: e.target.value })} placeholder="my-tool" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Назва (RU)</Label><Input value={newTool.nameRu} onChange={(e) => setNewTool({ ...newTool, nameRu: e.target.value })} /></div>
                <div><Label>Назва (UK)</Label><Input value={newTool.nameUk} onChange={(e) => setNewTool({ ...newTool, nameUk: e.target.value })} /></div>
                <div><Label>Назва (EN)</Label><Input value={newTool.nameEn} onChange={(e) => setNewTool({ ...newTool, nameEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Категория</Label>
                  <Select value={newTool.category} onValueChange={(value) => setNewTool({ ...newTool, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enhance">Покращення</SelectItem>
                      <SelectItem value="face">Обличчя</SelectItem>
                      <SelectItem value="background">Фон</SelectItem>
                      <SelectItem value="restore">Реставрация</SelectItem>
                      <SelectItem value="edit">Редактирование</SelectItem>
                      <SelectItem value="effects">Ефекти</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Цена (кредиты)</Label><Input type="number" value={newTool.creditCost} onChange={(e) => setNewTool({ ...newTool, creditCost: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Иконка</Label><Input value={newTool.iconName} onChange={(e) => setNewTool({ ...newTool, iconName: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTool(false)}>Отмена</Button>
              <Button onClick={() => createTool.mutate(newTool)} disabled={createTool.isPending || !newTool.id || !newTool.nameRu}>
                {createTool.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit SEO Dialog */}
        <Dialog open={!!editingSeo} onOpenChange={() => setEditingSeo(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>SEO для страницы: {editingSeo?.page}</DialogTitle></DialogHeader>
            {editingSeo && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Title (RU)</Label><Input value={editingSeo.titleRu || ""} onChange={(e) => setEditingSeo({ ...editingSeo, titleRu: e.target.value })} /></div>
                  <div><Label>Title (UK)</Label><Input value={editingSeo.titleUk || ""} onChange={(e) => setEditingSeo({ ...editingSeo, titleUk: e.target.value })} /></div>
                  <div><Label>Title (EN)</Label><Input value={editingSeo.titleEn || ""} onChange={(e) => setEditingSeo({ ...editingSeo, titleEn: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Description (RU)</Label><Textarea value={editingSeo.descriptionRu || ""} onChange={(e) => setEditingSeo({ ...editingSeo, descriptionRu: e.target.value })} /></div>
                  <div><Label>Description (UK)</Label><Textarea value={editingSeo.descriptionUk || ""} onChange={(e) => setEditingSeo({ ...editingSeo, descriptionUk: e.target.value })} /></div>
                  <div><Label>Description (EN)</Label><Textarea value={editingSeo.descriptionEn || ""} onChange={(e) => setEditingSeo({ ...editingSeo, descriptionEn: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Keywords (RU)</Label><Input value={editingSeo.keywordsRu || ""} onChange={(e) => setEditingSeo({ ...editingSeo, keywordsRu: e.target.value })} /></div>
                  <div><Label>Keywords (UK)</Label><Input value={editingSeo.keywordsUk || ""} onChange={(e) => setEditingSeo({ ...editingSeo, keywordsUk: e.target.value })} /></div>
                  <div><Label>Keywords (EN)</Label><Input value={editingSeo.keywordsEn || ""} onChange={(e) => setEditingSeo({ ...editingSeo, keywordsEn: e.target.value })} /></div>
                </div>
                <div><Label>OG Image URL</Label><Input value={editingSeo.ogImage || ""} onChange={(e) => setEditingSeo({ ...editingSeo, ogImage: e.target.value })} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSeo(null)}>Отмена</Button>
              <Button onClick={() => editingSeo && updateSeo.mutate(editingSeo)} disabled={updateSeo.isPending}>
                {updateSeo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New SEO Dialog */}
        <Dialog open={showNewSeo} onOpenChange={setShowNewSeo}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Новая SEO страница</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Страница (ID)</Label><Input value={newSeo.page} onChange={(e) => setNewSeo({ ...newSeo, page: e.target.value })} placeholder="about" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Title (RU)</Label><Input value={newSeo.titleRu} onChange={(e) => setNewSeo({ ...newSeo, titleRu: e.target.value })} /></div>
                <div><Label>Title (UK)</Label><Input value={newSeo.titleUk} onChange={(e) => setNewSeo({ ...newSeo, titleUk: e.target.value })} /></div>
                <div><Label>Title (EN)</Label><Input value={newSeo.titleEn} onChange={(e) => setNewSeo({ ...newSeo, titleEn: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSeo(false)}>Отмена</Button>
              <Button onClick={() => createSeo.mutate(newSeo)} disabled={createSeo.isPending || !newSeo.page}>
                {createSeo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Content Dialog */}
        <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Редактирование контента: {editingContent?.id}</DialogTitle></DialogHeader>
            {editingContent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Страница</Label><Input value={editingContent.page} disabled /></div>
                  <div><Label>Секция</Label><Input value={editingContent.section} disabled /></div>
                </div>
                <div><Label>Контент (RU)</Label><Textarea rows={4} value={editingContent.contentRu || ""} onChange={(e) => setEditingContent({ ...editingContent, contentRu: e.target.value })} /></div>
                <div><Label>Контент (UK)</Label><Textarea rows={4} value={editingContent.contentUk || ""} onChange={(e) => setEditingContent({ ...editingContent, contentUk: e.target.value })} /></div>
                <div><Label>Контент (EN)</Label><Textarea rows={4} value={editingContent.contentEn || ""} onChange={(e) => setEditingContent({ ...editingContent, contentEn: e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingContent.isActive === 1} onCheckedChange={(checked) => setEditingContent({ ...editingContent, isActive: checked ? 1 : 0 })} />
                  <Label>Активен</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingContent(null)}>Отмена</Button>
              <Button onClick={() => editingContent && updateContent.mutate(editingContent)} disabled={updateContent.isPending}>
                {updateContent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Content Dialog */}
        <Dialog open={showNewContent} onOpenChange={setShowNewContent}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Новый контент</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>ID (уникальный)</Label><Input value={newContent.id} onChange={(e) => setNewContent({ ...newContent, id: e.target.value })} placeholder="home_hero_title" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Страница</Label><Input value={newContent.page} onChange={(e) => setNewContent({ ...newContent, page: e.target.value })} placeholder="home" /></div>
                <div><Label>Секция</Label><Input value={newContent.section} onChange={(e) => setNewContent({ ...newContent, section: e.target.value })} placeholder="hero" /></div>
              </div>
              <div><Label>Контент (RU)</Label><Textarea rows={3} value={newContent.contentRu} onChange={(e) => setNewContent({ ...newContent, contentRu: e.target.value })} /></div>
              <div><Label>Контент (UK)</Label><Textarea rows={3} value={newContent.contentUk} onChange={(e) => setNewContent({ ...newContent, contentUk: e.target.value })} /></div>
              <div><Label>Контент (EN)</Label><Textarea rows={3} value={newContent.contentEn} onChange={(e) => setNewContent({ ...newContent, contentEn: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewContent(false)}>Отмена</Button>
              <Button onClick={() => createContent.mutate(newContent)} disabled={createContent.isPending || !newContent.id || !newContent.page || !newContent.section}>
                {createContent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Provider Dialog */}
        <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Редактирование провайдера</DialogTitle></DialogHeader>
            {editingProvider && (
              <div className="space-y-4">
                <div><Label>Назва</Label><Input value={editingProvider.name} onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Тип провайдера</Label>
                    <Select value={editingProvider.providerType} onValueChange={(value) => setEditingProvider({ ...editingProvider, providerType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="runpod">RunPod</SelectItem>
                        <SelectItem value="replicate">Replicate</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Инструмент</Label>
                    <Select value={editingProvider.toolId} onValueChange={(value) => setEditingProvider({ ...editingProvider, toolId: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {toolsList.map((tool) => (
                          <SelectItem key={tool.id} value={tool.id}>{tool.nameRu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Endpoint URL</Label><Input value={editingProvider.endpoint || ""} onChange={(e) => setEditingProvider({ ...editingProvider, endpoint: e.target.value })} placeholder="https://api..." /></div>
                  <div><Label>API Key Env Var</Label><Input value={editingProvider.apiKeyEnvVar || ""} onChange={(e) => setEditingProvider({ ...editingProvider, apiKeyEnvVar: e.target.value })} placeholder="RUNPOD_API_KEY" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Модель</Label><Input value={editingProvider.model || ""} onChange={(e) => setEditingProvider({ ...editingProvider, model: e.target.value })} /></div>
                  <div><Label>Приоритет</Label><Input type="number" value={editingProvider.priority} onChange={(e) => setEditingProvider({ ...editingProvider, priority: parseInt(e.target.value) || 1 })} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProvider.isActive === 1} onCheckedChange={(checked) => setEditingProvider({ ...editingProvider, isActive: checked ? 1 : 0 })} />
                    <Label>Активен</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProvider.isDefault === 1} onCheckedChange={(checked) => setEditingProvider({ ...editingProvider, isDefault: checked ? 1 : 0 })} />
                    <Label>За замовч.</Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProvider(null)}>Отмена</Button>
              <Button onClick={() => editingProvider && updateProvider.mutate(editingProvider)} disabled={updateProvider.isPending}>
                {updateProvider.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Provider Dialog */}
        <Dialog open={showNewProvider} onOpenChange={setShowNewProvider}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Новый провайдер</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Назва</Label><Input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} placeholder="My Provider" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Тип провайдера</Label>
                  <Select value={newProvider.providerType} onValueChange={(value) => setNewProvider({ ...newProvider, providerType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="runpod">RunPod</SelectItem>
                      <SelectItem value="replicate">Replicate</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Инструмент</Label>
                  <Select value={newProvider.toolId} onValueChange={(value) => setNewProvider({ ...newProvider, toolId: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {toolsList.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id}>{tool.nameRu}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Endpoint URL</Label><Input value={newProvider.endpoint} onChange={(e) => setNewProvider({ ...newProvider, endpoint: e.target.value })} placeholder="https://api..." /></div>
                <div><Label>API Key Env Var</Label><Input value={newProvider.apiKeyEnvVar} onChange={(e) => setNewProvider({ ...newProvider, apiKeyEnvVar: e.target.value })} placeholder="RUNPOD_API_KEY" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Модель</Label><Input value={newProvider.model} onChange={(e) => setNewProvider({ ...newProvider, model: e.target.value })} /></div>
                <div><Label>Приоритет</Label><Input type="number" value={newProvider.priority} onChange={(e) => setNewProvider({ ...newProvider, priority: parseInt(e.target.value) || 1 })} /></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={newProvider.isActive === 1} onCheckedChange={(checked) => setNewProvider({ ...newProvider, isActive: checked ? 1 : 0 })} />
                  <Label>Активен</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newProvider.isDefault === 1} onCheckedChange={(checked) => setNewProvider({ ...newProvider, isDefault: checked ? 1 : 0 })} />
                  <Label>За замовч.</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProvider(false)}>Отмена</Button>
              <Button onClick={() => createProvider.mutate(newProvider)} disabled={createProvider.isPending || !newProvider.name || !newProvider.toolId}>
                {createProvider.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Створити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
