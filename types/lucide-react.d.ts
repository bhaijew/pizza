declare module "lucide-react" {
  import * as React from "react";

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const LayoutDashboard: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const ChefHat: LucideIcon;
  export const Pizza: LucideIcon;
  export const Tag: LucideIcon;
  export const Tags: LucideIcon;
  export const QrCode: LucideIcon;
  export const TicketPercent: LucideIcon;
  export const FileText: LucideIcon;
  export const Coins: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Boxes: LucideIcon;
  export const Settings: LucideIcon;
  export const Sun: LucideIcon;
  export const Moon: LucideIcon;
  export const LogOut: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Store: LucideIcon;
  export const Flame: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Plus: LucideIcon;
  export const Clock: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Sliders: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Activity: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const UtensilsCrossed: LucideIcon;
  export const Bike: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Search: LucideIcon;
  export const Image: LucideIcon;
  export const Edit2: LucideIcon;
  export const Trash2: LucideIcon;
  export const Bell: LucideIcon;
  export const Key: LucideIcon;
  export const MapPin: LucideIcon;
  export const Phone: LucideIcon;
  export const User: LucideIcon;
  export const Receipt: LucideIcon;
  export const XCircle: LucideIcon;
  export const Layers: LucideIcon;
  export const Filter: LucideIcon;
  export const Eye: LucideIcon;
  export const ImageIcon: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Building2: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Users: LucideIcon;
  export const Crown: LucideIcon;
  export const KeyRound: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Lock: LucideIcon;
  export const Shield: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Globe: LucideIcon;
  export const Server: LucideIcon;
  export const Terminal: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Edit3: LucideIcon;
  export const AlertOctagon: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Database: LucideIcon;
  export const Power: LucideIcon;
  export const Mail: LucideIcon;
  export const Laptop: LucideIcon;
  export const Radio: LucideIcon;

  // Fallback for any other Lucide icons
  const icons: { [key: string]: LucideIcon };
  export default icons;
}
