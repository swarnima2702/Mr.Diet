import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";

const AdminAuth = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await api.auth.login(email, password);
            
            if (data.user) {
                if (data.user.is_admin === 1 || data.user.is_admin === "1" || data.user.is_admin === true) {
                    localStorage.setItem("mrdiet_auth_user", JSON.stringify(data.user));
                    toast.success("Admin Access Granted", { description: "Welcome to the Command Center." });
                    navigate("/admin", { replace: true });
                } else {
                    toast.error("Access Denied", { description: "You do not have administrative privileges." });
                }
            }
        } catch (error: any) {
            toast.error("Auth Error", { description: error.message || "Invalid credentials" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-md bg-black/40 backdrop-blur-3xl border-gold/10 shadow-[0_0_50px_rgba(212,175,55,0.05)] relative z-10 transition-all duration-500 hover:border-gold/20">
                <CardHeader className="text-center pb-8 border-b border-gold/5">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 mb-6 group">
                        <ShieldCheck className="h-8 w-8 text-gold transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <CardTitle className="text-3xl font-black gold-text tracking-tighter uppercase italic">
                        Admin Portal
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
                        Authorization Required
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@mrdiet.com"
                                    className="pl-10 bg-secondary/20 border-border/40 h-12 rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/50 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" title="Enter your secure password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Key</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 bg-secondary/20 border-border/40 h-12 rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/50 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-12 bg-gold text-black hover:bg-gold/90 border-0 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]" 
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                "Initiate Access"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center border-t border-gold/5 pt-6">
                        <p className="text-[9px] text-muted-foreground/40 font-medium tracking-tight">
                            Unauthorized access attempts are logged.<br/>System managed by mrdiet Engine.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAuth;
