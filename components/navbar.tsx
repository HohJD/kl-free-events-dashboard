"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { RefreshCw, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-orange-500 to-indigo-500 text-white shadow-lg shadow-rose-500/20">
            <MapPin className="size-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">
              KL Free Events
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Kuala Lumpur
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-8 gap-1.5 rounded-full text-xs"
          >
            <RefreshCw
              className={refreshing ? "size-3.5 animate-spin" : "size-3.5"}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Refreshing…" : "Refresh"}
            </span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
      {/* Gradient hairline */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
    </motion.header>
  );
}
