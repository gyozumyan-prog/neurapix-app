import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

interface PageContent {
  id: string;
  page: string;
  section: string;
  contentRu: string | null;
  contentUk: string | null;
  contentEn: string | null;
  isActive: number;
}

export function useContent(page: string) {
  const { language } = useI18n();
  
  const { data: contents = [], isLoading } = useQuery<PageContent[]>({
    queryKey: ["/api/content", page],
  });

  const getContent = (section: string, fallback: string = ""): string => {
    const content = contents.find(c => c.section === section && c.isActive === 1);
    if (!content) return fallback;
    
    switch (language) {
      case "ru":
        return content.contentRu || fallback;
      case "uk":
        return content.contentUk || content.contentRu || fallback;
      case "en":
        return content.contentEn || fallback;
      default:
        return content.contentRu || fallback;
    }
  };

  const hasContent = (section: string): boolean => {
    return contents.some(c => c.section === section && c.isActive === 1);
  };

  return { getContent, hasContent, isLoading, contents };
}
