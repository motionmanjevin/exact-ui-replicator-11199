import { useState, useEffect } from "react";
import { ArrowLeft, Search, MapPin, Navigation, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
interface Medicine {
  name: string;
  dosage: string;
}
interface MedicineAvailability {
  name: string;
  available: boolean;
  price: string;
  alternative?: {
    medicine: string;
    reason: string;
  };
}
interface Pharmacy {
  id: string;
  name: string;
  distance: number;
  distanceText: string;
  medicines: MedicineAvailability[];
  image?: string;
  phone?: string;
  hours?: string;
  address?: string;
}
const MedicineAvailability = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const medicines = location.state?.medicines as Medicine[] || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState("Accra, Greater Accra Region");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Simulate fetching pharmacy data
    setTimeout(() => {
      const pharmacyNames = ["Soul Health Pharmacy", "Care Pharmacy", "HealthPlus Pharmacy", "MediCare Center", "Wellness Pharmacy", "City Drug Store", "Green Cross Pharmacy", "Hope Medical Pharmacy"];
      const addresses = ["Madina, Greater Accra Region", "East Legon, Greater Accra Region", "Osu, Greater Accra Region", "Labone, Greater Accra Region", "Achimota, Greater Accra Region", "Tema, Greater Accra Region", "Teshie, Greater Accra Region", "Kaneshie, Greater Accra Region"];
      const alternativeDrugs: Record<string, {
        medicine: string;
        reason: string;
      }> = {
        "Paracetamol": {
          medicine: "Acetaminophen 500mg",
          reason: "Same active compound, equal effectiveness"
        },
        "Ibuprofen": {
          medicine: "Naproxen 250mg",
          reason: "Similar NSAID, comparable pain relief"
        },
        "Amoxicillin": {
          medicine: "Augmentin 625mg",
          reason: "Enhanced antibiotic with similar spectrum"
        },
        "Omeprazole": {
          medicine: "Esomeprazole 20mg",
          reason: "Same drug class, equivalent acid reduction"
        },
        "Metformin": {
          medicine: "Glucophage XR 500mg",
          reason: "Extended release formulation of same drug"
        },
        "Cetirizine": {
          medicine: "Loratadine 10mg",
          reason: "Alternative antihistamine with less drowsiness"
        }
      };
      const simulatedPharmacies: Pharmacy[] = pharmacyNames.slice(0, 6).map((name, index) => {
        const distance = (index + 1) * 1.2 + Math.random() * 0.5;
        
        // For Soul Health (first pharmacy), ensure at least one medicine is unavailable with alternative
        const isSoulHealth = index === 0;
        const medicinesWithAlternatives = medicines.filter(m => alternativeDrugs[m.name]);
        let forcedUnavailableIndex = -1;
        if (isSoulHealth) {
          if (medicinesWithAlternatives.length > 0) {
            forcedUnavailableIndex = medicines.findIndex(m => m.name === medicinesWithAlternatives[0].name);
          } else if (medicines.length > 0) {
            forcedUnavailableIndex = 0; // fallback to first medicine; we'll generate a generic alternative
          }
        }

        const medicineAvailability: MedicineAvailability[] = medicines.map((medicine, medIndex) => {
          // For Soul Health, force the selected medicine to be unavailable, others are random
          // For other pharmacies, use standard random logic
          let isAvailable: boolean;
          if (isSoulHealth) {
            isAvailable = medIndex === forcedUnavailableIndex ? false : Math.random() > 0.3;
          } else {
            const hasAllMedicines = Math.random() > 0.4;
            isAvailable = hasAllMedicines || Math.random() > 0.3;
          }
          
          const basePrice = 5 + Math.random() * 10;
          const priceVariation = 1 + (Math.random() * 0.4 - 0.2); // ±20% variation

          // If medicine not available, suggest alternative.
          // Guarantee an AI suggestion for the forced-unavailable item at Soul Health even if not in mapping.
          let alternativeSuggestion: { medicine: string; reason: string } | undefined = undefined;
          if (!isAvailable) {
            if (alternativeDrugs[medicine.name]) {
              alternativeSuggestion = alternativeDrugs[medicine.name];
            } else if (isSoulHealth && medIndex === forcedUnavailableIndex) {
              alternativeSuggestion = {
                medicine: `${medicine.name} Alternative`,
                reason: "Pharmacist-recommended equivalent available here"
              };
            }
          }
          return {
            name: medicine.name,
            available: isAvailable,
            price: `GH₵ ${(basePrice * priceVariation).toFixed(2)}`,
            alternative: alternativeSuggestion
          };
        });
        return {
          id: `${index + 1}`,
          name,
          distance,
          distanceText: `${distance.toFixed(1)} km away`,
          medicines: medicineAvailability,
          image: index === 0 ? "/src/assets/soul-health-pharmacy.jpg" : undefined,
          phone: `+233 ${20 + index} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
          hours: index % 2 === 0 ? "8:00 AM - 8:00 PM" : "24 Hours",
          address: addresses[index]
        };
      });

      // Sort by distance
      simulatedPharmacies.sort((a, b) => a.distance - b.distance);
      setPharmacies(simulatedPharmacies);
      setIsLoading(false);
    }, 1000);
  }, [medicines]);
  const filteredPharmacies = pharmacies.filter(pharmacy => pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Medicine Availability</h1>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>Updated Just now</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsLoading(true)} className="rounded-full">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search medicine" className="pl-10 bg-muted/50 border-0" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Location Banner */}
          <div className="bg-primary/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Searching for Pharmacies near you</p>
                <p className="text-xs text-muted-foreground">{userLocation}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Navigation className="w-4 h-4 text-primary" />
            </Button>
          </div>

          {/* Pharmacies List */}
          <div>
            <h2 className="text-sm font-semibold mb-3">
              Nearby Pharmacies ({filteredPharmacies.length})
            </h2>
            <div className="space-y-3">
              {filteredPharmacies.map(pharmacy => {
              const availableCount = pharmacy.medicines.filter(m => m.available).length;
              const totalCount = pharmacy.medicines.length;
              const hasAll = availableCount === totalCount;
              const hasAlternatives = pharmacy.medicines.some(m => m.alternative);
              return <div key={pharmacy.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{pharmacy.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{pharmacy.distanceText}</span>
                        </div>
                      </div>
                      <Badge variant={hasAll ? "default" : "secondary"} className={hasAll ? "bg-green-500/10 text-green-600 border-green-200" : ""}>
                        {availableCount}/{totalCount} Available
                      </Badge>
                    </div>


                    {/* AI Recommendations */}
                    {hasAlternatives && <div className="space-y-2 mb-3">
                        {pharmacy.medicines.filter(m => m.alternative).map((med, idx) => <div key={idx} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-orange-900">AI Recommendation for {med.name}</p>
                                <p className="text-sm text-orange-800 mt-0.5">{med.alternative!.medicine}</p>
                                <p className="text-xs text-orange-600 mt-0.5">{med.alternative!.reason}</p>
                              </div>
                            </div>
                          </div>)}
                      </div>}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Price</p>
                        <p className="font-semibold">
                          GH₵ {pharmacy.medicines.filter(m => m.available).reduce((sum, m) => sum + parseFloat(m.price.replace("GH₵ ", "")), 0).toFixed(2)}
                        </p>
                      </div>
                      <Button onClick={() => navigate('/pharmacy-details', {
                    state: {
                      pharmacy
                    }
                  })}>
                        Details
                      </Button>
                    </div>
                  </div>;
            })}
            </div>
          </div>

          {/* Selected Medicines */}
          {medicines.length > 0 && <div className="bg-muted/50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-2">Searching for:</h3>
              <div className="space-y-2">
                {medicines.map((medicine, index) => <div key={index} className="text-sm">
                    <span className="font-medium">{medicine.name}</span>
                    <span className="text-muted-foreground"> - {medicine.dosage}</span>
                  </div>)}
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
export default MedicineAvailability;