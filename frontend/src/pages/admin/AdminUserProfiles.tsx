import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
    UserCircle, Edit, Save, X, Activity, TrendingUp, Flame, Loader2,
    Calendar, Mail, Phone, User, Scale, Ruler, Target, Dumbbell, Search, Filter, SortAsc, Crown, Download, FileText, CheckCircle2, Trash2, MoreHorizontal, Clock
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const AdminUserProfiles = () => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [goalFilter, setGoalFilter] = useState("all");
    const [planFilter, setPlanFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name_asc");

    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [editingProfile, setEditingProfile] = useState<any>(null);
    const [healthMetrics, setHealthMetrics] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");

    const fetchProfiles = async () => {
        try {
            const res = await api.admin.getUserProfiles(currentUser.id);
            setProfiles(res);
            setFilteredProfiles(res);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load profiles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, [currentUser.id]);

    useEffect(() => {
        let result = [...profiles];

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.email.toLowerCase().includes(term)
            );
        }

        // Goal Filter
        if (goalFilter !== "all") {
            result = result.filter(p => p.goal === goalFilter);
        }

        // Plan Filter
        if (planFilter !== "all") {
            if (planFilter === "paid") result = result.filter(p => p.active_plan && p.active_plan !== "Trial");
            else if (planFilter === "free") result = result.filter(p => !p.active_plan || p.active_plan === "Trial");
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "name_asc") return a.name.localeCompare(b.name);
            if (sortBy === "name_desc") return b.name.localeCompare(a.name);
            if (sortBy === "age_high") return b.age - a.age;
            if (sortBy === "age_low") return a.age - b.age;
            if (sortBy === "weight_high") return b.weight - a.weight;
            if (sortBy === "weight_low") return a.weight - b.weight;
            return 0;
        });

        setFilteredProfiles(result);
    }, [searchTerm, goalFilter, planFilter, sortBy, profiles]);

    const handleEditProfile = (profile: any) => {
        navigate(`/admin/profile-edit/${profile.id}`);
    };

    const exportToCSV = () => {
        if (filteredProfiles.length === 0) return;
        
        const headers = [
            "Name", "Email", "WhatsApp", "Age", "Gender", "Height(cm)", "Weight(kg)", "Primary_Goal", "Plan",
            "City", "Occupation", "Work_Hours", "Marital_Status", "Children", "Living_Situation",
            "Fitness_Goals", "Hormonal_Goals", "Hormonal_Male_Specific", "Hormonal_Female_Specific", "Other_Conditions", "Timeline", "Exp_Weight", "Motivation",
            "Metabolic_Conditions", "Digestive_Health", "Digestive_Overall", "Menstrual_Regularity", "Cycle_Length", "Period_Duration", "Period_Flow", "Period_Symptoms", "PCOS_Status", "Pregnancy_Status",
            "Supplements", "Past_Surgeries", "Alcohol", "Smoking", "Wake_Up", "Sleep_Time", "Sleep_Duration", "Sleep_Quality", "Daily_Movement", "Stress_Level", "Water_Intake",
            "Currently_Exercise", "Exercise_Type", "Exercise_Freq", "Diet_Type", "Disliked_Foods", "Food_Allergies", "Food_Allergies_Other", "Tea_Coffee_Intake", "Outside_Food", "Spice_Tolerance",
            "Breakfast_Time", "Mid_Morning_Snack", "Lunch_Time", "Evening_Snack", "Dinner_Time", "Late_Night_Eating", "Who_Cooks", "Kitchen_Appliances", "Food_Budget", "Special_Instructions"
        ];

        const rows = filteredProfiles.map(p => {
            let ext: any = {};
            if (p.extended_data) {
                try {
                    ext = typeof p.extended_data === 'string' ? JSON.parse(p.extended_data) : p.extended_data;
                    if (ext.formData) ext = { ...ext, ...ext.formData };
                } catch (e) { console.error(e); }
            }
            
            const joinArr = (val: any) => Array.isArray(val) ? val.join("; ") : (val || "");

            return [
                p.name,
                p.email,
                p.phone || "",
                p.age,
                p.gender,
                p.height,
                p.weight,
                p.goal,
                p.active_plan,

                ext.city || "",
                ext.occupation || "",
                ext.workingHours || "",
                ext.maritalStatus || "",
                ext.children || "",
                ext.livingSituation || "",

                joinArr(ext.primaryFitnessGoals),
                joinArr(ext.hormonalGoals),
                joinArr(ext.hormonalMaleSpecific),
                joinArr(ext.hormonalFemaleSpecific),
                joinArr(ext.otherConditions),
                ext.targetTimeline || "",
                ext.expectedWeight || "",
                ext.motivationLevel || "",

                joinArr(ext.lifestyleMetabolic),
                joinArr(ext.digestiveHealth),
                ext.digestiveHealthOverall || "",
                ext.menstrualRegularity || "",
                ext.averageCycleLength || "",
                ext.periodDuration || "",
                ext.menstrualFlow || "",
                joinArr(ext.periodSymptoms),
                ext.pcos || "",
                ext.pregnancyStatus || "",

                joinArr(ext.currentSupplements),
                ext.pastSurgeries || "",
                ext.alcoholConsumption || "",
                ext.smokingHabit || "",
                ext.wakeUpTime || "",
                ext.sleepTime || "",
                ext.sleepDuration || "",
                ext.sleepQuality || "",
                ext.dailyMovementLevel || "",
                ext.stressLevel || "",
                ext.waterIntake || "",

                ext.currentlyExercise || "",
                joinArr(ext.exerciseTypes),
                ext.exerciseFrequency || "",
                joinArr(ext.dietType),
                ext.foodsDislike || "",
                joinArr(ext.foodAllergies),
                ext.foodAllergiesOther || "",
                ext.teaCoffeeIntake || "",
                ext.outsideFood || "",
                ext.spiceTolerance || "",

                ext.breakfastTime || "",
                ext.midMorningSnackTime || "",
                ext.lunchTime || "",
                ext.eveningSnackTime || "",
                ext.dinnerTime || "",
                ext.lateNightEating || "",
                ext.whoCooksMeals || "",
                joinArr(ext.kitchenAppliances),
                ext.budgetForFood || "",
                ext.specialInstructions || ""
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(val => `"${String(val || "").replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `mrdiet_master_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
            return;
        }

        try {
            await api.admin.deleteUserProfile(currentUser.id, profileId);
            toast.success("Profile deleted successfully!");
            fetchProfiles();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete profile");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProfiles.length === 0) {
            toast.error("Please select profiles to delete");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedProfiles.length} profile(s)? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            for (const profileId of selectedProfiles) {
                await api.admin.deleteUserProfile(currentUser.id, profileId);
            }
            toast.success(`${selectedProfiles.length} profile(s) deleted successfully!`);
            setSelectedProfiles([]);
            fetchProfiles();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete profiles");
        } finally {
            setDeleting(false);
        }
    };

    const toggleProfileSelection = (profileId: string) => {
        setSelectedProfiles(prev =>
            prev.includes(profileId)
                ? prev.filter(id => id !== profileId)
                : [...prev, profileId]
        );
    };

    const selectAllProfiles = () => {
        if (selectedProfiles.length === filteredProfiles.length) {
            setSelectedProfiles([]);
        } else {
            setSelectedProfiles(filteredProfiles.map(p => p.id));
        }
    };

    if (loading && profiles.length === 0) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin h-12 w-12 text-gold" />
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                <div className="relative overflow-hidden bg-card/20 border border-border/40 rounded-xl p-5 backdrop-blur-md">
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                                <UserCircle className="h-6 w-6 text-gold" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">Profile Editor</h1>
                                <p className="text-muted-foreground text-xs font-medium">Fine-tune health metrics</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {selectedProfiles.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-10 mr-2 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[10px]"
                                    onClick={handleBulkDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    Delete ({selectedProfiles.length})
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 border-gold/30 bg-gold/5 text-gold hover:bg-gold hover:text-black font-bold uppercase tracking-widest text-[10px]"
                                onClick={exportToCSV}
                            >
                                <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                            </Button>
                            <div className="px-4 py-1 text-center font-bold bg-background/20 rounded-lg border border-border/30">
                                <p className="text-[9px] font-bold uppercase text-gold tracking-widest mb-0.5">Total Profiles</p>
                                <p className="text-2xl font-black text-foreground">{profiles.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative mt-5 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-gold transition-colors" />
                            <Input
                                placeholder="Search profiles..."
                                className="w-full pl-9 bg-background/40 border-border/40 h-10 rounded-lg focus:ring-0 focus:border-gold/50 transition-all shadow-sm text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Select value={goalFilter} onValueChange={setGoalFilter}>
                                <SelectTrigger className="w-[130px] bg-background/40 border-border/40 h-10 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-3.5 w-3.5 text-gold/70" />
                                        <SelectValue placeholder="Goal" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border/40">
                                    <SelectItem value="all">Goals</SelectItem>
                                    <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                                    <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
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
                                    <SelectItem value="all">Plans</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="free">Trial</SelectItem>
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
                                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                                    <SelectItem value="age_high">Highest Age</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Card className="border-border/40 bg-card/20 rounded-xl overflow-hidden shadow-none">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-secondary/20">
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedProfiles.length === filteredProfiles.length && filteredProfiles.length > 0}
                                            onCheckedChange={selectAllProfiles}
                                            className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                        />
                                    </TableHead>
                                    <TableHead className="font-bold">User</TableHead>
                                    <TableHead className="font-bold text-center">Age/Gender</TableHead>
                                    <TableHead className="font-bold text-center">Height/Weight</TableHead>
                                    <TableHead className="font-bold text-center">Goal</TableHead>
                                    <TableHead className="font-bold text-center">Plan</TableHead>
                                    <TableHead className="font-bold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProfiles.map((profile) => (
                                    <TableRow key={profile.id} className="group hover:bg-gold/5 transition-colors border-border/50">
                                        <TableCell className="w-12">
                                            <Checkbox
                                                checked={selectedProfiles.includes(profile.id)}
                                                onCheckedChange={() => toggleProfileSelection(profile.id)}
                                                className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold border border-gold/30 flex items-center justify-center font-bold text-lg">
                                                    {profile.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground group-hover:text-gold transition-colors">
                                                        {profile.name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium lowercase italic">
                                                        <Mail className="h-2 w-2" /> {profile.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="text-sm font-bold">{profile.age} yrs</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">{profile.gender}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="text-sm font-bold">{profile.height} cm</div>
                                            <div className="text-[10px] text-muted-foreground">{profile.weight} kg</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                {profile.goal}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {profile.active_plan && profile.active_plan !== "Trial" ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-foreground uppercase tracking-tighter bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                                                        <Crown className="h-3 w-3 text-gold" /> {profile.active_plan}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-tighter bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                        <Clock className="h-3 w-3 text-orange-500" /> Trial
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditProfile(profile)}
                                                    className="h-8 px-3 text-xs font-bold uppercase tracking-widest hover:bg-gold/10 hover:text-gold"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteProfile(profile.id)}
                                                    className="h-8 px-3 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 text-red-400"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AdminUserProfiles;
