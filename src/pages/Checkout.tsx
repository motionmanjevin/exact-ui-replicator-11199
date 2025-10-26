import { useState } from "react";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import LocationPicker from "@/components/LocationPicker";

interface Pharmacy {
  id: string;
  name: string;
  distance: string;
  available: boolean;
  price: string;
  medicineName?: string;
  image?: string;
  phone?: string;
  hours?: string;
  address?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pharmacy = location.state?.pharmacy as Pharmacy;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    deliveryAddress: "",
    deliveryCoordinates: null as [number, number] | null,
    notes: "",
  });

  if (!pharmacy) {
    navigate(-1);
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLocationSelect = (address: string, coordinates: [number, number]) => {
    setFormData({
      ...formData,
      deliveryAddress: address,
      deliveryCoordinates: coordinates,
    });
  };

  const handlePlaceOrder = () => {
    if (!formData.fullName || !formData.phone || !formData.deliveryAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including delivery location",
        variant: "destructive",
      });
      return;
    }

    // Handle order placement logic here
    console.log("Order details:", {
      ...formData,
      pharmacy: pharmacy.name,
      medicine: pharmacy.medicineName,
      price: pharmacy.price,
    });

    toast({
      title: "Order Placed!",
      description: `Your order from ${pharmacy.name} has been confirmed.`,
    });
    
    // Navigate back to home or order confirmation page
    setTimeout(() => navigate("/"), 2000);
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
              <h1 className="text-xl font-semibold">Checkout</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Order Summary */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{pharmacy.medicineName || "Medicine"}</p>
                  <p className="text-sm text-muted-foreground">{pharmacy.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{pharmacy.distance}</span>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary">{pharmacy.price}</p>
              </div>
            </div>
          </Card>

          {/* Delivery Information */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Delivery Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label>Delivery Location *</Label>
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialAddress={formData.deliveryAddress}
                />
                {formData.deliveryAddress && (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{formData.deliveryAddress}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions for delivery"
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* Pharmacy Contact */}
          <Card className="p-4 bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">Questions?</h3>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-primary" />
              <span>Contact {pharmacy.name}: {pharmacy.phone || "+233 XX XXX XXXX"}</span>
            </div>
          </Card>

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            Place Order - {pharmacy.price}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
