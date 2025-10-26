import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InsightData {
  dailyScore: number;
  overallScore: number;
  insights: string[];
  reminders: string[];
}

const Insights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    fetchPrescriptionsAndInsights();
  }, []);

  const fetchPrescriptionsAndInsights = async () => {
    try {
      setLoading(true);

      // Fetch user's prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from("prescriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (prescriptionsError) throw prescriptionsError;

      setPrescriptions(prescriptionsData || []);

      if (!prescriptionsData || prescriptionsData.length === 0) {
        setInsightData({
          dailyScore: 0,
          overallScore: 0,
          insights: ["No prescriptions found. Upload your first prescription to get started!"],
          reminders: ["Start by scanning a prescription to receive personalized insights."],
        });
        setLoading(false);
        return;
      }

      // Get AI insights
      const { data, error } = await supabase.functions.invoke("prescription-insights", {
        body: { prescriptions: prescriptionsData },
      });

      if (error) throw error;

      setInsightData(data);
    } catch (error: any) {
      console.error("Error fetching insights:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load insights",
        variant: "destructive",
      });
      
      // Fallback data
      setInsightData({
        dailyScore: 0,
        overallScore: 0,
        insights: ["Unable to generate insights at this time."],
        reminders: ["Please try again later."],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[image:var(--gradient-header)] text-white px-6 pt-8 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Health Insights</h1>
            <p className="text-sm opacity-90">AI-powered prescription monitoring</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 -mt-6">
        {loading ? (
          <Card className="bg-card mb-6">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Analyzing your prescriptions...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Daily Adherence
                  </CardTitle>
                  <CardDescription>Your medication compliance today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        {insightData?.dailyScore || 0}%
                      </span>
                    </div>
                    <Progress value={insightData?.dailyScore || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Overall Progress
                  </CardTitle>
                  <CardDescription>Your health journey score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        {insightData?.overallScore || 0}%
                      </span>
                    </div>
                    <Progress value={insightData?.overallScore || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="bg-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Insights
                </CardTitle>
                <CardDescription>Personalized recommendations based on your prescriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insightData?.insights.map((insight, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <p className="text-sm flex-1">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reminders & Warnings */}
            {insightData?.reminders && insightData.reminders.length > 0 && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Important Reminders
                  </CardTitle>
                  <CardDescription>Things to keep in mind</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insightData.reminders.map((reminder, index) => (
                      <div key={index} className="flex gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm flex-1">{reminder}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prescription Summary */}
            <Card className="bg-card mt-6">
              <CardHeader>
                <CardTitle className="text-base">Current Prescriptions</CardTitle>
                <CardDescription>
                  {prescriptions.length} {prescriptions.length === 1 ? "prescription" : "prescriptions"} being monitored
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{prescription.prescription_name || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/my-prescriptions")}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Insights;
