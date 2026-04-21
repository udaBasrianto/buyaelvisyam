import { useState, useEffect } from "react";
import { Trophy, Award, Search, TrendingUp, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  total_score: number;
  total_quizzes: number;
}

export default function LeaderboardManager() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const resp = await api.get("/leaderboard");
      setData(resp.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(entry => 
    entry.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" /> Leaderboard Kuis
          </h1>
          <p className="text-muted-foreground text-sm">Pantau perkembangan belajar dan skor kuis para pembaca.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Cari pembaca..." 
             className="pl-10 h-11 rounded-xl"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.slice(0, 3).map((top, index) => (
           <div key={top.user_id} className={`p-6 rounded-[2rem] border relative overflow-hidden ${index === 0 ? 'bg-amber-500 text-white border-amber-400' : 'bg-card border-border/50'}`}>
              <div className="flex items-center gap-4 relative z-10">
                 <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl ${index === 0 ? 'bg-white/20' : 'bg-muted'}`}>
                    {index + 1}
                 </div>
                 <Avatar className="h-14 w-14 border-4 border-background/20 shadow-xl">
                    <AvatarImage src={top.avatar_url} />
                    <AvatarFallback className="font-bold">{top.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="font-black text-lg truncate w-32">{top.display_name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-widest ${index === 0 ? 'text-white/70' : 'text-muted-foreground'}`}>{top.total_score} Poin</p>
                 </div>
              </div>
              <Award className={`absolute bottom-[-10px] right-[-10px] h-24 w-24 opacity-10 ${index === 0 ? 'text-white' : 'text-primary'}`} />
           </div>
        ))}
      </div>

      <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Peringkat</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pembaca</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kuis Selesai</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Skor</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry, index) => (
                <tr key={entry.user_id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="px-8 py-4">
                     <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${index < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {index + 1}
                     </span>
                  </td>
                  <td className="px-8 py-4">
                     <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                           <AvatarImage src={entry.avatar_url} />
                           <AvatarFallback className="font-bold text-[10px]">{entry.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                           <p className="text-sm font-black">{entry.display_name}</p>
                           <p className="text-[10px] text-muted-foreground font-bold">{entry.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                     <span className="text-sm font-bold bg-muted px-3 py-1 rounded-full">{entry.total_quizzes}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                     <p className="text-lg font-black text-primary tracking-tight">{entry.total_score.toLocaleString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
