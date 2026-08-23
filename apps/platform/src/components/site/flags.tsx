import type { ReactElement } from "react";
import type { Locale } from "@/i18n";

const SHAPES: Record<Locale, ReactElement> = {
  en: (
    <>
      <rect width="21" height="15" fill="#012169" />
      <path d="M0,0 L21,15 M21,0 L0,15" stroke="#fff" strokeWidth="3" />
      <path d="M0,0 L21,15 M21,0 L0,15" stroke="#C8102E" strokeWidth="1.2" />
      <rect x="8.5" width="4" height="15" fill="#fff" />
      <rect y="5.5" width="21" height="4" fill="#fff" />
      <rect x="9.25" width="2.5" height="15" fill="#C8102E" />
      <rect y="6.25" width="21" height="2.5" fill="#C8102E" />
    </>
  ),
  fr: (
    <>
      <rect width="7" height="15" fill="#002395" />
      <rect x="7" width="7" height="15" fill="#fff" />
      <rect x="14" width="7" height="15" fill="#ED2939" />
    </>
  ),
  de: (
    <>
      <rect width="21" height="5" fill="#000" />
      <rect y="5" width="21" height="5" fill="#DD0000" />
      <rect y="10" width="21" height="5" fill="#FFCE00" />
    </>
  ),
  es: (
    <>
      <rect width="21" height="15" fill="#AA151B" />
      <rect y="3.75" width="21" height="7.5" fill="#F1BF00" />
    </>
  ),
  pt: (
    <>
      <rect width="21" height="15" fill="#DA291C" />
      <rect width="8.4" height="15" fill="#046A38" />
      <circle cx="8.4" cy="7.5" r="3" fill="#FFE900" />
      <circle cx="8.4" cy="7.5" r="1.9" fill="#fff" />
      <circle cx="8.4" cy="7.5" r="1" fill="#DA291C" />
    </>
  ),
  it: (
    <>
      <rect width="7" height="15" fill="#009246" />
      <rect x="7" width="7" height="15" fill="#fff" />
      <rect x="14" width="7" height="15" fill="#CE2B37" />
    </>
  ),
  nl: (
    <>
      <rect width="21" height="5" fill="#AE1C28" />
      <rect y="5" width="21" height="5" fill="#fff" />
      <rect y="10" width="21" height="5" fill="#21468B" />
    </>
  ),
  sv: (
    <>
      <rect width="21" height="15" fill="#006AA7" />
      <rect x="6" width="2.5" height="15" fill="#FECC02" />
      <rect y="6.25" width="21" height="2.5" fill="#FECC02" />
    </>
  ),
  no: (
    <>
      <rect width="21" height="15" fill="#BA0C2F" />
      <rect x="5.25" width="4" height="15" fill="#fff" />
      <rect y="5.5" width="21" height="4" fill="#fff" />
      <rect x="6.125" width="2.25" height="15" fill="#00205B" />
      <rect y="6.375" width="21" height="2.25" fill="#00205B" />
    </>
  ),
  da: (
    <>
      <rect width="21" height="15" fill="#C8102E" />
      <rect x="6" width="2.5" height="15" fill="#fff" />
      <rect y="6.25" width="21" height="2.5" fill="#fff" />
    </>
  ),
  fi: (
    <>
      <rect width="21" height="15" fill="#fff" />
      <rect x="6" width="3" height="15" fill="#003580" />
      <rect y="6" width="21" height="3" fill="#003580" />
    </>
  ),
  pl: (
    <>
      <rect width="21" height="7.5" fill="#fff" />
      <rect y="7.5" width="21" height="7.5" fill="#DC143C" />
    </>
  ),
  cs: (
    <>
      <rect width="21" height="7.5" fill="#fff" />
      <rect y="7.5" width="21" height="7.5" fill="#D7141A" />
      <path d="M0,0 L10.5,7.5 L0,15 Z" fill="#11457E" />
    </>
  ),
  hu: (
    <>
      <rect width="21" height="5" fill="#CE2939" />
      <rect y="5" width="21" height="5" fill="#fff" />
      <rect y="10" width="21" height="5" fill="#477050" />
    </>
  ),
  ro: (
    <>
      <rect width="7" height="15" fill="#002B7F" />
      <rect x="7" width="7" height="15" fill="#FCD116" />
      <rect x="14" width="7" height="15" fill="#CE1126" />
    </>
  ),
  bg: (
    <>
      <rect width="21" height="5" fill="#fff" />
      <rect y="5" width="21" height="5" fill="#00966E" />
      <rect y="10" width="21" height="5" fill="#D62612" />
    </>
  ),
  el: (
    <>
      <rect width="21" height="15" fill="#0D5EAF" />
      <rect y="1.67" width="21" height="1.66" fill="#fff" />
      <rect y="5" width="21" height="1.67" fill="#fff" />
      <rect y="8.33" width="21" height="1.67" fill="#fff" />
      <rect y="11.67" width="21" height="1.66" fill="#fff" />
      <rect width="8.33" height="8.33" fill="#0D5EAF" />
      <rect x="3.42" width="1.5" height="8.33" fill="#fff" />
      <rect y="3.42" width="8.33" height="1.5" fill="#fff" />
    </>
  ),
};

export function Flag(params: { locale: Locale }) {
  return (
    <span
      aria-hidden
      className="inline-block h-[13px] w-[18px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/15"
    >
      <svg viewBox="0 0 21 15" preserveAspectRatio="none" className="block h-full w-full">
        {SHAPES[params.locale]}
      </svg>
    </span>
  );
}
