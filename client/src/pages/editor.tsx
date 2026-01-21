import { useRef, useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useImage, useCreateEdit, useProcessEdit, useEdit, useCreateImage } from "@/hooks/use-images";
import { useUpload } from "@/hooks/use-upload";
import { CanvasEditor, type CanvasEditorRef } from "@/components/canvas-editor";
import { ComparisonSlider } from "@/components/comparison-slider";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCredits, useToolCosts, useActiveTools } from "@/hooks/use-credits";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/seo";
import type { ToolType } from "@shared/schema";
import { TOOL_CREDITS, CUSTOM_BACKGROUND_CREDITS } from "@shared/schema";
import { 
    Download, 
    Eraser, 
    Undo2, 
    Loader2, 
    ChevronLeft, 
    Brush,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Minus,
    Sparkles,
    User,
    Camera,
    ImageIcon,
    Palette,
    Upload,
    Coins,
    LogIn,
    LogOut,
    Scissors,
    Droplets,
    Paintbrush,
    Wand2,
    Heart,
    PenTool,
    Expand,
    Droplet,
    Sun,
    RefreshCw,
    XCircle,
    Lock,
    FileType,
    FileArchive,
    Lightbulb,
    Edit3,
    Menu,
    X,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    EyeOff,
    Eye,
    Check,
    Search,
    Plus
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

type ToolConfig = { id: ToolType; label: string; icon: any; description: string; tooltip: string; needsMask?: boolean; needsPrompt?: boolean; needsSecondImage?: boolean; needsBackgroundColor?: boolean };

export default function Editor() {
  const [, params] = useRoute("/editor/:id");
  const [, setLocation] = useLocation();
  const imageId = params ? parseInt(params.id) : 0;
  
  const { data: image, isLoading: isImageLoading } = useImage(imageId);
  const { toast } = useToast();
  
  // Auth
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { t } = useI18n();
  
  // Tool categories with translations
  const TOOL_CATEGORIES = useMemo(() => [
    {
      id: 'enhancement',
      name: t('category.enhancement'),
      icon: Sparkles,
      tools: [
        { id: 'enhance' as ToolType, label: t('tools.enhance'), icon: Sparkles, description: t('tools.enhanceDesc'), tooltip: t('tooltip.enhance') },
        { id: 'upscale' as ToolType, label: t('tools.upscale'), icon: ZoomIn, description: t('tools.upscaleDesc'), tooltip: t('tooltip.upscale') },
        { id: 'hdr' as ToolType, label: t('tools.hdr'), icon: Sun, description: t('tools.hdrDesc'), tooltip: t('tooltip.hdr') },
      ]
    },
    {
      id: 'faces',
      name: t('category.faces'),
      icon: User,
      tools: [
        { id: 'face-restore' as ToolType, label: t('tools.faceRestore'), icon: User, description: t('tools.faceRestoreDesc'), tooltip: t('tooltip.faceRestore') },
        { id: 'portrait-enhance' as ToolType, label: t('tools.portrait'), icon: Camera, description: t('tools.portraitDesc'), tooltip: t('tooltip.portrait') },
        { id: 'makeup' as ToolType, label: t('tools.makeup'), icon: Heart, description: t('tools.makeupDesc'), tooltip: t('tooltip.makeup') },
        { id: 'face-swap' as ToolType, label: t('tools.faceSwap'), icon: RefreshCw, description: t('tools.faceSwapDesc'), tooltip: t('tooltip.faceSwap'), needsSecondImage: true },
        { id: 'blur-face' as ToolType, label: t('tools.blurFace'), icon: EyeOff, description: t('tools.blurFaceDesc'), tooltip: t('tooltip.blurFace') },
      ]
    },
    {
      id: 'background',
      name: t('category.background'),
      icon: Palette,
      tools: [
        { id: 'background-remove' as ToolType, label: t('tools.bgRemove'), icon: Scissors, description: t('tools.bgRemoveDesc'), tooltip: t('tooltip.bgRemove'), needsBackgroundColor: true },
        { id: 'background-change' as ToolType, label: t('tools.bgChange'), icon: Palette, description: t('tools.bgChangeDesc'), tooltip: t('tooltip.bgChange'), needsPrompt: true },
        { id: 'blur-background' as ToolType, label: t('tools.bgBlur'), icon: Droplet, description: t('tools.bgBlurDesc'), tooltip: t('tooltip.bgBlur') },
      ]
    },
    {
      id: 'restoration',
      name: t('category.restoration'),
      icon: ImageIcon,
      tools: [
        { id: 'old-photo-restore' as ToolType, label: t('tools.oldPhoto'), icon: ImageIcon, description: t('tools.oldPhotoDesc'), tooltip: t('tooltip.oldPhoto') },
        { id: 'old-photo-restore-pro' as ToolType, label: t('tools.oldPhotoPro'), icon: ImageIcon, description: t('tools.oldPhotoProDesc'), tooltip: t('tooltip.oldPhotoPro') },
        { id: 'colorize' as ToolType, label: t('tools.colorize'), icon: Droplets, description: t('tools.colorizeDesc'), tooltip: t('tooltip.colorize') },
      ]
    },
    {
      id: 'editing',
      name: t('category.editing'),
      icon: PenTool,
      tools: [
        { id: 'object-removal' as ToolType, label: t('tools.objectRemoval'), icon: Eraser, description: t('tools.objectRemovalDesc'), tooltip: t('tooltip.objectRemoval'), needsMask: true },
      ]
    },
    {
      id: 'utilities',
      name: t('category.utilities'),
      icon: FileType,
      tools: [
        { id: 'watermark-add' as ToolType, label: t('tools.watermark'), icon: XCircle, description: t('tools.watermarkDesc'), tooltip: t('tooltip.watermark'), needsPrompt: true },
        { id: 'convert' as ToolType, label: t('tools.convert'), icon: FileType, description: t('tools.convertDesc'), tooltip: t('tooltip.convert'), needsPrompt: true },
        { id: 'compress' as ToolType, label: t('tools.compress'), icon: FileArchive, description: t('tools.compressDesc'), tooltip: t('tooltip.compress'), needsPrompt: true },
        { id: 'auto-light' as ToolType, label: t('tools.autoLight'), icon: Lightbulb, description: t('tools.autoLightDesc'), tooltip: t('tooltip.autoLight') },
      ]
    },
  ], [t]);
  
  const TOOLS = useMemo(() => TOOL_CATEGORIES.flatMap(cat => cat.tools), [TOOL_CATEGORIES]);
  
  // Load active tools and costs from database
  const { data: activeToolsFromDb, isLoading: isLoadingTools } = useActiveTools();
  const { data: toolCostsData } = useToolCosts();
  
  // Set of active tool IDs from database - empty while loading to prevent showing all tools
  const activeToolIds = useMemo(() => {
    if (!activeToolsFromDb) return new Set<string>(); // Empty while loading
    return new Set(activeToolsFromDb.map(t => t.id));
  }, [activeToolsFromDb]);
  
  // Tool costs from database (fallback to hardcoded)
  const getToolCost = (toolId: string): number => {
    if (toolCostsData?.tools && toolCostsData.tools[toolId] !== undefined) {
      return toolCostsData.tools[toolId];
    }
    return TOOL_CREDITS[toolId as ToolType] || 0;
  };
  
  // Filter categories to only show active tools
  const ACTIVE_TOOL_CATEGORIES = useMemo(() => {
    return TOOL_CATEGORIES.map(cat => ({
      ...cat,
      tools: cat.tools.filter(tool => activeToolIds.has(tool.id))
    })).filter(cat => cat.tools.length > 0);
  }, [TOOL_CATEGORIES, activeToolIds]);
  
  // Credits
  const { data: creditsData, refetch: refetchCredits } = useCredits();
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showFileTooLarge, setShowFileTooLarge] = useState(false);
  const [fileTooLargeType, setFileTooLargeType] = useState<'background' | 'face'>('background');
  
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  
  // Read tool from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const toolFromUrl = urlParams.get('tool') as ToolType | null;
  
  // Tool State
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(toolFromUrl || null);
  const [brushSize, setBrushSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const [customBackgroundFile, setCustomBackgroundFile] = useState<File | null>(null);
  const [useCustomBackground, setUseCustomBackground] = useState(false);
  const [upscaleScale, setUpscaleScale] = useState<2 | 4 | 8>(2); // 2 = 2x, 4 = 4x, 8 = 8x (two passes of 4x)
  const [secondImageFile, setSecondImageFile] = useState<File | null>(null);
  const [secondImageUrl, setSecondImageUrl] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>('enhancement');
  // Watermark settings
  const [watermarkText, setWatermarkText] = useState('NeuraPix');
  const [watermarkPositions, setWatermarkPositions] = useState<string[]>(['center']);
  const [watermarkOpacity, setWatermarkOpacity] = useState(40);
  const [watermarkSize, setWatermarkSize] = useState(100); // 100 = default size
  
  // Compress settings
  const [compressQuality, setCompressQuality] = useState(80);
  // Blur face intensity (1-100%)
  const [blurIntensity, setBlurIntensity] = useState(50);
  // Background color for background-remove (null = transparent)
  const [bgRemoveColor, setBgRemoveColor] = useState<string | null>(null);
  // Download progress (0-100, null = not downloading)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  // Preset colors for background removal
  const BG_COLOR_PRESETS = ['transparent', '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  // Background selection tab: 'magic' | 'photo' | 'color'
  const [bgTab, setBgTab] = useState<'magic' | 'photo' | 'color'>('photo');
  // Pexels search
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<Array<{id: number, src: string, thumb: string}>>([]);
  const [isSearchingPexels, setIsSearchingPexels] = useState(false);
  // Selected background image from gallery
  const [selectedBgImage, setSelectedBgImage] = useState<string | null>(null);
  // Popular background categories
  const POPULAR_BG_CATEGORIES = [
    { id: 'beach', label: 'Пляж', query: 'tropical beach sunset' },
    { id: 'city', label: 'Город', query: 'city skyline' },
    { id: 'nature', label: 'Природа', query: 'forest landscape' },
    { id: 'abstract', label: 'Абстракт', query: 'abstract colorful gradient' },
    { id: 'office', label: 'Офис', query: 'modern office interior' },
    { id: 'studio', label: 'Студия', query: 'photo studio backdrop' },
  ];
  // Face detection for blur-face
  const [detectedFaces, setDetectedFaces] = useState<Array<{id: number, x: number, y: number, width: number, height: number}>>([]);
  const [selectedFaces, setSelectedFaces] = useState<number[]>([]);
  const [isDetectingFaces, setIsDetectingFaces] = useState(false);
  const [faceImageDimensions, setFaceImageDimensions] = useState<{width: number, height: number} | null>(null);
  // Mobile tools panel
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  
  const canvasRef = useRef<CanvasEditorRef>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const secondImageInputRef = useRef<HTMLInputElement>(null);
  
  // Processing State
  const { uploadFile } = useUpload();
  const createEdit = useCreateEdit();
  const processEdit = useProcessEdit();
  const createImage = useCreateImage();
  
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  const { data: currentEdit } = useEdit(currentEditId || 0, !!currentEditId);

  const isProcessing = currentEdit?.status === "pending" || currentEdit?.status === "processing";

  const currentToolConfig = TOOLS.find(t => t.id === selectedTool);

  // Search Pexels for background photos
  const searchPexels = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingPexels(true);
    try {
      const response = await fetch(`/api/pexels/search?query=${encodeURIComponent(query)}&per_page=15`);
      if (response.ok) {
        const data = await response.json();
        setPexelsResults(data.photos || []);
      }
    } catch (error) {
      console.error('Pexels search error:', error);
    } finally {
      setIsSearchingPexels(false);
    }
  };

  // Load default photos on mount
  useEffect(() => {
    if (selectedTool === 'background-remove' && pexelsResults.length === 0) {
      searchPexels('nature landscape');
    }
  }, [selectedTool]);

  // Reset custom background state when tool changes
  useEffect(() => {
    if (selectedTool !== 'background-change') {
      setUseCustomBackground(false);
      setCustomBackgroundFile(null);
      setCustomBackgroundUrl(null);
    }
  }, [selectedTool]);

  // Auto-expand category when tool is selected from URL
  useEffect(() => {
    if (toolFromUrl) {
      const category = TOOL_CATEGORIES.find(cat => 
        cat.tools.some(t => t.id === toolFromUrl)
      );
      if (category) {
        setExpandedCategory(category.id);
      }
    }
  }, [toolFromUrl, TOOL_CATEGORIES]);

  // Face detection for blur-face
  const handleDetectFaces = async () => {
    if (!image) return;
    
    setIsDetectingFaces(true);
    setDetectedFaces([]);
    setSelectedFaces([]);
    
    try {
      const response = await fetch('/api/detect-faces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl: image.url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to detect faces');
      }
      
      const data = await response.json();
      setDetectedFaces(data.faces || []);
      setFaceImageDimensions({ width: data.imageWidth, height: data.imageHeight });
      
      // Select all faces by default
      setSelectedFaces((data.faces || []).map((f: any) => f.id));
      
      if (data.faces.length === 0) {
        toast({ 
          title: t("toast.noFacesDetected"), 
          description: t("toast.noFacesDetectedDesc"),
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: t("toast.facesDetected"), 
          description: `${data.faces.length} ${t("toast.facesFound")}`
        });
      }
    } catch (error) {
      console.error('Face detection error:', error);
      toast({ 
        title: t("toast.error"), 
        description: t("toast.faceDetectionFailed"),
        variant: "destructive" 
      });
    } finally {
      setIsDetectingFaces(false);
    }
  };

  const handleProcess = async () => {
    if (!image || !selectedTool) return;

    // Validate prompt for background-change (unless using custom background)
    if (selectedTool === 'background-change' && !useCustomBackground && !backgroundPrompt.trim()) {
      toast({ 
        title: t("toast.enterDescription"), 
        description: t("toast.enterDescriptionBg"),
        variant: "destructive" 
      });
      return;
    }
    
    // Validate custom background file for background-change
    if (selectedTool === 'background-change' && useCustomBackground && !customBackgroundFile) {
      toast({ 
        title: t("toast.uploadBg"), 
        description: t("toast.uploadBgDesc"),
        variant: "destructive" 
      });
      return;
    }
    
    // Validate blur-face requires detected and selected faces
    if (selectedTool === 'blur-face' && selectedFaces.length === 0) {
      toast({ 
        title: t("toast.selectFaces"), 
        description: t("toast.selectFacesDesc"),
        variant: "destructive" 
      });
      return;
    }
    
    // Validate second image for face-swap
    if (currentToolConfig?.needsSecondImage && !secondImageFile) {
      toast({ 
        title: t("toast.uploadImage"), 
        description: t("toast.uploadFaceDesc"),
        variant: "destructive" 
      });
      return;
    }

    try {
      let maskUrl: string | undefined;

      // For tools that need a mask
      if ((currentToolConfig as any)?.needsMask && canvasRef.current) {
        const maskBlob = await canvasRef.current.getMaskBlob();
        if (!maskBlob) {
          toast({ 
            title: t("toast.selectArea"), 
            description: t("toast.selectAreaDesc"),
            variant: "destructive" 
          });
          return;
        }

        const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
        toast({ title: t("toast.uploadingMask"), description: t("toast.pleaseWait") });
        const uploadRes = await uploadFile(maskFile);
        if (!uploadRes) throw new Error(t("toast.maskUploadError"));
        maskUrl = uploadRes.objectPath;
      }

      // Upload custom background if provided (only for background-change)
      let customBgUrl: string | undefined;
      if (selectedTool === 'background-change' && useCustomBackground && customBackgroundFile) {
        toast({ title: t("toast.uploadingBg"), description: t("toast.pleaseWait") });
        const bgUploadRes = await uploadFile(customBackgroundFile);
        if (!bgUploadRes) throw new Error(t("toast.bgUploadError"));
        customBgUrl = bgUploadRes.objectPath;
      }
      
      // Upload second image for face-swap
      let targetImageUrl: string | undefined;
      if (currentToolConfig?.needsSecondImage && secondImageFile) {
        toast({ title: t("toast.uploadingImage"), description: t("toast.pleaseWait") });
        const secondUploadRes = await uploadFile(secondImageFile);
        if (!secondUploadRes) throw new Error(t("toast.imageUploadError"));
        targetImageUrl = secondUploadRes.objectPath;
      }

      // Create Edit Record
      // For custom background, we pass it as a special prefix in the prompt
      let editPrompt = `Apply ${selectedTool}`;
      if ((currentToolConfig as any)?.needsPrompt) {
        if (useCustomBackground && customBgUrl) {
          editPrompt = `CUSTOM_BG:${customBgUrl}`;
        } else {
          editPrompt = backgroundPrompt;
        }
      }
      // For upscale, pass scale in prompt
      if (selectedTool === 'upscale') {
        editPrompt = `UPSCALE:${upscaleScale}`;
      }
      // For face-swap, pass target image URL
      if (selectedTool === 'face-swap' && targetImageUrl) {
        editPrompt = `TARGET:${targetImageUrl}`;
      }
      // For watermark-add, pass settings as JSON
      if (selectedTool === 'watermark-add') {
        editPrompt = JSON.stringify({
          text: watermarkText || 'NeuraPix',
          positions: watermarkPositions.length > 0 ? watermarkPositions : ['center'],
          opacity: watermarkOpacity / 100,
          size: watermarkSize / 100
        });
      }
      // For blur-face, pass intensity and selected faces as JSON
      if (selectedTool === 'blur-face') {
        // Get selected face coordinates
        const selectedFaceCoords = detectedFaces
          .filter(f => selectedFaces.includes(f.id))
          .map(f => ({ x: f.x, y: f.y, width: f.width, height: f.height }));
        
        editPrompt = JSON.stringify({
          intensity: blurIntensity / 100,
          faces: selectedFaceCoords,
          imageWidth: faceImageDimensions?.width,
          imageHeight: faceImageDimensions?.height
        });
      }
      // For convert, pass selected format (default to jpeg)
      if (selectedTool === 'convert') {
        editPrompt = backgroundPrompt || 'jpeg';
      }
      // For compress, pass quality percentage
      if (selectedTool === 'compress') {
        editPrompt = String(compressQuality);
      }
      
      const edit = await createEdit.mutateAsync({
        imageId: image.id,
        toolType: selectedTool,
        maskUrl,
        prompt: editPrompt,
      });

      setCurrentEditId(edit.id);

      // Trigger Processing
      toast({ title: t("toast.processingTool"), description: `${t("toast.applyingTool")} ${currentToolConfig?.label || selectedTool}...` });
      await processEdit.mutateAsync(edit.id);

    } catch (error) {
      console.error(error);
      const errorMessage = (error as Error).message || '';
      
      if (errorMessage.includes('402') || errorMessage.includes('Недостаточно кредитов')) {
        toast({ 
          title: t("toast.notEnoughCredits"), 
          description: t("toast.notEnoughCreditsDesc"),
          variant: "destructive" 
        });
        refetchCredits();
      } else {
        toast({ 
          title: t("toast.error"), 
          description: t("toast.processError"), 
          variant: "destructive" 
        });
      }
    }
  };

  const handleDownload = async () => {
    if (!currentEdit?.resultUrl) return;
    
    try {
      const filename = `neurapix-${selectedTool}-${Date.now()}.png`;
      
      // Build download URL with optional bgcolor/bgimage parameter
      let downloadUrl = `/api/download?url=${encodeURIComponent(currentEdit.resultUrl)}&filename=${encodeURIComponent(filename)}`;
      
      // If background is selected for background-remove
      if (selectedTool === 'background-remove') {
        if (selectedBgImage) {
          // Use photo as background
          downloadUrl += `&bgimage=${encodeURIComponent(selectedBgImage)}`;
        } else if (bgRemoveColor) {
          // Use color as background
          downloadUrl += `&bgcolor=${encodeURIComponent(bgRemoveColor)}`;
        }
      }
      
      // Open in new window/tab for reliable download
      window.open(downloadUrl, '_blank');
      
      toast({ title: t("toast.downloadSuccess") });
    } catch (error) {
      console.error('Download failed:', error);
      toast({ 
        title: t("toast.downloadError"), 
        description: t("toast.downloadErrorDesc"),
        variant: "destructive" 
      });
    }
  };

  const handleReset = () => {
    setCurrentEditId(null);
    canvasRef.current?.clearMask();
  };

  if (isImageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!image) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h2 className="text-xl font-semibold">{t("editor.imageNotFound")}</h2>
        <Button onClick={() => setLocation("/")} data-testid="button-go-home">{t("editor.goHome")}</Button>
      </div>
    );
  }

  const handleContinueEditing = async () => {
    if (!currentEdit?.resultUrl) return;
    
    try {
      toast({ title: t("toast.preparing"), description: t("toast.uploadingForEdit") });
      
      // Build URL with background if selected (for background-remove tool)
      let fetchUrl = currentEdit.resultUrl;
      if (selectedTool === 'background-remove' && (selectedBgImage || bgRemoveColor)) {
        fetchUrl = `/api/download?url=${encodeURIComponent(currentEdit.resultUrl)}&inline=true`;
        if (selectedBgImage) {
          fetchUrl += `&bgimage=${encodeURIComponent(selectedBgImage)}`;
        } else if (bgRemoveColor) {
          fetchUrl += `&bgcolor=${encodeURIComponent(bgRemoveColor)}`;
        }
      }
      
      const response = await fetch(fetchUrl);
      const blob = await response.blob();
      
      const filename = `edited_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      
      const uploadRes = await uploadFile(file);
      if (!uploadRes) throw new Error(t("toast.uploadError"));
      
      const imageRecord = await createImage.mutateAsync({
        url: uploadRes.objectPath,
        originalFilename: filename,
        contentType: 'image/png',
      });
      
      // Reset background selection
      setBgRemoveColor(null);
      setSelectedBgImage(null);
      
      setCurrentEditId(null);
      canvasRef.current?.clearMask();
      setLocation(`/editor/${imageRecord.id}`);
      
      toast({ title: t("toast.ready"), description: t("toast.continueEdit") });
    } catch (error) {
      console.error(error);
      toast({ 
        title: t("toast.error"), 
        description: t("toast.continueEditError"),
        variant: "destructive" 
      });
    }
  };

  const showResult = currentEdit?.status === "completed" && currentEdit.resultUrl;
  
  // For background-remove: check if we have a result and need to show background preview
  const isBgRemoveResult = showResult && currentEdit?.toolType === 'background-remove';
  
  // Generate background style for preview
  const getPreviewBackgroundStyle = (): React.CSSProperties => {
    if (selectedBgImage) {
      return {
        backgroundImage: `url(${selectedBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (bgRemoveColor) {
      return { backgroundColor: bgRemoveColor };
    }
    // Transparent checkerboard pattern
    return {
      background: 'repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 16px 16px',
    };
  };

  return (
    <>
      <SEO page="editor" />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="h-14 md:h-16 border-b border-white/5 bg-card/50 backdrop-blur px-2 md:px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-sm md:text-base truncate max-w-[120px] md:max-w-[200px] lg:max-w-[300px]">{image.originalFilename}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(`/manual-editor/${imageId}`)}
            data-testid="button-manual-editor"
            className="hidden sm:flex"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {t("editor.manualEditor")}
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Auth & Credits Display */}
          {isAuthenticated ? (
            <>
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center gap-1 md:gap-2 rounded-full bg-primary/10 border-primary/20 hover:bg-primary/20 px-2 md:px-3" 
                onClick={() => setShowBuyCredits(true)}
                data-testid="credits-display"
              >
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">
                  {creditsData?.credits !== undefined ? creditsData.credits : '...'}
                </span>
                <span className="text-xs text-muted-foreground hidden md:inline">кредитов</span>
              </Button>
              {creditsData?.plan === 'pro' && (
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30" data-testid="pro-badge">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-500">PRO</span>
                </div>
              )}
              {creditsData?.plan === 'standard' && (
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30" data-testid="standard-badge">
                  <span className="text-xs font-semibold text-blue-500">Стандарт</span>
                </div>
              )}
              <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user?.firstName || user?.email || 'Пользователь'}</span>
              </div>
              <Button variant="ghost" size="icon" asChild data-testid="button-logout" className="hidden md:flex">
                <a href="/api/logout">
                  <LogOut className="w-4 h-4" />
                </a>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild data-testid="button-login">
              <a href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                {t("nav.login")}
              </a>
            </Button>
          )}
          
          {/* AI Generator Button */}
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setLocation("/generate")}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-violet-500/30 hover:from-violet-600/30 hover:to-purple-600/30 hover:border-violet-500/50"
            data-testid="button-ai-generator"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-violet-300 font-medium">{t("nav.aiGenerator")}</span>
          </Button>
          
          <LanguageSwitcher />
          
          <div className="flex items-center gap-2">
            {!showResult ? (
                 <Button 
                 onClick={handleProcess} 
                 disabled={isProcessing || !isAuthenticated || !selectedTool}
                 className="btn-primary-gradient text-xs md:text-sm px-2 md:px-4"
                 size="sm"
                 data-testid="button-process"
               >
                 {isProcessing ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                     <span className="hidden sm:inline">{creditsData?.plan === 'pro' ? t("editor.processing.priority") : t("editor.processing.default")}</span>
                     <span className="sm:hidden">...</span>
                   </>
                 ) : (
                   <>
                     {currentToolConfig && <currentToolConfig.icon className="w-4 h-4 mr-1 md:mr-2" />}
                     <span className="hidden sm:inline">{t("editor.apply")}</span>
                     <span className="sm:hidden">OK</span>
                     {selectedTool && (
                       <span className="ml-1 md:ml-2 flex items-center gap-0.5 opacity-70">
                         <Coins className="w-3 h-3" />
                         {selectedTool === 'background-change' && useCustomBackground 
                           ? CUSTOM_BACKGROUND_CREDITS 
                           : selectedTool === 'upscale' 
                             ? (upscaleScale === 8 ? 10 : upscaleScale === 4 ? 5 : 3)
                             : getToolCost(selectedTool)}
                       </span>
                     )}
                   </>
                 )}
               </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handleContinueEditing} variant="outline" className="text-xs md:text-sm" size="sm" data-testid="button-continue-editing">
                    <ArrowRight className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">{t("editor.continue")}</span>
                </Button>
                <Button 
                  onClick={handleDownload} 
                  className="btn-primary-gradient text-xs md:text-sm min-w-[80px]" 
                  size="sm" 
                  disabled={downloadProgress !== null}
                  data-testid="button-download"
                >
                  {downloadProgress !== null ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                      <span>{downloadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">{t("editor.download")}</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 relative flex overflow-hidden">
        
        {/* Left Toolbar - Compact Categories */}
        {(!showResult || isBgRemoveResult) && (
            <div className="w-64 bg-card border-r border-white/5 flex flex-col z-10 hidden md:flex">
            
            {/* Tool Categories - hide when showing bg remove result */}
            {!isBgRemoveResult && (
            <div className="flex-1 overflow-y-auto">
              {isLoadingTools ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                ACTIVE_TOOL_CATEGORIES.map((category) => (
                <div key={category.id} className="border-b border-white/5">
                  <button
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors ${
                      expandedCategory === category.id ? 'bg-white/5' : ''
                    }`}
                    onClick={() => {
                      setExpandedCategory(expandedCategory === category.id ? '' : category.id);
                      setSelectedTool(null);
                    }}
                  >
                    <category.icon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm flex-1">{category.name}</span>
                    <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${
                      expandedCategory === category.id ? '-rotate-90' : ''
                    }`} />
                  </button>
                  
                  {expandedCategory === category.id && (
                    <div className="pb-2 px-2">
                      {category.tools.map((tool) => {
                        const toolCost = getToolCost(tool.id);
                        return (
                          <Tooltip key={tool.id} delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button
                                className={`w-full px-3 py-2 flex items-center gap-2 rounded-lg text-left transition-all ${
                                  selectedTool === tool.id 
                                    ? 'bg-primary/15 text-primary' 
                                    : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                                }`}
                                onClick={() => {
                                  setSelectedTool(tool.id);
                                  setCurrentEditId(null);
                                  canvasRef.current?.clearMask();
                                }}
                                data-testid={`button-tool-${tool.id}`}
                              >
                                <tool.icon className="w-4 h-4 shrink-0" />
                                <span className="text-sm flex-1">{tool.label}</span>
                                <span className="text-xs opacity-60 flex items-center gap-0.5">
                                  <Coins className="w-3 h-3" />
                                  {toolCost}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[280px] text-sm">
                              <p>{tool.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )))
            }
            </div>
            )}
            
            {/* Selected Tool Options - Bottom Panel */}
            <div className={`border-t border-white/5 p-4 space-y-4 overflow-y-auto bg-black/20 ${isBgRemoveResult ? 'flex-1' : 'max-h-[40vh]'}`}>

            {/* Brush Size (only for mask tools) */}
            {(currentToolConfig as any)?.needsMask && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t("editor.brushSize")}</label>
                  <span className="text-xs text-muted-foreground">{brushSize}px</span>
                </div>
                <Slider
                  value={[brushSize]}
                  min={5}
                  max={100}
                  step={1}
                  onValueChange={(val) => setBrushSize(val[0])}
                  className="py-2"
                  data-testid="slider-brush-size"
                />
                
                {/* Brush Preview */}
                <div className="h-16 bg-black/20 rounded-lg flex items-center justify-center border border-white/5">
                  <div 
                    className="rounded-full bg-red-500/50"
                    style={{ width: brushSize, height: brushSize }}
                  />
                </div>

                <Button variant="outline" className="w-full" onClick={() => canvasRef.current?.clearMask()} data-testid="button-clear-mask">
                  <Undo2 className="w-4 h-4 mr-2" />
                  {t("editor.clearSelection")}
                </Button>
              </div>
            )}

            {/* Upscale Options */}
            {selectedTool === 'upscale' && (
              <div className="space-y-4">
                <label className="text-sm font-medium">{t("editor.upscaleLabel")}</label>
                <div className="flex gap-2">
                  <Button
                    variant={upscaleScale === 2 ? "secondary" : "ghost"}
                    size="sm"
                    className={`flex-1 ${upscaleScale === 2 ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}`}
                    onClick={() => setUpscaleScale(2)}
                    data-testid="button-upscale-2x"
                  >
                    2x
                  </Button>
                  <Button
                    variant={upscaleScale === 4 ? "secondary" : "ghost"}
                    size="sm"
                    className={`flex-1 ${upscaleScale === 4 ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""} ${creditsData?.plan === 'free' ? "opacity-50" : ""}`}
                    onClick={() => {
                      if (creditsData?.plan === 'free') {
                        toast({ 
                          title: t("editor.subscriptionRequired"), 
                          description: t("editor.upscale4xPaidOnly"),
                          variant: "destructive" 
                        });
                        return;
                      }
                      setUpscaleScale(4);
                    }}
                    data-testid="button-upscale-4x"
                  >
                    4x {creditsData?.plan === 'free' && <Lock className="h-3 w-3 ml-1" />}
                  </Button>
                  <Button
                    variant={upscaleScale === 8 ? "secondary" : "ghost"}
                    size="sm"
                    className={`flex-1 ${upscaleScale === 8 ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""} ${creditsData?.plan === 'free' ? "opacity-50" : ""}`}
                    onClick={() => {
                      if (creditsData?.plan === 'free') {
                        toast({ 
                          title: t("editor.subscriptionRequired"), 
                          description: t("editor.upscale8xPaidOnly"),
                          variant: "destructive" 
                        });
                        return;
                      }
                      setUpscaleScale(8);
                    }}
                    data-testid="button-upscale-8x"
                  >
                    8x {creditsData?.plan === 'free' && <Lock className="h-3 w-3 ml-1" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {upscaleScale === 2 
                    ? t("editor.upscale2xHint") 
                    : upscaleScale === 4 
                      ? t("editor.upscale4xHint")
                      : t("editor.upscale8xHint")}
                </p>
                {creditsData?.plan === 'free' && (
                  <p className="text-xs text-amber-600">
                    {t("editor.upscale4xPlan")}
                  </p>
                )}
              </div>
            )}

            {/* Background Options (ONLY for background-change) */}
            {selectedTool === 'background-change' && (
              <div className="space-y-4">
                <label className="text-sm font-medium">Новый фон</label>
                
                {/* Toggle between AI generation and custom upload */}
                <div className="flex gap-2">
                  <Button
                    variant={!useCustomBackground ? "secondary" : "ghost"}
                    size="sm"
                    className={!useCustomBackground ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}
                    onClick={() => setUseCustomBackground(false)}
                    data-testid="button-ai-background"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t("editor.generateAI")}
                  </Button>
                  <Button
                    variant={useCustomBackground ? "secondary" : "ghost"}
                    size="sm"
                    className={useCustomBackground ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}
                    onClick={() => setUseCustomBackground(true)}
                    data-testid="button-custom-background"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {t("editor.uploadOwn")}
                  </Button>
                </div>
                
                {!useCustomBackground ? (
                  <>
                    <Input
                      placeholder={t("editor.bgPromptPlaceholder")}
                      value={backgroundPrompt}
                      onChange={(e) => setBackgroundPrompt(e.target.value)}
                      data-testid="input-background-prompt"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("editor.describeBackground")}
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > MAX_FILE_SIZE_BYTES) {
                            setFileTooLargeType('background');
                            setShowFileTooLarge(true);
                            e.target.value = '';
                            return;
                          }
                          setCustomBackgroundFile(file);
                          setCustomBackgroundUrl(URL.createObjectURL(file));
                        }
                      }}
                      data-testid="input-custom-bg-file"
                    />
                    
                    {customBackgroundUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-white/10">
                        <img 
                          src={customBackgroundUrl} 
                          alt="Custom background" 
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 right-2"
                          onClick={() => bgFileInputRef.current?.click()}
                          data-testid="button-change-bg"
                        >
                          {t("editor.changeBtn")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-24 border-dashed"
                        onClick={() => bgFileInputRef.current?.click()}
                        data-testid="button-upload-bg"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{t("editor.selectImage")}</span>
                        </div>
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("editor.uploadYourBackground")}
                    </p>
                  </>
                )}
              </div>
            )}
            
            {/* Watermark Settings */}
            {selectedTool === 'watermark-add' && (
              <div className="space-y-4">
                <label className="text-sm font-medium">{t("editor.watermarkTextLabel")}</label>
                <Input
                  placeholder="NeuraPix"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  data-testid="input-watermark-text"
                />
                
                <label className="text-sm font-medium">{t("editor.positionsLabel")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'top-left', label: '↖' },
                    { id: 'top-center', label: '↑' },
                    { id: 'top-right', label: '↗' },
                    { id: 'center-left', label: '←' },
                    { id: 'center', label: '●' },
                    { id: 'center-right', label: '→' },
                    { id: 'bottom-left', label: '↙' },
                    { id: 'bottom-center', label: '↓' },
                    { id: 'bottom-right', label: '↘' },
                  ].map(pos => (
                    <Button
                      key={pos.id}
                      variant={watermarkPositions.includes(pos.id) ? "secondary" : "ghost"}
                      size="sm"
                      className={watermarkPositions.includes(pos.id) ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}
                      onClick={() => {
                        if (watermarkPositions.includes(pos.id)) {
                          setWatermarkPositions(watermarkPositions.filter(p => p !== pos.id));
                        } else {
                          setWatermarkPositions([...watermarkPositions, pos.id]);
                        }
                      }}
                      data-testid={`button-wm-pos-${pos.id}`}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("editor.selectPositions")}
                </p>
                
                <label className="text-sm font-medium">{t("editor.watermarkOpacity")} {watermarkOpacity}%</label>
                <Slider
                  value={[watermarkOpacity]}
                  onValueChange={(val) => setWatermarkOpacity(val[0])}
                  min={10}
                  max={80}
                  step={5}
                  data-testid="slider-watermark-opacity"
                />
                
                <label className="text-sm font-medium">{t("editor.watermarkSize")} {watermarkSize}%</label>
                <Slider
                  value={[watermarkSize]}
                  onValueChange={(val) => setWatermarkSize(val[0])}
                  min={50}
                  max={200}
                  step={10}
                  data-testid="slider-watermark-size"
                />
              </div>
            )}

            {/* Background Remove Settings with Tabs */}
            {(selectedTool === 'background-remove' || isBgRemoveResult) && (
              <div className="space-y-4">
                {/* Tab buttons */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      bgTab === 'magic' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                    onClick={() => setBgTab('magic')}
                    data-testid="tab-bg-magic"
                  >
                    <Wand2 className="w-3 h-3 inline mr-1" />
                    {t("editor.bgTabMagic")}
                  </button>
                  <button
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      bgTab === 'photo' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                    onClick={() => setBgTab('photo')}
                    data-testid="tab-bg-photo"
                  >
                    <ImageIcon className="w-3 h-3 inline mr-1" />
                    {t("editor.bgTabPhoto")}
                  </button>
                  <button
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      bgTab === 'color' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                    onClick={() => setBgTab('color')}
                    data-testid="tab-bg-color"
                  >
                    <Palette className="w-3 h-3 inline mr-1" />
                    {t("editor.bgTabColor")}
                  </button>
                </div>

                {/* Magic Tab - AI Generation */}
                {bgTab === 'magic' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t("editor.bgMagicHint")}
                    </p>
                    <Input
                      placeholder={t("editor.bgMagicPlaceholder")}
                      value={backgroundPrompt}
                      onChange={(e) => setBackgroundPrompt(e.target.value)}
                      data-testid="input-bg-magic-prompt"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={!backgroundPrompt.trim() || isProcessing}
                      onClick={async () => {
                        if (!backgroundPrompt.trim() || !image) return;
                        setSelectedBgImage(null);
                        setBgRemoveColor(null);
                        // Create and process background-change with AI-generated background
                        try {
                          const edit = await createEdit.mutateAsync({
                            imageId: image.id,
                            toolType: 'background-change',
                            prompt: backgroundPrompt,
                          });
                          setCurrentEditId(edit.id);
                          toast({ title: t("toast.processingTool"), description: t("toast.generatingBg") });
                          await processEdit.mutateAsync(edit.id);
                        } catch (error) {
                          console.error(error);
                          toast({ title: t("toast.error"), description: t("toast.processError"), variant: "destructive" });
                        }
                      }}
                      data-testid="button-use-ai-bg"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      {t("editor.bgGenerateBtn")}
                    </Button>
                  </div>
                )}

                {/* Photo Tab - Gallery & Upload */}
                {bgTab === 'photo' && (
                  <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t("editor.bgSearchPlaceholder")}
                        value={pexelsQuery}
                        onChange={(e) => setPexelsQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && pexelsQuery.trim()) {
                            searchPexels(pexelsQuery);
                          }
                        }}
                        className="pl-9"
                        data-testid="input-pexels-search"
                      />
                      {isSearchingPexels && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("editor.bgPexelsHint")}
                    </p>

                    {/* Upload custom */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => bgFileInputRef.current?.click()}
                      data-testid="button-upload-bg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t("editor.bgUploadBtn")}
                    </Button>

                    {/* Category chips */}
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_BG_CATEGORIES.map((cat) => (
                        <Button
                          key={cat.id}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setPexelsQuery(cat.label);
                            searchPexels(cat.query);
                          }}
                          data-testid={`chip-bg-${cat.id}`}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>

                    {/* Gallery grid */}
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {/* Show uploaded custom background if any */}
                      {customBackgroundUrl && (
                        <button
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedBgImage === customBackgroundUrl
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => {
                            setSelectedBgImage(customBackgroundUrl);
                            setBgRemoveColor(null);
                            setUseCustomBackground(true);
                          }}
                          data-testid="button-select-custom-bg"
                        >
                          <img
                            src={customBackgroundUrl}
                            alt="Custom"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
                      
                      {/* Pexels gallery results */}
                      {pexelsResults.map((photo) => (
                        <button
                          key={photo.id}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedBgImage === photo.src
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => {
                            setSelectedBgImage(photo.src);
                            setBgRemoveColor(null);
                            setCustomBackgroundUrl(photo.src);
                            setUseCustomBackground(true);
                          }}
                          data-testid={`button-bg-pexels-${photo.id}`}
                        >
                          <img
                            src={photo.thumb}
                            alt={`Background ${photo.id}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Tab */}
                {bgTab === 'color' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t("editor.bgColorHint")}
                    </p>
                    
                    {/* Preset colors grid */}
                    <div className="grid grid-cols-5 gap-2">
                      {BG_COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            (color === 'transparent' && bgRemoveColor === null && !selectedBgImage) || bgRemoveColor === color
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50'
                          }`}
                          style={{
                            background: color === 'transparent' 
                              ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px'
                              : color
                          }}
                          onClick={() => {
                            setBgRemoveColor(color === 'transparent' ? null : color);
                            setSelectedBgImage(null);
                            setUseCustomBackground(false);
                          }}
                          title={color === 'transparent' ? t("editor.bgTransparent") : color}
                          data-testid={`button-bg-color-${color}`}
                        />
                      ))}
                    </div>

                    {/* Custom color picker */}
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={bgRemoveColor || '#FFFFFF'}
                        onChange={(e) => {
                          setBgRemoveColor(e.target.value);
                          setSelectedBgImage(null);
                          setUseCustomBackground(false);
                        }}
                        className="w-12 h-10 p-1 cursor-pointer"
                        data-testid="input-bg-color-picker"
                      />
                      <Input
                        type="text"
                        placeholder="#FFFFFF"
                        value={bgRemoveColor || ''}
                        onChange={(e) => {
                          setBgRemoveColor(e.target.value || null);
                          setSelectedBgImage(null);
                          setUseCustomBackground(false);
                        }}
                        className="flex-1"
                        data-testid="input-bg-color-text"
                      />
                    </div>
                  </div>
                )}

                {/* Current selection indicator */}
                {(selectedBgImage || bgRemoveColor) && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    {selectedBgImage ? (
                      <>
                        <img src={selectedBgImage} alt="Selected" className="w-8 h-8 rounded object-cover" />
                        <span className="text-xs text-muted-foreground flex-1">{t("editor.bgSelected")}</span>
                      </>
                    ) : bgRemoveColor ? (
                      <>
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: bgRemoveColor }}
                        />
                        <span className="text-xs text-muted-foreground flex-1">{bgRemoveColor}</span>
                      </>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        setSelectedBgImage(null);
                        setBgRemoveColor(null);
                        setUseCustomBackground(false);
                      }}
                      data-testid="button-clear-bg-selection"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Blur Face Settings */}
            {selectedTool === 'blur-face' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("editor.blurFaceDesc")}</p>
                
                {/* Step 1: Detect faces */}
                <Button
                  onClick={handleDetectFaces}
                  disabled={isDetectingFaces || !image}
                  className="w-full"
                  variant="outline"
                  data-testid="button-detect-faces"
                >
                  {isDetectingFaces ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("editor.detectingFaces")}</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-2" />{t("editor.detectFaces")}</>
                  )}
                </Button>
                
                {/* Step 2: Select faces */}
                {detectedFaces.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("editor.selectFacesToBlur")} ({selectedFaces.length}/{detectedFaces.length})</label>
                    <div className="grid grid-cols-2 gap-2">
                      {detectedFaces.map((face, index) => {
                        // Calculate thumbnail crop from original image
                        const imgUrl = image?.url || '';
                        const imgW = faceImageDimensions?.width || 1;
                        const imgH = faceImageDimensions?.height || 1;
                        // Add padding around face for better thumbnail
                        const pad = 0.2;
                        const cropX = Math.max(0, face.x - face.width * pad);
                        const cropY = Math.max(0, face.y - face.height * pad);
                        const cropW = Math.min(imgW - cropX, face.width * (1 + pad * 2));
                        const cropH = Math.min(imgH - cropY, face.height * (1 + pad * 2));
                        // Scale to fit 48x48 thumbnail
                        const thumbSize = 48;
                        const scale = thumbSize / Math.min(cropW, cropH);
                        
                        return (
                          <button
                            key={face.id}
                            type="button"
                            className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
                              selectedFaces.includes(face.id) 
                                ? "border-primary bg-primary/10 ring-2 ring-primary" 
                                : "border-border hover:border-primary/50 hover:bg-muted"
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (selectedFaces.includes(face.id)) {
                                setSelectedFaces(prev => prev.filter(id => id !== face.id));
                              } else {
                                setSelectedFaces(prev => [...prev, face.id]);
                              }
                            }}
                            data-testid={`button-face-${index}`}
                          >
                            {/* Face thumbnail */}
                            <div 
                              className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted"
                              style={{
                                backgroundImage: `url(${imgUrl})`,
                                backgroundSize: `${imgW * scale}px ${imgH * scale}px`,
                                backgroundPosition: `-${cropX * scale}px -${cropY * scale}px`,
                              }}
                            />
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">{t("editor.face")} {index + 1}</span>
                              {selectedFaces.includes(face.id) && (
                                <span className="text-xs text-primary flex items-center">
                                  <Check className="w-3 h-3 mr-1" />{t("editor.selected")}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFaces(detectedFaces.map(f => f.id));
                        }}
                        className="text-xs"
                      >
                        {t("editor.selectAll")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFaces([]);
                        }}
                        className="text-xs"
                      >
                        {t("editor.deselectAll")}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Intensity */}
                <label className="text-sm font-medium">{t("editor.blurIntensity")} {blurIntensity}%</label>
                <Slider
                  value={[blurIntensity]}
                  onValueChange={(val) => setBlurIntensity(val[0])}
                  min={10}
                  max={100}
                  step={5}
                  data-testid="slider-blur-intensity"
                />
              </div>
            )}

            {/* Convert Format Selector */}
            {selectedTool === 'convert' && (
              <div className="space-y-4">
                <label className="text-sm font-medium">{t("editor.selectFormat")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'jpeg', label: 'JPEG', desc: t("editor.formatJpeg") },
                    { id: 'png', label: 'PNG', desc: t("editor.formatPng") },
                    { id: 'webp', label: 'WebP', desc: t("editor.formatWebp") },
                    { id: 'avif', label: 'AVIF', desc: t("editor.formatAvif") },
                    { id: 'tiff', label: 'TIFF', desc: t("editor.formatTiff") },
                  ].map(format => (
                    <Button
                      key={format.id}
                      variant={backgroundPrompt === format.id ? "secondary" : "ghost"}
                      size="sm"
                      className={`flex flex-col items-start ${backgroundPrompt === format.id ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}`}
                      onClick={() => setBackgroundPrompt(format.id)}
                      data-testid={`button-format-${format.id}`}
                    >
                      <span className="font-medium">{format.label}</span>
                      <span className="text-xs text-muted-foreground">{format.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Compress Quality Slider */}
            {selectedTool === 'compress' && (
              <div className="space-y-4">
                <label className="text-sm font-medium">{t("editor.compressQuality")} {compressQuality}%</label>
                <Slider
                  value={[compressQuality]}
                  onValueChange={(val) => setCompressQuality(val[0])}
                  min={10}
                  max={100}
                  step={5}
                  data-testid="slider-compress-quality"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("editor.smallerSize")}</span>
                  <span>{t("editor.betterQuality")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("editor.compressHint")}
                </p>
              </div>
            )}

            
            {/* Second Image Upload (for face-swap) */}
            {currentToolConfig?.needsSecondImage && (
              <div className="space-y-4">
                <label className="text-sm font-medium">{t("editor.faceImage")}</label>
                
                <input
                  ref={secondImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > MAX_FILE_SIZE_BYTES) {
                        setFileTooLargeType('face');
                        setShowFileTooLarge(true);
                        e.target.value = '';
                        return;
                      }
                      setSecondImageFile(file);
                      setSecondImageUrl(URL.createObjectURL(file));
                    }
                  }}
                  data-testid="input-second-image-file"
                />
                
                {secondImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-white/10">
                    <img 
                      src={secondImageUrl} 
                      alt="Target face" 
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => secondImageInputRef.current?.click()}
                      data-testid="button-change-second-image"
                    >
                      {t("editor.changeBtn")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => secondImageInputRef.current?.click()}
                    data-testid="button-upload-second-image"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("editor.uploadFacePhotoBtn")}</span>
                    </div>
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("editor.faceSwapHint")}
                </p>
              </div>
            )}

            </div>
            </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-neutral-900/50 relative flex items-center justify-center p-2 md:p-4 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center max-w-full">
            
            {showResult ? (
                <div className="flex flex-col items-center gap-4">
                    {isBgRemoveResult ? (
                      // Background Remove Result with live preview
                      <div className="relative">
                        <div 
                          className="rounded-lg overflow-hidden"
                          style={getPreviewBackgroundStyle()}
                          data-testid="bg-remove-preview"
                        >
                          <img 
                            src={currentEdit.resultUrl!}
                            alt="Result with background"
                            className="max-w-full max-h-[60vh] object-contain"
                            style={{ display: 'block' }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {t("editor.bgPreviewHint")}
                        </p>
                      </div>
                    ) : (
                      <ComparisonSlider 
                          original={image.url}
                          result={currentEdit.resultUrl!}
                      />
                    )}
                    <Button variant="secondary" onClick={handleReset} data-testid="button-edit-more">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t("editor.editMore")}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                      disabled={zoom <= 0.25}
                      data-testid="button-zoom-out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                      disabled={zoom >= 3}
                      data-testid="button-zoom-in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setZoom(1)}
                      data-testid="button-zoom-reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="overflow-auto max-w-full max-h-[70vh]" style={{ scrollbarWidth: 'thin' }}>
                  <CanvasEditor
                      ref={canvasRef}
                      imageUrl={image.url}
                      width={800}
                      height={600}
                      brushSize={brushSize}
                      zoom={zoom}
                      isDrawingEnabled={!isProcessing && !!(currentToolConfig as any)?.needsMask}
                  >
                    {/* Watermark Preview Overlay - positioned over the canvas */}
                    {selectedTool === 'watermark-add' && !isProcessing && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                          {/* Top Row */}
                          <div className="flex items-start justify-start p-4">
                            {watermarkPositions.includes('top-left') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${10 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-start justify-center p-4">
                            {watermarkPositions.includes('top-center') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${10 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-start justify-end p-4">
                            {watermarkPositions.includes('top-right') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${10 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          
                          {/* Middle Row */}
                          <div className="flex items-center justify-start p-4">
                            {watermarkPositions.includes('center-left') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${16 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-center">
                            {watermarkPositions.includes('center') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${24 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-end p-4">
                            {watermarkPositions.includes('center-right') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${16 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          
                          {/* Bottom Row */}
                          <div className="flex items-end justify-start p-4">
                            {watermarkPositions.includes('bottom-left') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${10 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-end justify-center p-4">
                            {watermarkPositions.includes('bottom-center') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${10 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-end justify-end p-4">
                            {watermarkPositions.includes('bottom-right') && (
                              <span className="text-white font-bold drop-shadow-lg" style={{ opacity: watermarkOpacity / 100, fontSize: `${10 * watermarkSize / 100}px` }}>
                                {watermarkText || 'NeuraPix'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CanvasEditor>
                  </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse" />
                  <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                </div>
                <p className="mt-4 text-lg font-medium animate-pulse">{t("editor.applying")} {currentToolConfig?.label}...</p>
                <p className="text-sm text-muted-foreground">{t("editor.usuallyTakes")}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Tools Bottom Sheet */}
      {(!showResult || isBgRemoveResult) && (
        <Sheet open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
          <SheetTrigger asChild>
            <Button 
              className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 btn-primary-gradient shadow-lg rounded-full px-6"
              onClick={() => setMobileToolsOpen(true)}
            >
              {currentToolConfig && <currentToolConfig.icon className="w-4 h-4 mr-2" />}
              {currentToolConfig?.label || 'Инструменты'}
              <ChevronUp className="w-4 h-4 ml-2" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Инструменты AI</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      setLocation("/generate");
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-violet-500/30"
                    data-testid="button-mobile-ai-generator"
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-300 font-medium text-xs">{t("nav.aiGenerator")}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setMobileToolsOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Tool Categories */}
                <div className="p-4 border-b">
                  {isLoadingTools ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    ACTIVE_TOOL_CATEGORIES.map((category) => (
                    <div key={category.id} className="mb-3">
                      <button
                        className={`w-full px-3 py-2 flex items-center gap-3 text-left rounded-lg ${
                          expandedCategory === category.id ? 'bg-primary/10' : 'hover:bg-white/5'
                        }`}
                        onClick={() => {
                          setExpandedCategory(expandedCategory === category.id ? '' : category.id);
                          setSelectedTool(null);
                        }}
                      >
                        <category.icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm flex-1">{category.name}</span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                          expandedCategory === category.id ? 'rotate-180' : ''
                        }`} />
                      </button>
                      
                      {expandedCategory === category.id && (
                        <div className="grid grid-cols-3 gap-2 mt-2 pl-2">
                          {category.tools.map((tool) => {
                            const toolCost = getToolCost(tool.id);
                            return (
                              <button
                                key={tool.id}
                                className={`p-2 flex flex-col items-center gap-1 rounded-lg text-center transition-all ${
                                  selectedTool === tool.id 
                                    ? 'bg-primary/15 text-primary border border-primary/30' 
                                    : 'bg-card hover:bg-white/5 text-muted-foreground hover:text-foreground border border-white/5'
                                }`}
                                onClick={() => {
                                  setSelectedTool(tool.id);
                                  setCurrentEditId(null);
                                  canvasRef.current?.clearMask();
                                }}
                                data-testid={`button-mobile-tool-${tool.id}`}
                              >
                                <tool.icon className="w-4 h-4" />
                                <span className="text-[10px] font-medium leading-tight">{tool.label}</span>
                                <span className="text-[9px] opacity-60 flex items-center gap-0.5">
                                  <Coins className="w-2 h-2" />
                                  {toolCost}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                  )}
                </div>

                {/* Mobile Tool Options */}
                <div className="p-4 space-y-4 bg-black/20">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {currentToolConfig && <currentToolConfig.icon className="w-4 h-4 text-primary" />}
                    {t("editor.settingsLabel")} {currentToolConfig?.label}
                  </h4>

                  {/* Brush Size for mask tools */}
                  {(currentToolConfig as any)?.needsMask && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm">{t("editor.brushSize")}</label>
                        <span className="text-xs text-muted-foreground">{brushSize}px</span>
                      </div>
                      <Slider
                        value={[brushSize]}
                        min={5}
                        max={100}
                        step={1}
                        onValueChange={(val) => setBrushSize(val[0])}
                        data-testid="slider-mobile-brush-size"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => canvasRef.current?.clearMask()}
                        data-testid="button-mobile-clear-mask"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t("editor.clearSelection")}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {t("editor.drawMaskHint")}
                      </p>
                    </div>
                  )}

                  {/* Upscale options */}
                  {selectedTool === 'upscale' && (
                    <div className="space-y-2">
                      <label className="text-sm">{t("editor.upscaleLabel")}</label>
                      <div className="flex gap-2">
                        <Button
                          variant={upscaleScale === 2 ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setUpscaleScale(2)}
                        >
                          2x
                        </Button>
                        <Button
                          variant={upscaleScale === 4 ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${creditsData?.plan === 'free' ? "opacity-50" : ""}`}
                          onClick={() => {
                            if (creditsData?.plan === 'free') {
                              toast({ 
                                title: t("editor.subscriptionRequired"), 
                                description: t("editor.upscale4xPaidOnly"),
                                variant: "destructive" 
                              });
                              return;
                            }
                            setUpscaleScale(4);
                          }}
                        >
                          4x {creditsData?.plan === 'free' && <Lock className="h-3 w-3 ml-1" />}
                        </Button>
                        <Button
                          variant={upscaleScale === 8 ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${creditsData?.plan === 'free' ? "opacity-50" : ""}`}
                          onClick={() => {
                            if (creditsData?.plan === 'free') {
                              toast({ 
                                title: t("editor.subscriptionRequired"), 
                                description: t("editor.upscale8xPaidOnly"),
                                variant: "destructive" 
                              });
                              return;
                            }
                            setUpscaleScale(8);
                          }}
                        >
                          8x {creditsData?.plan === 'free' && <Lock className="h-3 w-3 ml-1" />}
                        </Button>
                      </div>
                      {creditsData?.plan === 'free' && (
                        <p className="text-xs text-amber-600">
                          {t("editor.upscale4xPlan")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Background change options */}
                  {selectedTool === 'background-change' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant={!useCustomBackground ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setUseCustomBackground(false)}
                        >
                          {t("editor.generateAI")}
                        </Button>
                        <Button
                          variant={useCustomBackground ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setUseCustomBackground(true)}
                        >
                          {t("editor.ownBackground")}
                        </Button>
                      </div>
                      
                      {!useCustomBackground ? (
                        <Input
                          placeholder={t("editor.mobileBgPromptPlaceholder")}
                          value={backgroundPrompt}
                          onChange={(e) => setBackgroundPrompt(e.target.value)}
                          data-testid="input-mobile-bg-prompt"
                        />
                      ) : (
                        <div>
                          <input
                            ref={bgFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > MAX_FILE_SIZE_BYTES) {
                                  setFileTooLargeType('background');
                                  setShowFileTooLarge(true);
                                  e.target.value = '';
                                  return;
                                }
                                setCustomBackgroundFile(file);
                                setCustomBackgroundUrl(URL.createObjectURL(file));
                              }
                            }}
                          />
                          {customBackgroundUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-white/10">
                              <img src={customBackgroundUrl} alt="Background" className="w-full h-20 object-cover" />
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-1 right-1 text-xs"
                                onClick={() => bgFileInputRef.current?.click()}
                              >
                                {t("editor.changeBtn")}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full h-16 border-dashed"
                              onClick={() => bgFileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {t("editor.uploadBackground")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Second image for face-swap */}
                  {currentToolConfig?.needsSecondImage && (
                    <div className="space-y-2">
                      <label className="text-sm">{t("editor.faceImage")}</label>
                      <input
                        ref={secondImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > MAX_FILE_SIZE_BYTES) {
                              setFileTooLargeType('face');
                              setShowFileTooLarge(true);
                              e.target.value = '';
                              return;
                            }
                            setSecondImageFile(file);
                            setSecondImageUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {secondImageUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-white/10">
                          <img src={secondImageUrl} alt="Target face" className="w-full h-20 object-cover" />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-1 right-1 text-xs"
                            onClick={() => secondImageInputRef.current?.click()}
                          >
                            {t("editor.changeBtn")}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-16 border-dashed"
                          onClick={() => secondImageInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {t("editor.uploadFacePhoto")}
                        </Button>
                      )}
                    </div>
                  )}


                  {/* Watermark settings */}
                  {selectedTool === 'watermark-add' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm">{t("editor.watermarkTextLabel")}</label>
                        <Input
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="NeuraPix"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm">{t("editor.positionsLabel")}</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'top-left', label: '↖' },
                            { id: 'top-center', label: '↑' },
                            { id: 'top-right', label: '↗' },
                            { id: 'center-left', label: '←' },
                            { id: 'center', label: '●' },
                            { id: 'center-right', label: '→' },
                            { id: 'bottom-left', label: '↙' },
                            { id: 'bottom-center', label: '↓' },
                            { id: 'bottom-right', label: '↘' },
                          ].map(pos => (
                            <Button
                              key={pos.id}
                              variant={watermarkPositions.includes(pos.id) ? "secondary" : "ghost"}
                              size="sm"
                              className={`h-8 ${watermarkPositions.includes(pos.id) ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}`}
                              onClick={() => {
                                if (watermarkPositions.includes(pos.id)) {
                                  setWatermarkPositions(watermarkPositions.filter(p => p !== pos.id));
                                } else {
                                  setWatermarkPositions([...watermarkPositions, pos.id]);
                                }
                              }}
                            >
                              {pos.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm">{t("editor.watermarkOpacity")} {watermarkOpacity}%</label>
                        <Slider
                          value={[watermarkOpacity]}
                          onValueChange={(val) => setWatermarkOpacity(val[0])}
                          min={10}
                          max={80}
                          step={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm">{t("editor.watermarkSize")} {watermarkSize}%</label>
                        <Slider
                          value={[watermarkSize]}
                          onValueChange={(val) => setWatermarkSize(val[0])}
                          min={50}
                          max={200}
                          step={10}
                        />
                      </div>
                    </div>
                  )}

                  {/* Convert format selector */}
                  {selectedTool === 'convert' && (
                    <div className="space-y-2">
                      <label className="text-sm">{t("editor.selectFormat")}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'jpeg', label: 'JPEG' },
                          { id: 'png', label: 'PNG' },
                          { id: 'webp', label: 'WebP' },
                          { id: 'avif', label: 'AVIF' },
                          { id: 'tiff', label: 'TIFF' },
                        ].map(format => (
                          <Button
                            key={format.id}
                            variant={backgroundPrompt === format.id ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-9 ${backgroundPrompt === format.id ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}`}
                            onClick={() => setBackgroundPrompt(format.id)}
                          >
                            {format.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compress settings */}
                  {selectedTool === 'compress' && (
                    <div className="space-y-2">
                      <label className="text-sm">{t("editor.compressQuality")} {compressQuality}%</label>
                      <Slider
                        value={[compressQuality]}
                        onValueChange={(val) => setCompressQuality(val[0])}
                        min={10}
                        max={100}
                        step={5}
                      />
                    </div>
                  )}

                  {/* Blur face settings */}
                  {selectedTool === 'blur-face' && (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={handleDetectFaces}
                        disabled={isDetectingFaces || !image}
                        className="w-full"
                        variant="outline"
                      >
                        {isDetectingFaces ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("editor.detectingFaces")}</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" />{t("editor.detectFaces")}</>
                        )}
                      </Button>
                      
                      {detectedFaces.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t("editor.selectFacesToBlur")} ({selectedFaces.length}/{detectedFaces.length})</label>
                          <div className="grid grid-cols-2 gap-2">
                            {detectedFaces.map((face, index) => {
                              const imgUrl = image?.url || '';
                              const imgW = faceImageDimensions?.width || 1;
                              const imgH = faceImageDimensions?.height || 1;
                              const pad = 0.2;
                              const cropX = Math.max(0, face.x - face.width * pad);
                              const cropY = Math.max(0, face.y - face.height * pad);
                              const cropW = Math.min(imgW - cropX, face.width * (1 + pad * 2));
                              const cropH = Math.min(imgH - cropY, face.height * (1 + pad * 2));
                              const thumbSize = 40;
                              const scale = thumbSize / Math.min(cropW, cropH);
                              
                              return (
                                <button
                                  key={face.id}
                                  type="button"
                                  className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
                                    selectedFaces.includes(face.id) 
                                      ? "border-primary bg-primary/10 ring-2 ring-primary" 
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (selectedFaces.includes(face.id)) {
                                      setSelectedFaces(prev => prev.filter(id => id !== face.id));
                                    } else {
                                      setSelectedFaces(prev => [...prev, face.id]);
                                    }
                                  }}
                                >
                                  <div 
                                    className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted"
                                    style={{
                                      backgroundImage: `url(${imgUrl})`,
                                      backgroundSize: `${imgW * scale}px ${imgH * scale}px`,
                                      backgroundPosition: `-${cropX * scale}px -${cropY * scale}px`,
                                    }}
                                  />
                                  <div className="flex flex-col items-start">
                                    <span className="text-xs font-medium">{t("editor.face")} {index + 1}</span>
                                    {selectedFaces.includes(face.id) && (
                                      <Check className="w-3 h-3 text-primary" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFaces(detectedFaces.map(f => f.id))}
                              className="text-xs flex-1"
                            >
                              {t("editor.selectAll")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFaces([])}
                              className="text-xs flex-1"
                            >
                              {t("editor.deselectAll")}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm">{t("editor.blurIntensity")} {blurIntensity}%</label>
                        <Slider
                          value={[blurIntensity]}
                          onValueChange={(val) => setBlurIntensity(val[0])}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>
                  )}

                  {/* Apply button */}
                  <Button 
                    className="w-full btn-primary-gradient"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      handleProcess();
                    }}
                    disabled={isProcessing || !isAuthenticated || !selectedTool}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("editor.processing")}
                      </>
                    ) : (
                      <>
                        {currentToolConfig && <currentToolConfig.icon className="w-4 h-4 mr-2" />}
                        {t("editor.apply")} {selectedTool && (
                          <>({selectedTool === 'background-change' && useCustomBackground 
                            ? CUSTOM_BACKGROUND_CREDITS 
                            : selectedTool === 'upscale'
                              ? (upscaleScale === 8 ? 10 : upscaleScale === 4 ? 5 : 3)
                              : getToolCost(selectedTool)} {t("credits.short")})</>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
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
                <DialogTitle>Файл слишком большой</DialogTitle>
                <DialogDescription className="mt-1">
                  Максимальный размер: {MAX_FILE_SIZE_MB} МБ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              {fileTooLargeType === 'background' 
                ? 'Пожалуйста, выберите фоновое изображение размером не более 10 МБ.'
                : 'Пожалуйста, выберите изображение с лицом размером не более 10 МБ.'}
            </p>
            <Button
              className="w-full"
              onClick={() => setShowFileTooLarge(false)}
            >
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
