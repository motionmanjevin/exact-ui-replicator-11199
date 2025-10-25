import { Pill, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReminderCardProps {
  name: string;
  amount: string;
  time: string;
  actionType: "taken" | "log";
  icon?: "pill" | "capsule";
}

const ReminderCard = ({ name, amount, time, actionType, icon = "pill" }: ReminderCardProps) => {
  const bgColor = actionType === "taken" ? "bg-primary/10" : "bg-blue-50";
  const iconBg = actionType === "taken" ? "bg-primary" : "bg-blue-500";

  return (
    <div className={`${bgColor} rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`${iconBg} p-2 rounded-full`}>
        <Pill className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{name}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{amount}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{time}</span>
        </div>
      </div>
      <Button 
        variant={actionType} 
        size="sm"
        className="rounded-xl px-6"
      >
        {actionType === "taken" ? "Taken" : "Log"}
      </Button>
    </div>
  );
};

export default ReminderCard;
