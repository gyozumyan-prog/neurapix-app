import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { UploadZone } from "@/components/ui/upload-zone";
import { useUpload } from "@/hooks/use-upload";
import { useCreateImage } from "@/hooks/use-images";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { Button } from "@/components/ui/button";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { Card } from "@/components/ui/card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MobileMenu } from "@/components/mobile-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SEO } from "@/components/seo";
import { useI18n } from "@/lib/i18n";
import { useContent } from "@/hooks/use-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  ZoomIn, 
  User, 
  ImageIcon, 
  Palette, 
  Eraser, 
  LogIn, 
  LogOut, 
  Coins,
  Camera,
  ShoppingBag,
  Plane,
  Home as HomeIcon,
  Heart,
  Check,
  ArrowRight,
  Star,
  Users,
  Image as ImageLucide,
  Wand2,
  Scissors,
  Droplets,
  Paintbrush,
  PenTool,
  Droplet,
  Sun,
  RefreshCw,
  XCircle,
  Brush,
  Type,
  Crop,
  RotateCw,
  Square,
  Circle,
  Minus,
  SlidersHorizontal,
  FileArchive,
  Lightbulb,
  FileType,
  EyeOff
} from "lucide-react";

import enhanceVideo from "@assets/video-enhance_1768502342676.mp4";
import removeObjVideo from "@assets/video-removeobj_1768502472579.mp4";
import removeBgVideo from "@assets/video-removebg_1768502568689.mp4";
import restorePhotoImg from "@assets/product_restore_photo_1768503501543.jpg";
import upscaleImg from "@assets/product_enhance_photo_1768504687160.png";
import faceRestoreImg from "@assets/generated_images/face_restoration_before_after_comparison.png";

