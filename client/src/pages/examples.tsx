import { useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ImageCompare } from "@/components/image-compare";
import { ScrollToTop } from "@/components/scroll-to-top";
import { useI18n } from "@/lib/i18n";
import { useContent } from "@/hooks/use-content";
import { SEO } from "@/components/seo";
import { 
  Sparkles, 
  ArrowLeft,
  Check,
  Wand2,
  ZoomIn,
  User,
  Palette,
  ImageIcon,
  Eraser
} from "lucide-react";

import removeObjBeforeImg from "@assets/pexels-photo-5800227_1768744241259.jpeg";
import removeObjAfterImg from "@assets/snapedit_1768744223949_1768744241258.jpeg";
import oldPhotoBeforeImg from "@assets/images_(5)_1768745133468.jpg";
import oldPhotoAfterImg from "@assets/neurapix-old-photo-restore-1768745118739_1768745133467.png";
import colorizeBeforeImg from "@assets/-5_1768745195441.jpg";
import colorizeAfterImg from "@assets/neurapix-colorize-1768743890751_1768745195441.png";
import faceRestoreBeforeImg from "@assets/cover_1768745258211.jpg";
import faceRestoreAfterImg from "@assets/snapedit_1768743517292_1768745258211.jpeg";
import upscaleBeforeImg from "@assets/PicPicAI-ai-portrait-enhancer-detail-enhance-mode_1768745605624.jpg";
import upscaleAfterImg from "@assets/snapedit_1768745587926_1768745605624.jpeg";

export default function Examples() {
  const { t } = useI18n();
  const { getContent, hasContent } = useContent("examples");
  
  const EXAMPLES = useMemo(() => [
    {
      id: "face-restore",
      title: t("examples.faceRestore.title"),
      description: t("examples.faceRestore.description"),
      features: [
        t("examples.faceRestore.feature1"),
        t("examples.faceRestore.feature2"),
        t("examples.faceRestore.feature3")
      ],
      beforeImage: faceRestoreBeforeImg,
      afterImage: faceRestoreAfterImg,
      beforeLabel: t("examples.faceRestore.before"),
      afterLabel: t("examples.faceRestore.after"),
      icon: User
    },
    {
      id: "colorize",
      title: t("examples.colorize.title"),
      description: t("examples.colorize.description"),
      features: [
        t("examples.colorize.feature1"),
        t("examples.colorize.feature2"),
        t("examples.colorize.feature3")
      ],
      beforeImage: colorizeBeforeImg,
      afterImage: colorizeAfterImg,
      beforeLabel: t("examples.colorize.before"),
      afterLabel: t("examples.colorize.after"),
      icon: Palette
    },
    {
      id: "old-photo",
      title: t("examples.oldPhoto.title"),
      description: t("examples.oldPhoto.description"),
      features: [
        t("examples.oldPhoto.feature1"),
        t("examples.oldPhoto.feature2"),
        t("examples.oldPhoto.feature3")
      ],
      beforeImage: oldPhotoBeforeImg,
      afterImage: oldPhotoAfterImg,
      beforeLabel: t("examples.oldPhoto.before"),
      afterLabel: t("examples.oldPhoto.after"),
      icon: ImageIcon
    },
    {
      id: "remove-objects",
      title: t("examples.removeObjects.title"),
      description: t("examples.removeObjects.description"),
      features: [
        t("examples.removeObjects.feature1"),
        t("examples.removeObjects.feature2"),
        t("examples.removeObjects.feature3")
      ],
      beforeImage: removeObjBeforeImg,
      afterImage: removeObjAfterImg,
      beforeLabel: t("examples.removeObjects.before"),
      afterLabel: t("examples.removeObjects.after"),
      icon: Eraser
    },
    {
      id: "upscale",
      title: t("examples.upscale.title"),
      description: t("examples.upscale.description"),
      features: [
        t("examples.upscale.feature1"),
        t("examples.upscale.feature2"),
        t("examples.upscale.feature3")
      ],
      beforeImage: upscaleBeforeImg,
      afterImage: upscaleAfterImg,
      beforeLabel: t("examples.upscale.before"),
      afterLabel: t("examples.upscale.after"),
      icon: ZoomIn
    },
  ], [t]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <SEO page="examples" />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute top-[400px] -left-40 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[1200px] right-0 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight">NeuraPix</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("examples.backHome")}
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
              data-testid="link-examples-ai-generator"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 font-medium">{t("nav.aiGenerator")}</span>
            </Link>
            <Button size="sm" asChild data-testid="button-examples-try">
              <Link href="/#upload">
                <Wand2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("examples.tryIt")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        
        <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4">
              {hasContent("title") ? getContent("title") : (
                <>{t("examples.title")} <span className="text-primary">{t("examples.titleHighlight")}</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("examples.subtitle")}
            </p>
          </div>

          <div className="space-y-20 md:space-y-28">
            {EXAMPLES.map((example, index) => {
              const isReversed = index % 2 === 1;
              const IconComponent = example.icon;
              
              return (
                <div 
                  key={example.id}
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}
                  data-testid={`example-${example.id}`}
                >
                  <div className={`relative ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 blur-3xl rounded-full scale-90 opacity-40" />
                    <ImageCompare
                      beforeImage={example.beforeImage}
                      afterImage={example.afterImage}
                      beforeLabel={example.beforeLabel}
                      afterLabel={example.afterLabel}
                      className="relative aspect-[4/3] w-full"
                    />
                  </div>
                  
                  <div className={`space-y-5 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold">
                        {example.title}
                      </h2>
                    </div>
                    
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {example.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {example.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-2">
                      <Button asChild data-testid={`button-try-${example.id}`}>
                        <Link href="/#upload">
                          {t("examples.tryIt")}
                          <Wand2 className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="w-full bg-primary/5 py-16 mt-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              {t("examples.readyToTry")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t("examples.readyDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-primary-gradient" asChild>
                <Link href="/#upload">
                  <Wand2 className="w-5 h-5 mr-2" />
                  {t("examples.startFree")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">
                  {t("examples.viewPricing")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/5 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 NeuraPix. {t("examples.footer")}</p>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
