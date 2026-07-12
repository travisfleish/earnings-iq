type LogoVariant = "horizontal" | "vertical" | "wordmark" | "marque";
type LogoColor = "blue" | "white";

interface LogoProps {
  variant?: LogoVariant;
  color?: LogoColor;
  className?: string;
  alt?: string;
}

const logoMap: Record<LogoVariant, Record<LogoColor, string>> = {
  horizontal: {
    blue: "/logos/GENIUS_SPORTS_HORIZONTAL_BLUE_RGB.svg",
    white: "/logos/GENIUS_SPORTS_HORIZONTAL_WHITE_RGB.svg",
  },
  vertical: {
    blue: "/logos/GENIUS_SPORTS_VERTICAL_BLUE_RGB.svg",
    white: "/logos/GENIUS_SPORTS_VERTICAL_WHITE_RGB.svg",
  },
  wordmark: {
    blue: "/logos/GENIUS_SPORTS_WORDMARK_BLUE_RGB.svg",
    white: "/logos/GENIUS_SPORTS_WORDMARK_WHITE_RGB.svg",
  },
  marque: {
    blue: "/logos/GENIUS_SPORTS_MARQUE_BLUE_RGB.svg",
    white: "/logos/GENIUS_SPORTS_MARQUE_WHITE_RGB.svg",
  },
};

const minWidths: Record<LogoVariant, number> = {
  vertical: 110,
  horizontal: 70,
  wordmark: 70,
  marque: 40,
};

export function Logo({
  variant = "horizontal",
  color = "blue",
  className = "",
  alt = "Genius Sports",
}: LogoProps) {
  const src = logoMap[variant][color];
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ minWidth: minWidths[variant] }}
    />
  );
}
