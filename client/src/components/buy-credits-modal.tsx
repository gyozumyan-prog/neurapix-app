import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Coins, Info, Loader2, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface CreditPackage {
  id: string;
  credits: number;
  priceUah: number;
  priceUsd: number;
  bonusCredits: number;
  isActive: number;
  sortOrder: number;
}

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const { toast } = useToast();
  const { language } = useI18n();

  const { data: packages = [], isLoading } = useQuery<CreditPackage[]>({
    queryKey: ["/api/credit-packages"],
    enabled: open,
  });

  const { data: creditsData } = useQuery<{ credits: number; plan?: string }>({
    queryKey: ["/api/credits"],
    enabled: open,
  });

  const userPlan = creditsData?.plan ?? 'free';
  const isProUser = userPlan === 'pro' || userPlan === 'premium';

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0].id);
    }
  }, [packages, selectedPackage]);

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) throw new Error("Пакет не найден");
      
      const response = await apiRequest("POST", "/api/credits/purchase", {
        packageId: pkg.id,
        credits: pkg.credits + pkg.bonusCredits,
        price: language === "en" ? pkg.priceUsd : pkg.priceUah
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Успешно!",
          description: `Добавлено ${data.credits} кредитов`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
        onOpenChange(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось приобрести кредиты",
        variant: "destructive",
      });
    },
  });

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const isUah = language !== "en";

  const formatPrice = (pkg: CreditPackage) => {
    if (isUah) {
      return `${pkg.priceUah}₴`;
    }
    return `$${pkg.priceUsd}`;
  };

  const getPerCreditPrice = (pkg: CreditPackage) => {
    const totalCredits = pkg.credits + pkg.bonusCredits;
    const price = isUah ? pkg.priceUah : pkg.priceUsd;
    if (totalCredits <= 0 || price <= 0) return "0.00";
    return (price / totalCredits).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            {language === "en" ? "Buy AI Credits" : language === "uk" ? "Купити AI-кредити" : "Купить AI-кредиты"}
          </DialogTitle>
          <DialogDescription>
            {language === "en" 
              ? "Top up your credit balance to continue using AI tools."
              : language === "uk"
              ? "Поповніть баланс кредитів для продовження роботи з AI інструментами."
              : "Пополните баланс кредитов для продолжения работы с AI инструментами."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!isProUser && (
            <Alert className="mb-4 border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <Crown className="w-4 h-4 text-purple-500" />
              <AlertTitle className="text-purple-600 dark:text-purple-400 text-sm">
                {language === "en" ? "PRO subscription required" : language === "uk" ? "Потрібна PRO підписка" : "Требуется PRO подписка"}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                {language === "en" 
                  ? "Credit purchases are only available for PRO subscribers."
                  : language === "uk"
                  ? "Покупка кредитів доступна лише для PRO користувачів."
                  : "Покупка кредитов доступна только для PRO пользователей."}
                <div className="mt-2">
                  <Button asChild size="sm" className="btn-primary-gradient">
                    <Link href="/pricing" onClick={() => onOpenChange(false)}>
                      <Crown className="w-3 h-3 mr-1" />
                      {language === "en" ? "Get PRO" : language === "uk" ? "Отримати PRO" : "Оформить PRO"}
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "en" ? "No packages available" : "Пакеты недоступны"}
            </div>
          ) : (
            <RadioGroup
              value={selectedPackage}
              onValueChange={setSelectedPackage}
              className="space-y-2"
            >
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedPackage === pkg.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                  data-testid={`credit-package-${pkg.id}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={pkg.id} id={pkg.id} />
                    <Label htmlFor={pkg.id} className="cursor-pointer font-medium">
                      {pkg.credits.toLocaleString()} {language === "en" ? "credits" : "кредитов"}
                      {pkg.bonusCredits > 0 && (
                        <span className="text-green-500 ml-1">+{pkg.bonusCredits}</span>
                      )}
                    </Label>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">{formatPrice(pkg)}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {getPerCreditPrice(pkg)}/{language === "en" ? "credit" : "кредит"}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => purchaseMutation.mutate(selectedPackage)}
          disabled={!isProUser || purchaseMutation.isPending || !selectedPkg || isLoading}
          data-testid="button-purchase-credits"
        >
          {!isProUser ? (
            language === "en" ? "PRO only" : language === "uk" ? "Лише для PRO" : "Только для PRO"
          ) : purchaseMutation.isPending ? (
            language === "en" ? "Processing..." : "Обработка..."
          ) : selectedPkg ? (
            <>
              {language === "en" ? "Get" : "Получить"} {(selectedPkg.credits + selectedPkg.bonusCredits).toLocaleString()} {language === "en" ? "credits for" : "кредитов за"} {formatPrice(selectedPkg)}
            </>
          ) : (
            language === "en" ? "Select a package" : "Выберите пакет"
          )}
        </Button>

        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            {language === "en" 
              ? "Unused credits carry over as long as you're subscribed."
              : language === "uk"
              ? "Невикористані кредити переносяться, поки ви підписані."
              : "Неиспользованные кредиты переносятся, пока вы подписаны."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
