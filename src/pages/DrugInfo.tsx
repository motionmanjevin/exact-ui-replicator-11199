import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Pill, Volume2, Pause, Play, Camera, Upload, MapPin, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { CameraModal } from "@/components/CameraModal";
import { Skeleton } from "@/components/ui/skeleton";
import paracetamolImg from "@/assets/medicines/paracetamol.jpg";
import ibuprofenImg from "@/assets/medicines/ibuprofen.jpg";
import amoxicillinImg from "@/assets/medicines/amoxicillin.jpg";
import aspirinImg from "@/assets/medicines/aspirin.jpg";
import metforminImg from "@/assets/medicines/metformin.jpg";
import omeprazoleImg from "@/assets/medicines/omeprazole.jpg";
import vitaminD3Img from "@/assets/medicines/vitamin-d3.jpg";
import cetirizineImg from "@/assets/medicines/cetirizine.jpg";

const POPULAR_MEDICINES = [
  { name: "Paracetamol", image: paracetamolImg },
  { name: "Ibuprofen", image: ibuprofenImg },
  { name: "Amoxicillin", image: amoxicillinImg },
  { name: "Aspirin", image: aspirinImg },
  { name: "Metformin", image: metforminImg },
  { name: "Omeprazole", image: omeprazoleImg },
  { name: "Vitamin D3", image: vitaminD3Img },
  { name: "Cetirizine", image: cetirizineImg },
];

const DrugInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [drugInfo, setDrugInfo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const debounceTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle preloaded data from navigation
  useEffect(() => {
    const state = location.state as { medicineName?: string; preloadedInfo?: string } | null;
    if (state?.medicineName && state?.preloadedInfo) {
      setSearchQuery(state.medicineName);
      setDrugInfo(state.preloadedInfo);
      // Clear the state to prevent re-loading on component re-render
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
    setAudioUrl("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drug-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ medicineName: searchTerm }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let accumulatedText = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulatedText += content;
              setDrugInfo(accumulatedText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching drug info:", error);
      toast.error("Failed to fetch drug information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!drugInfo) return;

    setIsGeneratingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text: drugInfo },
      });

      if (error) throw error;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      toast.success("Audio generated successfully!");
    } catch (error) {
      console.error("Error generating audio:", error);
      toast.error("Failed to generate audio. Please try again.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const handleImageAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setShowImageDialog(false);
    setShowCameraModal(false);
    setDrugInfo("");
    setSearchQuery("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;

          const { data, error } = await supabase.functions.invoke('analyze-medication', {
            body: { imageBase64: base64Image }
          });

          if (error) throw error;

          // Extract medicine name from the first line or heading
          const medicationInfo = data.medicationInfo;
          const firstLine = medicationInfo.split('\n')[0].replace(/^#+\s*/, '').trim();
          setSearchQuery(firstLine || "Medication from Image");
          
          // Hide loading screen immediately and start typing effect
          setIsAnalyzing(false);
          
          // Simulate typing effect for analyzed medication
          let currentIndex = 0;
          const typingInterval = setInterval(() => {
            if (currentIndex < medicationInfo.length) {
              setDrugInfo(medicationInfo.slice(0, currentIndex + 1));
              currentIndex++;
            } else {
              clearInterval(typingInterval);
            }
          }, 10);
          
          toast.success("Medication analyzed successfully!");
        } catch (error) {
          console.error('Error analyzing medication:', error);
          toast.error("Failed to analyze medication image");
          setIsAnalyzing(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read image file");
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error('Error analyzing medication:', error);
      toast.error("Failed to analyze medication image");
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      handleImageAnalysis(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleImageAnalysis(file);
  };

  const handleCheckAvailability = () => {
    const medicineName = searchQuery || "Medication";
    navigate('/medicine-availability', {
      state: {
        medicines: [{
          name: medicineName,
          dosage: "As prescribed"
        }]
      }
    });
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
          <Button
            onClick={() => setShowImageDialog(true)}
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 hover:bg-white/20 text-white ml-auto"
          >
            <Camera className="w-5 h-5" />
          </Button>
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
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                    <img 
                      src={medicine.image} 
                      alt={medicine.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-center">{medicine.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {drugInfo && !isLoading && (
          <div className="space-y-4 animate-fade-in">
            <Card className="overflow-hidden border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{searchQuery}</CardTitle>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {audioUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleAudioPlayback}
                        className="rounded-full"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      className="gap-2 text-xs sm:text-sm"
                      size="sm"
                    >
                      {isGeneratingAudio ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Generate Audio</span>
                      <span className="sm:hidden">Audio</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert 
                  prose-headings:text-foreground prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0
                  prose-h2:text-lg prose-h2:bg-gradient-to-r prose-h2:from-primary/10 prose-h2:to-transparent prose-h2:p-3 prose-h2:rounded-lg prose-h2:border-l-4 prose-h2:border-primary
                  prose-h3:text-base prose-h3:text-primary
                  prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:text-foreground prose-ul:space-y-2 prose-ul:my-4
                  prose-ol:text-foreground prose-ol:space-y-2 prose-ol:my-4
                  prose-li:text-foreground prose-li:leading-relaxed
                  [&>*:first-child]:mt-0">
                  <ReactMarkdown>{drugInfo}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
            
            <Button
              onClick={handleCheckAvailability}
              className="w-full gap-2 h-auto py-4 text-sm sm:text-base"
              size="lg"
            >
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">Check Availability in Nearby Pharmacies</span>
            </Button>
          </div>
        )}

        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} className="hidden" />
        )}

        {!drugInfo && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Search for any medicine to get detailed AI-powered information</p>
          </div>
        )}
      </main>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyze Medication</DialogTitle>
            <DialogDescription>
              Take a photo or upload an image of your medication to get AI-powered information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => {
                setShowImageDialog(false);
                setShowCameraModal(true);
              }}
              className="w-full h-24 flex flex-col gap-2"
              variant="outline"
            >
              <Camera className="w-8 h-8" />
              <span>Take Photo</span>
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 flex flex-col gap-2"
              variant="outline"
            >
              <Upload className="w-8 h-8" />
              <span>Upload Image</span>
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </DialogContent>
      </Dialog>

      <CameraModal
        open={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />

      {isAnalyzing && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing medication...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugInfo;
