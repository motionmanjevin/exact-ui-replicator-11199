import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, FileText, MapPin, Pill, Home, ScanLine, Activity, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import QuickActionCard from "@/components/QuickActionCard";
import MedicationCard from "@/components/MedicationCard";
import ReminderCard from "@/components/ReminderCard";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  amount: string;
}

interface Prescription {
  id: string;
  prescription_name: string;
  medicines: Medicine[];
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          fetchPrescriptions();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/onboarding");
      } else {
        fetchPrescriptions();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPrescriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions((data || []) as unknown as Prescription[]);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (createdAt: string, frequency: string) => {
    const startDate = new Date(createdAt);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Default to 30 days prescription duration
    const totalDays = 30;
    const daysLeft = Math.max(0, totalDays - daysPassed);
    return { daysLeft, totalDays };
  };

  const getUserDisplayName = () => {
    if (!session?.user) return "there";
    
    // Try to get name from user metadata first
    const metadata = session.user.user_metadata;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.name) return metadata.name;
    
    // Fallback to email username
    if (session.user.email) {
      return session.user.email.split('@')[0];
    }
    
    return "there";
  };

  const getAllMedicines = () => {
    const allMeds: Array<Medicine & { prescriptionDate: string }> = [];
    prescriptions.forEach(prescription => {
      if (prescription.medicines && Array.isArray(prescription.medicines)) {
        prescription.medicines.forEach((med: Medicine) => {
          allMeds.push({
            ...med,
            prescriptionDate: prescription.created_at
          });
        });
      }
    });
    return allMeds;
  };

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
            <h1 className="text-2xl font-bold">Hi, {getUserDisplayName()}</h1>
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
            <button 
              onClick={() => navigate("/my-prescriptions")}
              className="text-primary text-sm font-medium"
            >
              See all
            </button>
          </div>
          {loading ? (
            <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground">
              Loading medications...
            </div>
          ) : getAllMedicines().length > 0 ? (
            <div className="space-y-3">
              {getAllMedicines().slice(0, 2).map((med, index) => {
                const { daysLeft, totalDays } = calculateDaysLeft(med.prescriptionDate, med.frequency);
                return (
                  <MedicationCard
                    key={index}
                    name={med.name}
                    dosage={med.dosage}
                    instructions={`${med.amount} ${med.frequency}`}
                    daysLeft={daysLeft}
                    totalDays={totalDays}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 text-center">
              <p className="text-muted-foreground mb-3">No active medications</p>
              <button
                onClick={() => navigate("/upload-prescription")}
                className="text-primary text-sm font-medium"
              >
                Upload a prescription to get started
              </button>
            </div>
          )}
        </section>

        {/* Medication Reminders */}
        <section>
          <h2 className="text-lg font-bold mb-4">Medication Reminders</h2>
          {loading ? (
            <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground">
              Loading reminders...
            </div>
          ) : getAllMedicines().length > 0 ? (
            <div className="space-y-3">
              {getAllMedicines().slice(0, 3).map((med, index) => {
                const currentHour = new Date().getHours();
                const morningTime = "8:00 AM";
                const afternoonTime = "2:00 PM";
                const eveningTime = "8:00 PM";
                
                // Determine time based on frequency
                let time = morningTime;
                if (index % 3 === 1) time = afternoonTime;
                if (index % 3 === 2) time = eveningTime;
                
                // Mark morning reminders as taken if it's past 10 AM
                const actionType = (time === morningTime && currentHour > 10) ? "taken" : "log";
                
                return (
                  <ReminderCard
                    key={index}
                    name={`${med.name} ${med.dosage}`}
                    amount={med.amount}
                    time={time}
                    actionType={actionType}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 text-center">
              <p className="text-muted-foreground">No reminders set</p>
            </div>
          )}
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
          <button 
            onClick={() => navigate("/insights")}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <Activity className="w-6 h-6" />
            <span className="text-xs">Insights</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
