import { Pill } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MedicationCardProps {
  name: string;
  dosage: string;
  instructions: string;
  daysLeft: number;
  totalDays: number;
}

const MedicationCard = ({ name, dosage, instructions, daysLeft, totalDays }: MedicationCardProps) => {
  const progress = ((totalDays - daysLeft) / totalDays) * 100;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-muted rounded-xl">
          <Pill className="w-6 h-6 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base">{name} {dosage}</h3>
          <p className="text-sm text-muted-foreground mt-1">{instructions}</p>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">{daysLeft} days left</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
