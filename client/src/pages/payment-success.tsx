import { useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccess() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, [queryClient]);

  return (
    <>
      <Helmet>
        <title>{t("payment.success") || "Оплата успешна"} | NeuraPix</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2" data-testid="text-payment-success">
              {t("payment.success") || "Оплата успешна!"}
            </h1>
            
            <p className="text-muted-foreground mb-8">
              {t("payment.creditsAdded") || "Кредиты добавлены на ваш аккаунт. Спасибо за покупку!"}
            </p>
            
            <div className="flex flex-col gap-3">
              <Button asChild data-testid="button-go-editor">
                <Link href="/editor">
                  {t("payment.goToEditor") || "Перейти в редактор"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild data-testid="button-go-home">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  {t("nav.home") || "На главную"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
