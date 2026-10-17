import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Utensils, Users, Settings, LogOut, ChevronRight, Menu, History as HistoryIcon, Activity, Droplets, Tag, Smartphone, Apple } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAppConfig } from "@/hooks/useAppConfig";

interface UserSidebarProps {
    logoUrl?: string;
    gender?: string;
    onSignOut: () => void;
}

const UserSidebar = ({ logoUrl, gender, onSignOut }: UserSidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const displayLogo = logoUrl || "/logo.png";
    const [open, setOpen] = useState(false);
    const config = useAppConfig();

    const profileData = JSON.parse(localStorage.getItem("mrdiet_profile_data") || "{}");
    const rawGender = (gender || profileData.gender)?.toString().toLowerCase().trim();
    const isFemale = rawGender === "women" || rawGender === "female";

    const playStoreUrl: string = (config.play_store_url || "").trim();
    const appStoreUrl: string = (config.app_store_url || "").trim();

    const handleStoreClick = (platform: "playstore" | "appstore", url: string) => {
        setOpen(false);
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            navigate(`/coming-soon?platform=${platform}`);
        }
    };

    const navItems = [
        { label: "HOME PAGE", path: "/", icon: Home },
        { label: "MY DIET PLAN", path: "/dashboard", icon: Utensils, hasSub: true },
        { label: "HEALTH METRICS", path: "/health-metrics", icon: Activity },
        { label: "PRICING & PLANS", path: "/pricing", icon: Tag },
        isFemale && { label: "PERIOD TRACKER", path: "/period-tracker", icon: Droplets },
        { label: "PARTNER PROGRAM", path: "/partner", icon: Users },
        { label: "PAYMENT HISTORY", path: "/payments", icon: HistoryIcon },
        { label: "PROFILE SETTINGS", path: "/profile", icon: Settings },
    ].filter(Boolean) as any[];

    const NavContent = () => (
        <div className="flex flex-col h-full bg-[#0a0a0a] py-8">
            {/* Logo */}
            <div className="px-6 mb-10">
                {logoUrl ? (
                    <img src={displayLogo} alt="Logo" className="h-8 object-contain" />
                ) : (
                    <span className="text-xl font-black text-white tracking-tighter italic">mrdiet<span className="text-gold">.</span></span>
                )}
            </div>

            {/* Navigation - Scrollable area */}
            <div className="flex-1 px-4 overflow-y-auto py-2 no-scrollbar">
                <h3 className="px-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.25em] mb-4">Navigation</h3>
                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const displayActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "group flex items-center justify-between px-4 py-2.5 rounded-lg transition-all",
                                    displayActive 
                                        ? "bg-gold/10 text-gold border border-gold/20 shadow-xl shadow-black/40" 
                                        : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn("h-4 w-4", displayActive ? "text-gold" : "text-muted-foreground group-hover:text-foreground")} />
                                    <span className={cn("text-[11px] font-bold tracking-wide uppercase", displayActive ? "text-white" : "text-muted-foreground")}>{item.label}</span>
                                </div>
                                {item.hasSub && <ChevronRight className={cn("h-3 w-3", displayActive ? "text-gold" : "text-muted-foreground/10")} />}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Get the App */}
            <div className="px-4 pt-6 mt-auto border-t border-white/5">
                <h3 className="px-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.25em] mb-3">Get the App</h3>
                <div className="space-y-2 px-1">
                    <button
                        onClick={() => handleStoreClick("playstore", playStoreUrl)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-gold/30 transition-all group"
                    >
                        <Smartphone className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
                        <div className="flex flex-col items-start leading-tight text-left">
                            <span className="text-[8px] text-muted-foreground/70 uppercase tracking-widest">Get it on</span>
                            <span className="text-[11px] font-bold text-white">Google Play</span>
                        </div>
                    </button>
                    <button
                        onClick={() => handleStoreClick("appstore", appStoreUrl)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-gold/30 transition-all group"
                    >
                        <Apple className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
                        <div className="flex flex-col items-start leading-tight text-left">
                            <span className="text-[8px] text-muted-foreground/70 uppercase tracking-widest">Download on the</span>
                            <span className="text-[11px] font-bold text-white">App Store</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Sign Out */}
            <div className="px-4 pt-4 border-t border-white/5">
                <button
                    onClick={onSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
                {logoUrl ? (
                    <img src={displayLogo} alt="Logo" className="h-6 object-contain" />
                ) : (
                    <span className="text-lg font-black text-white italic">mrdiet<span className="text-gold">.</span></span>
                )}

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-white/5">
                            <Menu className="h-5 w-5 text-white" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-[#0a0a0a] border-r border-white/10">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Access your diet plan, health metrics, and period tracker.</SheetDescription>
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Sidebar - Strictly Fixed */}
            <aside className="hidden lg:flex w-64 bg-[#0a0a0a] border-r border-white/5 h-screen fixed top-0 left-0 flex-col z-40">
                <NavContent />
            </aside>
            {/* Spacer for fixed sidebar on desktop */}
            <div className="hidden lg:block w-64 shrink-0" />
        </>
    );
};

export default UserSidebar;
