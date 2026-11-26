import {
  BoltIcon,
  BroomIcon,
  CakeIcon,
  CupIcon,
  DropletIcon,
  FlameIcon,
  HeaterIcon,
  HomeIcon,
  LeafIcon,
  PipeIcon,
  RollerIcon,
  TruckIcon,
  UtensilsIcon,
  WrenchIcon,
} from "../../components/icons";
import { foodIconKey, tradeIconKey, type FoodIconKey, type TradeIconKey } from "./variant-data";

const TRADE: Record<TradeIconKey, typeof WrenchIcon> = {
  heater: HeaterIcon,
  drain: DropletIcon,
  pipe: PipeIcon,
  bolt: BoltIcon,
  roller: RollerIcon,
  broom: BroomIcon,
  leaf: LeafIcon,
  roof: HomeIcon,
  truck: TruckIcon,
  wrench: WrenchIcon,
};

const FOOD: Record<FoodIconKey, typeof WrenchIcon> = {
  utensils: UtensilsIcon,
  cup: CupIcon,
  flame: FlameIcon,
  cake: CakeIcon,
};

/** Ícone de serviço de casa pelo nome. Decorativo: o nome vem ao lado. */
export function TradeGlyph({ name, className }: { name: string; className?: string }) {
  const Glyph = TRADE[tradeIconKey(name)];
  return <Glyph className={className} />;
}

/** Ícone de prato ou bebida pelo nome. Decorativo: o nome vem ao lado. */
export function FoodGlyph({ name, className }: { name: string; className?: string }) {
  const Glyph = FOOD[foodIconKey(name)];
  return <Glyph className={className} />;
}
