import { cn } from "@/src/lib/utils";

type BrandLogoProps = {
  className?: string;
  surface?: "theme" | "light" | "dark";
  decorative?: boolean;
};

export function BrandLogo({
  className,
  surface = "theme",
  decorative = false,
}: BrandLogoProps) {
  const alt = decorative ? "" : "pAIse";
  const imageClass = cn("h-full w-full object-contain", className);

  if (surface === "light") {
    return <img src="/lightModeLogo.png" alt={alt} className={imageClass} />;
  }

  if (surface === "dark") {
    return <img src="/darkModeLogo.png" alt={alt} className={imageClass} />;
  }

  return (
    <>
      <img
        src="/lightModeLogo.png"
        alt={alt}
        className={cn(imageClass, "dark:hidden")}
      />
      <img
        src="/darkModeLogo.png"
        alt={alt}
        className={cn(imageClass, "hidden dark:block")}
      />
    </>
  );
}
