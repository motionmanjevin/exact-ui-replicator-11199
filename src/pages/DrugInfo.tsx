import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Pill } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const POPULAR_MEDICINES = [
  { name: "Paracetamol", icon: "💊" },
  { name: "Ibuprofen", icon: "💊" },
  { name: "Amoxicillin", icon: "💊" },
  { name: "Aspirin", icon: "💊" },
  { name: "Metformin", icon: "💊" },
  { name: "Omeprazole", icon: "💊" },
  { name: "Vitamin D3", icon: "💊" },
  { name: "Cetirizine", icon: "💊" },
];

const DrugInfo = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [drugInfo, setDrugInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("drug-autocomplete", {
        body: { query },
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleSearch = async (medicineName?: string) => {
    const searchTerm = medicineName || searchQuery;
    
    if (!searchTerm.trim()) {
      toast.error("Please enter a medicine name");
      return;
    }

    setIsLoading(true);
    setDrugInfo("");
    setShowSuggestions(false);

    try {
      const { data, error } = await supabase.functions.invoke("drug-info", {
        body: { medicineName: searchTerm },
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
          <div className="relative flex-1" ref={inputRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
              placeholder="Search for any medicine..."
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-12 h-12 bg-white border-0 rounded-2xl text-foreground placeholder:text-muted-foreground"
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : (
                  <ul className="py-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                        >
                          <Pill className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{suggestion}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="h-12 px-6 rounded-2xl"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 mt-6">
        {/* Popular Medicines */}
        {!drugInfo && !isLoading && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4">Popular Medicines</h2>
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_MEDICINES.map((medicine) => (
                <button
                  key={medicine.name}
                  onClick={() => {
                    setSearchQuery(medicine.name);
                    handleSearch(medicine.name);
                  }}
                  className="bg-card rounded-2xl p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-all flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-3xl">
                    {medicine.icon}
                  </div>
                  <span className="text-sm font-medium text-center">{medicine.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

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
          <div className="text-center py-8 text-muted-foreground">
            <p>Search for any medicine to get detailed AI-powered information</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DrugInfo;
