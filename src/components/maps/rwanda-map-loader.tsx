"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RwandaPovertyMap = dynamic(
  () => import("@/components/maps/rwanda-poverty-map").then((module) => module.RwandaPovertyMap),
  { ssr: false, loading: () => <Skeleton className="h-[500px] rounded-2xl" /> },
);

export function RwandaMapLoader({ height }: { height?: number }) {
  return <RwandaPovertyMap height={height} />;
}
