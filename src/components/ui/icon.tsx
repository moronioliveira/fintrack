import {
  Baby, Banknote, BriefcaseBusiness, Car, Coins, Dog, Fuel, Gamepad2, Gift, GraduationCap, HandCoins,
  HeartPulse, House, Landmark, Laptop, Megaphone, Package, Percent, Phone, Plane, Receipt, Scale, Shirt,
  ShoppingBag, Store, Tag, Truck, Users, Utensils, Wifi, Wrench, Zap, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Baby, Banknote, BriefcaseBusiness, Car, Coins, Dog, Fuel, Gamepad2, Gift, GraduationCap, HandCoins,
  HeartPulse, House, Landmark, Laptop, Megaphone, Package, Percent, Phone, Plane, Receipt, Scale, Shirt,
  ShoppingBag, Store, Tag, Truck, Users, Utensils, Wifi, Wrench, Zap,
};

export function CategoryIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Tag;
  return <Icon className={className} />;
}

/** Ícone dentro de um círculo colorido (cor da categoria/conta). */
export function IconBadge({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-7" : "size-9";
  return (
    <span className={`inline-flex ${box} shrink-0 items-center justify-center rounded-lg`} style={{ backgroundColor: `${color}1f`, color }}>
      <CategoryIcon name={name} className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}
