import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

const QuickActionCard = ({ icon: Icon, label, onClick }: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-2xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-all flex flex-col items-center gap-3 min-w-[100px]"
    >
      <div className="p-3 bg-muted rounded-xl">
        <Icon className="w-6 h-6 text-foreground" />
      </div>
      <span className="text-sm font-medium text-center leading-tight">{label}</span>
    </button>
  );
};

export default QuickActionCard;
