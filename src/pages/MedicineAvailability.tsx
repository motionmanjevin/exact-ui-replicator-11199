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

interface Pharmacy {
  id: string;
  name: string;
  distance: string;
  available: boolean;
  price: string;
  medicineName?: string;
  recommendation?: {
    medicine: string;
    reason: string;
  };
}

const MedicineAvailability = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const medicines = (location.state?.medicines as Medicine[]) || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState("Accra, Greater Accra Region");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching pharmacy data
    setTimeout(() => {
      const firstMedicine = medicines[0]?.name || "Medicine";
      setPharmacies([
        {
          id: "1",
          name: "Medi-Pharm Accra",
          distance: "1.2 km away",
          available: true,
          price: "GH₵ 8.50",
          medicineName: firstMedicine,
        },
        {
          id: "2",
          name: "Care Pharmacy",
          distance: "3.1 km away",
          available: false,
          price: "GH₵ 8.00",
          medicineName: firstMedicine,
          recommendation: {
            medicine: "Acetaminophen 500mg",
            reason: "Same active compound",
          },
        },
        {
          id: "3",
          name: "HealthPlus Pharmacy",
          distance: "4.5 km away",
          available: true,
          price: "GH₵ 9.00",
          medicineName: firstMedicine,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [medicines]);

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLoading(true)}
              className="rounded-full"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine"
              className="pl-10 bg-muted/50 border-0"
            />
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
              {filteredPharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="bg-card rounded-2xl p-4 shadow-sm border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{pharmacy.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{pharmacy.distance}</span>
                      </div>
                    </div>
                    <Badge
                      variant={pharmacy.available ? "default" : "destructive"}
                      className={pharmacy.available ? "bg-green-500/10 text-green-600 border-green-200" : ""}
                    >
                      {pharmacy.medicineName || "Medicine"}
                    </Badge>
                  </div>

                  {pharmacy.recommendation && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">AI Recommendation</p>
                          <p className="text-sm text-orange-800 mt-0.5">{pharmacy.recommendation.medicine}</p>
                          <p className="text-xs text-orange-600 mt-0.5">{pharmacy.recommendation.reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-semibold">{pharmacy.price}</p>
                    </div>
                    <Button
                      onClick={() => navigate('/pharmacy-details', { state: { pharmacy } })}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Medicines */}
          {medicines.length > 0 && (
            <div className="bg-muted/50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-2">Searching for:</h3>
              <div className="space-y-2">
                {medicines.map((medicine, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{medicine.name}</span>
                    <span className="text-muted-foreground"> - {medicine.dosage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineAvailability;
