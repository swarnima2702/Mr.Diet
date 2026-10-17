import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    User, Mail, Phone, MapPin, 
    Shield, Lock, Save, ArrowRight,
    Scale, Ruler, Activity, Heart,
    LogOut
} from "lucide-react";
import UserSidebar from "@/components/UserSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, getLogoUrl } from "@/lib/api";
import { calculateBMI } from "@/lib/utils/diet";
import NotificationSettings from "@/components/NotificationSettings";

const Profile = () => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form States
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const currentUser = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser.id) {
            navigate("/auth", { replace: true });
            return;
        }
        const fetchProfile = async () => {
            try {
                const data = await api.profiles.getByUserId(currentUser.id);
                if (!data) throw new Error("Profile not found");
                setUserData(data);
                setName(data.name || "");
                setPhone(data.phone || "");
                setCity(data.city || "");
            } catch (err) {
                console.error("Profile Fetch Error Details:", err);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser.id]);

    // Handle smooth scroll to hash sections
    const { hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [hash, loading]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            await api.profiles.update(currentUser.id, {
                name,
                phone,
                city,
                password: newPassword || undefined
            });
            
            // Sync with localStorage
            const updatedProfile = await api.profiles.getByUserId(currentUser.id);
            if (updatedProfile) {
                localStorage.setItem("mrdiet_profile_data", JSON.stringify(updatedProfile));
                setUserData(updatedProfile);
            }

            toast.success("Profile Updated", { description: "Changes saved successfully." });
            setNewPassword("");
        } catch (err) {
            toast.error("Update Failed");
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    if (loading) return null;

    const bmi = userData ? calculateBMI(userData.height, userData.weight) : "---";

    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex overflow-hidden">
            <UserSidebar logoUrl={logoUrl} gender={userData?.gender} onSignOut={handleSignOut} />

            <main className="flex-1 min-h-screen overflow-y-auto px-4 py-8 md:px-8 pt-24 lg:pt-8 text-foreground">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6" data-aos="fade-right">
                        <div className="space-y-1">
                             <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#eab308]/10 text-[#eab308] text-[8px] font-bold tracking-widest uppercase mb-1">
                                MEMBER PROFILE
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                Profile <span className="text-[#eab308]">Settings</span>
                            </h1>
                            <p className="text-muted-foreground text-[11px]">
                                Manage your personal information and health preferences.
                            </p>
                        </div>
                        <Button 
                            variant="destructive" 
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 text-[10px] font-bold px-4 h-9"
                            onClick={handleSignOut}
                        >
                            <LogOut className="mr-1.5 h-3.5 w-3.5" /> SIGN OUT
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column: Account Details */}
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="lg:col-span-2 space-y-6">
                            <Card id="settings" className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 scroll-mt-24" data-aos="fade-up">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#eab308]/5 border border-[#eab308]/20 flex items-center justify-center">
                                            <Shield className="h-4.5 w-4.5 text-[#eab308]" />
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-bold uppercase tracking-widest leading-none">Account Details</h3>
                                            <p className="text-[9px] text-muted-foreground/60 leading-none mt-1">Keep your contact info up to date.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                                <Input 
                                                    value={name} 
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="pl-10 h-10 rounded-lg text-xs font-semibold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 opacity-60">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Email Address</Label>
                                            <div className="relative cursor-not-allowed">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                                                <Input readOnly value={userData?.email} className="pl-10 h-10 rounded-lg text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                                <Input 
                                                    value={phone} 
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-10 h-10 rounded-lg text-xs font-semibold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">City / Location</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                                <Input 
                                                    value={city} 
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className="pl-10 h-10 rounded-lg text-xs font-semibold" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-[#0f0f0f] border-white/5 rounded-xl p-6" data-aos="fade-up">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-center">
                                            <Lock className="h-4.5 w-4.5 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-bold uppercase tracking-widest leading-none">Security</h3>
                                            <p className="text-[9px] text-muted-foreground/60 leading-none mt-1">Update your password correctly.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-tight">New Password</Label>
                                        <Input 
                                            type="password"
                                            placeholder="Leave blank to keep current"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-10 rounded-lg text-xs max-w-sm" 
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Notification Preferences */}
                            <Card id="notifications" className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 scroll-mt-24" data-aos="fade-up">
                                <NotificationSettings userData={userData} />
                            </Card>

                            <div className="flex justify-end">
                                <Button 
                                    type="submit"
                                    disabled={saving}
                                    variant="luxury" 
                                    className="h-10 px-8 text-[11px] font-bold rounded-lg group"
                                >
                                    {saving ? "Saving..." : "SAVE CHANGES"} <Save className="ml-2 h-3.5 w-3.5 group-hover:scale-105 transition-transform" />
                                </Button>
                            </div>
                        </form>

                        {/* Right Column: Health Snapshot */}
                        <div className="space-y-6">
                            <Card className="bg-[#0f0f0f] border-white/5 rounded-xl overflow-hidden shadow-2xl" data-aos="fade-left">
                                <div className="bg-[#1a1608] border-b border-[#eab308]/20 px-6 py-4">
                                    <h3 className="text-[10px] font-bold text-[#eab308] uppercase tracking-[0.2em]">Health Snapshot</h3>
                                </div>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex flex-col items-center justify-center text-center space-y-1 py-2 border-b border-white/5">
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Body Mass Index</p>
                                        <div className="text-4xl font-bold text-white tracking-tighter">{bmi}</div>
                                        <div className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 uppercase tracking-[0.15em] mt-1">
                                            Optimal 
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1">
                                            <div className="flex items-center gap-1.5 mb-1 opacity-60">
                                                <Scale className="h-2.5 w-2.5 text-[#3399ff]" />
                                                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Weight</span>
                                            </div>
                                            <p className="text-lg font-bold text-white">{userData?.weight} <span className="text-[10px] font-normal text-muted-foreground">kg</span></p>
                                        </div>
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1">
                                            <div className="flex items-center gap-1.5 mb-1 opacity-60">
                                                <Ruler className="h-2.5 w-2.5 text-[#00ff9d]" />
                                                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Height</span>
                                            </div>
                                            <p className="text-lg font-bold text-white">{userData?.height} <span className="text-[10px] font-normal text-muted-foreground">cm</span></p>
                                        </div>
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1">
                                            <div className="flex items-center gap-1.5 mb-1 opacity-60">
                                                <Activity className="h-2.5 w-2.5 text-[#ff4d00]" />
                                                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Age</span>
                                            </div>
                                            <p className="text-lg font-bold text-white">{userData?.age}</p>
                                        </div>
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1">
                                            <div className="flex items-center gap-1.5 mb-1 opacity-60">
                                                <Heart className="h-2.5 w-2.5 text-red-500" />
                                                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Plan</span>
                                            </div>
                                            <p className="text-sm font-bold text-[#eab308] uppercase italic leading-none">{(userData?.plan?.charAt(0).toUpperCase() + userData?.plan?.slice(1)) || 'Weekly'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-[9px] font-black h-9 tracking-widest uppercase transition-all" onClick={() => window.location.href='/dashboard'}>
                                            Back to Dashboard <ArrowRight className="ml-1.5 h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-4 bg-gradient-to-br from-[#1a1608] to-[#050505] rounded-xl border border-[#eab308]/10 space-y-2">
                                <h4 className="text-[9px] font-bold text-[#eab308] uppercase leading-none">Security Note</h4>
                                <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                                    Your data is encrypted. We use these metrics ONLY to optimize your meal recommendations.
                                </p>
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
};

export default Profile;
