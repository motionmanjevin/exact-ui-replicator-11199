import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DrugInfo = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drugInfo, setDrugInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a medicine name");
      return;
    }

    setIsLoading(true);
    setDrugInfo("");

    try {
      const { data, error } = await supabase.functions.invoke("drug-info", {
        body: { medicineName: searchQuery },
      });

      if (error) throw error;

      setDrugInfo(data.drugInfo);
    } catch (error) {
      console.error("Error fetching drug info:", error);
      toast.error("Failed to fetch drug information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[image:var(--gradient-header)] text-white px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">AI Drug Information</h1>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for any medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-12 bg-white border-0 rounded-2xl text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="h-12 px-6 rounded-2xl"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 mt-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {drugInfo && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>{searchQuery}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {drugInfo.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-3 text-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!drugInfo && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Search for any medicine to get detailed AI-powered information</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DrugInfo;
