import { useRef, useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useImage, useCreateImage } from "@/hooks/use-images";
import { ManualEditor, type ManualEditorRef } from "@/components/manual-editor";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { UploadZone } from "@/components/ui/upload-zone";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Download,
  Loader2,
  MousePointer2,
  Crop,
  Brush,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  Sun,
  Contrast,
  Palette,
  RotateCw,
  RotateCcw,
  Undo2,
  LogIn,
  LogOut,
  Coins,
  Wand2
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";

type ToolMode = 'select' | 'crop' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line';

export default function ManualEditorPage() {
  const [, params] = useRoute("/manual-editor/:id");
  const [, setLocation] = useLocation();
  const imageId = params?.id ? parseInt(params.id) : null;
  
  const { t } = useI18n();
  const { data: image, isLoading: isImageLoading } = useImage(imageId || 0);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { uploadFile, isUploading, progress } = useUpload();
  const createImage = useCreateImage();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const TOOLS = useMemo(() => [
    { id: 'select' as ToolMode, label: t("manualEditor.select"), icon: MousePointer2, tooltip: t("manualEditor.selectTooltip") },
    { id: 'crop' as ToolMode, label: t("manualEditor.crop"), icon: Crop, tooltip: t("manualEditor.cropTooltip") },
    { id: 'brush' as ToolMode, label: t("manualEditor.brush"), icon: Brush, tooltip: t("manualEditor.brushTooltip") },
    { id: 'eraser' as ToolMode, label: t("manualEditor.eraser"), icon: Eraser, tooltip: t("manualEditor.eraserTooltip") },
    { id: 'text' as ToolMode, label: t("manualEditor.text"), icon: Type, tooltip: t("manualEditor.textTooltip") },
    { id: 'rectangle' as ToolMode, label: t("manualEditor.rectangle"), icon: Square, tooltip: t("manualEditor.rectangleTooltip") },
    { id: 'circle' as ToolMode, label: t("manualEditor.circle"), icon: Circle, tooltip: t("manualEditor.circleTooltip") },
    { id: 'line' as ToolMode, label: t("manualEditor.line"), icon: Minus, tooltip: t("manualEditor.lineTooltip") },
  ], [t]);
  
  const handleLogin = () => {
    window.location.href = '/login';
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const editorRef = useRef<ManualEditorRef>(null);
  
  const [selectedTool, setSelectedTool] = useState<ToolMode>('select');
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Dynamic canvas sizing for mobile
  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const width = window.innerWidth - 16;
        const height = window.innerHeight * 0.55; // More height for image since toolbar is at bottom
        setCanvasSize({ width, height });
      } else {
        setCanvasSize({ width: 800, height: 600 });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDownload = async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    try {
      const blob = await editorRef.current.getEditedImage();
      if (!blob) {
        toast({ title: t("manualEditor.errorSave"), description: t("manualEditor.errorSaveDesc"), variant: "destructive" });
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurapix-edited-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: t("toast.downloadSuccess"), description: t("toast.imageSaved") });
    } catch (error) {
      toast({ title: t("manualEditor.errorSave"), description: t("manualEditor.errorSaveDesc"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddText = () => {
    if (!editorRef.current || !textInput.trim()) return;
    editorRef.current.addText(textInput);
    setTextInput('');
  };

  const handleReset = () => {
    if (!editorRef.current) return;
    editorRef.current.resetTransforms();
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setRotation(0);
    toast({ title: t("manualEditor.toast.reset"), description: t("manualEditor.toast.resetDesc") });
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      const uploadRes = await uploadFile(file);
      
      if (!uploadRes) {
        throw new Error(t("manualEditor.toast.errorLoad"));
      }

      const imageRecord = await createImage.mutateAsync({
        url: uploadRes.objectPath,
        originalFilename: file.name,
        contentType: file.type,
      });

      toast({
        title: t("manualEditor.toast.imageLoaded"),
        description: "",
      });

      setLocation(`/manual-editor/${imageRecord.id}`);
    } catch (error) {
      toast({
        title: t("manualEditor.toast.error"),
        description: t("manualEditor.toast.errorLoad"),
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (imageId && isImageLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imageId || !image) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-home">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">{t("manualEditor.title")}</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto">
                <Brush className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold">{t("manualEditor.uploadPhoto")}</h2>
              <p className="text-muted-foreground">
                {t("manualEditor.uploadPhotoDesc")}
              </p>
            </div>
            
            <Card className="p-2 bg-card/50 border-white/10">
              <UploadZone 
                onFileSelect={handleFileSelect}
                isUploading={isUploading || isProcessing}
                uploadProgress={progress}
                className="h-64"
              />
            </Card>
            
            <div className="text-center text-sm text-muted-foreground">
              {t("manualEditor.supportedFormats")}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentImageUrl = image.url.startsWith('http') ? image.url : `${window.location.origin}${image.url}`;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex w-72 border-r bg-card/50 flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/editor/${imageId}`)} data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{t("manualEditor.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("manualEditor.freeTools")}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("manualEditor.toolsLabel")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {TOOLS.map((tool) => (
                <Tooltip key={tool.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTool === tool.id ? "secondary" : "ghost"}
                      size="icon"
                      className={selectedTool === tool.id ? "bg-primary/10 text-primary ring-1 ring-primary/30" : ""}
                      onClick={() => setSelectedTool(tool.id)}
                      data-testid={`button-tool-${tool.id}`}
                    >
                      <tool.icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">{tool.label}</p>
                    <p className="text-xs text-muted-foreground">{tool.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {(selectedTool === 'brush' || selectedTool === 'eraser') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t("manualEditor.brushSize")} {brushSize}px</Label>
                <Slider
                  value={[brushSize]}
                  onValueChange={(v) => setBrushSize(v[0])}
                  min={1}
                  max={100}
                  step={1}
                  data-testid="slider-brush-size"
                />
              </div>
              {selectedTool === 'brush' && (
                <div className="space-y-2">
                  <Label className="text-sm">{t("manualEditor.color")}</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? 'border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setBrushColor(color)}
                        data-testid={`button-color-${color.slice(1)}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTool === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t("manualEditor.textLabel")}</Label>
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t("manualEditor.textPlaceholder")}
                  data-testid="input-text"
                />
                <p className="text-xs text-muted-foreground">
                  {t("manualEditor.textHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("manualEditor.brushSize")} {brushSize * 2}px</Label>
                <Slider
                  value={[brushSize]}
                  onValueChange={(v) => setBrushSize(v[0])}
                  min={8}
                  max={72}
                  step={1}
                  data-testid="slider-text-size"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("manualEditor.color")}</Label>
                <div className="flex gap-2 flex-wrap">
                  {['#ff0000', '#00ff00', '#0000ff', '#000000', '#ffffff'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBrushColor(color)}
                      data-testid={`button-text-color-${color.slice(1)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTool === 'crop' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("manualEditor.cropHint")}
              </p>
            </div>
          )}

          {(selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line') && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("manualEditor.shapeHint")} {selectedTool === 'rectangle' ? t("manualEditor.shapeRectangle") : selectedTool === 'circle' ? t("manualEditor.shapeCircle") : t("manualEditor.shapeLine")}.
              </p>
              <Label className="text-sm">{t("manualEditor.strokeColor")}</Label>
              <div className="flex gap-2 flex-wrap">
                {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? 'border-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                    data-testid={`button-shape-color-${color.slice(1)}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sun className="w-4 h-4" /> {t("manualEditor.adjustments")}
            </Label>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t("manualEditor.brightness")}</Label>
                <span className="text-xs text-muted-foreground">{brightness}</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={(v) => setBrightness(v[0])}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-brightness"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t("manualEditor.contrast")}</Label>
                <span className="text-xs text-muted-foreground">{contrast}</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={(v) => setContrast(v[0])}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-contrast"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t("manualEditor.saturation")}</Label>
                <span className="text-xs text-muted-foreground">{saturation}</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={(v) => setSaturation(v[0])}
                min={-100}
                max={100}
                step={1}
                data-testid="slider-saturation"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <RotateCw className="w-4 h-4" /> {t("manualEditor.rotation")}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(r => r - 90)}
                data-testid="button-rotate-left"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <span className="text-sm flex-1 text-center">{rotation}°</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(r => r + 90)}
                data-testid="button-rotate-right"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleReset}
            data-testid="button-reset"
          >
            <Undo2 className="w-4 h-4 mr-2" />
            {t("manualEditor.resetAll")}
          </Button>
          <Button
            className="w-full"
            onClick={handleDownload}
            disabled={isSaving}
            data-testid="button-download"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {t("manualEditor.download")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-11 md:h-14 border-b flex items-center justify-between px-2 md:px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/editor/${imageId}`)}
              data-testid="button-back-ai"
              className="md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/editor/${imageId}`)}
              data-testid="button-ai-editor"
              className="hidden md:flex"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {t("manualEditor.aiTools")}
            </Button>
            <span className="md:hidden text-sm font-medium">{t("manualEditor.title")}</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/editor/${imageId}`)}
              className="md:hidden text-xs px-2"
            >
              <Wand2 className="w-3 h-3 mr-1" />
              AI
            </Button>
            {!isAuthLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-sm text-muted-foreground">{user.firstName || user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleLogin} data-testid="button-login">
                  <LogIn className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t("manualEditor.login")}</span>
                </Button>
              )
            )}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-auto bg-muted/20">
          <ManualEditor
            ref={editorRef}
            imageUrl={currentImageUrl}
            width={canvasSize.width}
            height={canvasSize.height}
            tool={selectedTool}
            brushSize={brushSize}
            brushColor={brushColor}
            brightness={brightness}
            contrast={contrast}
            saturation={saturation}
            rotation={rotation}
            textToAdd={textInput}
            onTextAdded={() => setTextInput('')}
          />
        </div>
        
        {/* Mobile bottom toolbar */}
        <div className="md:hidden border-t bg-card/80 backdrop-blur p-2 space-y-2 shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "secondary" : "ghost"}
                size="sm"
                className={`shrink-0 ${selectedTool === tool.id ? "bg-primary/10 text-primary" : ""}`}
                onClick={() => setSelectedTool(tool.id)}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
            <div className="w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setRotation(r => r - 90)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setRotation(r => r + 90)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Adjustments */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1">
              <Sun className="w-3 h-3 text-muted-foreground shrink-0" />
              <Slider
                value={[brightness]}
                onValueChange={(v) => setBrightness(v[0])}
                min={-100}
                max={100}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-1">
              <Contrast className="w-3 h-3 text-muted-foreground shrink-0" />
              <Slider
                value={[contrast]}
                onValueChange={(v) => setContrast(v[0])}
                min={-100}
                max={100}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-muted-foreground shrink-0" />
              <Slider
                value={[saturation]}
                onValueChange={(v) => setSaturation(v[0])}
                min={-100}
                max={100}
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Brush color for brush/text/shapes */}
          {(selectedTool === 'brush' || selectedTool === 'text' || selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line') && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground mr-1">{t("manualEditor.color")}:</span>
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#000000', '#ffffff'].map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border ${brushColor === color ? 'border-primary ring-1 ring-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                />
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
              <Undo2 className="w-4 h-4 mr-1" />
              {t("manualEditor.resetAll")}
            </Button>
            <Button size="sm" className="flex-1" onClick={handleDownload} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
              {t("manualEditor.download")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
