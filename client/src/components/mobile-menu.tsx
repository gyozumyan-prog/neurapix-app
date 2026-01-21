import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Sparkles, LogIn, LogOut, User, Coins } from "lucide-react";

interface MobileMenuProps {
  isAuthenticated: boolean;
  credits?: number;
  onBuyCredits?: () => void;
}

export function MobileMenu({ isAuthenticated, credits, onBuyCredits }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-display font-bold text-lg">NeuraPix</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link 
              href="/" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Главная
            </Link>
            <a 
              href="#tools" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Инструменты
            </a>
            <Link 
              href="/examples" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Примеры
            </Link>
            <Link 
              href="/pricing" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              Цены
            </Link>
            <Link 
              href="/generate" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 hover:from-violet-600/30 hover:to-purple-600/30 transition-all"
              data-testid="link-mobile-ai-generator"
            >
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span className="text-violet-300 font-medium">AI Генератор</span>
            </Link>
          </nav>

          <div className="p-4 border-t space-y-3">
            {isAuthenticated ? (
              <>
                {credits !== undefined && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 rounded-lg bg-primary/10 border-primary/20"
                    onClick={() => {
                      setOpen(false);
                      onBuyCredits?.();
                    }}
                  >
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">{credits} кредитов</span>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/account" onClick={() => setOpen(false)}>
                    <User className="w-4 h-4" />
                    Аккаунт
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                  <a href="/api/logout">
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </a>
                </Button>
              </>
            ) : (
              <Button className="w-full gap-2" asChild>
                <a href="/login">
                  <LogIn className="w-4 h-4" />
                  Войти
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
