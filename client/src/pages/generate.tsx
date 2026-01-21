import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useI18n } from "@/lib/i18n";
import { 
  Wand2, 
  Sparkles, 
  Download, 
  ArrowLeft, 
  Loader2,
  LogIn,
  Coins,
  Image as ImageIcon,
  Zap,
  Clock,
  Upload,
  X
} from "lucide-react";

// Fixed cost for image generation
const GENERATION_COST = 5;

interface StylePreset {
  id: string;
  labelKey: string;
  prompt: string;
}

const STYLE_PRESETS_DATA: StylePreset[] = [
  { id: 'photorealistic', labelKey: 'generate.style.photorealistic', prompt: 'photorealistic, high quality, detailed' },
  { id: 'anime', labelKey: 'generate.style.anime', prompt: 'anime style, vibrant colors, detailed' },
  { id: 'oil-painting', labelKey: 'generate.style.oilPainting', prompt: 'oil painting, artistic, brush strokes' },
  { id: 'watercolor', labelKey: 'generate.style.watercolor', prompt: 'watercolor painting, soft colors, artistic' },
  { id: '3d-render', labelKey: 'generate.style.3dRender', prompt: '3d render, octane render, high quality' },
  { id: 'pixel-art', labelKey: 'generate.style.pixelArt', prompt: 'pixel art, 8-bit style, retro' },
];

export default function Generate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { data: creditsData, refetch: refetchCredits } = useCredits();
  const { t } = useI18n();
  
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("generate.toast.invalidFile"),
        description: t("generate.toast.invalidFileDesc"),
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
      setReferenceFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceFileName(null);
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast({
        title: t("generate.toast.authRequired"),
        description: t("generate.toast.authRequiredDesc"),
        variant: "destructive"
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: t("generate.toast.enterPrompt"),
        description: t("generate.toast.enterPromptDesc"),
        variant: "destructive"
      });
      return;
    }

    if ((creditsData?.credits || 0) < GENERATION_COST) {
      toast({
        title: t("generate.toast.notEnoughCredits"),
        description: t("generate.toast.notEnoughCreditsDesc").replace("{cost}", String(GENERATION_COST)),
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const stylePrompt = selectedStyle 
        ? STYLE_PRESETS_DATA.find(s => s.id === selectedStyle)?.prompt || ''
        : '';
      
      const fullPrompt = stylePrompt 
        ? `${prompt}, ${stylePrompt}`
        : prompt;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          referenceImage: referenceImage 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t("generate.toast.error"));
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      refetchCredits();
      
      toast({
        title: t("generate.toast.success"),
        description: t("generate.toast.successDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("generate.toast.error"),
        description: error.message || t("generate.toast.errorDesc"),
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const filename = `neurapix-generated-${Date.now()}.png`;
      
      // Use server-side download endpoint for reliable download on all devices
      const downloadUrl = `/api/download?url=${encodeURIComponent(generatedImage)}&filename=${encodeURIComponent(filename)}`;
      
      // Create link and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: t("generate.toast.downloadError"),
        description: t("generate.toast.downloadErrorDesc"),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative z-10">
        <header className="border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation('/')}
                className="text-white/70 hover:text-white hover:bg-white/10"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base md:text-xl font-bold text-white">{t("generate.title")}</h1>
                  <p className="hidden md:block text-xs text-white/50">{t("generate.subtitle")}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/10 border border-white/20">
                  <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
                  <span className="text-xs md:text-sm font-medium text-white">{creditsData?.credits || 0}</span>
                </div>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs md:text-sm px-2 md:px-4"
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t("generate.login")}</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4 md:mb-8">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3">
                {t("generate.heroTitle")} <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{t("generate.heroTitleHighlight")}</span> {t("generate.heroTitleEnd")}
              </h2>
              <p className="text-white/60 text-sm md:text-lg">
                {t("generate.heroSubtitle")}
              </p>
            </div>

            <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-4 md:gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      {t("generate.promptLabel")}
                    </label>
                    <textarea
                      className="w-full h-24 md:h-32 px-3 md:px-4 py-2 md:py-3 rounded-xl bg-white/5 border border-white/10 text-sm md:text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none"
                      placeholder={t("generate.promptPlaceholder")}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      data-testid="textarea-prompt"
                    />
                    
                    {/* Reference Image Upload */}
                    <div className="mt-3">
                      {referenceImage ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                          <img 
                            src={referenceImage} 
                            alt="Reference" 
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{referenceFileName}</p>
                            <p className="text-xs text-white/50">{t("generate.referenceUploaded")}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={removeReferenceImage}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            data-testid="button-remove-reference"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-violet-500/50 hover:bg-white/10 cursor-pointer transition-all">
                          <Upload className="w-4 h-4 text-violet-400" />
                          <span className="text-sm text-white/60">{t("generate.uploadReference")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            data-testid="input-reference-image"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2 md:mb-3">
                      {t("generate.styleLabel")}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2">
                      {STYLE_PRESETS_DATA.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                          className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            selectedStyle === style.id
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                          }`}
                          data-testid={`button-style-${style.id}`}
                        >
                          {t(style.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-lg"
                      data-testid="button-generate"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t("generate.generating")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          {t("generate.createBtn")} ({GENERATION_COST} {t("generate.credits")})
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Zap className="w-3 h-3" />
                    <span>{t("generate.generationTime")}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-4 md:p-6 flex flex-col">
                <label className="block text-sm font-medium text-white/80 mb-2 md:mb-3">
                  {t("generate.resultLabel")}
                </label>
                
                <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center min-h-[200px] md:min-h-[300px]">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                      </div>
                      <p className="text-white/60">{t("generate.creatingImage")}</p>
                      <p className="text-white/40 text-sm mt-1">{t("generate.mayTake30sec")}</p>
                    </div>
                  ) : generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt={t("generate.generatedAlt")} 
                      className="w-full h-full object-contain"
                      data-testid="img-generated"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/30" />
                      </div>
                      <p className="text-white/40">{t("generate.imagePlaceholder")}</p>
                    </div>
                  )}
                </div>

                {generatedImage && (
                  <Button
                    onClick={handleDownload}
                    className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    data-testid="button-download"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("generate.downloadBtn")}
                  </Button>
                )}
              </Card>
            </div>

            <div className="mt-8 text-center">
              <p className="text-white/40 text-sm">
                {t("generate.tip")}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
