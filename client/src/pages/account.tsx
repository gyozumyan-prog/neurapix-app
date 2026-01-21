import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SEO } from "@/components/seo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { 
  Home, 
  User, 
  CreditCard, 
  HelpCircle, 
  Check, 
  X, 
  Sparkles,
  Crown,
  Zap,
  ArrowLeft,
  LogOut,
  Mail,
  Calendar,
  Menu
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  credits: number;
  plan?: string;
}

export default function Account() {
  const [location] = useLocation();
  const searchString = useSearch();
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const { t } = useI18n();
  
  const SIDEBAR_ITEMS = useMemo(() => [
    { href: "/", icon: Home, label: t("account.home"), tab: null },
    { href: "/account", icon: User, label: t("account.profile"), tab: "account" },
    { href: "/account?tab=plan", icon: CreditCard, label: t("account.subscription"), tab: "plan" },
    { href: "/account?tab=support", icon: HelpCircle, label: t("account.support"), tab: "support" },
  ], [t]);

  const PLANS = useMemo(() => [
    {
      id: "free",
      name: t("pricing.free"),
      description: `10 ${t("account.creditsPerMonth")}`,
      monthly: {
        price: 0,
        credits: 10,
      },
      yearly: {
        price: 0,
        credits: 10,
      },
      featuresHeader: t("account.availableFeatures"),
      features: [
        { text: t("account.freeTools"), included: true },
        { text: t("account.basicAI"), included: true },
        { text: t("account.upscale4x"), included: true },
        { text: t("account.export1600"), included: true },
        { text: t("account.upscale8x"), included: false },
        { text: t("account.noAds"), included: false },
      ],
      buttonText: t("account.startFree"),
      buttonVariant: "outline" as const,
      icon: Zap,
      popular: false,
    },
    {
      id: "pro",
      name: "PRO",
      description: t("account.forProfessionals"),
      monthly: {
        price: 9,
        credits: 200,
      },
      yearly: {
        price: 89,
        credits: 3000,
      },
      featuresHeader: t("account.allFeatures"),
      features: [
        { text: t("account.all21Tools"), included: true },
        { text: t("account.upscaleTo8x"), included: true },
        { text: t("account.export8K"), included: true },
        { text: t("account.priorityProcessing"), included: true },
        { text: t("account.batchProcessing"), included: true },
        { text: t("account.noAds"), included: true },
        { text: t("account.support247"), included: true },
      ],
      buttonText: t("account.upgradePro"),
      buttonVariant: "default" as const,
      icon: Crown,
      popular: true,
    },
  ], [t]);
  
  // Parse tab from URL
  const params = new URLSearchParams(searchString);
  const currentTab = params.get("tab") || "account";

  const { data: user, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const { data: creditsData } = useQuery<{ credits: number; plan?: string }>({
    queryKey: ["/api/credits"],
    enabled: !!user,
  });

  const credits = creditsData?.credits ?? user?.credits ?? 0;
  const userPlan = creditsData?.plan ?? user?.plan ?? 'free';

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t("account.authRequired")}</CardTitle>
            <CardDescription>
              {t("account.authDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild>
              <a href="/login" data-testid="button-login">{t("account.login")}</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" data-testid="link-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("account.toHome")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <nav className="flex-1 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = item.tab === null 
            ? location === "/" 
            : item.tab === currentTab;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover-elevate"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.firstName || 'User'}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.email}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm text-muted-foreground">{t("account.credits")}:</span>
          <Badge variant="secondary" className="font-bold">
            {credits}
          </Badge>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("account.logout")}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <SEO page="account" />
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <Sparkles className="w-5 h-5" />
            NeuraPix
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-bold">
              {credits} {t("account.cr")}
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-4 flex flex-col">
                <div className="mb-4">
                  <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Sparkles className="w-6 h-6" />
                    NeuraPix
                  </Link>
                </div>
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card/50 p-4 flex-col">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Sparkles className="w-6 h-6" />
            NeuraPix
          </Link>
        </div>
        <SidebarContent />
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Account Tab */}
          {currentTab === "account" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">{t("account.myAccount")}</h1>
              
              <Card className="max-w-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.firstName || 'User'}
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/20">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || t("account.user")}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t("account.currentPlan")}</p>
                          <Badge 
                            variant={userPlan === 'pro' ? 'default' : 'outline'}
                            className={userPlan === 'pro' ? 'bg-amber-500' : ''}
                          >
                            {userPlan === 'pro' ? 'PRO' : t("pricing.free")}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t("account.balance")}</p>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="font-bold text-lg">{credits}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button asChild variant="outline">
                          <Link href="/account?tab=plan">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {t("account.changePlan")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Plan Tab */}
          {currentTab === "plan" && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {t("account.planTitle")}
                </h1>
                <div className="flex items-center justify-center gap-3 mt-8">
                  <span className={`text-sm font-medium ${!yearlyBilling ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t("account.monthly")}
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
                    {t("account.yearlyBilling")}
                  </span>
                  {yearlyBilling && (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 ml-2">
                      {t("account.save18")}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                {PLANS.map((plan) => {
                  const isCurrentPlan = plan.id === userPlan;
                  const displayPrice = yearlyBilling 
                    ? Math.round(plan.yearly.price / 12) 
                    : plan.monthly.price;
                  
                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col overflow-visible ${
                        plan.popular ? "border-primary border-2 shadow-xl scale-105" : "border"
                      } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
                      data-testid={`card-plan-${plan.id}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white px-4 py-1">
                            {t("account.bestValue")}
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-2 pt-8">
                        <div className="flex items-center gap-2 mb-1">
                          <plan.icon className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          {isCurrentPlan && (
                            <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-600 border-green-500/30">
                              {t("account.yourPlan")}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">{plan.description}</CardDescription>
                        
                        <div className="mt-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold">
                              ${displayPrice}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">
                            {t("account.perMonth")}
                          </p>
                          {yearlyBilling && plan.monthly.price > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("account.billedYearly")} (${plan.yearly.price}/{t("account.perYear")})
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col pt-4">
                        <Button
                          variant={isCurrentPlan ? "outline" : plan.buttonVariant}
                          className={`w-full mb-6 h-11 ${plan.popular && !isCurrentPlan ? "bg-primary hover:bg-primary/90" : ""}`}
                          disabled={isCurrentPlan}
                          data-testid={`button-plan-${plan.id}`}
                        >
                          {isCurrentPlan ? t("account.current") : plan.buttonText}
                        </Button>

                        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                          <Zap className="w-5 h-5 text-amber-500" />
                          <span className="font-bold text-lg">
                            {(yearlyBilling ? plan.yearly.credits : plan.monthly.credits).toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {t("account.creditsWord")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {yearlyBilling ? t("account.everyYear") : t("account.everyMonth")}
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

              <div className="mt-12 grid md:grid-cols-2 gap-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{t("account.cancelAnytime")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t("account.unusedCredits")}
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
                        <h3 className="font-semibold mb-1">{t("account.tryFree")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t("account.freeCreditsUpgrade")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {currentTab === "support" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">{t("account.supportTab")}</h1>
              
              <Card className="max-w-2xl">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="text-xl font-semibold">
                        {t("account.thankYou")}
                      </h2>
                      <p className="text-muted-foreground">
                        {t("account.needHelp")}{' '}
                        <a 
                          href="mailto:gyozumyan@gmail.com" 
                          className="text-primary hover:underline font-medium"
                        >
                          gyozumyan@gmail.com
                        </a>
                      </p>
                    </div>
                    
                    <Button asChild variant="outline" className="mt-4">
                      <a href="mailto:gyozumyan@gmail.com">
                        <Mail className="w-4 h-4 mr-2" />
                        {t("account.sendEmail")}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>

      <ScrollToTop />
    </div>
    </>
  );
}
