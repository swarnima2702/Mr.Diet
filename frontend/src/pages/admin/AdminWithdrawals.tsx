import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api, getLogoUrl } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Eye, IndianRupee, Clock, History, Search, Filter, SortAsc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [filteredWithdrawals, setFilteredWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const user = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [txnId, setTxnId] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);

    const fetchWithdrawals = async () => {
        try {
            const res = await api.admin.getWithdrawals(user.id);
            setWithdrawals(res);
            setFilteredWithdrawals(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.id) fetchWithdrawals();
    }, [user.id]);

    useEffect(() => {
        let result = [...withdrawals];

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(w =>
                w.name.toLowerCase().includes(term) ||
                w.email.toLowerCase().includes(term) ||
                (w.transaction_id && w.transaction_id.toLowerCase().includes(term))
            );
        }

        // Filter
        if (statusFilter !== "all") {
            result = result.filter(w => w.status === statusFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime();
            if (sortBy === "oldest") return new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime();
            if (sortBy === "amount_high") return parseFloat(b.amount) - parseFloat(a.amount);
            if (sortBy === "amount_low") return parseFloat(a.amount) - parseFloat(b.amount);
            return 0;
        });

        setFilteredWithdrawals(result);
    }, [searchTerm, statusFilter, sortBy, withdrawals]);

    const handleProcess = async (id: number, status: 'approved' | 'rejected') => {
        const formData = new FormData();
        formData.append("id", id.toString());
        formData.append("status", status);
        formData.append("transaction_id", txnId);
        if (screenshot) formData.append("screenshot", screenshot);

        try {
            await api.admin.processWithdrawal(user.id, formData);
            toast.success(`Request ${status === 'approved' ? 'Processed' : 'Rejected'}`);
            setSelectedRequest(null);
            setTxnId("");
            setScreenshot(null);
            fetchWithdrawals();
        } catch (err) {
            toast.error("Failed to process request");
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        </AdminLayout>
    );

    const filteredPending = filteredWithdrawals.filter(w => w.status === 'pending');
    const filteredHistory = filteredWithdrawals.filter(w => w.status !== 'pending');

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                {/* Compact Minimal Header */}
                <div className="relative overflow-hidden bg-card/20 border border-border/40 rounded-xl p-5 backdrop-blur-md">

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Title Section */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <IndianRupee className="h-6 w-6 text-gold" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">Withdrawals</h1>
                                <p className="text-muted-foreground text-xs font-medium">Manage affiliate payouts</p>
                            </div>
                        </div>

                        {/* Stats Summary - More Compact */}
                        <div className="flex items-center gap-4 bg-background/20 p-1.5 rounded-lg border border-border/30">
                            <div className="px-4 py-1 text-center border-r border-border/30">
                                <p className="text-[9px] font-bold uppercase text-gold tracking-widest">Volume</p>
                                <p className="text-lg font-bold text-foreground">₹{withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString()}</p>
                            </div>
                            <div className="px-4 py-1 text-center">
                                <p className="text-[9px] font-bold uppercase text-emerald-500 tracking-widest">Requests</p>
                                <p className="text-lg font-bold text-foreground">{withdrawals.filter(w => w.status === 'pending').length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Filter Toolbar */}
                    <div className="relative mt-5 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search payments..."
                                className="w-full pl-9 bg-background/40 border-border/40 h-10 rounded-lg focus:ring-0 focus:border-gold/50 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px] bg-background/40 border-border/40 h-10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5 text-gold/70" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border/40">
                                    <SelectItem value="all">All Payouts</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[140px] bg-background/40 border-border/40 h-10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <SortAsc className="h-3.5 w-3.5 text-gold/70" />
                                        <SelectValue placeholder="Sort" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border/40">
                                    <SelectItem value="newest">Recent First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="amount_high">Highest</SelectItem>
                                    <SelectItem value="amount_low">Lowest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* PENDING REQUESTS */}
                <Card className="border-border/40 bg-card/20 rounded-xl overflow-hidden shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 py-3 px-5">
                        <div className="flex items-center gap-2 text-gold">
                            <Clock className="h-4 w-4" />
                            <CardTitle className="text-sm font-bold">Pending Approval</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-secondary/20">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold">Customer</TableHead>
                                    <TableHead className="font-bold text-center">Amount</TableHead>
                                    <TableHead className="font-bold text-center">Requested On</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPending.map((req) => (
                                    <TableRow key={req.id} className="group hover:bg-gold/5 transition-colors border-border/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center font-bold text-gold text-xs">
                                                    {req.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold group-hover:text-gold transition-colors">{req.name}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">{req.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 font-black text-lg text-foreground">
                                                <IndianRupee className="h-3 w-3" /> {req.amount}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-xs text-muted-foreground font-medium">
                                            {new Date(req.requested_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="luxury" className="h-8 px-4 font-bold text-[10px] uppercase tracking-widest" onClick={() => setSelectedRequest(req)}>
                                                            Approve
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-gold/20">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-xl font-black">Release Payment</DialogTitle>
                                                            <DialogDescription>
                                                                Transfer <b>₹{req.amount}</b> to <b>{req.name}</b> and upload proof.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-6 pt-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Transaction Reference (TXN ID)</Label>
                                                                <Input
                                                                    placeholder="e.g. UPI-1234567890"
                                                                    value={txnId}
                                                                    onChange={(e) => setTxnId(e.target.value)}
                                                                    className="bg-secondary/30 border-border/50 h-11"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Payout Screenshot</Label>
                                                                <Input
                                                                    type="file"
                                                                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                                                    className="bg-secondary/30 border-border/50 h-11 cursor-pointer pt-2"
                                                                />
                                                            </div>
                                                            <Button className="w-full h-12 text-sm font-black uppercase tracking-widest" variant="luxury" onClick={() => handleProcess(req.id, 'approved')}>
                                                                Confirm & Done
                                                            </Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/10 font-bold text-[10px] uppercase tracking-widest" onClick={() => handleProcess(req.id, 'rejected')}>
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPending.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 opacity-50 italic text-sm">
                                            No pending requests at the moment.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* HISTORY */}
                <Card className="border-border/40 bg-card/10 rounded-xl overflow-hidden shadow-none">
                    <CardHeader className="py-3 px-5 border-b border-border/20">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <History className="h-4 w-4" />
                            <CardTitle className="text-sm font-bold">Payout History</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-secondary/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">User</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Amount</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Verification</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.map((req) => (
                                    <TableRow key={req.id} className="border-border/30">
                                        <TableCell>
                                            <div className="font-bold text-xs">{req.name}</div>
                                            <div className="text-[10px] text-muted-foreground lowercase">{req.email}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-sm">₹{req.amount}</TableCell>
                                        <TableCell className="text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {req.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {req.screenshot_url ? (
                                                <a href={getLogoUrl(req.screenshot_url)} target="_blank" rel="noreferrer">
                                                    <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase font-black tracking-widest">
                                                        <Eye className="h-3 w-3 mr-1" /> View Proof
                                                    </Button>
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground font-mono">{req.transaction_id || '---'}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout >
    );
};

export default AdminWithdrawals;
