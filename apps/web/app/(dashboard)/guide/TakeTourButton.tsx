"use client";

import { GlassButton } from "@/components/glass";
import { TourIcon } from "../NavIcons";
import { openWelcomeTour } from "../WelcomeTour";

// "Take the tour" do /guide: abre o tour de boas-vindas (que mora na moldura do painel).

export function TakeTourButton() {
  return (
    <GlassButton variant="primary" icon={<TourIcon />} onClick={openWelcomeTour}>
      Take the tour
    </GlassButton>
  );
}
