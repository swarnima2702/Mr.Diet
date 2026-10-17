import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api, API_BASE_URL } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users as UsersIcon, Shield, ShieldAlert, Mail, Calendar, Crown, Search, Filter, SortAsc, Wallet, Settings, Trash2, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type PlanKey = "daily" | "weekly" | "monthly";

const PLAN_OPTIONS: Array<{ key: PlanKey; label: string; days: number }> = [
    { key: "daily", label: "Daily", days: 1 },
    { key: "weekly", label: "Weekly", days: 7 },
    { key: "monthly", label: "Monthly", days: 30 },
];

const planKeyFromValue = (plan?: string): PlanKey => {
    const value = (plan || "").toLowerCase();
    if (value.includes("daily")) return "daily";
    if (value.includes("monthly")) return "monthly";
    return "weekly";
};

const AdminUsers = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [planFilter, setPlanFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [adjustAmount, setAdjustAmount] = useState("");
    const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
    const [adjustDescription, setAdjustDescription] = useState("");
    const [adjusting, setAdjusting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanKey>("weekly");
    const [changingPlan, setChangingPlan] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");

    const handleAdjustBalance = async () => {
        if (!adjustAmount || isNaN(Number(adjustAmount)) || Number(adjustAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setAdjusting(true);
        try {
            await api.admin.adjustBalance(currentUser.id, selectedUser.id, Number(adjustAmount), adjustType, adjustDescription);

            // Refresh users data
            const res = await api.admin.getUsers(currentUser.id);
            setUsers(res);
            setFilteredUsers(res);

            toast.success("Balance adjusted successfully");
            setAdjustModalOpen(false);
            setAdjustAmount("");
            setAdjustDescription("");
            setAdjustType("add");
            setSelectedUser(null);
        } catch (err) {
            toast.error("Failed to adjust balance");
            console.error(err);
        } finally {
            setAdjusting(false);
        }
    };

    const openAdjustModal = (user: any) => {
        setSelectedUser(user);
        setAdjustModalOpen(true);
    };

    const openPlanModal = (user: any) => {
        setSelectedUser(user);
        setSelectedPlan(planKeyFromValue(user.active_plan));
        setPlanModalOpen(true);
    };

    const handleChangePlan = async () => {
        if (!selectedUser) return;

        setChangingPlan(true);
        try {
            await api.admin.changeUserPlan(currentUser.id, selectedUser.id, selectedPlan);

            const res = await api.admin.getUsers(currentUser.id);
            setUsers(res);
            setFilteredUsers(res);

            toast.success("Plan changed successfully");
            setPlanModalOpen(false);
            setSelectedUser(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to change plan");
            console.error(err);
        } finally {
            setChangingPlan(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users.php?admin_id=${currentUser.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: selectedIds })
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Users deleted successfully");
                setUsers(users.filter(u => !selectedIds.includes(u.id)));
                setSelectedIds([]);
                setDeleteModalOpen(false);
            } else {
                toast.error(data.error || "Failed to delete users");
            }
        } catch (err) {
            toast.error("Operation failed");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (user.is_admin) {
            toast.error("Cannot delete admins");
            return;
        }
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users.php?admin_id=${currentUser.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            });
            const data = await response.json();
            if (data.success) {
                toast.success("User deleted");
                setUsers(users.filter(u => u.id !== user.id));
            } else {
                toast.error(data.error || "Failed to delete");
            }
        } catch (err) {
            toast.error("Operation failed");
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredUsers.filter(u => !u.is_admin).length && filteredUsers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredUsers.filter(u => !u.is_admin).map(u => u.id));
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.admin.getUsers(currentUser.id);
                setUsers(res);
                setFilteredUsers(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentUser.id]);

    useEffect(() => {
        let result = [...users];

        // Search
        if (searchTerm) {
            result = result.filter(u =>
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status Filter
        if (statusFilter !== "all") {
            result = result.filter(u => statusFilter === "admin" ? u.is_admin : !u.is_admin);
        }

        // Plan Filter
        if (planFilter !== "all") {
            if (planFilter === "paid") result = result.filter(u => u.active_plan);
            else if (planFilter === "free") result = result.filter(u => !u.active_plan);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === "name_asc") return a.name.localeCompare(b.name);
            if (sortBy === "name_desc") return b.name.localeCompare(a.name);
            return 0;
        });

        setFilteredUsers(result);
    }, [searchTerm, statusFilter, planFilter, sortBy, users]);

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                {/* Compact Minimal Header */}
                <div className="relative overflow-hidden bg-card/20 border border-border/40 rounded-xl p-5 backdrop-blur-md">


                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Title Section */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <UsersIcon className="h-6 w-6 text-gold" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">User Directory</h1>
                                <p className="text-muted-foreground text-xs font-medium">Manage growth</p>
                            </div>
                        </div>

                        {/* Stats Summary - Compact */}
                        <div className="flex items-center gap-4 bg-background/20 p-2 rounded-lg border border-border/30">
                            <div className="px-4 py-1 text-center">
                                <p className="text-[9px] font-bold uppercase text-gold tracking-widest mb-0.5">Total Members</p>
                                <p className="text-2xl font-black text-foreground">{users.length}</p>
                            </div>

                            {selectedIds.length > 0 && (
                                <div className="px-4 py-1 text-center border-l border-border/30">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 text-[10px] font-black uppercase tracking-widest gap-2"
                                        onClick={() => setDeleteModalOpen(true)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete ({selectedIds.length})
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Filter Toolbar */}
                    <div className="relative mt-5 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <Input
                                placeholder="Search by name or email..."
                                className="w-full pl-9 bg-background/40 border-border/40 h-10 rounded-lg focus:ring-0 focus:border-gold/50 transition-all shadow-sm text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[120px] bg-background/40 border-border/40 h-10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5 text-gold/70" />
                                        <SelectValue placeholder="Account" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border/40">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                    <SelectItem value="member">Members</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={planFilter} onValueChange={setPlanFilter}>
                                <SelectTrigger className="w-[110px] bg-background/40 border-border/40 h-10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-3.5 w-3.5 text-gold/70" />
                                        <SelectValue placeholder="Plan" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border/40">
                                    <SelectItem value="all">Any Plan</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="free">Free</SelectItem>
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
                                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Card className="border-border/40 bg-card/20 rounded-xl overflow-hidden shadow-none">

                    <CardContent className="p-0">
                        <Table>
                             <TableHeader className="bg-secondary/20">
                                 <TableRow className="hover:bg-transparent">
                                     <TableHead className="w-[40px]">
                                         <Checkbox
                                             checked={selectedIds.length === filteredUsers.filter(u => !u.is_admin).length && filteredUsers.length > 0}
                                             onCheckedChange={toggleSelectAll}
                                         />
                                     </TableHead>
                                     <TableHead className="font-bold">Identity</TableHead>
                                     <TableHead className="font-bold text-center">Status</TableHead>
                                     <TableHead className="font-bold text-center text-xs">Plan</TableHead>
                                     <TableHead className="font-bold text-center">Wallet</TableHead>
                                     <TableHead className="font-bold text-center">Ref Code</TableHead>
                                     <TableHead className="font-bold text-right">Actions</TableHead>
                                 </TableRow>
                             </TableHeader>
                            <TableBody>
                                {filteredUsers.map((u) => (
                                     <TableRow key={u.id} className="group hover:bg-gold/5 transition-colors border-border/50">
                                         <TableCell>
                                             <Checkbox
                                                 checked={selectedIds.includes(u.id)}
                                                 onCheckedChange={() => toggleSelect(u.id)}
                                                 disabled={u.is_admin}
                                             />
                                         </TableCell>
                                         <TableCell>
                                             <div className="flex items-center gap-3">
                                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${u.is_admin ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-secondary text-foreground'}`}>
                                                     {u.name.charAt(0)}
                                                 </div>
                                                 <div>
                                                     <div className="flex items-center gap-2">
                                                         <span className="font-bold text-foreground group-hover:text-gold transition-colors">{u.name}</span>
                                                         {u.is_admin && <Shield className="h-3 w-3 text-gold" />}
                                                     </div>
                                                     <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium lowercase italic">
                                                         <Mail className="h-2 w-2" /> {u.email}
                                                     </div>
                                                 </div>
                                             </div>
                                         </TableCell>
                                         <TableCell className="text-center">
                                             <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.is_admin ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                 {u.is_admin ? 'Admin' : 'Member'}
                                             </div>
                                         </TableCell>
                                           <TableCell className="text-center">
                                               {u.active_plan ? (
                                                   <div className="flex flex-col items-center">
                                                       <div className="flex items-center gap-1 text-[10px] font-black text-foreground uppercase tracking-tighter bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                                                           <Crown className="h-3 w-3 text-gold" /> {u.active_plan}
                                                       </div>
                                                       {u.active_plan_end_date && (
                                                           <div className="mt-1 text-[9px] text-muted-foreground font-medium">
                                                               Till {new Date(u.active_plan_end_date).toLocaleDateString()}
                                                           </div>
                                                       )}
                                                   </div>
                                               ) : (
                                                   (() => {
                                                       const created = new Date(u.created_at).getTime();
                                                       const now = new Date().getTime();
                                                       const hoursSinceCreation = (now - created) / (1000 * 60 * 60);
                                                       if (hoursSinceCreation <= 24) {
                                                           return (
                                                               <div className="flex flex-col items-center">
                                                                   <div className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-tighter bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                                       <Clock className="h-3 w-3 text-orange-500" /> Trial
                                                                   </div>
                                                               </div>
                                                           );
                                                       }
                                                       return (
                                                           <span className="text-[10px] text-muted-foreground italic font-medium opacity-60 uppercase tracking-widest">
                                                               Free User
                                                           </span>
                                                       );
                                                   })()
                                               )}
                                           </TableCell>
                                          <TableCell className="text-center">
                                              <div className="flex flex-col items-center gap-1">
                                                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                                                      <Wallet className="h-3 w-3 text-gold" />
                                                      ₹{parseFloat(u.current_balance || 0).toFixed(2)}
                                                  </div>
                                                  <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-6 px-2 text-[9px] font-bold"
                                                      onClick={() => openAdjustModal(u)}
                                                  >
                                                      <Settings className="h-3 w-3 mr-1" />
                                                      Adjust
                                                  </Button>
                                              </div>
                                          </TableCell>
                                          <TableCell className="text-center">
                                              <code className="text-[10px] bg-secondary/50 px-2 py-1 rounded font-mono border border-border/30">
                                                  {u.referral_code || '---'}
                                              </code>
                                          </TableCell>
                                         <TableCell className="text-right">
                                             <div className="flex justify-end gap-2">
                                                 <Button
                                                     size="sm"
                                                     variant="ghost"
                                                     className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gold/10 hover:text-gold"
                                                     onClick={() => openPlanModal(u)}
                                                 >
                                                     <Crown className="h-3.5 w-3.5 mr-1" />
                                                     Plan
                                                 </Button>
                                                 {!u.is_admin && (
                                                     <Button
                                                         size="icon"
                                                         variant="ghost"
                                                         className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                         onClick={() => handleDeleteUser(u)}
                                                     >
                                                         <Trash2 className="h-3.5 w-3.5" />
                                                     </Button>
                                                 )}
                                                 <div className="flex flex-col items-end">
                                                     <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
                                                         {new Date(u.created_at).toLocaleDateString()}
                                                     </div>
                                                 </div>
                                             </div>
                                         </TableCell>
                                     </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Adjust Balance Modal */}
                <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-gold" />
                                Adjust Balance
                            </DialogTitle>
                            <DialogDescription>
                                Add or deduct funds from the user's wallet balance.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="p-3 bg-secondary/20 rounded-lg">
                                    <p className="text-sm font-medium">{selectedUser.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Current Balance: ₹{parseFloat(selectedUser.current_balance || 0).toFixed(2)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="amount" className="text-sm font-medium">Amount (₹)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="Enter amount"
                                            value={adjustAmount}
                                            onChange={(e) => setAdjustAmount(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">Action</Label>
                                        <RadioGroup value={adjustType} onValueChange={(value) => setAdjustType(value as "add" | "remove")} className="mt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="add" id="add" />
                                                <Label htmlFor="add" className="text-sm">Add Funds</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="remove" id="remove" />
                                                <Label htmlFor="remove" className="text-sm">Deduct Funds</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium">Note (Optional)</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Reason for adjustment (e.g., Bonus for 50 referrals)"
                                            value={adjustDescription}
                                            onChange={(e) => setAdjustDescription(e.target.value)}
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAdjustModalOpen(false)} disabled={adjusting}>
                                Cancel
                            </Button>
                            <Button onClick={handleAdjustBalance} disabled={adjusting || !adjustAmount}>
                                {adjusting ? "Adjusting..." : "Adjust Balance"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Change Plan Modal */}
                <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-gold" />
                                Change Plan
                            </DialogTitle>
                            <DialogDescription>
                                Assign a new active subscription for this user.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="p-3 bg-secondary/20 rounded-lg">
                                    <p className="text-sm font-medium">{selectedUser.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Current Plan: {selectedUser.active_plan || "No active plan"}
                                        {selectedUser.active_plan_end_date ? ` till ${selectedUser.active_plan_end_date}` : ""}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">New Plan</Label>
                                    <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as PlanKey)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PLAN_OPTIONS.map((plan) => (
                                                <SelectItem key={plan.key} value={plan.key}>
                                                    {plan.label} - {plan.days} day{plan.days > 1 ? "s" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs text-muted-foreground">
                                    Existing active plan will end today. The new plan starts immediately with fresh locked day entries.
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPlanModalOpen(false)} disabled={changingPlan}>
                                Cancel
                            </Button>
                            <Button onClick={handleChangePlan} disabled={changingPlan}>
                                {changingPlan ? "Changing..." : "Change Plan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Bulk Delete Confirmation */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md border-destructive/20 border">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <ShieldAlert className="h-5 w-5" />
                                Confirm Bulk Deletion
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {selectedIds.length} users? This will permanently remove their entire history, including plans, wallet balance, and profiles. This action is irreversible.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 mt-4">
                            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
                                {deleting ? "Deleting..." : "Permanently Delete Users"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
