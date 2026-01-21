import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Coins, Sparkles, Gift, Loader2, AlertCircle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

interface CreditPackage {
  id: string;
  credits: number;
  priceUah: number;
  priceUsd: number | null;
  bonusCredits: number | null;
  isActive: number;
  sortOrder: number;
}

interface PaymentStatus {
  configured: boolean;
  enabled: boolean;
  available: boolean;
}

export default function BuyCredits() {
  const { t, language } = useI18n();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const { data: packages = [], isLoading: packagesLoading } = useQuery<CreditPackage[]>({
    queryKey: ["/api/payment/packages"],
  });

  const { data: paymentStatus } = useQuery<PaymentStatus>({
    queryKey: ["/api/payment/status"],
  });

  const { data: userCredits } = useQuery<{ credits: number; plan?: string }>({
    queryKey: ["/api/credits"],
  });

  const userPlan = userCredits?.plan ?? 'free';
  const isProUser = userPlan === 'pro' || userPlan === 'premium';

  const createPayment = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await apiRequest("POST", "/api/payment/create", {
        type: "package",
        packageId,
        language: language === "uk" ? "uk" : language === "ru" ? "ru" : "en",
      });
      return response.json();
    },
    onSuccess: (data) => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkoutUrl;
      form.target = "_blank";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = data.data;
      form.appendChild(dataInput);

      const signatureInput = document.createElement("input");
      signatureInput.type = "hidden";
      signatureInput.name = "signature";
      signatureInput.value = data.signature;
      form.appendChild(signatureInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    },
  });

  const handleBuy = (packageId: string) => {
    setSelectedPackage(packageId);
    createPayment.mutate(packageId);
  };

  return (
    <>
      <Helmet>
        <title>{t("buyCredits.title") || "Купить кредиты"} | NeuraPix</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("common.back") || "Назад"}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-medium" data-testid="text-current-credits">
                {userCredits?.credits ?? 0} {t("credits.credits") || "кредитов"}
              </span>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                {t("buyCredits.heading") || "Купить кредиты"}
              </h1>
              <p className="text-muted-foreground">
                {t("buyCredits.subtitle") || "Выберите пакет кредитов для AI-обработки фотографий"}
              </p>
            </div>

            {!isProUser && (
              <Alert className="mb-6 border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <Crown className="w-5 h-5 text-purple-500" />
                <AlertTitle className="text-purple-600 dark:text-purple-400">
                  {t("buyCredits.proRequired") || "Требуется PRO подписка"}
                </AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  {t("buyCredits.proRequiredDesc") || "Покупка дополнительных кредитов доступна только для пользователей с PRO подпиской. Оформите подписку, чтобы получить доступ к покупке кредитов и другим преимуществам."}
                  <div className="mt-3">
                    <Button asChild className="btn-primary-gradient">
                      <Link href="/pricing">
                        <Crown className="w-4 h-4 mr-2" />
                        {t("buyCredits.upgradeToPro") || "Оформить PRO подписку"}
                      </Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!paymentStatus?.available && (
              <Card className="mb-6 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t("buyCredits.paymentUnavailable") || "Оплата временно недоступна. Ключи LiqPay не настроены. Обратитесь к администратору."}
                  </p>
                </CardContent>
              </Card>
            )}

            {packagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => {
                  const hasBonus = (pkg.bonusCredits || 0) > 0;
                  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
                  const pricePerCredit = (pkg.priceUah / totalCredits).toFixed(2);
                  const isPopular = pkg.id === "pack_1000";

                  return (
                    <Card 
                      key={pkg.id} 
                      className={`relative transition-all hover:shadow-lg ${isPopular ? "ring-2 ring-primary" : ""}`}
                      data-testid={`card-package-${pkg.id}`}
                    >
                      {isPopular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2" variant="default">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("buyCredits.popular") || "Популярный"}
                        </Badge>
                      )}
                      
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">
                          {pkg.credits.toLocaleString()}
                        </CardTitle>
                        <CardDescription>
                          {t("credits.credits") || "кредитов"}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="text-center space-y-4">
                        {hasBonus && (
                          <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                            <Gift className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              +{pkg.bonusCredits} {t("buyCredits.bonus") || "бонус"}
                            </span>
                          </div>
                        )}

                        <div className="text-3xl font-bold">
                          {pkg.priceUah} <span className="text-lg font-normal text-muted-foreground">₴</span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {pricePerCredit} ₴ / {t("buyCredits.perCredit") || "за кредит"}
                        </p>

                        <Button
                          className="w-full"
                          disabled={!isProUser || !paymentStatus?.available || createPayment.isPending}
                          onClick={() => handleBuy(pkg.id)}
                          data-testid={`button-buy-${pkg.id}`}
                        >
                          {createPayment.isPending && selectedPackage === pkg.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {!isProUser ? (t("buyCredits.proOnly") || "Только для PRO") : (t("buyCredits.buy") || "Купить")}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>{t("buyCredits.securePayment") || "Безопасная оплата через LiqPay (ПриватБанк)"}</p>
              <p className="mt-1">{t("buyCredits.instantCredit") || "Кредиты зачисляются мгновенно после оплаты"}</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
