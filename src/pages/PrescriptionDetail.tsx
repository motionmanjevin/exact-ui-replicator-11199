import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Medicine {
  name: string;
  dosage: string;
  frequency?: string;
  amount?: string;
  selected?: boolean;
}

interface PrescriptionState {
  id: string;
  name: string;
  medicines: Medicine[];
}

const PrescriptionDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prescriptionData = location.state as PrescriptionState;
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    if (!prescriptionData) {
      navigate("/my-prescriptions");
      return;
    }
    
    // Initialize medicines with selected: false
    const initializedMedicines = prescriptionData.medicines.map(med => ({
      ...med,
      selected: false
    }));
    setMedicines(initializedMedicines);
  }, [prescriptionData, navigate]);

  const toggleMedicineSelection = (index: number) => {
    setMedicines(medicines.map((med, i) => 
      i === index ? { ...med, selected: !med.selected } : med
    ));
  };

  const handleSearchAvailability = () => {
    const selectedMedicines = medicines.filter(med => med.selected);
    if (selectedMedicines.length === 0) {
      toast.error("Please select at least one medicine");
      return;
    }
    navigate("/medicine-availability", { state: { medicines: selectedMedicines } });
  };

  const handleViewDrugInfo = () => {
    const selectedMedicines = medicines.filter(med => med.selected);
    if (selectedMedicines.length === 0) {
      toast.error("Please select a medicine");
      return;
    }
    if (selectedMedicines.length > 1) {
      toast.error("Please select only one medicine for drug information");
      return;
    }
    navigate("/drug-info", { state: { medicineName: selectedMedicines[0].name } });
  };

  const selectedCount = medicines.filter(med => med.selected).length;

  if (!prescriptionData) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/my-prescriptions")}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{prescriptionData.name}</h1>
              <p className="text-sm text-muted-foreground">
                {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
              </p>
            </div>
            {selectedCount > 0 && (
              <Badge variant="default" className="text-sm">
                {selectedCount} selected
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-3 mb-6">
          {medicines.map((medicine, index) => (
            <div 
              key={index} 
              className="bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={medicine.selected ?? false}
                  onCheckedChange={() => toggleMedicineSelection(index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{medicine.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{medicine.dosage}</p>
                  {(medicine.frequency || medicine.amount) && (
                    <div className="flex gap-4 mt-2">
                      {medicine.amount && (
                        <span className="text-xs text-muted-foreground">
                          Amount: {medicine.amount}
                        </span>
                      )}
                      {medicine.frequency && (
                        <span className="text-xs text-muted-foreground">
                          Frequency: {medicine.frequency}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 bg-background/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border">
          <div className="flex gap-3">
            <Button
              onClick={handleViewDrugInfo}
              variant="outline"
              className="flex-1"
              disabled={selectedCount !== 1}
            >
              <Info className="w-4 h-4 mr-2" />
              Drug Info
              {selectedCount > 1 && <span className="text-xs ml-2">(Select 1 only)</span>}
            </Button>
            <Button
              onClick={handleSearchAvailability}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={selectedCount === 0}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Availability
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetail;
