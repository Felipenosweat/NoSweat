import {
  BrushIcon,
  CrownIcon,
  DropletIcon,
  LotusIcon,
  NailIcon,
  ScissorsIcon,
  SparkIcon,
  WindIcon,
} from "../../components/icons";
import { serviceIconKey, type IconKey } from "./soft-data";

const GLYPHS: Record<IconKey, typeof SparkIcon> = {
  scissors: ScissorsIcon,
  brush: BrushIcon,
  droplet: DropletIcon,
  wind: WindIcon,
  nail: NailIcon,
  crown: CrownIcon,
  lotus: LotusIcon,
  sparkle: SparkIcon,
};

/** Ícone do serviço escolhido pelo nome (nunca por posição). Decorativo: o nome vem ao lado. */
export function ServiceGlyph({ name, className }: { name: string; className?: string }) {
  const Glyph = GLYPHS[serviceIconKey(name)];
  return <Glyph className={className} />;
}
