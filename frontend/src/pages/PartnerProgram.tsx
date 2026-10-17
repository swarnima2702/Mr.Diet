import React, { useEffect, useState } from "react";
import { 
    Gift, Copy, Wallet, ArrowRight, History, Eye,
    Users, TrendingUp, Info, CheckCircle2, Clock 
} from "lucide-react";
import UserSidebar from "@/components/UserSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api, getLogoUrl } from "@/lib/api";

const PartnerProgram = () => {
    const [stats, setStats] = useState<any>({ referrals: 0, total_pay: 0, balance: 0 });
    const [history, setHistory] = useState<any>({ earnings: [], payouts: [], referrals: [] });
    const [payoutAmount, setPayoutAmount] = useState("");
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);

    const user = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
    const [referralCode, setReferralCode] = useState(user.referral_code || user.id);
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resStats = await api.partner.getStats(user.id);
                setStats(resStats);
                if (resStats.referral_code) {
                    setReferralCode(resStats.referral_code);
                }
                
                const resHistory = await api.partner.getHistory(user.id);
                setHistory(resHistory);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success("Link Copied", { description: "Your referral link is ready to share." });
    };

    const handleRequestPayout = async () => {
        if (!payoutAmount || isNaN(Number(payoutAmount))) return;
        const minPayout = Number(stats.min_payout || 100);
        if (Number(payoutAmount) < minPayout) {
            toast.error(`Min ₹${minPayout} required for payout`);
            return;
        }
        if (Number(payoutAmount) > stats.balance) {
            toast.error("Insufficient balance");
            return;
        }

        setRequesting(true);
        try {
            await api.partner.requestPayout(user.id, Number(payoutAmount));
            toast.success("Request Sent", { description: "Admin will process your payout soon." });
            setPayoutAmount("");
            // Refresh stats
            const resStats = await api.partner.getStats(user.id);
            setStats(resStats);
        } catch (err) {
            toast.error("Request Failed");
        } finally {
            setRequesting(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    const renderRichText = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={i} className="text-white font-bold">{part.slice(2, -2)}</span>;
            }
            return part;
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex overflow-hidden">
            <UserSidebar logoUrl={logoUrl} onSignOut={handleSignOut} />

            <main className="flex-1 min-h-screen overflow-y-auto px-4 py-8 md:px-8 pt-24 lg:pt-8 text-foreground selection:bg-[#eab308]/30">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Top Row: Main Card + Payout Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Main Hero Card */}
                        <Card className="lg:col-span-2 bg-[#0f0f0f] border-white/5 rounded-xl p-6 relative overflow-hidden group">
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[#eab308] text-[9px] font-bold tracking-widest uppercase mb-1">
                                        <Gift className="h-3.5 w-3.5" /> Partner Program
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                        Earn while you <span className="text-[#eab308]">Transform</span>
                                    </h1>
                                    <p className="text-muted-foreground text-[11px] max-w-sm">
                                        {renderRichText(settings.affiliate_text || "Share your transformation with friends and earn upto **₹200 per referral** instantly in your wallet.")}
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row items-end md:items-center gap-6 pt-2">
                                    <div className="flex-1 space-y-2 w-full">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Your Referral Link</label>
                                        <div className="relative">
                                            <Input 
                                                readOnly 
                                                value={referralLink} 
                                                className="bg-black/60 pl-3 pr-12 text-[10px] h-10 font-mono"
                                            />
                                            <button 
                                                onClick={copyLink} 
                                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-[#eab308] text-black hover:scale-105 transition-transform"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 px-4 border-l border-white/5">
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Referrals</p>
                                            <p className="text-xl font-bold text-white leading-none">{stats.referrals}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Pay</p>
                                            <p className="text-xl font-bold text-white leading-none">₹{stats.total_pay}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Payout Card */}
                        <Card className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-[#00ff9d]/5 border border-[#00ff9d]/20 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-[#00ff9d]" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Available for Payout</p>
                                <h3 className="text-3xl font-bold text-white tracking-tighter">₹{stats.balance}</h3>
                            </div>
                            
                            <div className="w-full space-y-2 pt-1">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px]">₹</span>
                                    <Input 
                                        type="number" 
                                        placeholder="Amount" 
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        className="pl-6 h-10 rounded-lg text-sm font-semibold"
                                    />
                                </div>
                                <Button 
                                    onClick={handleRequestPayout}
                                    disabled={requesting || !payoutAmount}
                                    variant="luxury" 
                                    className="w-full h-10 text-[10px] font-bold"
                                >
                                    {requesting ? "..." : "Request Payout"} <ArrowRight className="ml-1.5 h-3 w-3" />
                                </Button>
                                <p className="text-[8px] text-muted-foreground/60 italic leading-none">Min ₹{stats.min_payout || 100} required.</p>
                            </div>
                        </Card>
                    </div>

                    {/* Middle Row: How it works + Recent Earnings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <Card className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 space-y-6">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                <Info className="h-3.5 w-3.5 text-[#eab308]" /> How it works
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { step: "01", icon: Copy, title: "Copy Link", desc: "Get your referral link above." },
                                    { step: "02", icon: Users, title: "Share Plan", desc: "Invite friends to join." },
                                    { step: "03", icon: Clock, title: "Wait for Join", desc: "Friend subscribes." },
                                    { step: "04", icon: CheckCircle2, title: "Get Rewarded", desc: "Earn commission instantly." },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-center gap-4 group">
                                        <div className="text-sm font-bold text-white/10 group-hover:text-[#eab308] transition-colors">{item.step}</div>
                                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                            <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold leading-tight">{item.title}</h4>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 space-y-6 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="h-3.5 w-3.5 text-[#00ff9d]" /> Recent Earnings
                                </h3>
                            </div>
                            <div className="border border-white/10 rounded-lg overflow-hidden min-h-[120px] max-h-[210px] overflow-y-auto no-scrollbar shadow-inner">
                                <table className="w-full text-left text-[10px]">
                                     <thead className="bg-white/5 border-b border-white/10">
                                         <tr>
                                             <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">User</th>
                                             <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Reward</th>
                                             <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Note</th>
                                             <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                         </tr>
                                     </thead>
                                    <tbody className="divide-y divide-white/5">
                                         {history?.earnings?.length > 0 ? history.earnings.map((row: any) => (
                                             <tr key={row.id} className="hover:bg-white/5 transition-colors">
                                                 <td className={`px-4 py-2.5 font-semibold ${(Number(row.is_admin_adjustment) === 1 || !row.referred_user_id) ? (parseFloat(row.amount) < 0 ? 'text-red-500' : 'text-emerald-400') : 'text-white/90'}`}>
                                                     {(Number(row.is_admin_adjustment) === 1 || !row.referred_user_id) ? (
                                                         <span className="flex items-center gap-1.5">
                                                             Admin Adjustment
                                                         </span>
                                                     ) : (
                                                         row.user_name || 'Referral Bonus'
                                                     )}
                                                 </td>
                                                  <td className={`px-4 py-2.5 font-bold ${parseFloat(row.amount) < 0 ? 'text-red-500' : 'text-[#00ff9d]'}`}>
                                                      {parseFloat(row.amount) < 0 ? '' : '+'}₹{row.amount}
                                                  </td>
                                                 <td className={`px-4 py-2.5 text-xs ${(Number(row.is_admin_adjustment) === 1 || !row.referred_user_id) && parseFloat(row.amount) < 0 ? 'text-red-400/80' : 'text-muted-foreground/60'}`}>
                                                     {row.description || '---'}
                                                 </td>
                                                 <td className="px-4 py-2.5 text-muted-foreground/60">{new Date(row.created_at).toLocaleDateString()}</td>
                                             </tr>
                                         )) : (
                                             <tr>
                                                 <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">No earnings yet.</td>
                                             </tr>
                                         )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Bottom Row: Payout History + Referral History */}
                    <div className="space-y-5">
                        <Card className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 space-y-5">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                <History className="h-3.5 w-3.5 text-[#3399ff]" /> Payout History
                            </h3>
                            <div className="border border-white/10 rounded-lg overflow-hidden overflow-x-auto no-scrollbar">
                                <table className="w-full text-left text-[10px] min-w-[500px]">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Ref</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history?.payouts?.length > 0 ? history.payouts.map((row: any) => (
                                            <tr key={row.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-2.5 font-bold text-white/90">₹{row.amount}</td>
                                                <td className="px-4 py-2.5 text-muted-foreground/60">{new Date(row.requested_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                                        row.status === 'approved' || row.status === 'processed' ? 'bg-green-500/10 text-green-500' : 
                                                        row.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-muted-foreground/40">{row.transaction_id || '---'}</td>
                                                <td className="px-4 py-2.5">
                                                    {row.screenshot_url ? (
                                                        <a 
                                                            href={getLogoUrl(row.screenshot_url)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[#eab308] hover:text-[#eab308]/80 transition-colors"
                                                            title="View Receipt"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </a>
                                                    ) : '---'}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">No payout history.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <Card className="bg-[#0f0f0f] border-white/5 rounded-xl p-6 space-y-5">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                <Users className="h-3.5 w-3.5 text-purple-400" /> Referral History
                            </h3>
                            <div className="border border-white/10 rounded-lg overflow-hidden overflow-x-auto no-scrollbar">
                                <table className="w-full text-left text-[10px] min-w-[500px]">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">User</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Joined</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.referrals_list && history.referrals_list.length > 0 ? history.referrals_list.map((row: any) => (
                                            <tr key={row.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-2.5 font-bold text-white/90">{row.user_name}</td>
                                                <td className="px-4 py-2.5 text-muted-foreground/60">{new Date(row.created_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-2.5 text-green-500 font-bold uppercase text-[8px] tracking-tight">SUBSCRIBED</td>
                                                <td className="px-4 py-2.5 text-white/80 font-semibold">₹{row.commission_amount}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">No referrals yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default PartnerProgram;
