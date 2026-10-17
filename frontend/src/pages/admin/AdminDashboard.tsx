import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight, Activity, DollarSign, LineChart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("mrdiet_auth_user") || "{}");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.admin.getAnalytics(user.id);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        </AdminLayout>
    );

    const stats = [
        {
            title: "Total Revenue",
            value: `₹${(data?.stats?.totalRevenue || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
            trend: data?.stats?.revenueToday ? `₹${data.stats.revenueToday} today` : null,
            trendUp: true
        },
        {
            title: "Monthly Revenue (MRR)",
            value: `₹${(data?.stats?.mrr || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "from-gold/20 to-gold/5 text-gold",
            trend: "Only 30d/Monthly plans",
            trendUp: true
        },
        {
            title: "Total Users",
            value: data?.stats?.totalUsers || 0,
            icon: Users,
            color: "from-blue-500/20 to-blue-500/5 text-blue-500",
            trend: data?.stats?.activeSubscriptions ? `${data.stats.activeSubscriptions} active` : null,
            trendUp: true
        },
        {
            title: "Pending Payouts",
            value: `₹${(data?.stats?.pendingWithdrawalsAmount || 0).toLocaleString()}`,
            icon: CreditCard,
            color: "from-amber-500/20 to-amber-500/5 text-amber-500",
            trend: data?.stats?.pendingWithdrawalsCount ? `${data.stats.pendingWithdrawalsCount} requests` : null,
            trendUp: false
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card/10 p-5 rounded-xl border border-border/40 backdrop-blur-xl gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold/10 rounded-lg">
                            <Activity className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Admin Intel</h1>
                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-[0.1em]">Performance Metrics Dashboard</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1.5 bg-secondary/30 rounded-lg border border-border/50 flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Today:</span>
                            <span className="text-xs font-black text-emerald-500">₹{data?.stats?.revenueToday || 0}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-secondary/30 rounded-lg border border-border/50 flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending Orders:</span>
                            <span className="text-xs font-black text-amber-500">{data?.stats?.pendingPayments || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="border-border/40 bg-card/30 backdrop-blur-xl relative overflow-hidden group hover:border-gold/30 transition-all duration-300">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} blur-3xl opacity-20 -mr-12 -mt-12 group-hover:opacity-40 transition-opacity`}></div>
                            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                                <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-1.5 rounded-md bg-gradient-to-br ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]}`}>
                                    <stat.icon className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                                {stat.trend && (
                                    <div className="flex items-center gap-1 mt-2">
                                        <div className={`w-1 h-1 rounded-full ${stat.trendUp ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${stat.trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>{stat.trend}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/40 bg-card/10 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <div>
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">Revenue Flow (30d)</CardTitle>
                            </div>
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="h-[200px] pt-2 pr-4 pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.revenueChart}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={7}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis stroke="#888888" fontSize={7} width={20} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '9px' }}
                                        labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                                        formatter={(val: any) => [`₹${val}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAmount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border/40 bg-card/10 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <div>
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest">User Growth (30d)</CardTitle>
                            </div>
                            <Users className="h-3.5 w-3.5 text-blue-500" />
                        </CardHeader>
                        <CardContent className="h-[200px] pt-2 pr-4 pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.growthChart}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={7}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric' })}
                                    />
                                    <YAxis stroke="#888888" fontSize={7} width={20} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '9px' }}
                                        labelStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-border/40 bg-card/10 backdrop-blur-sm">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold uppercase tracking-tighter">Recent Transactions</CardTitle>
                                    <CardDescription className="text-[10px] uppercase">Live payment activity</CardDescription>
                                </div>
                                <Activity className="h-4 w-4 text-gold opacity-50" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t border-border/40 overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-secondary/20">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold text-[9px] uppercase h-10 px-4">Customer</TableHead>
                                            <TableHead className="font-bold text-[9px] uppercase text-center h-10">Plan</TableHead>
                                            <TableHead className="font-bold text-[9px] uppercase text-center h-10">Amount</TableHead>
                                            <TableHead className="font-bold text-[9px] uppercase text-center h-10">Status</TableHead>
                                            <TableHead className="font-bold text-[9px] uppercase text-right h-10 px-4">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.recentTransactions?.map((tx: any) => (
                                            <TableRow key={tx.id} className="group hover:bg-gold/5 transition-colors border-border/40">
                                                <TableCell className="px-4 py-2 border-none">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-[9px] font-black uppercase">
                                                            {tx.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-foreground group-hover:text-gold transition-colors">{tx.name}</div>
                                                            <div className="text-[9px] text-muted-foreground font-medium uppercase truncate max-w-[120px]">{tx.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-2">
                                                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/50 border border-border/40">
                                                        {tx.plan_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center py-2 font-black text-xs text-gold">₹{tx.amount}</TableCell>
                                                <TableCell className="text-center py-2">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${tx.payment_status === 'completed' || tx.payment_status === 'SUCCESS'
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-amber-500/10 text-amber-500'
                                                        }`}>
                                                        {tx.payment_status}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-2 px-4 text-[10px] font-medium text-muted-foreground font-mono">
                                                    {new Date(tx.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
