import { useState, useRef } from "react";
import { ArrowLeft, Upload, Camera, Plus, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CameraModal } from "@/components/CameraModal";
import { Textarea } from "@/components/ui/textarea";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  amount: string;
  selected?: boolean;
}

const UploadPrescription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [medicineName, setMedicineName] = useState("");
  const [medicineDosage, setMedicineDosage] = useState("");
  const [medicineFrequency, setMedicineFrequency] = useState("");
  const [medicineAmount, setMedicineAmount] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prescriptionName, setPrescriptionName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke("extract-prescription", {
          body: { imageBase64: base64Image },
        });

        if (error) {
          throw error;
        }

        if (data?.medicines && data.medicines.length > 0) {
          setMedicines(data.medicines);
          toast({
            title: "Success!",
            description: `Extracted ${data.medicines.length} medicine(s) from prescription`,
          });
        } else {
          toast({
            title: "No medicines found",
            description: "Please add medicines manually",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing prescription:", error);
      toast({
        title: "Error",
        description: "Failed to process prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleAddMedicine = () => {
    if (!medicineName.trim() || !medicineDosage.trim() || !medicineFrequency.trim() || !medicineAmount.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setMedicines([...medicines, { 
      name: medicineName, 
      dosage: medicineDosage, 
      frequency: medicineFrequency,
      amount: medicineAmount,
      selected: true 
    }]);
    setMedicineName("");
    setMedicineDosage("");
    setMedicineFrequency("");
    setMedicineAmount("");
    setShowManualForm(false);
    toast({
      title: "Medicine added",
      description: "Medicine has been added to the list",
    });
  };

  const toggleMedicineSelection = (index: number) => {
    setMedicines(medicines.map((med, i) => 
      i === index ? { ...med, selected: !med.selected } : med
    ));
  };

  const handleSearchPharmacies = () => {
    const selectedMedicines = medicines.filter(med => med.selected);
    if (selectedMedicines.length === 0) {
      toast({
        title: "No medicines selected",
        description: "Please select at least one medicine to search",
        variant: "destructive",
      });
      return;
    }
    navigate("/medicine-availability", { state: { medicines: selectedMedicines } });
  };

  const handleCancel = () => {
    setMedicineName("");
    setMedicineDosage("");
    setMedicineFrequency("");
    setMedicineAmount("");
    setShowManualForm(false);
  };

  const handleSavePrescription = async () => {
    if (!prescriptionName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a prescription name",
        variant: "destructive",
      });
      return;
    }

    if (medicines.length === 0) {
      toast({
        title: "No Medicines",
        description: "Please add at least one medicine",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save prescriptions",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      let imageUrl = null;

      // Upload image if available
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('prescription-images')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('prescription-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Save prescription to database
      const { error: insertError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: user.id,
          prescription_name: prescriptionName,
          prescription_image_url: imageUrl,
          medicines: medicines as any,
          notes: null,
        } as any);

      if (insertError) throw insertError;

      toast({
        title: "Prescription Saved!",
        description: "Your prescription has been saved successfully",
      });

      // Navigate to my prescriptions
      setTimeout(() => navigate("/my-prescriptions"), 1500);
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast({
        title: "Error",
        description: "Failed to save prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Upload Prescription</h1>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-3xl p-12 mb-8 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1">Upload Prescription</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop your prescription image or PDF
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleChooseFile}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <Button
                onClick={handleTakePhoto}
                disabled={isProcessing}
                variant="outline"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {/* Medicines Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Medicines</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualForm(true)}
              className="text-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Manually
            </Button>
          </div>

          {/* Extracted Medicines List */}
          {medicines.length > 0 && (
            <>
              <div className="space-y-3 mb-4">
                {medicines.map((medicine, index) => (
                  <div key={index} className="bg-card rounded-2xl p-4 shadow-sm flex items-start gap-3">
                    <Checkbox
                      checked={medicine.selected ?? true}
                      onCheckedChange={() => toggleMedicineSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{medicine.dosage}</p>
                      {medicine.frequency && medicine.amount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {medicine.amount} • {medicine.frequency}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSearchPharmacies}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Search Pharmacies
                </Button>
                <Button
                  onClick={() => setShowSaveForm(!showSaveForm)}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Prescription
                </Button>
              </div>
            </>
          )}

          {/* Save Prescription Form */}
          {showSaveForm && medicines.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold">Save to My Prescriptions</h3>
              <div>
                <Label htmlFor="prescriptionName">Prescription Name *</Label>
                <Input
                  id="prescriptionName"
                  value={prescriptionName}
                  onChange={(e) => setPrescriptionName(e.target.value)}
                  placeholder="e.g., Monthly Prescription"
                  className="mt-2"
                />
              </div>
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                Make sure to add frequency and amount details to each medicine for reminders and tracking
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSavePrescription}
                  disabled={isProcessing}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setShowSaveForm(false);
                    setPrescriptionName("");
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Manual Form */}
          {showManualForm && (
            <div className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <Label htmlFor="medicineName">Medicine Name *</Label>
                <Input
                  id="medicineName"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g., Paracetamol"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={medicineDosage}
                  onChange={(e) => setMedicineDosage(e.target.value)}
                  placeholder="e.g., 500mg"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency of Intake *</Label>
                <Input
                  id="frequency"
                  value={medicineFrequency}
                  onChange={(e) => setMedicineFrequency(e.target.value)}
                  placeholder="e.g., Twice daily"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  value={medicineAmount}
                  onChange={(e) => setMedicineAmount(e.target.value)}
                  placeholder="e.g., 2 tablets"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAddMedicine}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add Medicine
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card p-8 rounded-2xl shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-center font-medium">Processing prescription...</p>
            </div>
          </div>
        )}

        <CameraModal
          open={showCamera}
          onClose={() => setShowCamera(false)}
          onCapture={handleFileSelect}
        />
      </div>
    </div>
  );
};

export default UploadPrescription;
