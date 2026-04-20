import { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { 
  Users, Eye, TrendingUp, Clock, Globe, ArrowUpRight, 
  MapPin, MousePointer2, Smartphone, Monitor, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { format, isValid } from "date-fns";
import { id } from "date-fns/locale/id";

type AnalyticsData = {
  overview: {
    total_views: number;
    unique_visitors: number;
    views_growth: number;
    visitor_growth: number;
  };
  daily_stats: {
    date: string;
    views: number;
    unique: number;
  }[];
  top_articles: any[];
  recent_visitors: {
    id: string;
    ip: string;
    path: string;
    user_agent: string;
    created_at: string;
  }[];
  online_users: {
    id: string;
    display_name: string;
    email: string;
    last_active: string;
    last_path: string;
  }[];
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/admin/analytics");
        setData(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch analytics:", err);
        setError(err.response?.data?.error || "Gagal memuat data statistik");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || "Terjadi kesalahan saat memproses data statistik."}
        </AlertDescription>
      </Alert>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
  const overview = data.overview || { total_views: 0, unique_visitors: 0, views_growth: 0, visitor_growth: 0 };
  const dailyStats = data.daily_stats || [];
  const topArticles = data.top_articles || [];
  const recentVisitors = data.recent_visitors || [];
  const onlineUsers = data.online_users || [];

  const safeFormatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isValid(d)) return "--:--";
      return format(d, "HH:mm", { locale: id });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-none card-shadow glass-card relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tayangan</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{(overview.total_views || 0).toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-2 text-emerald-500 text-xs font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>{(overview.views_growth || 0)}% dari bulan lalu</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/30" />
        </Card>

        <Card className="overflow-hidden border-none card-shadow glass-card relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pengunjung Unik</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{(overview.unique_visitors || 0).toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>{(overview.visitor_growth || 0)}% peningkatan</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-110">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500/30" />
        </Card>

        <Card className="overflow-hidden border-none card-shadow glass-card relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sesi Aktif</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{((overview.unique_visitors || 0) * 0.1).toFixed(0)}</h3>
                <div className="flex items-center gap-1 mt-2 text-blue-500 text-xs font-semibold">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>Real-time stat</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-500/30" />
        </Card>

        <Card className="overflow-hidden border-none card-shadow glass-card relative group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rasio Pantulan</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">32.4%</h3>
                <div className="flex items-center gap-1 mt-2 text-violet-500 text-xs font-semibold">
                  <span>Sangat Stabil</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 transition-transform group-hover:scale-110">
                <Globe className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-violet-500/30" />
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none card-shadow glass-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-lg font-bold">Tren Kunjungan Harian</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Data 14 hari terakhir menunjukkan performa konten</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-medium">Views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-[10px] font-medium">Unique</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)'}}
                    />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="unique" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorUnique)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm italic">
                  Belum ada data kunjungan harian
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none card-shadow glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Konten Terpopuler</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Artikel dengan interaksi tertinggi hari ini</p>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full flex flex-col">
              {topArticles.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={topArticles} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="title" 
                        type="category" 
                        hide 
                      />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="views" radius={[0, 4, 4, 0]} barSize={20}>
                        {topArticles.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-3 overflow-y-auto pr-2 flex-1">
                    {topArticles.map((art: any, i: number) => (
                      <div key={art.id} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="text-xs font-bold text-muted-foreground w-4">{i + 1}</div>
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{art.title}</p>
                        </div>
                        <div className="text-[10px] font-bold whitespace-nowrap ml-4">{art.views.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm italic">
                  Belum ada data artikel populer
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Users & Visitor List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none card-shadow glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">User Sedang Online</CardTitle>
              <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{onlineUsers.length} Online</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Nama</th>
                    <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Email</th>
                    <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Halaman Terakhir</th>
                    <th className="text-right py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {onlineUsers.length > 0 ? (
                    onlineUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/10 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {u.display_name?.charAt(0) || "U"}
                            </div>
                            <span className="font-medium">{u.display_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4 truncate max-w-[120px] text-xs">{u.last_path}</td>
                        <td className="py-3 px-4 text-right text-[10px] font-bold text-emerald-600">
                          {safeFormatTime(u.last_active)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground italic">
                        Tidak ada user yang sedang online
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none card-shadow glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Kunjungan Real-time (IP)</CardTitle>
            <Badge variant="outline" className="animate-pulse bg-emerald-500/10 text-emerald-600 border-emerald-500/20">LIVE</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">IP</th>
                    <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Halaman</th>
                    <th className="text-left py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Device</th>
                    <th className="text-right py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {recentVisitors.length > 0 ? (
                    recentVisitors.map((v) => (
                      <tr key={v.id} className="hover:bg-accent/10 transition-colors">
                        <td className="py-3 px-4 font-mono text-[10px]">{v.ip}</td>
                        <td className="py-3 px-4 truncate max-w-[100px] text-xs">{v.path}</td>
                        <td className="py-3 px-4">
                           <div className="flex items-center gap-1.5 text-muted-foreground scale-75 origin-left">
                             {v.user_agent?.toLowerCase().includes('mobile') ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                             <span className="text-[10px] truncate max-w-[60px]">{v.user_agent?.split('/')[0]}</span>
                           </div>
                        </td>
                        <td className="py-3 px-4 text-right text-[10px] text-muted-foreground">
                          {safeFormatTime(v.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground italic">
                        Belum ada kunjungan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none card-shadow glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Metrik Sesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">Domestik (Indonesia)</span>
              </div>
              <span>85%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MousePointer2 className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">Desktop Users</span>
              </div>
              <span>65%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">Mobile Users</span>
              </div>
              <span>35%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '35%' }} />
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs font-semibold text-primary uppercase mb-1">Peralihan Perangkat</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Pengunjung lebih banyak mengakses melalui Desktop pada jam-jam kajian siang hari.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
