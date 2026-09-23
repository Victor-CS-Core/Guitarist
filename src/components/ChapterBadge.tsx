import {
  Compass,
  Fingerprint,
  Guitar,
  AudioLines,
  Repeat2,
  Music2,
  BookOpen,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const badgeIcons: Record<string, LucideIcon> = {
  "guitar-explorer": Compass,
  "fretboard-rookie": Fingerprint,
  "chord-builder": Guitar,
  "rhythm-keeper": AudioLines,
  "chord-switcher": Repeat2,
  "first-song": Music2,
  "guitar-player": BookOpen,
  "independent-musician": Sparkles,
};

export function ChapterBadge({
  badgeId,
  title,
  earned,
  compact = false,
}: {
  badgeId: string;
  title: string;
  earned: boolean;
  compact?: boolean;
}) {
  const Icon = badgeIcons[badgeId] ?? Music2;
  return (
    <span
      className={`chapter-badge ${earned ? "is-earned" : "is-pending"} ${compact ? "is-compact" : ""}`}
      data-badge={badgeId}
      role="img"
      aria-label={`${title} badge: ${earned ? "earned" : "not yet earned"}`}
    >
      <Icon size={compact ? 22 : 30} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}