import backgroundRemoveImg from "@assets/product_remove_bg_1768510973988.png";
import colorizeImg from "@assets/generated_images/colorization_before_after_demo.jpg";
import textToImageImg from "@assets/generated_images/beautiful_new_york_skyline.png";
import blurBackgroundImg from "@assets/product_blur_bg_1768511030644.jpg";
import faceSwapImg from "@assets/generated_images/face_swap_demo.png";
import blurFaceImg from "@assets/generated_images/blur-face-demo.png";
import hdrImg from "@assets/generated_images/hdr_effect_demo.png";
import watermarkRemoveImg from "@assets/product_add_watermark_1768511080969.jpg";
import portraitEnhanceImg from "@assets/generated_images/portrait_retouch_before_after.png";
import oldPhotoRestoreProImg from "@assets/generated_images/pro_photo_restoration_demo.png";
import manualEditorHeroImg from "@assets/generated_images/ai_photo_editing_hero_image.png";
import autoLightImg from "@assets/ChatGPT_Image_Jan_18,_2026,_02_07_03_PM_1768738166143.png";
import convertImg from "@assets/ChatGPT_Image_Jan_18,_2026,_02_08_59_PM_1768738166143.png";
import compressImg from "@assets/ChatGPT_Image_Jan_18,_2026,_02_03_35_PM_1768738166143.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload();
  const createImage = useCreateImage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState('photography');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { data: creditsData } = useCredits();
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const { t } = useI18n();
  const { getContent, hasContent } = useContent("home");
  const [showFileTooLarge, setShowFileTooLarge] = useState(false);
  const [largeFile, setLargeFile] = useState<File | null>(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const TOOLS = useMemo(() => [
    { 
      id: 'object-removal',
      icon: Eraser, 
      title: t("home.tools.objectRemoval"), 
      desc: t("home.tools.objectRemovalDesc"),
      color: "from-red-500/20 to-orange-500/20",
      video: removeObjVideo
    },
    { 
      id: 'background-change',
      icon: Palette, 
      title: t("home.tools.backgroundChange"), 
      desc: t("home.tools.backgroundChangeDesc"),
      color: "from-purple-500/20 to-violet-500/20",
      video: removeBgVideo
    },
    { 
      id: 'enhance',
      icon: Sparkles, 
      title: t("home.tools.enhance"), 
      desc: t("home.tools.enhanceDesc"),
      color: "from-yellow-500/20 to-amber-500/20",
      video: enhanceVideo
    },
    { 
      id: 'face-restore',
      icon: User, 
      title: t("home.tools.faceRestore"), 
      desc: t("home.tools.faceRestoreDesc"),
      color: "from-pink-500/20 to-rose-500/20",
      image: faceRestoreImg
    },
    { 
      id: 'portrait-enhance',
      icon: User, 
      title: t("home.tools.portraitEnhance"), 
      desc: t("home.tools.portraitEnhanceDesc"),
      color: "from-rose-500/20 to-pink-500/20",
      image: portraitEnhanceImg
    },
    { 
      id: 'old-photo-restore',
      icon: ImageIcon, 
      title: t("home.tools.oldPhotoRestore"), 
      desc: t("home.tools.oldPhotoRestoreDesc"),
      color: "from-emerald-500/20 to-green-500/20",
      image: restorePhotoImg
    },
    { 
      id: 'old-photo-restore-pro',
      icon: ImageIcon, 
      title: t("home.tools.oldPhotoRestorePro"), 
      desc: t("home.tools.oldPhotoRestoreProDesc"),
      color: "from-green-500/20 to-teal-500/20",
      image: oldPhotoRestoreProImg
    },
    { 
      id: 'upscale',
      icon: ZoomIn, 
      title: t("home.tools.upscale"), 
      desc: t("home.tools.upscaleDesc"),
      color: "from-blue-500/20 to-cyan-500/20",
      image: upscaleImg
    },
    { 
      id: 'background-remove',
      icon: Scissors, 
      title: t("home.tools.backgroundRemove"), 
      desc: t("home.tools.backgroundRemoveDesc"),
      color: "from-teal-500/20 to-cyan-500/20",
      image: backgroundRemoveImg
    },
    { 
      id: 'colorize',
      icon: Droplets, 
      title: t("home.tools.colorize"), 
      desc: t("home.tools.colorizeDesc"),
      color: "from-amber-500/20 to-orange-500/20",
      image: colorizeImg
    },
    { 
      id: 'text-to-image',
      icon: Wand2, 
      title: t("home.tools.textToImage"), 
      desc: t("home.tools.textToImageDesc"),
      color: "from-violet-500/20 to-purple-500/20",
      image: textToImageImg
    },
    { 
      id: 'blur-background',
      icon: Droplet, 
      title: t("home.tools.blurBackground"), 
      desc: t("home.tools.blurBackgroundDesc"),
      color: "from-sky-500/20 to-blue-500/20",
      image: blurBackgroundImg
    },
    { 
      id: 'face-swap',
      icon: RefreshCw, 
      title: t("home.tools.faceSwap"), 
      desc: t("home.tools.faceSwapDesc"),
      color: "from-rose-500/20 to-red-500/20",
      image: faceSwapImg
    },
    { 
      id: 'blur-face',
      icon: EyeOff, 
      title: t("home.tools.blurFace"), 
      desc: t("home.tools.blurFaceDesc"),
      color: "from-slate-500/20 to-gray-500/20",
      image: blurFaceImg
    },
    { 
      id: 'hdr',
      icon: Sun, 
      title: t("home.tools.hdr"), 
      desc: t("home.tools.hdrDesc"),
      color: "from-yellow-500/20 to-orange-500/20",
      image: hdrImg
    },
    { 
      id: 'watermark-add',
      icon: XCircle, 
      title: t("home.tools.watermarkAdd"), 
      desc: t("home.tools.watermarkAddDesc"),
      color: "from-red-500/20 to-rose-500/20",
      image: watermarkRemoveImg
    },
    { 
      id: 'compress',
      icon: FileArchive, 
      title: t("home.tools.compress"), 
      desc: t("home.tools.compressDesc"),
      color: "from-teal-500/20 to-cyan-500/20",
      image: compressImg,
      free: true
    },
    { 
      id: 'auto-light',
      icon: Lightbulb, 
      title: t("home.tools.autoLight"), 
      desc: t("home.tools.autoLightDesc"),
      color: "from-amber-500/20 to-yellow-500/20",
      image: autoLightImg,
      fitImage: true
    },
    { 
      id: 'convert',
      icon: FileType, 
      title: t("home.tools.convert"), 
      desc: t("home.tools.convertDesc"),
      color: "from-blue-500/20 to-indigo-500/20",
      image: convertImg,
      fitImage: true,
      free: true
    },
    { 
      id: 'manual-editor',
      icon: PenTool, 
      title: t("home.tools.manualEditor"), 
      desc: t("home.tools.manualEditorDesc"),
      color: "from-slate-500/20 to-gray-500/20",
      image: manualEditorHeroImg
    },
  ], [t]);

  const USE_CASES = useMemo(() => [
    {
      id: 'photography',
      icon: Camera,
      title: t("home.useCases.photography"),
      description: t("home.useCases.photographyDesc"),
      features: [
        t("home.useCases.photographyFeature1"),
        t("home.useCases.photographyFeature2"),
        t("home.useCases.photographyFeature3")
      ]
    },
    {
      id: 'ecommerce',
      icon: ShoppingBag,
      title: t("home.useCases.ecommerce"),
      description: t("home.useCases.ecommerceDesc"),
      features: [
        t("home.useCases.ecommerceFeature1"),
        t("home.useCases.ecommerceFeature2"),
        t("home.useCases.ecommerceFeature3")
      ]
    },
    {
      id: 'travel',
      icon: Plane,
      title: t("home.useCases.travel"),
      description: t("home.useCases.travelDesc"),
      features: [
        t("home.useCases.travelFeature1"),
        t("home.useCases.travelFeature2"),
        t("home.useCases.travelFeature3")
      ]
    },
    {
      id: 'realestate',
      icon: HomeIcon,
      title: t("home.useCases.realestate"),
      description: t("home.useCases.realestateDesc"),
      features: [
        t("home.useCases.realestateFeature1"),
        t("home.useCases.realestateFeature2"),
        t("home.useCases.realestateFeature3")
      ]
    },
    {
      id: 'memories',
      icon: Heart,
      title: t("home.useCases.memories"),
      description: t("home.useCases.memoriesDesc"),
      features: [
        t("home.useCases.memoriesFeature1"),
        t("home.useCases.memoriesFeature2"),
        t("home.useCases.memoriesFeature3")
      ]
    },
  ], [t]);

  const STATS = useMemo(() => [
    { value: "500K+", label: t("stats.processedPhotos"), icon: ImageLucide },
    { value: "50K+", label: t("stats.users"), icon: Users },
    { value: "4.9", label: t("stats.rating"), icon: Star },
  ], [t]);

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLargeFile(file);
      setShowFileTooLarge(true);
      return;
    }

    try {
      setIsProcessing(true);
      const uploadRes = await uploadFile(file);
      
      if (!uploadRes) {
        throw new Error(t("toast.error"));
      }

      const imageRecord = await createImage.mutateAsync({
        url: uploadRes.objectPath,
        originalFilename: file.name,
        contentType: file.type,
      });

      toast({
        title: t("toast.success"),
        description: t("toast.imageUploaded"),
      });

      const toolParam = selectedToolId ? `?tool=${selectedToolId}` : '';
      setLocation(`/editor/${imageRecord.id}${toolParam}`);
    } catch (error) {
      toast({
        title: t("toast.error"),
        description: t("toast.uploadFailed"),
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEditorFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLargeFile(file);
      setShowFileTooLarge(true);
      return;
    }

    try {
      setIsProcessing(true);
      const uploadRes = await uploadFile(file);
      
      if (!uploadRes) {
        throw new Error(t("toast.error"));
      }

      const imageRecord = await createImage.mutateAsync({
        url: uploadRes.objectPath,
        originalFilename: file.name,
        contentType: file.type,
      });

      toast({
        title: t("toast.success"),
        description: t("toast.openingManualEditor"),
      });

      setLocation(`/manual-editor/${imageRecord.id}`);
    } catch (error) {
      toast({
        title: t("toast.error"),
        description: t("toast.uploadFailed"),
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentUseCase = USE_CASES.find(uc => uc.id === activeUseCase) || USE_CASES[0];

  return (
    <>
      <SEO page="home" />
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute top-[400px] -left-40 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[1200px] right-0 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">NeuraPix</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#tools" className="hover:text-foreground transition-colors" data-testid="link-nav-tools">{t("nav.tools")}</a>
            <Link href="/examples" className="hover:text-foreground transition-colors" data-testid="link-nav-examples">{t("nav.examples")}</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors" data-testid="link-nav-pricing">{t("nav.pricing")}</Link>
            <Link 
              href="/generate" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 hover:from-violet-600/30 hover:to-purple-600/30 hover:border-violet-500/50 transition-all"
              data-testid="link-nav-ai-generator"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 font-medium">{t("nav.aiGenerator")}</span>
            </Link>
          </nav>
          
          <div className="flex items-center gap-2 md:gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 border-primary/20 hover:bg-primary/20"
                  onClick={() => setShowBuyCredits(true)}
                  data-testid="credits-display-home"
                >
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary text-sm">
                    {creditsData?.credits !== undefined ? creditsData.credits : '...'}
                  </span>
                </Button>
                <Button variant="ghost" size="sm" className="hidden md:flex" asChild data-testid="button-account-home">
                  <Link href="/account">
                    <User className="w-4 h-4 mr-2" />
                    {t("nav.account")}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="hidden md:flex" asChild data-testid="button-logout-home">
                  <a href="/api/logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("nav.logout")}
                  </a>
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" className="hidden md:flex" asChild data-testid="button-login-home">
                <a href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t("nav.login")}
                </a>
              </Button>
            )}
            <LanguageSwitcher />
            <MobileMenu 
              isAuthenticated={isAuthenticated} 
              credits={creditsData?.credits}
              onBuyCredits={() => setShowBuyCredits(true)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Hero Text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight">
                  {hasContent("hero_title") ? getContent("hero_title") : (
                    <>{t("hero.title")} <span className="text-primary">{t("hero.titleHighlight")}</span></>
                  )}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  {getContent("hero_subtitle", t("hero.subtitle"))}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="btn-primary-gradient text-base" asChild data-testid="button-hero-start">
                  <a href="#final-upload">
                    <Wand2 className="w-5 h-5 mr-2" />
                    {getContent("hero_cta", t("hero.startFree"))}
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-hero-examples">
                  <Link href="/examples">
                    {t("hero.viewExamples")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                {STATS.map((stat, i) => (
                  <div key={i} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="text-2xl font-bold text-foreground" data-testid={`stat-value-${i}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hero Image/Upload */}
            <div className="relative" id="upload">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl rounded-full scale-75" />
              <Card className="relative p-2 bg-card/50 backdrop-blur border-white/10">
                <UploadZone 
                  onFileSelect={handleFileSelect} 
                  isUploading={isUploading || isProcessing}
                  uploadProgress={progress}
                  className="h-72 md:h-80"
                />
              </Card>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section id="tools" className="w-full bg-card/30 border-y border-white/5 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                {hasContent("tools_title") ? getContent("tools_title") : (
                  <>{t("tools.sectionTitle")} <span className="text-primary">{t("tools.sectionTitleHighlight")}</span></>
                )}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {getContent("tools_subtitle", t("tools.sectionSubtitle"))}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOOLS.map((tool, i) => (
                <Card 
                  key={i} 
                  className={`group p-6 bg-card/50 transition-all duration-300 cursor-pointer overflow-hidden ${selectedToolId === tool.id ? 'border-primary ring-2 ring-primary/30' : 'border-white/5 hover:border-primary/30'}`}
                  onClick={() => {
                    if (tool.id === 'text-to-image') {
                      setLocation('/generate');
                    } else if (tool.id === 'manual-editor') {
                      setLocation('/manual-editor');
                    } else {
                      setSelectedToolId(tool.id);
                      const uploadSection = document.getElementById('upload');
                      if (uploadSection) {
                        uploadSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  data-testid={`card-tool-${tool.id}`}
                >
                  {'video' in tool && tool.video ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 -mx-2 -mt-2">
                      <video 
                        src={tool.video} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        data-testid={`video-tool-${tool.id}`}
                      />
                    </div>
                  ) : 'image' in tool && tool.image ? (
                    <div className={`relative aspect-video rounded-xl overflow-hidden mb-4 -mx-2 -mt-2 ${'fitImage' in tool && tool.fitImage ? 'bg-black/20' : ''}`}>
                      <img 
                        src={tool.image} 
                        alt={tool.title}
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${'fitImage' in tool && tool.fitImage ? 'object-contain' : 'object-cover'}`}
                        data-testid={`image-tool-${tool.id}`}
                      />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-7 h-7 text-foreground" />
                    </div>
                  )}
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="usecases" className="w-full max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("home.useCases.title")} <span className="text-primary">{t("home.useCases.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.useCases.subtitle")}
            </p>
          </div>
          
          <Tabs value={activeUseCase} onValueChange={setActiveUseCase} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
              {USE_CASES.map((uc) => (
                <TabsTrigger 
                  key={uc.id} 
                  value={uc.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full"
                  data-testid={`tab-usecase-${uc.id}`}
                >
                  <uc.icon className="w-4 h-4 mr-2" />
                  {uc.title}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {USE_CASES.map((uc) => (
              <TabsContent key={uc.id} value={uc.id} className="mt-0">
                <Card className="p-8 md:p-12 bg-card/50 border-white/5">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-3">{uc.title}</h3>
                        <p className="text-muted-foreground text-lg">{uc.description}</p>
                      </div>
                      
                      <ul className="space-y-3">
                        {uc.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button className="btn-primary-gradient" asChild data-testid={`button-usecase-try-${uc.id}`}>
                        <a href="#final-upload">
                          {t("home.useCases.tryNow")}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                    
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
                      <div className="text-center p-8">
                        <uc.icon className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {t("home.useCases.uploadToSee")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* Manual Editor Section */}
        <section id="manual-editor" className="w-full max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1" id="upload-manual">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl rounded-full scale-90" />
              <Card className="relative p-2 bg-card/50 backdrop-blur border-white/10">
                <UploadZone 
                  onFileSelect={handleManualEditorFileSelect} 
                  isUploading={isUploading || isProcessing}
                  uploadProgress={progress}
                  className="h-72 md:h-80"
                />
              </Card>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                  <PenTool className="w-4 h-4" />
                  {t("home.manualEditor.new")}
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  {t("home.manualEditor.title")} <span className="text-cyan-400">{t("home.manualEditor.titleHighlight")}</span>
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {t("home.manualEditor.description")}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Brush className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium">{t("home.manualEditor.brush")}</div>
                    <div className="text-xs text-muted-foreground">{t("home.manualEditor.brushDesc")}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Type className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium">{t("home.manualEditor.text")}</div>
                    <div className="text-xs text-muted-foreground">{t("home.manualEditor.textDesc")}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Crop className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium">{t("home.manualEditor.crop")}</div>
                    <div className="text-xs text-muted-foreground">{t("home.manualEditor.cropDesc")}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium">{t("home.manualEditor.filters")}</div>
                    <div className="text-xs text-muted-foreground">{t("home.manualEditor.filtersDesc")}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25" asChild data-testid="button-manual-editor">
                  <Link href="/manual-editor">
                    <PenTool className="w-5 h-5 mr-2" />
                    {t("home.manualEditor.openEditor")}
                  </Link>
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  {t("home.manualEditor.freeNoSignup")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <section id="pricing" className="w-full bg-card/30 border-y border-white/5 py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("home.pricing.title")} <span className="text-primary">{t("home.pricing.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {t("home.pricing.description")}
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="p-6 bg-card/50 border-white/10" data-testid="pricing-card-enhance">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="pricing-value-enhance">4-6</div>
                <div className="text-sm text-muted-foreground">{t("home.pricing.creditsEnhance")}</div>
              </Card>
              <Card className="p-6 bg-card/50 border-white/10" data-testid="pricing-card-restore">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="pricing-value-restore">6-10</div>
                <div className="text-sm text-muted-foreground">{t("home.pricing.creditsRestore")}</div>
              </Card>
              <Card className="p-6 bg-card/50 border-white/10" data-testid="pricing-card-background">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="pricing-value-background">4-8</div>
                <div className="text-sm text-muted-foreground">{t("home.pricing.creditsBackground")}</div>
              </Card>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <Button size="lg" className="btn-primary-gradient" asChild data-testid="button-pricing-signup">
                  <a href="/login">
                    <LogIn className="w-5 h-5 mr-2" />
                    {t("home.pricing.getFreeCredits")}
                  </a>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild data-testid="button-pricing-details">
                <Link href="/pricing">
                  {t("home.pricing.viewAllPlans")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA with Upload */}
        <section id="final-upload" className="w-full max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t("home.cta.title")} <span className="text-primary">{t("home.cta.titleHighlight")}</span> {t("home.cta.titleEnd")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("home.cta.subtitle")}
            </p>
          </div>
          
          <Card className="p-2 bg-card/50 backdrop-blur border-white/10" data-testid="card-upload-final">
            <UploadZone 
              onFileSelect={handleFileSelect} 
              isUploading={isUploading || isProcessing}
              uploadProgress={progress}
              className="h-64"
            />
          </Card>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 NeuraPix. {t("footer.allRightsReserved")}
            </p>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">
                {t("footer.terms")}
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                {t("footer.privacy")}
              </Link>
              <a href="mailto:support@neurapix.net" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">
                {t("footer.contact")}
              </a>
            </nav>
          </div>
        </div>
      </footer>
      
      <BuyCreditsModal 
        open={showBuyCredits} 
        onOpenChange={setShowBuyCredits} 
      />

      <Dialog open={showFileTooLarge} onOpenChange={setShowFileTooLarge}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-500/20">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <DialogTitle>{t("upload.tooLarge")}</DialogTitle>
                <DialogDescription className="mt-1">
                  {t("upload.maxSize")}: {MAX_FILE_SIZE_MB} MB
                  {largeFile && (
                    <span className="block mt-1">
                      {t("upload.yourFile")}: {(largeFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              {t("upload.compressOption")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowFileTooLarge(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (largeFile) {
                    setShowFileTooLarge(false);
                    setIsProcessing(true);
                    try {
                      const uploadRes = await uploadFile(largeFile);
                      if (uploadRes) {
                        const imageRecord = await createImage.mutateAsync({
                          url: uploadRes.objectPath,
                          originalFilename: largeFile.name,
                          contentType: largeFile.type,
                        });
                        setLocation(`/editor/${imageRecord.id}?tool=compress`);
                      }
                    } catch (error) {
                      toast({
                        title: t("common.error"),
                        description: t("upload.errorUpload"),
                        variant: "destructive",
                      });
                    } finally {
                      setIsProcessing(false);
                      setLargeFile(null);
                    }
                  }
                }}
              >
                <FileArchive className="w-4 h-4 mr-2" />
                {t("upload.compress")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
    </>
  );
}
