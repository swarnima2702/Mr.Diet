import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Search, IndianRupee, TrendingUp, Clock, AlertCircle, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

type Txn = {
    id: number;
    user_id: number;
    user_name?: string;
    profile_name?: string;
    email?: string;
    plan_type: string;
    plan_days: number;
    start_date: string;
    end_date: string;
    amount: string | number;
    payment_method: string;
    payment_status: string;
    transaction_id?: string | null;
    admin_note?: string | null;
};

const STATUS_BADGES: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    upgraded: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    refunded: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const AdminTransactions = () => {
    const user = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
    const [txns, setTxns] = useState<Txn[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [gateway, setGateway] = useState("all");
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<Txn | null>(null);
    const [draft, setDraft] = useState({ payment_status: "", transaction_id: "", admin_note: "" });
    const [saving, setSaving] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const r = await api.admin.transactions.list(user.id, { status, gateway, q });
            setTxns(r.transactions || []);
            setStats(r.stats || null);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user.id) fetchAll(); /* eslint-disable-next-line */ }, [status, gateway]);

    const startEdit = (t: Txn) => {
        setEditing(t);
        setDraft({
            payment_status: t.payment_status || "pending",
            transaction_id: t.transaction_id || "",
            admin_note: t.admin_note || "",
        });
    };

    const save = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await api.admin.transactions.updateStatus(user.id, {
                id: editing.id,
                payment_status: draft.payment_status,
                transaction_id: draft.transaction_id,
                admin_note: draft.admin_note,
            });
            toast.success(`Transaction #${editing.id} updated`);
            setEditing(null);
            fetchAll();
        } catch (e: any) {
            toast.error(e?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const formatINR = (n: any) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                {/* Header */}
                <div className="bg-card/20 border border-border/40 rounded-xl p-5 backdrop-blur-md flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
                        <p className="text-muted-foreground text-xs font-medium">Track payments &amp; manually update status</p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Revenue", value: formatINR(stats.revenue), icon: IndianRupee, color: "text-gold" },
                            { label: "Completed", value: stats.completed_count, icon: TrendingUp, color: "text-emerald-400" },
                            { label: "Pending", value: stats.pending_count, icon: Clock, color: "text-amber-400" },
                            { label: "Failed", value: stats.failed_count, icon: AlertCircle, color: "text-red-400" },
                        ].map((s) => (
                            <Card key={s.label} className="border-border/50 bg-card/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
                                        <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                                    </div>
                                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-xl">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <Label className="text-[10px] uppercase opacity-60">Search</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && fetchAll()}
                                        placeholder="Email / name / txn ID / sub ID"
                                        className="pl-9 bg-background/50 border-border/50"
                                    />
                                </div>
                                <Button onClick={fetchAll} variant="luxuryOutline" className="h-10 px-4 text-xs uppercase tracking-widest font-bold">Go</Button>
                            </div>
                        </div>
                        <div>
                            <Label className="text-[10px] uppercase opacity-60">Status</Label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 bg-background/50 border border-border/50 rounded-md px-3 font-bold text-sm">
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="upgraded">Upgraded</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-[10px] uppercase opacity-60">Gateway</Label>
                            <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full h-10 bg-background/50 border border-border/50 rounded-md px-3 font-bold text-sm">
                                <option value="all">All</option>
                                <option value="razorpay">Razorpay</option>
                                <option value="cashfree">Cashfree</option>
                                <option value="free">Free / Trial</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">All Transactions ({txns.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-10 text-center text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />Loading...</div>
                        ) : txns.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">No transactions match these filters.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-border/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                                            <th className="py-3 pr-3">ID</th>
                                            <th className="py-3 pr-3">Date</th>
                                            <th className="py-3 pr-3">User</th>
                                            <th className="py-3 pr-3">Plan</th>
                                            <th className="py-3 pr-3">Amount</th>
                                            <th className="py-3 pr-3">Gateway</th>
                                            <th className="py-3 pr-3">Status</th>
                                            <th className="py-3 pr-3">Txn ID</th>
                                            <th className="py-3 pr-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {txns.map((t) => (
                                            <tr key={t.id} className="border-b border-border/10 hover:bg-white/[0.02]">
                                                <td className="py-3 pr-3 text-muted-foreground font-mono text-xs">#{t.id}</td>
                                                <td className="py-3 pr-3 text-xs">{String(t.start_date).slice(0, 10)}</td>
                                                <td className="py-3 pr-3">
                                                    <div className="text-white text-xs">{t.user_name || t.profile_name || "—"}</div>
                                                    <div className="text-[10px] text-muted-foreground">{t.email}</div>
                                                </td>
                                                <td className="py-3 pr-3 capitalize">{t.plan_type}</td>
                                                <td className="py-3 pr-3 font-bold">{formatINR(t.amount)}</td>
                                                <td className="py-3 pr-3 capitalize text-xs">{t.payment_method || "—"}</td>
                                                <td className="py-3 pr-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-black tracking-widest uppercase ${STATUS_BADGES[t.payment_status] || "bg-white/5 text-white border-white/10"}`}>
                                                        {t.payment_status}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-3 font-mono text-[10px] text-muted-foreground max-w-[140px] truncate">{t.transaction_id || "—"}</td>
                                                <td className="py-3 pr-3">
                                                    <Button size="sm" variant="luxuryOutline" className="h-8 px-3 text-[10px]" onClick={() => startEdit(t)}>Update</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit modal */}
            {editing && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
                    <Card className="w-full max-w-md bg-background border-gold/20 shadow-2xl rounded-2xl">
                        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Update Transaction #{editing.id}</CardTitle>
                            <button type="button" onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5">
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="rounded-lg bg-secondary/30 p-3 text-xs space-y-1">
                                <div className="flex justify-between"><span className="text-muted-foreground">User</span><span>{editing.user_name} ({editing.email})</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="capitalize">{editing.plan_type}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatINR(editing.amount)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="capitalize">{editing.payment_method || "—"}</span></div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase opacity-60">Payment Status</Label>
                                <select value={draft.payment_status} onChange={(e) => setDraft({ ...draft, payment_status: e.target.value })} className="w-full h-10 bg-background/50 border border-border/50 rounded-md px-3 font-bold text-sm">
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="failed">Failed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="upgraded">Upgraded</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase opacity-60">Gateway Transaction ID (optional)</Label>
                                <Input value={draft.transaction_id} onChange={(e) => setDraft({ ...draft, transaction_id: e.target.value })} placeholder="pay_XXXX / cf_XXXX" className="bg-background/50 border-border/50 font-mono text-xs" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase opacity-60">Admin note (optional)</Label>
                                <textarea value={draft.admin_note} onChange={(e) => setDraft({ ...draft, admin_note: e.target.value })} rows={3} placeholder="Why is this being updated manually?" className="w-full p-3 rounded-md bg-background/50 border border-border/50 text-xs resize-none" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="luxuryOutline" className="flex-1 h-11 font-bold uppercase tracking-widest text-xs" onClick={() => setEditing(null)}>Cancel</Button>
                                <Button variant="luxury" className="flex-1 h-11 font-bold uppercase tracking-widest text-xs" onClick={save} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Save</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminTransactions;
