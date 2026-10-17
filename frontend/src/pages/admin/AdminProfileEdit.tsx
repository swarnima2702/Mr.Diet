import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, Save, ArrowLeft, Activity, Check, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { api } from "@/lib/api";
import AdminLayout from "@/components/admin/AdminLayout";

type FormData = {
    name: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    heightFt: string;
    heightIn: string;
    weight: string;
    city: string;
    occupation: string;
    workingHours: string;
    maritalStatus: string;
    children: string;
    livingSituation: string;
    hormonalGoals: string[];
    primaryFitnessGoals: string[];
    targetTimeline: string;
    expectedWeight: string;
    motivationLevel: string;
    lifestyleMetabolic: string[];
    digestiveHealth: string[];
    hormonalMaleSpecific: string[];
    hormonalFemaleSpecific: string[];
    otherConditions: string[];
    menstrualRegularity: string;
    averageCycleLength: string;
    periodDuration: string;
    menstrualFlow: string;
    periodSymptoms: string[];
    pcos: string;
    pregnancyStatus: string;
    currentSupplements: string[];
    pastSurgeries: string;
    digestiveHealthOverall: string;
    alcoholConsumption: string;
    smokingHabit: string;
    wakeUpTime: string;
    sleepTime: string;
    sleepDuration: string;
    sleepQuality: string;
    dailyMovementLevel: string;
    stressLevel: string;
    waterIntake: string;
    currentlyExercise: string;
    exerciseTypes: string[];
    exerciseFrequency: string;
    dietType: string[];
    foodsDislike: string;
    foodAllergies: string[];
    foodAllergiesOther: string;
    teaCoffeeIntake: string;
    outsideFood: string;
    spiceTolerance: string;
    breakfastTime: string;
    midMorningSnackTime: string;
    lunchTime: string;
    eveningSnackTime: string;
    dinnerTime: string;
    lateNightEating: string;
    whoCooksMeals: string;
    kitchenAppliances: string[];
    budgetForFood: string;
    specialInstructions: string;
};

const emptyFormData: FormData = {
    name: "", email: "", phone: "", age: "", gender: "", heightFt: "", heightIn: "", weight: "",
    city: "", occupation: "", workingHours: "", maritalStatus: "", children: "", livingSituation: "",
    hormonalGoals: [], primaryFitnessGoals: [], targetTimeline: "", expectedWeight: "", motivationLevel: "",
    lifestyleMetabolic: [], digestiveHealth: [], hormonalMaleSpecific: [], hormonalFemaleSpecific: [], otherConditions: [],
    menstrualRegularity: "", averageCycleLength: "", periodDuration: "", menstrualFlow: "", periodSymptoms: [], pcos: "", pregnancyStatus: "",
    currentSupplements: [], pastSurgeries: "", digestiveHealthOverall: "", alcoholConsumption: "", smokingHabit: "",
    wakeUpTime: "", sleepTime: "", sleepDuration: "", sleepQuality: "", dailyMovementLevel: "", stressLevel: "", waterIntake: "",
    currentlyExercise: "", exerciseTypes: [], exerciseFrequency: "", dietType: [], foodsDislike: "", foodAllergies: [], foodAllergiesOther: "",
    teaCoffeeIntake: "", outsideFood: "", spiceTolerance: "", breakfastTime: "", midMorningSnackTime: "", lunchTime: "", eveningSnackTime: "",
    dinnerTime: "", lateNightEating: "", whoCooksMeals: "", kitchenAppliances: [], budgetForFood: "", specialInstructions: "",
};

const AdminProfileEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>(emptyFormData);
    const [activeSection, setActiveSection] = useState<string>("basic");
    const [profileId, setProfileId] = useState<string | null>(null);
    const [originalFullProfile, setOriginalFullProfile] = useState<any>(null);
    const currentUser = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (uid: string) => {
        try {
            const profile = await api.admin.getUserProfile(currentUser.id, uid);
            setProfileId(profile?.id || null);
            setOriginalFullProfile(profile);

            if (profile) {
                let ed = profile.extended_data || {};
                if (typeof ed === 'string') { try { ed = JSON.parse(ed); } catch (e) { ed = {}; } }
                if (ed.formData) ed = { ...ed, ...ed.formData };
                
                const heightCm = parseFloat(profile.height) || 0;
                const heightTotalIn = heightCm / 2.54;
                const ft = Math.floor(heightTotalIn / 12);
                const inches = Math.round(heightTotalIn % 12);

                setFormData({
                    ...emptyFormData,
                    ...ed,
                    name: profile.name || ed.name || "",
                    email: profile.email || ed.email || "",
                    phone: profile.phone || ed.phone || "",
                    age: ed.age ? String(ed.age) : (profile.age ? String(profile.age) : ""),
                    gender: ed.gender || profile.gender || "",
                    heightFt: ed.heightFt || (ft ? String(ft) : ""),
                    heightIn: ed.heightIn || (inches ? String(inches) : ""),
                    weight: ed.weight ? String(ed.weight) : (profile.weight ? String(profile.weight) : ""),
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load user data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleArrayToggle = (field: keyof FormData, value: string) => {
        setFormData((prev) => {
            const currentArray = Array.isArray(prev[field]) ? prev[field] as string[] : [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter((item) => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray };
        });
    };

    const handleSave = async () => {
        if (!id || !profileId) return;
        setIsSaving(true);
        try {
            await api.admin.updateUserProfile(currentUser.id, id, {
                name: formData.name, email: formData.email, phone: formData.phone,
                age: parseInt(formData.age), gender: formData.gender,
                height: (parseFloat(formData.heightFt) * 30.48) + (parseFloat(formData.heightIn) * 2.54),
                weight: parseFloat(formData.weight),
                goal: formData.primaryFitnessGoals.join(", "),
                activity_level: formData.dailyMovementLevel,
                dietary_restrictions: [...formData.lifestyleMetabolic, ...formData.digestiveHealth, ...formData.hormonalMaleSpecific, ...formData.hormonalFemaleSpecific, ...formData.otherConditions],
                allergies: [...formData.foodAllergies, formData.foodAllergiesOther].filter(Boolean).join(", "),
                meal_preference: `${formData.dietType.join(", ")}, ${formData.foodsDislike}`,
                extended_data: formData,
            });

            toast.success("Profile updated successfully!");
            navigate("/admin/user-profiles");
        } catch (err: any) {
            toast.error(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                        <Sparkles className="h-12 w-12 text-gold animate-pulse mx-auto mb-6" />
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Loading Profile Data</h2>
                        <Progress value={66} className="w-48 mx-auto mt-6 h-1 bg-white/5" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const sections = [
        { id: "basic", label: "Basic Info" },
        { id: "goals", label: "Goals" },
        { id: "medical", label: "Medical" },
        { id: "lifestyle", label: "Lifestyle" },
        { id: "food", label: "Food & Meals" },
    ];

    const selectedGender = formData.gender;

    return (
        <AdminLayout>
            <main className="max-w-7xl mx-auto space-y-8 pb-32">
                {/* Header & Back Button Row */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1a1608] border border-[#eab308]/20 text-[#eab308] text-[9px] font-semibold tracking-[0.15em] uppercase">
                            Admin Editor
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                            Health <span className="text-[#eab308]">Profile</span> Editor
                        </h1>
                        <p className="max-w-sm text-muted-foreground text-xs leading-relaxed">
                            Complete health profile editing for user <span className="text-gold">{id}</span>. All fields are fully editable.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => navigate("/admin/user-profiles")}
                        className="text-muted-foreground hover:text-white hover:bg-white/5 h-10 px-4 mb-1"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to User Profiles
                    </Button>
                </div>


                {/* Section Navigation */}
                <div className="flex flex-wrap gap-2">
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                activeSection === s.id
                                    ? "bg-gold/10 text-gold border border-gold/20"
                                    : "bg-[#0f0f0f] text-muted-foreground border border-white/5 hover:text-white hover:border-white/10"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <Card className="bg-[#0a0a0a] border border-white/5 rounded-2xl">
                    {/* Section: Basic Info */}
                    {activeSection === "basic" && (
                        <CardContent className="p-6 md:p-8 space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-6">Gender</h3>
                                <div className="flex flex-col md:flex-row gap-6 justify-center py-8">
                                    {/* Men Option */}
                                    <div
                                        className={`flex-1 p-10 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-6 group relative overflow-hidden
                        ${selectedGender === 'men'
                                                    ? 'border-blue-500 bg-blue-50/5 shadow-lg shadow-blue-500/10'
                                                    : 'border-white/10 hover:border-blue-300/30 hover:bg-blue-50/20 bg-[#0f0f0f]'}`}
                                        onClick={() => handleInputChange("gender", "men")}
                                    >
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300
                          ${selectedGender === 'men' ? 'bg-blue-100 text-blue-600' : 'bg-secondary text-muted-foreground group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                                            <span className="text-lg font-bold">M</span>
                                        </div>
                                        <span className={`text-xl font-bold transition-colors ${selectedGender === 'men' ? 'text-blue-400' : 'text-foreground'}`}>
                                            Men
                                        </span>
                                        {selectedGender === 'men' && (
                                            <div className="absolute top-4 right-4">
                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Women Option */}
                                    <div
                                        className={`flex-1 p-10 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-6 group relative overflow-hidden
                        ${selectedGender === 'women'
                                                    ? 'border-pink-500 bg-pink-50/5 shadow-lg shadow-pink-500/10'
                                                    : 'border-white/10 hover:border-pink-300/30 hover:bg-pink-50/20 bg-[#0f0f0f]'}`}
                                        onClick={() => handleInputChange("gender", "women")}
                                    >
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300
                          ${selectedGender === 'women' ? 'bg-pink-100 text-pink-600' : 'bg-secondary text-muted-foreground group-hover:bg-pink-100 group-hover:text-pink-500'}`}>
                                            <span className="text-lg font-bold">W</span>
                                        </div>
                                        <span className={`text-xl font-bold transition-colors ${selectedGender === 'women' ? 'text-pink-400' : 'text-foreground'}`}>
                                            Women
                                        </span>
                                        {selectedGender === 'women' && (
                                            <div className="absolute top-4 right-4">
                                                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-name">Full Name *</Label>
                                    <Input id="ape-name" placeholder="Enter your full name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-email">Email Address</Label>
                                    <Input id="ape-email" type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-phone">WhatsApp Number *</Label>
                                        <Input id="ape-phone" type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-age">Age *</Label>
                                        <Input id="ape-age" type="number" placeholder="Enter your age" value={formData.age} onChange={(e) => handleInputChange("age", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-heightFt">Height (Feet) *</Label>
                                        <Input id="ape-heightFt" placeholder="e.g., 5" type="number" value={formData.heightFt} onChange={(e) => handleInputChange("heightFt", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-heightIn">Height (Inches) *</Label>
                                        <Input id="ape-heightIn" placeholder="e.g., 8" type="number" value={formData.heightIn} onChange={(e) => handleInputChange("heightIn", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-weight">Weight (kg) *</Label>
                                        <Input id="ape-weight" type="number" placeholder="e.g., 70" value={formData.weight} onChange={(e) => handleInputChange("weight", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-city">City</Label>
                                    <Input id="ape-city" placeholder="Enter your city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                </div>


                                <div className="space-y-2">
                                    <Label>Occupation</Label>
                                    <RadioGroup
                                        value={formData.occupation}
                                        onValueChange={(value) => handleInputChange("occupation", value)}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-2"
                                    >
                                        {(selectedGender === "women"
                                            ? ["Student", "Desk Job", "Business", "Field / Outdoor Job", "Physical Job", "Night-Shift Job", "Homemaker", "None"]
                                            : ["Student", "Desk Job", "Business", "Field / Outdoor Job", "Physical Job", "Night-Shift Job", "None"]
                                        ).map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`occ-${option}`} />
                                                <Label htmlFor={`occ-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ape-workingHours">Working Hours (per day)</Label>
                                    <Input id="ape-workingHours" type="number" placeholder="e.g. 8" value={formData.workingHours} onChange={(e) => handleInputChange("workingHours", e.target.value)} className="bg-[#0f0f0f] border-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Marital Status</Label>
                                        <RadioGroup
                                            value={formData.maritalStatus}
                                            onValueChange={(value) => handleInputChange("maritalStatus", value)}
                                            className="grid gap-2"
                                        >
                                            {["Single", "Married", "Recently Married", selectedGender === "women" ? "Divorced / Separated" : "Planning", selectedGender === "women" ? "Planning marriage" : ""].filter(Boolean).map(opt => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`ms-${opt}`} />
                                                    <Label htmlFor={`ms-${opt}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Children</Label>
                                        <RadioGroup
                                            value={formData.children}
                                            onValueChange={(value) => handleInputChange("children", value)}
                                            className="grid gap-2"
                                        >
                                            {["No children", "1 child", "2 children", "3+ children", selectedGender === "women" ? "Planning pregnancy" : "Planning"].map(opt => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`ch-${opt}`} />
                                                    <Label htmlFor={`ch-${opt}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Living Situation</Label>
                                    <RadioGroup
                                        value={formData.livingSituation}
                                        onValueChange={(value) => handleInputChange("livingSituation", value)}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-2"
                                    >
                                        {["With family", "With partner", "Living alone", "With roommates", "Hostel / PG"].map(opt => (
                                            <div key={opt} className="flex items-center space-x-2">
                                                <RadioGroupItem value={opt} id={`ls-${opt}`} />
                                                <Label htmlFor={`ls-${opt}`}>{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    {/* Section: Goals */}
                    {activeSection === "goals" && (
                        <CardContent className="p-6 md:p-8 space-y-8">
                            {/* Hormonal Goals */}
                            <div className="space-y-2">
                                <Label>{selectedGender === "men" ? "Hormonal Goals" : "Female Health Goals"} (Select all that apply)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(selectedGender === "men"
                                        ? ["Thyroid management", "Diabetes / Prediabetes control", "Cholesterol management", "BP control", "Fatty liver improvement", "Reduce acidity / bloating", "Improve gut health", "Hormone balance", "Testosterone support", "Correct Vitamin D", "B12 deficiency", "None"]
                                        : ["Hormonal balance", "Regular menstrual cycle", "Reduce PMS symptoms", "PCOS / PCOD management", "Thyroid management", "Diabetes / Prediabetes control", "Cholesterol management", "BP control", "Fatty liver improvement", "Reduce bloating / acidity", "Improve gut health", "Improve fertility", "Pregnancy nutrition support", "Post-pregnancy recovery", "Lactation support", "Improve skin & hair health", "Correct Vitamin D deficiency", "Correct Vitamin B12 deficiency", "Iron deficiency correction", "None"]
                                    ).map((goal) => (
                                        <div key={goal} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`hg-${goal}`}
                                                checked={formData.hormonalGoals.includes(goal)}
                                                onCheckedChange={() => handleArrayToggle("hormonalGoals", goal)}
                                            />
                                            <Label htmlFor={`hg-${goal}`}>{goal}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fitness Goals & Timeline */}
                            <div className="space-y-2">
                                <Label>Primary Fitness Goal (Select all that apply)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(selectedGender === "men"
                                        ? ["Weight Loss", "Weight Gain", "Fat Loss", "Muscle Gain", "Lean Muscle Toning", "Strength Building", "Body Recomposition", "Increase Energy", "Improve Stamina"]
                                        : ["Weight Loss", "Weight Gain", "Fat Loss", "Muscle Toning", "Lean Muscle Development", "Strength Building", "Body Recomposition", "Increase Energy", "Improve Stamina", "Improve Metabolism"]
                                    ).map((goal) => (
                                        <div key={goal} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`fg-${goal}`}
                                                checked={formData.primaryFitnessGoals.includes(goal)}
                                                onCheckedChange={() => handleArrayToggle("primaryFitnessGoals", goal)}
                                            />
                                            <Label htmlFor={`fg-${goal}`}>{goal}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Target Timeline</Label>
                                    <RadioGroup
                                        value={formData.targetTimeline}
                                        onValueChange={(value) => handleInputChange("targetTimeline", value)}
                                        className="grid gap-2"
                                    >

                                        {["30 days", "45 days", "60 days (2 months)", "90 days (3 months)", "No fixed timeline"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`tt-${option}`} />
                                                <Label htmlFor={`tt-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-expectedWeight">Expected Weight (kg)</Label>
                                    <Input
                                        id="ape-expectedWeight"
                                        type="number"
                                        placeholder="e.g., 65"
                                        value={formData.expectedWeight}
                                        onChange={(e) => handleInputChange("expectedWeight", e.target.value)}
                                        className="bg-[#0f0f0f] border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Motivation Level (1-10)</Label>
                                    <RadioGroup
                                        value={formData.motivationLevel}
                                        onValueChange={(value) => handleInputChange("motivationLevel", value)}
                                        className="grid grid-cols-5 gap-2"
                                    >
                                        {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map((level) => (
                                            <div key={level} className="flex items-center space-x-2">
                                                <RadioGroupItem value={level} id={`ml-${level}`} />
                                                <Label htmlFor={`ml-${level}`}>{level}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    {/* Section: Medical */}
                    {activeSection === "medical" && (
                        <CardContent className="p-6 md:p-8 space-y-8">
                            {/* Menstrual Health for Women */}
                            {selectedGender === "women" && (
                                <>
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Menstrual & Reproductive Health</h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Menstrual Cycle Regularity</Label>
                                                    <RadioGroup
                                                        value={formData.menstrualRegularity}
                                                        onValueChange={(value) => handleInputChange("menstrualRegularity", value)}
                                                        className="grid gap-2"
                                                    >
                                                        {["Regular", "Irregular", "Very irregular", "Missed periods", "Not applicable (pregnant / menopause)"].map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={`mr-${option}`} />
                                                                <Label htmlFor={`mr-${option}`}>{option}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Average Cycle Length</Label>
                                                    <RadioGroup
                                                        value={formData.averageCycleLength}
                                                        onValueChange={(value) => handleInputChange("averageCycleLength", value)}
                                                        className="grid gap-2"
                                                    >
                                                        {["21–24 days", "25–28 days", "29–32 days", "Varies every month", "Not sure"].map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={`cl-${option}`} />
                                                                <Label htmlFor={`cl-${option}`}>{option}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Period Duration</Label>
                                                    <RadioGroup
                                                        value={formData.periodDuration}
                                                        onValueChange={(value) => handleInputChange("periodDuration", value)}
                                                        className="grid gap-2"
                                                    >
                                                        {["2–3 days", "4–5 days", "6–7 days", "More than 7 days"].map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={`pd-${option}`} />
                                                                <Label htmlFor={`pd-${option}`}>{option}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Menstrual Flow</Label>
                                                    <RadioGroup
                                                        value={formData.menstrualFlow}
                                                        onValueChange={(value) => handleInputChange("menstrualFlow", value)}
                                                        className="grid gap-2"
                                                    >
                                                        {["Light", "Moderate", "Heavy", "Very heavy"].map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={`mf-${option}`} />
                                                                <Label htmlFor={`mf-${option}`}>{option}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>PCOS / PCOD</Label>
                                                    <RadioGroup
                                                        value={formData.pcos}
                                                        onValueChange={(value) => handleInputChange("pcos", value)}
                                                        className="grid gap-2"
                                                    >
                                                        {["Diagnosed", "Suspected", "No"].map((option) => (
                                                            <div key={option} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={option} id={`pcos-${option}`} />
                                                                <Label htmlFor={`pcos-${option}`}>{option}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Period Symptoms (Select all that apply)</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {["Severe cramps", "Mild cramps", "Back pain", "Headaches / migraine", "Mood swings", "Fatigue", "Bloating", "Breast tenderness", "Acne breakouts", "None"].map((symptom) => (
                                                        <div key={symptom} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`ps-${symptom}`}
                                                                checked={formData.periodSymptoms.includes(symptom)}
                                                                onCheckedChange={() => handleArrayToggle("periodSymptoms", symptom)}
                                                            />
                                                            <Label htmlFor={`ps-${symptom}`}>{symptom}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pregnancy Status</Label>
                                                <RadioGroup
                                                    value={formData.pregnancyStatus}
                                                    onValueChange={(value) => handleInputChange("pregnancyStatus", value)}
                                                    className="grid gap-2"
                                                >
                                                    {["Not pregnant", "Pregnant", "Postpartum (within 1 year)", "Breastfeeding", "Menopause"].map((option) => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <RadioGroupItem value={option} id={`preg-${option}`} />
                                                            <Label htmlFor={`preg-${option}`}>{option}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Medical Conditions */}
                            <div className="border-t pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Lifestyle & Metabolic (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Obesity / Overweight", "Diabetes (Type 1 / Type 2)", "Prediabetes", "Insulin resistance", "High cholesterol", "High BP", "Fatty liver", "Anemia (low iron)", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`lm-${condition}`}
                                                    checked={formData.lifestyleMetabolic.includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle("lifestyleMetabolic", condition)}
                                                />
                                                <Label htmlFor={`lm-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Digestive Health (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Acidity / GERD", "Gas / Bloating", "IBS", "Constipation", "Diarrhea", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`dh-${condition}`}
                                                    checked={formData.digestiveHealth.includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle("digestiveHealth", condition)}
                                                />
                                                <Label htmlFor={`dh-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{selectedGender === "men" ? "Hormonal & Male-Specific" : "Hormonal & Female-Specific"} (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Low testosterone", "Erectile dysfunction", "Low libido", "Thyroid issues (Hypo / Hyper)", "None"]
                                            : ["Thyroid issues (Hypo / Hyper)", "PCOS / PCOD", "Hormonal imbalance", "Low energy / fatigue", "Hair fall", "Irregular periods", "None"]
                                        ).map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`hs-${condition}`}
                                                    checked={(selectedGender === "men" ? formData.hormonalMaleSpecific : formData.hormonalFemaleSpecific).includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle(selectedGender === "men" ? "hormonalMaleSpecific" : "hormonalFemaleSpecific", condition)}
                                                />
                                                <Label htmlFor={`hs-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Other Conditions (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Migraines", "Asthma", "Anxiety", "Stress", "Depression", "Joint pain", "Kidney issues", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`oc-${condition}`}
                                                    checked={formData.otherConditions.includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle("otherConditions", condition)}
                                                />
                                                <Label htmlFor={`oc-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Supplements & History */}
                            <div className="border-t pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Current Supplements (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Multivitamin", "Omega-3", "Vitamin D", "Vitamin B12", "Protein powder", "Creatine", "Pre-workout", "Biotin", "Joint support", "None"]
                                            : ["Multivitamin", "Omega-3", "Vitamin D", "Vitamin B12", "Iron supplement", "Calcium", "Protein powder", "Biotin", "Probiotics", "Prenatal vitamins", "None"]
                                        ).map((supplement) => (
                                            <div key={supplement} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`sup-${supplement}`}
                                                    checked={formData.currentSupplements.includes(supplement)}
                                                    onCheckedChange={() => handleArrayToggle("currentSupplements", supplement)}
                                                />
                                                <Label htmlFor={`sup-${supplement}`}>{supplement}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-pastSurgeries">{selectedGender === "men" ? "Past Surgeries" : "Past Surgeries / Deliveries"}</Label>
                                    <Textarea
                                        id="ape-pastSurgeries"
                                        placeholder="Write details (max 600 characters)"
                                        value={formData.pastSurgeries}
                                        onChange={(e) => handleInputChange("pastSurgeries", e.target.value)}
                                        className="min-h-[80px] bg-[#0f0f0f] border-white/10"
                                        maxLength={600}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Digestive Health (Overall)</Label>
                                    <RadioGroup
                                        value={formData.digestiveHealthOverall}
                                        onValueChange={(value) => handleInputChange("digestiveHealthOverall", value)}
                                        className="grid gap-2"
                                    >
                                        {["Very good", "Moderate", "Poor", "Changes frequently"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`dho-${option}`} />
                                                <Label htmlFor={`dho-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                            {/* Medical Conditions */}
                            <div className="border-t pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Lifestyle & Metabolic (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Obesity / Overweight", "Diabetes (Type 1 / Type 2)", "Prediabetes", "Insulin resistance", "High cholesterol", "High BP", "Fatty liver", "Anemia (low iron)", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`lm-${condition}`}
                                                    checked={formData.lifestyleMetabolic.includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle("lifestyleMetabolic", condition)}
                                                />
                                                <Label htmlFor={`lm-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Digestive Health (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Acidity / GERD", "Gas / Bloating", "IBS", "Constipation", "Diarrhea", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`dh-${condition}`}
                                                    checked={formData.digestiveHealth.includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle("digestiveHealth", condition)}
                                                />
                                                <Label htmlFor={`dh-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{selectedGender === "men" ? "Hormonal & Male-Specific" : "Hormonal & Female-Specific"} (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Low testosterone", "Erectile dysfunction", "Low libido", "Thyroid issues (Hypo / Hyper)", "None"]
                                            : ["Thyroid issues (Hypo / Hyper)", "PCOS / PCOD", "Hormonal imbalance", "Low energy / fatigue", "Hair fall", "Irregular periods", "None"]
                                        ).map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`hs-${condition}`}
                                                    checked={(selectedGender === "men" ? formData.hormonalMaleSpecific : formData.hormonalFemaleSpecific).includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle(selectedGender === "men" ? "hormonalMaleSpecific" : "hormonalFemaleSpecific", condition)}
                                                />
                                                <Label htmlFor={`hs-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Other Conditions (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Migraines", "Asthma", "Anxiety", "Stress", "Depression", "Joint pain", "Kidney issues", "None"].map((condition) => (
                                            <div key={condition} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`oc-${condition}`}
                                                    checked={formData.otherConditions.includes(condition)}
                                                    onCheckedChange={() => handleArrayToggle("otherConditions", condition)}
                                                />
                                                <Label htmlFor={`oc-${condition}`}>{condition}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Supplements & History */}
                            <div className="border-t pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Current Supplements (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Multivitamin", "Omega-3", "Vitamin D", "Vitamin B12", "Protein powder", "Creatine", "Pre-workout", "Biotin", "Joint support", "None"]
                                            : ["Multivitamin", "Omega-3", "Vitamin D", "Vitamin B12", "Iron supplement", "Calcium", "Protein powder", "Biotin", "Probiotics", "Prenatal vitamins", "None"]
                                        ).map((supplement) => (
                                            <div key={supplement} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`sup-${supplement}`}
                                                    checked={formData.currentSupplements.includes(supplement)}
                                                    onCheckedChange={() => handleArrayToggle("currentSupplements", supplement)}
                                                />
                                                <Label htmlFor={`sup-${supplement}`}>{supplement}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-pastSurgeries">{selectedGender === "men" ? "Past Surgeries" : "Past Surgeries / Deliveries"}</Label>
                                    <Textarea
                                        id="ape-pastSurgeries"
                                        placeholder="Write details (max 600 characters)"
                                        value={formData.pastSurgeries}
                                        onChange={(e) => handleInputChange("pastSurgeries", e.target.value)}
                                        className="min-h-[80px] bg-[#0f0f0f] border-white/10"
                                        maxLength={600}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Digestive Health (Overall)</Label>
                                    <RadioGroup
                                        value={formData.digestiveHealthOverall}
                                        onValueChange={(value) => handleInputChange("digestiveHealthOverall", value)}
                                        className="grid gap-2"
                                    >
                                        {["Very good", "Moderate", "Poor", "Changes frequently"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`dho-${option}`} />
                                                <Label htmlFor={`dho-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                         </CardContent>
                    )}

                    {/* Section: Lifestyle */}
                    {activeSection === "lifestyle" && (
                        <CardContent className="p-6 md:p-8 space-y-8">
                            {/* Lifestyle Habits */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Alcohol Consumption</Label>
                                        <RadioGroup
                                            value={formData.alcoholConsumption}
                                            onValueChange={(value) => handleInputChange("alcoholConsumption", value)}
                                            className="grid gap-2"
                                        >
                                            {["Never", "Occasionally", "Every weekend", "1–2 drinks/week", "3–4 drinks/week", "Daily drinking"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`alc-${option}`} />
                                                    <Label htmlFor={`alc-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Smoking Habit</Label>
                                        <RadioGroup
                                            value={formData.smokingHabit}
                                            onValueChange={(value) => handleInputChange("smokingHabit", value)}
                                            className="grid gap-2"
                                        >
                                            {["No", "Yes, occasionally", "Regular", "Heavy smoker", "Quit recently"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`smk-${option}`} />
                                                    <Label htmlFor={`smk-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Routine */}
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Daily Routine</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-wakeUpTime">Wake-Up Time (12h format)</Label>
                                        <Input
                                            id="ape-wakeUpTime"
                                            type="time"
                                            value={formData.wakeUpTime}
                                            onChange={(e) => handleInputChange("wakeUpTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-sleepTime">Sleep Time (12h format)</Label>
                                        <Input
                                            id="ape-sleepTime"
                                            type="time"
                                            value={formData.sleepTime}
                                            onChange={(e) => handleInputChange("sleepTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-sleepDuration">Sleep Duration (hours)</Label>
                                        <Input
                                            id="ape-sleepDuration"
                                            placeholder="e.g., 7"
                                            value={formData.sleepDuration}
                                            onChange={(e) => handleInputChange("sleepDuration", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sleep Quality</Label>
                                        <RadioGroup
                                            value={formData.sleepQuality}
                                            onValueChange={(value) => handleInputChange("sleepQuality", value)}
                                            className="grid gap-2"
                                        >
                                            {["Excellent", "Good", "Average", "Poor", "Very disturbed"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`sq-${option}`} />
                                                    <Label htmlFor={`sq-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Daily Movement Level</Label>
                                        <RadioGroup
                                            value={formData.dailyMovementLevel}
                                            onValueChange={(value) => handleInputChange("dailyMovementLevel", value)}
                                            className="grid gap-2"
                                        >
                                            {["Very low", "Low", "Moderate", "High", "Very high"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`dml-${option}`} />
                                                    <Label htmlFor={`dml-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Stress Level</Label>
                                        <RadioGroup
                                            value={formData.stressLevel}
                                            onValueChange={(value) => handleInputChange("stressLevel", value)}
                                            className="grid gap-2"
                                        >
                                            {["Very low", "Low", "Moderate", "High", "Very high"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`str-${option}`} />
                                                    <Label htmlFor={`str-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Water Intake</Label>
                                        <RadioGroup
                                            value={formData.waterIntake}
                                            onValueChange={(value) => handleInputChange("waterIntake", value)}
                                            className="grid gap-2"
                                        >
                                            {["Less than 1 litre", "1–1.5 litres", "1.5–2 litres", "2–3 litres", "More than 3 litres", "No idea"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`wi-${option}`} />
                                                    <Label htmlFor={`wi-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                            </div>

                            {/* Physical Activity */}
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Physical Activity</h3>
                                <div className="space-y-2">
                                    <Label>Do You Currently Exercise?</Label>
                                    <RadioGroup
                                        value={formData.currentlyExercise}
                                        onValueChange={(value) => handleInputChange("currentlyExercise", value)}
                                        className="flex gap-4"
                                    >
                                        {["Yes", "No", "Sometimes"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`ce-${option}`} />
                                                <Label htmlFor={`ce-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label>Type of Exercise You Do (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(selectedGender === "men"
                                            ? ["Gym", "Home", "Bodyweight training", "Cardio", "Yoga", "None"]
                                            : ["Gym", "Home workouts", "Yoga", "Pilates", "Cardio", "Strength training", "Walking", "None"]
                                        ).map((type) => (
                                            <div key={type} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`et-${type}`}
                                                    checked={formData.exerciseTypes.includes(type)}
                                                    onCheckedChange={() => handleArrayToggle("exerciseTypes", type)}
                                                />
                                                <Label htmlFor={`et-${type}`}>{type}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Exercise Frequency</Label>
                                    <RadioGroup
                                        value={formData.exerciseFrequency}
                                        onValueChange={(value) => handleInputChange("exerciseFrequency", value)}
                                        className="grid gap-2"
                                    >
                                        {["0 days", "1–2 days", "3 days", "4 days", "5 days", "6 days", "Daily"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`ef-${option}`} />
                                                <Label htmlFor={`ef-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    {/* Section: Food & Meals */}
                    {activeSection === "food" && (
                        <CardContent className="p-6 md:p-8 space-y-8">
                            {/* Food Preferences */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Diet Type (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`dt-${option}`}
                                                    checked={formData.dietType.includes(option)}
                                                    onCheckedChange={() => handleArrayToggle("dietType", option)}
                                                />
                                                <Label htmlFor={`dt-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-foodsDislike">Foods You Dislike</Label>
                                    <Textarea
                                        id="ape-foodsDislike"
                                        placeholder="Write here (max 600 characters)"
                                        value={formData.foodsDislike}
                                        onChange={(e) => handleInputChange("foodsDislike", e.target.value)}
                                        className="min-h-[80px] bg-[#0f0f0f] border-white/10"
                                        maxLength={600}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Allergies (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Dairy allergy", "Lactose intolerance", "Gluten intolerance", "Peanut allergy", "Soy allergy", "Egg allergy", "Seafood allergy", "None"].map((allergy) => (
                                            <div key={allergy} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`fa-${allergy}`}
                                                    checked={formData.foodAllergies.includes(allergy)}
                                                    onCheckedChange={() => handleArrayToggle("foodAllergies", allergy)}
                                                />
                                                <Label htmlFor={`fa-${allergy}`}>{allergy}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-foodAllergiesOther">Food Allergies (Other)</Label>
                                    <Textarea
                                        id="ape-foodAllergiesOther"
                                        placeholder="Write here (max 600 characters)"
                                        value={formData.foodAllergiesOther}
                                        onChange={(e) => handleInputChange("foodAllergiesOther", e.target.value)}
                                        className="min-h-[80px] bg-[#0f0f0f] border-white/10"
                                        maxLength={600}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-teaCoffeeIntake">Tea & Coffee Intake</Label>
                                        <Input
                                            id="ape-teaCoffeeIntake"
                                            placeholder="e.g., 2 cups/day"
                                            value={formData.teaCoffeeIntake}
                                            onChange={(e) => handleInputChange("teaCoffeeIntake", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Outside Food</Label>
                                        <RadioGroup
                                            value={formData.outsideFood}
                                            onValueChange={(value) => handleInputChange("outsideFood", value)}
                                            className="grid gap-2"
                                        >
                                            {["Rarely (0–1 times/week)", "1–2 times/week", "3–4 times/week", "Almost daily", "None"].map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`of-${option}`} />
                                                    <Label htmlFor={`of-${option}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Spice Tolerance</Label>
                                    <RadioGroup
                                        value={formData.spiceTolerance}
                                        onValueChange={(value) => handleInputChange("spiceTolerance", value)}
                                        className="flex gap-4"
                                    >
                                        {["Low", "Medium", "High (very spicy food)", "None"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`sp-${option}`} />
                                                <Label htmlFor={`sp-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>

                            {/* Meal Timings & Household */}
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Meal Timings & Household</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-breakfastTime">Breakfast Time</Label>
                                        <Input
                                            id="ape-breakfastTime"
                                            type="time"
                                            value={formData.breakfastTime}
                                            onChange={(e) => handleInputChange("breakfastTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-midMorningSnackTime">Mid-Morning Snack Time</Label>
                                        <Input
                                            id="ape-midMorningSnackTime"
                                            type="time"
                                            value={formData.midMorningSnackTime}
                                            onChange={(e) => handleInputChange("midMorningSnackTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-lunchTime">Lunch Time</Label>
                                        <Input
                                            id="ape-lunchTime"
                                            type="time"
                                            value={formData.lunchTime}
                                            onChange={(e) => handleInputChange("lunchTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-eveningSnackTime">Evening Snack Time</Label>
                                        <Input
                                            id="ape-eveningSnackTime"
                                            type="time"
                                            value={formData.eveningSnackTime}
                                            onChange={(e) => handleInputChange("eveningSnackTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ape-dinnerTime">Dinner Time</Label>
                                        <Input
                                            id="ape-dinnerTime"
                                            type="time"
                                            value={formData.dinnerTime}
                                            onChange={(e) => handleInputChange("dinnerTime", e.target.value)}
                                            className="bg-[#0f0f0f] border-white/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ape-lateNightEating">Late-Night Eating</Label>
                                    <Input
                                        id="ape-lateNightEating"
                                        placeholder="Yes / No – mention time if yes"
                                        value={formData.lateNightEating}
                                        onChange={(e) => handleInputChange("lateNightEating", e.target.value)}
                                        className="bg-[#0f0f0f] border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Who Cooks Your Daily Meals?</Label>
                                    <RadioGroup
                                        value={formData.whoCooksMeals}
                                        onValueChange={(value) => handleInputChange("whoCooksMeals", value)}
                                        className="grid gap-2"
                                    >
                                        {["I cook myself", "Mother / Family member", "Cook / House-help", "Mostly eat outside", "Tiffin service", "Hostel / PG food"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`wc-${option}`} />
                                                <Label htmlFor={`wc-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label>Kitchen Appliances Available (Select all that apply)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {["Gas stove", "Microwave", "Air Fryer", "Mixer / Blender"].map((appliance) => (
                                            <div key={appliance} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`ka-${appliance}`}
                                                    checked={formData.kitchenAppliances.includes(appliance)}
                                                    onCheckedChange={() => handleArrayToggle("kitchenAppliances", appliance)}
                                                />
                                                <Label htmlFor={`ka-${appliance}`}>{appliance}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Budget for Food</Label>
                                    <RadioGroup
                                        value={formData.budgetForFood}
                                        onValueChange={(value) => handleInputChange("budgetForFood", value)}
                                        className="grid gap-2"
                                    >
                                        {["Low", "Medium", "Comfortable", "High", "Premium", "Not sure / varies"].map((option) => (
                                            <div key={option} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option} id={`bf-${option}`} />
                                                <Label htmlFor={`bf-${option}`}>{option}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>

                            {/* Special Instructions */}
                            <div className="border-t pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="ape-specialInstructions">Special Instructions</Label>
                                    <Textarea
                                        id="ape-specialInstructions"
                                        placeholder={`Write any personal preferences or limitations${selectedGender === "women" ? ", pregnancy notes, religious or cultural food restrictions" : ""} (max 600 characters)`}
                                        value={formData.specialInstructions}
                                        onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                                        className="min-h-[100px] bg-[#0f0f0f] border-white/10"
                                        maxLength={600}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Save Button */}
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="flex-1 border-white/10 hover:bg-white/5" onClick={() => navigate("/admin/user-profiles")}>
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back to User Profiles
                    </Button>
                    <Button
                        variant="luxury"
                        size="lg"
                        className="flex-1"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="mr-2 h-5 w-5" /> Save Health Metrics
                            </>
                        )}
                    </Button>
                </div>
            </main>
        </AdminLayout>
    );
};

export default AdminProfileEdit;
