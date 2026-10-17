import React, { useEffect, useState } from "react";
import { 
    CreditCard, Calendar, CheckCircle2, 
    XCircle, Clock, Receipt, ArrowLeft 
} from "lucide-react";
import UserSidebar from "@/components/UserSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getLogoUrl } from "@/lib/api";

const PaymentHistory = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const user = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
    const settings = JSON.parse(window.localStorage.getItem("app_public_settings") || "{}");
    const logoUrl = getLogoUrl(settings.logo_dark || "");

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await api.subscriptions.getAllByUserId(user.id);
                setPayments(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, [user.id]);

    const handleSignOut = () => {
        localStorage.removeItem("mrdiet_auth_user");
        window.location.href = "/auth";
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default:
                return 'bg-red-500/10 text-red-500 border-red-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'success':
                return <CheckCircle2 className="h-3 w-3" />;
            case 'pending':
                return <Clock className="h-3 w-3" />;
            default:
                return <XCircle className="h-3 w-3" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground flex overflow-hidden">
            <UserSidebar logoUrl={logoUrl} onSignOut={handleSignOut} />

            <main className="flex-1 min-h-screen overflow-y-auto px-4 py-8 md:px-8 pt-24 lg:pt-8 text-foreground selection:bg-gold/30">
                <div className="max-w-7xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <Receipt className="h-7 w-7 text-gold" /> Payment History
                            </h1>
                            <p className="text-muted-foreground text-xs font-medium">
                                Tracking your membership subscriptions and billing events.
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-secondary/20 border-white/5 text-[10px] font-bold uppercase tracking-widest h-9"
                            onClick={() => window.location.href='/dashboard'}
                        >
                            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Dashboard
                        </Button>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-[#0f0f0f] border-white/5 p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Spent</p>
                                <p className="text-xl font-black text-white">₹{payments.reduce((acc, p) => p.payment_status === 'completed' ? acc + parseFloat(p.amount) : acc, 0).toLocaleString()}</p>
                            </div>
                        </Card>
                        <Card className="bg-[#0f0f0f] border-white/5 p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Active Plans</p>
                                <p className="text-xl font-black text-white">{payments.filter(p => p.payment_status === 'completed' && new Date(p.end_date) > new Date()).length}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Payments Table */}
                    <Card className="bg-[#0f0f0f] border-white/5 overflow-hidden">
                        <CardHeader className="border-b border-white/5 py-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Transaction List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto no-scrollbar">
                                <Table>
                                    <TableHeader className="bg-white/[0.02]">
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-muted-foreground px-6">Plan Details</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-muted-foreground">Amount</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-muted-foreground">Date</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-muted-foreground text-right px-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array(3).fill(0).map((_, i) => (
                                                <TableRow key={i} className="border-white/5 animate-pulse">
                                                    <TableCell colSpan={4} className="h-16 bg-white/[0.01]" />
                                                </TableRow>
                                            ))
                                        ) : payments.length > 0 ? (
                                            payments.map((p) => (
                                                <TableRow key={p.id} className="group hover:bg-gold/[0.02] border-white/5 transition-colors h-16">
                                                    <TableCell className="px-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white group-hover:text-gold transition-colors">{p.plan_type}</span>
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase">{p.plan_days} Days Membership</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-black text-white">₹{parseFloat(p.amount).toLocaleString()}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-[11px] font-medium">{new Date(p.start_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right px-6">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(p.payment_status)}`}>
                                                            {getStatusIcon(p.payment_status)}
                                                            {p.payment_status}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                                        <Receipt className="h-10 w-10" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">No transactions found</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer Note */}
                    <div className="p-4 rounded-xl bg-gold/5 border border-gold/10 flex items-start gap-3">
                        <Clock className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Need help with a payment? Provide the transaction date and plan details when contacting our support team via <span className="text-white font-bold underline cursor-pointer">WhatsApp</span>.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default PaymentHistory;
