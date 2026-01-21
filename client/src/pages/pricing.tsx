import { useState, Fragment, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SEO } from "@/components/seo";
import { 
  Check, 
  X, 
  Sparkles,
  Crown,
  Zap,
  ArrowLeft,
  ChevronDown,
  Calendar,
  Minus
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { useContent } from "@/hooks/use-content";
import { useQuery } from "@tanstack/react-query";

interface PricingPlan {
  id: string;
  name: string;
  nameUk: string | null;
  nameEn: string | null;
  planType: string;
  period: string;
  priceUah: number;
  priceUsd: number;
  credits: number;
  features: string[] | null;
  featuresUk: string[] | null;
  featuresEn: string[] | null;
  isActive: number;
  sortOrder: number;
}

export default function Pricing() {
  const [yearlyBilling, setYearlyBilling] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t, language } = useI18n();
  const { getContent } = useContent("pricing");

  const { data: dbPlans = [] } = useQuery<PricingPlan[]>({
    queryKey: ["/api/pricing-plans"],
  });

  const proMonthly = dbPlans.find(p => p.planType === "pro" && p.period === "monthly");
  const proYearly = dbPlans.find(p => p.planType === "pro" && p.period === "yearly");

  const getPrice = (plan: PricingPlan | undefined) => {
    if (!plan) return 0;
    return language === "en" ? plan.priceUsd : plan.priceUah;
  };

  const PLANS = useMemo(() => [
    {
      id: "free",
      name: t("pricing.free"),
      description: t("pricing.freeDesc"),
      monthly: { price: 0, credits: 10 },
      yearly: { price: 0, credits: 10 },
      featuresHeader: t("pricing.featuresAvailable"),
      features: [
        { text: t("pricing.feature.freeTools"), included: true },
        { text: t("pricing.feature.aiTools"), included: true },
        { text: t("pricing.feature.upscale4x"), included: true },
        { text: t("pricing.feature.export1600"), included: true },
        { text: t("pricing.feature.compare"), included: true },
        { text: t("pricing.feature.upscale8x"), included: false },
      ],
      buttonText: t("pricing.startFree"),
      buttonVariant: "outline" as const,
      icon: Zap,
      popular: false,
    },
    {
      id: "pro",
      name: "PRO",
      description: t("pricing.proDesc"),
      monthly: { 
        price: getPrice(proMonthly) || (language === "en" ? 29 : 999), 
        credits: proMonthly?.credits || 2000 
      },
      yearly: { 
        price: getPrice(proYearly) || (language === "en" ? 249 : 8499), 
        credits: proYearly?.credits || 30000 
      },
      featuresHeader: t("pricing.featuresAll"),
      features: [
        { text: t("pricing.feature.allTools"), included: true },
        { text: t("pricing.feature.upscale8x"), included: true },
        { text: t("pricing.feature.export8k"), included: true },
        { text: t("pricing.feature.priority"), included: true },
        { text: t("pricing.feature.faceSwap"), included: true },
        { text: t("pricing.feature.outpainting"), included: true },
        { text: t("pricing.feature.emailSupport"), included: true },
      ],
      buttonText: t("pricing.upgradePro"),
      buttonVariant: "default" as const,
      icon: Crown,
      popular: true,
    },
  ], [t, language, proMonthly, proYearly]);

  const COMPARISON_DATA = useMemo(() => [
    { 
      category: t("pricing.cat.aiTools"), 
      items: [
        { name: t("pricing.tool.enhance"), credits: "4", free: true, pro: true },
        { name: t("pricing.tool.upscale4x"), credits: "5", free: true, pro: true },
        { name: t("pricing.tool.upscale8x"), credits: "10", free: false, pro: true },
        { name: t("pricing.tool.faceRestore"), credits: "4", free: true, pro: true },
        { name: t("pricing.tool.portrait"), credits: "4", free: true, pro: true },
        { name: t("pricing.tool.faceSwap"), credits: "8", free: true, pro: true },
        { name: t("pricing.tool.bgRemove"), credits: "3", free: true, pro: true },
        { name: t("pricing.tool.bgChangeAi"), credits: "10", free: true, pro: true },
        { name: t("pricing.tool.bgChangeOwn"), credits: "4", free: true, pro: true },
        { name: t("pricing.tool.bgBlur"), credits: "3", free: true, pro: true },
        { name: t("pricing.tool.restore"), credits: "8", free: true, pro: true },
        { name: t("pricing.tool.restorePro"), credits: "10", free: true, pro: true },
        { name: t("pricing.tool.colorize"), credits: "5", free: true, pro: true },
        { name: t("pricing.tool.objectRemove"), credits: "8", free: true, pro: true },
        { name: t("pricing.tool.inpainting"), credits: "6", free: true, pro: true },
        { name: t("pricing.tool.outpainting"), credits: "10", free: true, pro: true },
        { name: t("pricing.tool.artStyle"), credits: "10", free: true, pro: true },
        { name: t("pricing.tool.generate"), credits: "2", free: true, pro: true },
      ]
    },
    {
      category: t("pricing.cat.freeTools"),
      items: [
        { name: t("pricing.tool.hdr"), credits: "0", free: true, pro: true },
        { name: t("pricing.tool.watermark"), credits: "0", free: true, pro: true },
        { name: t("pricing.tool.autoLight"), credits: "0", free: true, pro: true },
        { name: t("pricing.tool.compress"), credits: "0", free: true, pro: true },
        { name: t("pricing.tool.convert"), credits: "0", free: true, pro: true },
      ]
    },
    {
      category: t("pricing.cat.export"),
      items: [
        { name: t("pricing.tool.quality"), credits: null, free: t("pricing.quality.max1600"), pro: t("pricing.quality.to8k") },
        { name: t("pricing.tool.exportPng"), credits: null, free: true, pro: true },
      ]
    },
    {
      category: t("pricing.cat.benefits"),
      items: [
        { name: t("pricing.tool.batch"), credits: null, free: false, pro: true },
        { name: t("pricing.tool.noAds"), credits: null, free: false, pro: true },
        { name: t("pricing.tool.prioritySupport"), credits: null, free: false, pro: true },
      ]
    },
  ], [t]);

  const FAQ_DATA = useMemo(() => [
    { question: t("pricing.faq.q1"), answer: t("pricing.faq.a1") },
    { question: t("pricing.faq.q2"), answer: t("pricing.faq.a2") },
    { question: t("pricing.faq.q3"), answer: t("pricing.faq.a3") },
    { question: t("pricing.faq.q4"), answer: t("pricing.faq.a4") },
    { question: t("pricing.faq.q5"), answer: t("pricing.faq.a5") },
    { question: t("pricing.faq.q6"), answer: t("pricing.faq.a6") },
    { question: t("pricing.faq.q7"), answer: t("pricing.faq.a7") },
  ], [t]);

  const renderCellValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <Minus className="w-5 h-5 text-muted-foreground/40 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <>
      <SEO page="pricing" />
      <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            NeuraPix
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("nav.home")}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <Link 
              href="/generate" 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 hover:from-violet-600/30 hover:to-purple-600/30 hover:border-violet-500/50 transition-all text-sm"
              data-testid="link-pricing-ai-generator"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 font-medium">{t("nav.aiGenerator")}</span>
            </Link>
            <LanguageSwitcher />
            <Button size="sm" asChild>
              <a href="/login" data-testid="button-login">{t("nav.login")}</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-2">
            {getContent("title", t("pricing.headline"))}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            <span className={`text-sm font-medium ${!yearlyBilling ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t("pricing.monthly")}
            </span>
            <button
              type="button"
              onClick={() => setYearlyBilling(!yearlyBilling)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                yearlyBilling ? 'bg-primary' : 'bg-muted'
              }`}
              data-testid="toggle-billing"
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                yearlyBilling ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium ${yearlyBilling ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t("pricing.yearly")}
            </span>
            {yearlyBilling && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 ml-2">
                {t("pricing.save18")}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-16 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const displayPrice = yearlyBilling 
              ? Math.round(plan.yearly.price / 12) 
              : plan.monthly.price;
            
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-visible ${
                  plan.popular ? "border-primary border-2 shadow-xl md:scale-105" : "border"
                }`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-white px-4 py-1 whitespace-nowrap">
                      {t("pricing.bestValue")}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-2 pt-8">
                  <div className="flex items-center gap-2 mb-1">
                    <plan.icon className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">
                        {language === "en" ? `$${displayPrice}` : `${displayPrice}₴`}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{t("pricing.perMonth")}</p>
                    {yearlyBilling && plan.monthly.price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("pricing.billedYearly")} ({language === "en" ? `$${plan.yearly.price}` : `${plan.yearly.price}₴`}{t("pricing.perYear")})
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-4">
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full mb-6 h-11 ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                    asChild
                  >
                    <a href="/login" data-testid={`button-plan-${plan.id}`}>
                      {plan.buttonText}
                    </a>
                  </Button>

                  <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-lg">
                      {(yearlyBilling && plan.id !== "free" ? plan.yearly.credits : plan.monthly.credits).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">{t("pricing.credits")}</span>
                    <span className="text-xs text-muted-foreground">
                      {plan.id === "free" ? t("pricing.creditsPerMonth") : (yearlyBilling ? t("pricing.creditsPerYear") : t("pricing.creditsPerMonth"))}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium mb-3">{plan.featuresHeader}</p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <>
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{feature.text}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature.text}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("pricing.cancelAnytime")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pricing.cancelAnytimeDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t("pricing.tryFree")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pricing.tryFreeDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t("pricing.comparePlans")}</h2>
          
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full border-collapse min-w-[320px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 md:py-4 px-2 md:px-4 font-medium">
                    <div>
                      <p className="text-sm md:text-lg">{t("pricing.compareTitle")}</p>
                      <p className="text-xs md:text-sm text-muted-foreground font-normal hidden sm:block">{t("pricing.compareSubtitle")}</p>
                    </div>
                  </th>
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 w-[80px] md:min-w-[140px]">
                    <div className="space-y-1">
                      <p className="font-bold text-xs md:text-base">{t("pricing.free")}</p>
                      <p className="text-lg md:text-2xl font-bold">$0</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">10 {t("pricing.crPerMonth")}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full text-xs md:text-sm px-2 md:px-4" asChild>
                        <a href="/login">{t("pricing.start")}</a>
                      </Button>
                    </div>
                  </th>
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 w-[80px] md:min-w-[140px] bg-primary/10">
                    <div className="space-y-1">
                      <p className="font-bold text-xs md:text-base">PRO</p>
                      <p className="text-lg md:text-2xl font-bold">${yearlyBilling ? 7 : 9}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{yearlyBilling ? `3000 ${t("pricing.crPerYear")}` : `200 ${t("pricing.crPerMonth")}`}</p>
                      <Button size="sm" className="mt-2 w-full text-xs md:text-sm px-2 md:px-4" asChild>
                        <a href="/login">PRO</a>
                      </Button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((section, sectionIdx) => (
                  <Fragment key={`section-${sectionIdx}`}>
                    <tr className="bg-muted/30">
                      <td colSpan={3} className="py-2 md:py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">
                        {section.category}
                      </td>
                    </tr>
                    {section.items.map((item, itemIdx) => (
                      <tr key={`item-${sectionIdx}-${itemIdx}`} className="border-b border-muted/50 hover:bg-muted/20">
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <span className="text-xs md:text-sm">{item.name}</span>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-center">
                          {renderCellValue(item.free)}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-center bg-primary/10">
                          {renderCellValue(item.pro)}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">{t("pricing.faq")}</h2>
          
          <div className="space-y-3">
            {FAQ_DATA.map((faq, idx) => (
              <div 
                key={idx} 
                className="border rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  data-testid={`faq-${idx}`}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="text-center py-12 bg-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">{t("pricing.readyToStart")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("pricing.getFreeCreds")}
          </p>
          <Button size="lg" asChild>
            <a href="/login" data-testid="button-cta">
              {t("pricing.tryFree")}
            </a>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 NeuraPix. {t("pricing.footer")}</p>
          <p className="mt-2">
            {t("pricing.questions")}{' '}
            <a href="mailto:gyozumyan@gmail.com" className="text-primary hover:underline">
              gyozumyan@gmail.com
            </a>
          </p>
        </div>
      </footer>

      <ScrollToTop />
    </div>
    </>
  );
}
