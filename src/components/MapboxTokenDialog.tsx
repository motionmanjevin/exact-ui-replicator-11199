import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MapboxTokenDialogProps {
  open: boolean;
  onTokenSaved: (token: string) => void;
}

const MapboxTokenDialog = ({ open, onTokenSaved }: MapboxTokenDialogProps) => {
  const [token, setToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadExistingToken();
    }
  }, [open]);

  const loadExistingToken = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('mapbox_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.mapbox_token) {
        setToken(data.mapbox_token);
      }
    } catch (error) {
      console.error("Error loading token:", error);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox token",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save settings",
          variant: "destructive",
        });
        return;
      }

      // Upsert the token
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            mapbox_token: token.trim(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;

      toast({
        title: "Token Saved!",
        description: "Your Mapbox token has been saved successfully",
      });

      onTokenSaved(token.trim());
    } catch (error) {
      console.error("Error saving token:", error);
      toast({
        title: "Error",
        description: "Failed to save token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mapbox Token Required</DialogTitle>
          <DialogDescription>
            To use location services, please enter your Mapbox public token. You can get it from{" "}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token">Mapbox Public Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="pk.eyJ1..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This token will be saved securely and used for all location features
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Token"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapboxTokenDialog;
