import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, MapPin, Bell, Globe, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      
      // Fetch prescription count
      const { count } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setPrescriptionCount(count || 0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    toast({
      title: "Logged out successfully",
    });
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[image:var(--gradient-header)] text-white px-6 pt-8 pb-12">
        <button onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 bg-white">
            <AvatarFallback className="text-primary text-xl">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{getUserName()}</h1>
            <p className="text-sm opacity-90">{user.email}</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 -mt-8 mb-6">
        <div className="grid grid-cols-3 gap-3 bg-card rounded-2xl p-4 shadow-[var(--shadow-card)]">
          <button 
            onClick={() => navigate('/my-prescriptions')}
            className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <p className="text-2xl font-bold">{prescriptionCount}</p>
            <p className="text-xs text-muted-foreground">Prescriptions</p>
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-2xl font-bold">85%</p>
            <p className="text-xs text-muted-foreground">Adherence</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <section className="px-6 mb-6">
        <h2 className="text-sm text-muted-foreground mb-3">Personal Information</h2>
        <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] divide-y divide-border">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{getUserName()}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">+233 24 123 4567</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">Accra, Greater Accra</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="px-6 mb-6">
        <h2 className="text-sm text-muted-foreground mb-3">Settings</h2>
        <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-muted-foreground">Enable push notifications</p>
            </div>
            <Switch 
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Language</p>
              <p className="text-sm text-muted-foreground">English</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

        </div>
      </section>


      {/* Logout Button */}
      <div className="px-6 mb-6">
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => navigate('/upload-prescription')}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Scan</span>
          </button>
          <button 
            onClick={() => navigate('/insights')}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Insights</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-primary">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Profile;
