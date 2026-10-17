import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag, Plus, Trash2, Save, Loader2, TrendingUp, Hash, Power, Clock, Ban } from "lucide-react";
import { toast } from "sonner";

type Coupon = {
    id?: number;
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    max_uses?: number | null;
    used_count?: number;
    min_amount: number;
    applies_to: string; // 'all' | 'daily' | 'weekly' | 'monthly'
    valid_from?: string | null;
    valid_until?: string | null;
    is_active: number | boolean;
};

const blank: Coupon = {
    code: "",
    discount_type: "percent",
    discount_value: 10,
    max_uses: null,
    min_amount: 0,
    applies_to: "all",
    valid_from: "",
    valid_until: "",
    is_active: 1,
};

const AdminCoupons = () => {
    const user = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");
    const [list, setList] = useState<Coupon[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<Coupon>(blank);
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [listData, analyticsData] = await Promise.all([
                api.admin.coupons.list(user.id),
                api.admin.coupons.analytics(user.id),
            ]);
            setList(Array.isArray(listData) ? listData : []);
            setAnalytics(analyticsData);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load coupons");
        } finally {
            setLoading(false);
        }
    };

    const fetchList = fetchAll; // alias for backward refs

    useEffect(() => { if (user.id) fetchAll(); /* eslint-disable-next-line */ }, []);

    const startEdit = (c: Coupon) => {
        setEditingId(c.id || null);
        setDraft({
            ...c,
            valid_from: c.valid_from ? c.valid_from.replace(" ", "T").slice(0, 16) : "",
            valid_until: c.valid_until ? c.valid_until.replace(" ", "T").slice(0, 16) : "",
            max_uses: c.max_uses ?? null,
            is_active: c.is_active ? 1 : 0,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(blank);
    };

    const save = async () => {
        if (!draft.code.trim()) {
            toast.error("Code is required");
            return;
        }
        if (!(draft.discount_value > 0)) {
            toast.error("Discount value must be > 0");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                code: draft.code.trim().toUpperCase(),
                valid_from: draft.valid_from ? draft.valid_from.replace("T", " ") + ":00" : "",
                valid_until: draft.valid_until ? draft.valid_until.replace("T", " ") + ":00" : "",
                max_uses: draft.max_uses === null || draft.max_uses === undefined || (draft.max_uses as any) === "" ? "" : Number(draft.max_uses),
                is_active: draft.is_active ? 1 : 0,
            };
            if (editingId) {
                await api.admin.coupons.update(user.id, editingId, payload);
                toast.success("Coupon updated");
            } else {
                await api.admin.coupons.create(user.id, payload);
                toast.success("Coupon created");
            }
            cancelEdit();
            fetchList();
        } catch (e: any) {
            toast.error(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id?: number) => {
        if (!id) return;
        if (!confirm("Delete this coupon?")) return;
        try {
            await api.admin.coupons.remove(user.id, id);
            toast.success("Deleted");
            fetchList();
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        }
    };

    const toggleActive = async (c: Coupon) => {
        try {
            await api.admin.coupons.update(user.id, c.id!, { is_active: c.is_active ? 0 : 1 });
            fetchList();
        } catch (e: any) {
            toast.error(e?.message || "Toggle failed");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                <div className="relative overflow-hidden bg-card/20 border border-border/40 rounded-xl p-5 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                            <Tag className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Coupon Codes</h1>
                            <p className="text-muted-foreground text-xs font-medium">Create & manage discount codes</p>
                        </div>
                    </div>
                </div>

                {/* Analytics */}
                {analytics && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { label: "Total Coupons", value: analytics.total_coupons, icon: Hash, color: "text-gold" },
                            { label: "Active", value: analytics.active_coupons, icon: Power, color: "text-emerald-400" },
                            { label: "Total Uses", value: analytics.total_redemptions, icon: TrendingUp, color: "text-blue-400" },
                            { label: "Expired", value: analytics.expired_coupons, icon: Clock, color: "text-orange-400" },
                            { label: "Exhausted", value: analytics.exhausted_coupons, icon: Ban, color: "text-red-400" },
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

                {/* Top Coupons */}
                {analytics?.top_coupons?.length > 0 && analytics.total_redemptions > 0 && (
                    <Card className="border-border/50 bg-card/30 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-gold" />
                                Top Performing Coupons
                            </CardTitle>
                            <CardDescription>By redemptions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.top_coupons.filter((c: any) => c.used_count > 0).map((c: any, i: number) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-gold w-5">#{i + 1}</span>
                                            <div>
                                                <p className="font-bold tracking-wider text-gold">{c.code}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`} · {c.applies_to}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white">{c.used_count}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">uses</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Form */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">{editingId ? "Edit Coupon" : "Create New Coupon"}</CardTitle>
                        <CardDescription>{editingId ? `Editing #${editingId}` : "All codes are stored uppercase."}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Code</Label>
                            <Input
                                value={draft.code}
                                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                                placeholder="WELCOME10"
                                className="bg-background/50 border-border/50 font-bold tracking-wider"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Type</Label>
                            <div className="flex bg-background/50 p-1 rounded-lg border border-border/30">
                                {(["percent", "fixed"] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setDraft({ ...draft, discount_type: t })}
                                        className={`flex-1 px-3 py-2 text-xs font-bold rounded-md transition-all uppercase ${draft.discount_type === t ? "bg-gold text-black" : "text-muted-foreground"}`}
                                    >
                                        {t === "percent" ? "% Percent" : "₹ Fixed"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">
                                {draft.discount_type === "percent" ? "Discount %" : "Discount ₹"}
                            </Label>
                            <Input
                                type="number"
                                value={draft.discount_value}
                                onChange={(e) => setDraft({ ...draft, discount_value: parseFloat(e.target.value) || 0 })}
                                className="bg-background/50 border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Min order ₹</Label>
                            <Input
                                type="number"
                                value={draft.min_amount}
                                onChange={(e) => setDraft({ ...draft, min_amount: parseFloat(e.target.value) || 0 })}
                                className="bg-background/50 border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Max uses (blank = ∞)</Label>
                            <Input
                                type="number"
                                value={(draft.max_uses ?? "") as any}
                                onChange={(e) => setDraft({ ...draft, max_uses: e.target.value === "" ? null : parseInt(e.target.value) })}
                                placeholder="Unlimited"
                                className="bg-background/50 border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Applies to</Label>
                            <select
                                value={draft.applies_to}
                                onChange={(e) => setDraft({ ...draft, applies_to: e.target.value })}
                                className="w-full h-10 bg-background/50 border border-border/50 rounded-md px-3 font-bold text-sm"
                            >
                                <option value="all">All plans</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Valid from</Label>
                            <Input
                                type="datetime-local"
                                value={draft.valid_from || ""}
                                onChange={(e) => setDraft({ ...draft, valid_from: e.target.value })}
                                className="bg-background/50 border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase opacity-60">Valid until</Label>
                            <Input
                                type="datetime-local"
                                value={draft.valid_until || ""}
                                onChange={(e) => setDraft({ ...draft, valid_until: e.target.value })}
                                disabled={!draft.valid_until && draft.valid_until !== ""}
                                placeholder="Lifetime"
                                className="bg-background/50 border-border/50 font-bold disabled:opacity-50"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold/20">
                            <div>
                                <Label className="text-sm font-bold">Lifetime validity</Label>
                                <p className="text-[10px] text-muted-foreground mt-0.5">No expiry — coupon stays valid forever (until manually deactivated)</p>
                            </div>
                            <Switch
                                checked={!draft.valid_until}
                                onCheckedChange={(c) => setDraft({ ...draft, valid_until: c ? "" : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16) })}
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/30">
                            <Label className="text-sm font-bold">Active</Label>
                            <Switch
                                checked={!!draft.is_active}
                                onCheckedChange={(c) => setDraft({ ...draft, is_active: c ? 1 : 0 })}
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-3 pt-2">
                            <Button onClick={save} disabled={saving} variant="luxury" className="h-11 px-6 font-bold uppercase tracking-widest text-xs flex-1">
                                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : (editingId ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)}
                                {editingId ? "Save Changes" : "Create Coupon"}
                            </Button>
                            {editingId && (
                                <Button variant="luxuryOutline" onClick={cancelEdit} className="h-11 px-6 font-bold uppercase tracking-widest text-xs">Cancel</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">All Coupons ({list.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-10 text-center text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />Loading...</div>
                        ) : list.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground text-sm">No coupons yet. Create one above.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-border/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                                            <th className="py-3 pr-3">Code</th>
                                            <th className="py-3 pr-3">Discount</th>
                                            <th className="py-3 pr-3">Min ₹</th>
                                            <th className="py-3 pr-3">Plan</th>
                                            <th className="py-3 pr-3">Used</th>
                                            <th className="py-3 pr-3">Validity</th>
                                            <th className="py-3 pr-3">Active</th>
                                            <th className="py-3 pr-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.map((c) => (
                                            <tr key={c.id} className="border-b border-border/10 hover:bg-white/[0.02]">
                                                <td className="py-3 pr-3 font-bold tracking-wider text-gold">{c.code}</td>
                                                <td className="py-3 pr-3">{c.discount_type === "percent" ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                                                <td className="py-3 pr-3">₹{c.min_amount}</td>
                                                <td className="py-3 pr-3 capitalize">{c.applies_to}</td>
                                                <td className="py-3 pr-3">{c.used_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                                                <td className="py-3 pr-3">
                                                    {!c.valid_until ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[9px] font-black tracking-widest uppercase">Lifetime</span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">till {String(c.valid_until).slice(0, 10)}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-3">
                                                    <Switch checked={!!c.is_active} onCheckedChange={() => toggleActive(c)} />
                                                </td>
                                                <td className="py-3 pr-3 flex gap-2">
                                                    <Button size="sm" variant="luxuryOutline" className="h-8 px-3 text-[10px]" onClick={() => startEdit(c)}>Edit</Button>
                                                    <Button size="sm" variant="ghost" className="h-8 px-3 text-[10px] text-red-500 hover:text-red-400" onClick={() => remove(c.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
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
        </AdminLayout>
    );
};

export default AdminCoupons;
