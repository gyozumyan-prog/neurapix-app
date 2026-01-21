import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { SiGoogle } from "react-icons/si";
import { Mail, Lock, User, Sparkles, KeyRound } from "lucide-react";

export default function LoginPage() {
  const { t, language } = useI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({ title: t("auth.loginSuccess") });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({ 
        title: t("auth.loginError"), 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (data: { email: string; language: string }) => {
      const res = await apiRequest("POST", "/api/auth/send-code", data);
      return res.json();
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({ title: t("auth.codeSent") });
    },
    onError: (error: any) => {
      toast({ 
        title: t("auth.sendCodeError"), 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string; code: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({ title: t("auth.registerSuccess") });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({ 
        title: t("auth.registerError"), 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail) {
      toast({ title: t("auth.emailRequired"), variant: "destructive" });
      return;
    }
    sendCodeMutation.mutate({ email: registerEmail, language });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ 
      email: registerEmail, 
      password: registerPassword,
      firstName: registerFirstName || undefined,
      lastName: registerLastName || undefined,
      code: verificationCode,
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">NeuraPix</CardTitle>
          <CardDescription>{t("auth.welcomeMessage")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={handleGoogleLogin}
            data-testid="button-google-login"
          >
            <SiGoogle className="w-4 h-4" />
            {t("auth.continueWithGoogle")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">{t("auth.register")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? t("auth.loggingIn") : t("auth.loginBtn")}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-4">
              {!codeSent ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-firstname">{t("auth.firstName")}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-firstname"
                          type="text"
                          placeholder={t("auth.firstName")}
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          className="pl-10"
                          data-testid="input-register-firstname"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-lastname">{t("auth.lastName")}</Label>
                      <Input
                        id="register-lastname"
                        type="text"
                        placeholder={t("auth.lastName")}
                        value={registerLastName}
                        onChange={(e) => setRegisterLastName(e.target.value)}
                        data-testid="input-register-lastname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="email@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10"
                        required
                        data-testid="input-register-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder={t("auth.minChars")}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                        data-testid="input-register-password"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={sendCodeMutation.isPending}
                    data-testid="button-send-code"
                  >
                    {sendCodeMutation.isPending ? t("auth.sendingCode") : t("auth.sendCode")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {t("auth.codeSentTo")} <strong>{registerEmail}</strong>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">{t("auth.verificationCode")}</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="pl-10 text-center text-xl tracking-widest"
                        maxLength={6}
                        required
                        data-testid="input-verification-code"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending || verificationCode.length !== 6}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? t("auth.registering") : t("auth.registerBtn")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setCodeSent(false)}
                    data-testid="button-back-to-email"
                  >
                    {t("auth.changeEmail")}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground">
            {t("auth.termsNoticeStart")}{" "}
            <a href="/terms" className="text-primary hover:underline" data-testid="link-login-terms">
              {t("auth.termsLink")}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
