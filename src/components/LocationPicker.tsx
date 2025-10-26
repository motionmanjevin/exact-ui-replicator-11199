import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MapboxTokenDialog from "./MapboxTokenDialog";

interface LocationPickerProps {
  onLocationSelect: (address: string, coordinates: [number, number]) => void;
  initialAddress?: string;
}

const LocationPicker = ({ onLocationSelect, initialAddress }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoder = useRef<MapboxGeocoder | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMapboxToken();
  }, []);

  const loadMapboxToken = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowTokenDialog(true);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('mapbox_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.mapbox_token) {
        setMapboxToken(data.mapbox_token);
        mapboxgl.accessToken = data.mapbox_token;
      } else {
        setShowTokenDialog(true);
      }
    } catch (error) {
      console.error("Error loading token:", error);
      setShowTokenDialog(true);
    }
  };

  const handleTokenSaved = (token: string) => {
    setMapboxToken(token);
    mapboxgl.accessToken = token;
    setShowTokenDialog(false);
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map centered on Accra, Ghana
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-0.1870, 5.6037], // Accra coordinates
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Initialize geocoder
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: "Search for a location",
      countries: "gh", // Restrict to Ghana
    });

    // Add geocoder to map
    map.current.addControl(geocoder.current);

    // Initialize marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: "#22c55e",
    });

    // Handle geocoder result
    geocoder.current.on("result", (e) => {
      const coordinates: [number, number] = e.result.geometry.coordinates;
      const address = e.result.place_name;
      
      // Update marker position
      if (marker.current) {
        marker.current.setLngLat(coordinates).addTo(map.current!);
      }

      // Notify parent component
      onLocationSelect(address, coordinates);
    });

    // Handle marker drag
    marker.current.on("dragend", async () => {
      if (!marker.current) return;
      
      const lngLat = marker.current.getLngLat();
      const coordinates: [number, number] = [lngLat.lng, lngLat.lat];

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxToken}`
        );
        const data = await response.json();
        const address = data.features[0]?.place_name || "Unknown location";
        onLocationSelect(address, coordinates);
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onLocationSelect]);

  const handleUseCurrentLocation = () => {
    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        // Update map and marker
        if (map.current && marker.current) {
          map.current.flyTo({
            center: coordinates,
            zoom: 15,
          });
          marker.current.setLngLat(coordinates).addTo(map.current);
        }

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxToken}`
          );
          const data = await response.json();
          const address = data.features[0]?.place_name || "Current location";
          
          onLocationSelect(address, coordinates);
          
          toast({
            title: "Location Found",
            description: "Using your current location",
          });
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          onLocationSelect("Current location", coordinates);
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location Error",
          description: "Unable to get your current location. Please check your browser permissions.",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <>
      <MapboxTokenDialog
        open={showTokenDialog}
        onTokenSaved={handleTokenSaved}
      />
      {!mapboxToken ? (
        <div className="h-[400px] flex items-center justify-center bg-muted rounded-xl">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      ) : (
        <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleUseCurrentLocation}
        disabled={isLoadingLocation}
        className="w-full"
      >
        {isLoadingLocation ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 mr-2" />
            Use Current Location
          </>
        )}
      </Button>
      <div ref={mapContainer} className="h-[400px] rounded-xl overflow-hidden border border-border" />
          <p className="text-xs text-muted-foreground">
            Search for a location above or drag the pin to adjust your delivery address
          </p>
        </div>
      )}
    </>
  );
};

export default LocationPicker;
