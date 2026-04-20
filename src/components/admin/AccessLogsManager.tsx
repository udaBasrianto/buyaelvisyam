import { useEffect, useState } from "react";
import { ShieldAlert, MapPin, Globe, Clock, Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface AccessLog {
  id: string;
  ip: string;
  path: string;
  user_agent: string;
  location: string;
  status: string;
  created_at: string;
}

export function AccessLogsManager() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/access-logs");
      if (data) setLogs(data);
    } catch (error) {
      console.error("Gagal memuat log", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Log Akses Keamanan
          </h3>
          <p className="text-xs text-muted-foreground italic">Memantau percobaan akses ke area sensitif / jalur admin rahasia.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2 rounded-xl">
           <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
           Refresh
        </Button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Waktu</th>
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">IP / Lokasi</th>
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Path</th>
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Device</th>
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">
                        {new Date(log.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold">{log.ip}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                           <MapPin className="h-3 w-3 text-primary" />
                           {log.location}
                        </span>
                     </div>
                  </td>
                  <td className="p-4">
                     <span className="px-2 py-1 bg-muted rounded font-mono text-[10px] border border-border/50">
                        {log.path}
                     </span>
                  </td>
                  <td className="p-4 max-w-[200px]">
                     <div className="text-[10px] text-muted-foreground truncate hover:whitespace-normal cursor-help flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {log.user_agent}
                     </div>
                  </td>
                  <td className="p-4">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        log.status === "blocked" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        log.status === "success" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                        "bg-muted text-muted-foreground border-border"
                     }`}>
                        {log.status.toUpperCase()}
                     </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                    {loading ? "Memuat data..." : "Belum ada log percobaan akses."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
