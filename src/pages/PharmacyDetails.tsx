import { ArrowLeft, MapPin, Phone, Clock, Navigation } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  distance?: number;
  distanceText?: string;
  medicines?: MedicineAvailability[];
  image?: string;
  phone?: string;
  hours?: string;
  address?: string;
  // Legacy properties for backward compatibility
  available?: boolean;
  price?: string;
  medicineName?: string;
  recommendation?: {
    medicine: string;
    reason: string;
  };
}

const PharmacyDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pharmacy = location.state?.pharmacy as Pharmacy;

  if (!pharmacy) {
    navigate(-1);
    return null;
  }

  // Check if we're using the new medicines array structure or legacy structure
  const hasMedicinesArray = pharmacy.medicines && pharmacy.medicines.length > 0;
  const availableMedicines = hasMedicinesArray 
    ? pharmacy.medicines!.filter(m => m.available) 
    : [];
  const hasAvailableMedicines = hasMedicinesArray 
    ? availableMedicines.length > 0 
    : pharmacy.available ?? false;
  
  const totalPrice = hasMedicinesArray
    ? availableMedicines.reduce((sum, m) => sum + parseFloat(m.price.replace("GH₵ ", "")), 0).toFixed(2)
    : pharmacy.price || "0.00";

  const displayDistance = pharmacy.distanceText || pharmacy.distance?.toFixed(1) + " km away" || "N/A";

  const handleOrderNow = () => {
    navigate('/checkout', { state: { pharmacy } });
  };

  const handleViewMap = () => {
    // Open map view or navigate to map
    const address = pharmacy.address 
      ? encodeURIComponent(pharmacy.address + ", " + pharmacy.name) 
      : encodeURIComponent(pharmacy.name + " Accra Ghana");
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
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
              <h1 className="text-xl font-semibold">Pharmacy Details</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Pharmacy Thumbnail */}
          {pharmacy.image && (
            <div className="w-full h-48 rounded-2xl overflow-hidden">
              <img 
                src={pharmacy.image} 
                alt={pharmacy.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Pharmacy Info Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{pharmacy.name}</h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4" />
                  <span>{displayDistance}</span>
                </div>
              </div>
              <Badge
                variant={hasAvailableMedicines ? "default" : "destructive"}
                className={hasAvailableMedicines ? "bg-green-500/10 text-green-600 border-green-200" : ""}
              >
                {hasMedicinesArray 
                  ? `${availableMedicines.length}/${pharmacy.medicines!.length} Available`
                  : (hasAvailableMedicines ? "Available" : "Out of Stock")}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{pharmacy.phone || "+233 XX XXX XXXX"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="font-medium">{pharmacy.hours || "8:00 AM - 8:00 PM"}</p>
                </div>
              </div>
            </div>

            {/* Legacy Medicine Info */}
            {!hasMedicinesArray && pharmacy.medicineName && (
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Medicine</p>
                <p className="font-semibold text-lg">{pharmacy.medicineName}</p>
                <p className="text-2xl font-bold text-primary mt-2">{pharmacy.price}</p>
              </div>
            )}

            {/* Legacy Recommendation */}
            {!hasMedicinesArray && pharmacy.recommendation && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-orange-900 mb-1">AI Recommendation</p>
                <p className="font-semibold text-orange-800">{pharmacy.recommendation.medicine}</p>
                <p className="text-sm text-orange-600 mt-1">{pharmacy.recommendation.reason}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleViewMap}
                className="w-full"
              >
                <Navigation className="w-4 h-4 mr-2" />
                View on Map
              </Button>
              <Button
                onClick={handleOrderNow}
                disabled={!hasAvailableMedicines}
                className={hasAvailableMedicines ? "bg-green-600 hover:bg-green-700 w-full" : "w-full"}
              >
                Order Now
              </Button>
            </div>
          </Card>

          {/* Additional Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">About this Pharmacy</h3>
            <p className="text-sm text-muted-foreground">
              Licensed pharmacy providing quality medications and healthcare products. 
              Professional pharmacists available for consultation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDetails;
