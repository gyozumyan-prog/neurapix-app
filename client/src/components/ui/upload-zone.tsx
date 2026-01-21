import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export function UploadZone({ onFileSelect, isUploading = false, uploadProgress = 0, className }: UploadZoneProps) {
  const { t } = useI18n();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer w-full rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden",
        isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-white/20 hover:bg-white/5",
        isUploading ? "pointer-events-none opacity-80" : "",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center p-12 md:p-24 text-center">
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t("upload.loading")}</h3>
                <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                <div className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 shadow-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                {/* Floating elements decoration */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-neutral-800 rounded-xl border border-white/10 flex items-center justify-center shadow-lg rotate-12 group-hover:rotate-6 transition-transform duration-500 delay-75">
                  <FileImage className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  {isDragActive ? t("upload.dropToUpload") : t("upload.uploadImage")}
                </h3>
                <p className="text-muted-foreground">
                  {t("upload.dropHint")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
