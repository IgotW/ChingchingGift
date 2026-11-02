"use client";

import Image from "next/image";
import { useState } from "react";
import { initials } from "@/lib/format";

const sizes = {
  sm: { box: "size-8 text-[0.65rem]", px: 32 },
  md: { box: "size-10 text-xs", px: 40 },
  lg: { box: "size-14 text-base", px: 56 },
  xl: { box: "size-20 text-xl", px: 80 },
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const config = sizes[size];

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-pine-100 font-semibold text-pine-800 ring-1 ring-pine-900/10 ${config.box} ${className}`}
      aria-hidden="true"
    >
      {src && !broken ? (
        <Image
          src={src}
          alt=""
          width={config.px}
          height={config.px}
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}
