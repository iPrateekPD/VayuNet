"use client";

import { HaloReel, type HaloReelItem } from "@/components/ui/halo-reel";
import { Image } from "lucide-react";
 
const CARDS: HaloReelItem[] = [
  {
    src: "https://images.unsplash.com/photo-1506744626753-eda8151a7474?q=80&w=400",
    alt: "Beautiful landscape view",
  },
  {
    src: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=400",
    alt: "Forest landscape",
  },
  {
    src: "https://images.unsplash.com/photo-1447752809965-9430cb36e16a?q=80&w=400",
    alt: "Nature mountains",
  },
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400",
    alt: "Scenic valley",
  },
  {
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=400",
    alt: "Grassfield under sunlight",
  },
  {
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400",
    alt: "Foggy mountain morning",
  },
  {
    src: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=400",
    alt: "Calm lake view",
  },
  {
    src: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=400",
    alt: "Coastal sunset",
  },
  {
    src: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=400",
    alt: "Autumn trees",
  },
  {
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=400",
    alt: "Sunrise over hills",
  },
];

export default function DemoOne() {
  return (
    <HaloReel
      items={CARDS}
      aria-label="Recent work"
      centerLabel={
        <div className="flex flex-col items-center gap-2 text-foreground">
          <Image className="w-8 h-8" />
          <span className="text-[3.4vw] font-medium tracking-tight">
            Selected works
          </span>
        </div>
      }
      cardWidth={130}
      cardHeight={180}
      minScale={0.4}
      radiusYRatio={0.36}
      holdDuration={1000}
      stepDuration={700}
      className="h-[560px] bg-muted/40"
    />
  );
}
