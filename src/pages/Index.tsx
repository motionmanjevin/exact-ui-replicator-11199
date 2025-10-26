import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, FileText, MapPin, Pill, Home, ScanLine, Activity, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import QuickActionCard from "@/components/QuickActionCard";
import MedicationCard from "@/components/MedicationCard";
import ReminderCard from "@/components/ReminderCard";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[image:var(--gradient-header)] text-white px-6 pt-8 pb-8 rounded-b-[2rem]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Good morning</p>
            <h1 className="text-2xl font-bold">Hi, Ama</h1>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Bell className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for medication"
            className="pl-12 h-12 bg-white border-0 rounded-2xl text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 -mt-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <QuickActionCard icon={FileText} label="My Prescriptions" onClick={() => navigate("/my-prescriptions")} />
          <QuickActionCard icon={MapPin} label="Nearby Pharmacies" />
          <QuickActionCard icon={Pill} label="AI Drug Info" onClick={() => navigate("/drug-info")} />
        </div>

        {/* Current Medications */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Current Medications</h2>
            <button className="text-primary text-sm font-medium">See all</button>
          </div>
          <MedicationCard
            name="Paracetamol"
            dosage="500mg"
            instructions="Take 2 tablets twice daily"
            daysLeft={6}
            totalDays={10}
          />
        </section>

        {/* Medication Reminders */}
        <section>
          <h2 className="text-lg font-bold mb-4">Medication Reminders</h2>
          <div className="space-y-3">
            <ReminderCard
              name="Paracetamol 500mg"
              amount="2 tablets"
              time="8:00 AM"
              actionType="taken"
            />
            <ReminderCard
              name="Vitamin D3"
              amount="1 capsule"
              time="12:00 PM"
              actionType="log"
              icon="capsule"
            />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => navigate("/upload-prescription")}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <ScanLine className="w-6 h-6" />
            <span className="text-xs">Scan</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <Activity className="w-6 h-6" />
            <span className="text-xs">Insights</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
