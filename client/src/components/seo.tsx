import { Helmet } from "react-helmet-async";
import { useI18n, type Language } from "@/lib/i18n";

interface SEOProps {
  page?: "home" | "editor" | "pricing" | "account" | "examples";
}

const BASE_URL = "https://neurapix.replit.app";

const pathMap: Record<string, string> = {
  home: "/",
  editor: "/editor",
  pricing: "/pricing",
  account: "/account",
  examples: "/examples"
};

const allLanguages: Language[] = ["ru", "uk", "en"];

export function SEO({ page = "home" }: SEOProps) {
  const { t, language } = useI18n();

  const langMap: Record<Language, string> = {
    ru: "ru_RU",
    uk: "uk_UA",
    en: "en_US"
  };

  const langNameMap: Record<Language, string> = {
    ru: "Russian",
    uk: "Ukrainian",
    en: "English"
  };

  const hrefLangMap: Record<Language, string> = {
    ru: "ru",
    uk: "uk",
    en: "en"
  };

  const getTitleAndDescription = () => {
    switch (page) {
      case "editor":
        return {
          title: t("seo.editor.title"),
          description: t("seo.editor.description")
        };
      case "pricing":
        return {
          title: t("seo.pricing.title"),
          description: t("seo.pricing.description")
        };
      case "account":
        return {
          title: t("seo.account.title"),
          description: t("seo.account.description")
        };
      case "examples":
        return {
          title: t("seo.examples.title"),
          description: t("seo.examples.description")
        };
      default:
        return {
          title: t("seo.home.title"),
          description: t("seo.home.description")
        };
    }
  };

  const { title, description } = getTitleAndDescription();
  const pagePath = pathMap[page] || "/";
  const canonicalUrl = `${BASE_URL}${pagePath}`;

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="language" content={langNameMap[language]} />
      
      <link rel="canonical" href={canonicalUrl} />
      
      {allLanguages.map((lang) => (
        <link 
          key={lang}
          rel="alternate" 
          hrefLang={hrefLangMap[lang]} 
          href={`${BASE_URL}${pagePath}?lang=${lang}`} 
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={langMap[language]} />
      <meta property="og:url" content={canonicalUrl} />
      
      {allLanguages
        .filter((lang) => lang !== language)
        .map((lang) => (
          <meta 
            key={lang}
            property="og:locale:alternate" 
            content={langMap[lang]} 
          />
        ))}
      
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
