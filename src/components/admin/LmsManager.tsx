import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Book, Video, FileText, ChevronRight, 
  Save, ImagePlus, X, Users, CreditCard, CheckCircle, XCircle, Search, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  instructor: string;
  level: string;
  category: string;
  price: number;
  is_published: boolean;
};

type Enrollment = {
  id: string;
  user_email: string;
  display_name: string;
  course_title: string;
  course_price: number;
  status: string;
  created_at: string;
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  content: string;
  duration: string;
  sort_order: number;
};

export function LmsManager() {
  const [activeTab, setActiveTab] = useState<"courses" | "enrollments">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [view, setView] = useState<{ type: "list" | "content", courseId?: string }>({ type: "list" });
  
  // Content Management State
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({}); // module_id -> lessons
  
  // Dialog States
  const [modOpen, setModOpen] = useState(false);
  const [lessOpen, setLessOpen] = useState(false);
  const [activeModId, setActiveModId] = useState<string | null>(null);
  
  const [modForm, setModForm] = useState({ title: "", sort_order: 1 });
  const [lessForm, setLessForm] = useState({ title: "", content: "", content_type: "video" });

  const [form, setForm] = useState({
    title: "", slug: "", description: "", thumbnail: "", instructor: "Ustadz", level: "Pemula", category: "Umum", price: 0, is_published: true
  });
  const [uploading, setUploading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/courses");
      if (data) setCourses(data);
    } catch (err) {
      toast({ title: "Gagal memuat kursus", variant: "destructive" });
    }
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/enrollments");
      if (data) setEnrollments(data);
    } catch (err) {
      toast({ title: "Gagal memuat pendaftaran", variant: "destructive" });
    }
    setLoading(false);
  };

  const updateEnrollment = async (id: string, status: string) => {
    try {
      await api.put(`/admin/enrollments/${id}`, { status });
      toast({ title: `Pendaftaran ${status === 'active' ? 'disetujui' : 'dibatalkan'}` });
      fetchEnrollments();
    } catch (err) {
      toast({ title: "Gagal memperbarui status", variant: "destructive" });
    }
  };

  const fetchContent = async (courseId: string) => {
    try {
      const { data: mods } = await api.get(`/courses/${courseId}/modules`);
      setModules(mods);
      
      const lessonMap: Record<string, Lesson[]> = {};
      for (const m of mods as Module[]) {
        const { data: less } = await api.get(`/modules/${m.id}/lessons`);
        lessonMap[m.id] = less;
      }
      setLessons(lessonMap);
    } catch (err) {
      toast({ title: "Gagal memuat materi", variant: "destructive" });
    }
  };

  useEffect(() => { 
    if (activeTab === "courses") fetchCourses();
    else fetchEnrollments();
  }, [activeTab]);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/courses/${editing.id}`, form);
      } else {
        await api.post("/courses", form);
      }
      toast({ title: "Berhasil menyimpan kursus" });
      setOpen(false);
      fetchCourses();
    } catch (err) {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(f => ({ ...f, thumbnail: data.url }));
      toast({ title: "Thumbnail diunggah" });
    } catch (err) {
      toast({ title: "Gagal upload", variant: "destructive" });
    }
    setUploading(false);
  };

  const onAddModule = async () => {
    if (!modForm.title.trim()) return;
    try {
      await api.post("/modules", { 
        course_id: view.courseId, 
        title: modForm.title, 
        sort_order: modules.length + 1 
      });
      setModOpen(false);
      setModForm({ title: "", sort_order: 1 });
      fetchContent(view.courseId!);
    } catch (err) { toast({ title: "Gagal tambah modul" }); }
  };

  const onAddLesson = async () => {
    if (!lessForm.title.trim() || !activeModId) return;
    try {
      await api.post("/lessons", { 
        module_id: activeModId, 
        title: lessForm.title, 
        slug: lessForm.title.toLowerCase().replace(/ /g, "-") + Date.now(),
        content: lessForm.content,
        content_type: lessForm.content_type,
        sort_order: (lessons[activeModId]?.length || 0) + 1
      });
      setLessOpen(false);
      setLessForm({ title: "", content: "", content_type: "video" });
      fetchContent(view.courseId!);
    } catch (err) { toast({ title: "Gagal tambah materi" }); }
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({ ...c });
    setOpen(true);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Hapus kursus ini? Semua modul dan materi di dalamnya juga akan hilang.")) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  if (view.type === "content") {
     const course = courses.find(c => c.id === view.courseId);
     return (
       <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => setView({ type: "list" })}><ChevronRight className="h-4 w-4 rotate-180" /></Button>
             <div>
                <h3 className="font-black uppercase tracking-tight">Materi: {course?.title}</h3>
                <p className="text-xs text-muted-foreground">Susun kurikulum belajar Anda di sini.</p>
             </div>
          </div>
          
          <div className="space-y-4">
             {modules.map((m, i) => (
               <div key={m.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-muted/50 px-6 py-4 flex items-center justify-between border-b">
                     <h4 className="font-bold text-sm">Modul {i+1}: {m.title}</h4>
                     <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase" onClick={() => { setActiveModId(m.id); setLessOpen(true); }}>
                        <Plus className="h-3 w-3 mr-1" /> Tambah Materi
                     </Button>
                  </div>
                  <div className="p-4 space-y-2">
                     {lessons[m.id]?.length > 0 ? (
                       lessons[m.id].map((l, j) => (
                         <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                  {l.content_type === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                               </div>
                               <div>
                                  <p className="text-sm font-semibold">{l.title}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{l.content}</p>
                               </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                       ))
                     ) : (
                       <p className="text-center py-6 text-xs text-muted-foreground">Belum ada materi di modul ini.</p>
                     )}
                  </div>
               </div>
             ))}
             
             <Button variant="dashed" className="w-full h-16 border-2" onClick={() => setModOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Modul Baru
             </Button>
          </div>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">Akademi LMS</h3>
          <p className="text-xs text-muted-foreground">Kelola kursus online dan materi edukasi Anda.</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/50">
           <button 
             onClick={() => setActiveTab("courses")}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "courses" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
           >
              Katalog
           </button>
           <button 
             onClick={() => setActiveTab("enrollments")}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "enrollments" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
           >
              Pendaftaran
           </button>
        </div>
      </div>

      {activeTab === "courses" ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setForm({ title: "", slug: "", description: "", thumbnail: "", instructor: "Ustadz", level: "Pemula", category: "Umum", price: 0, is_published: true }); setOpen(true); }} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Tambah Kursus
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Memuat...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {courses.map(c => (
                 <div key={c.id} className="bg-card border border-border/50 rounded-3xl overflow-hidden flex flex-col group hover:border-primary/30 transition-all shadow-sm hover:shadow-xl">
                   <div className="aspect-video relative overflow-hidden bg-muted">
                     {c.thumbnail && <img src={c.thumbnail} className="w-full h-full object-cover" />}
                     <div className="absolute top-3 right-3 flex gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${c.is_published ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                          {c.is_published ? "Live" : "Draft"}
                        </span>
                        {c.price > 0 && <span className="px-2 py-1 bg-primary text-white rounded-md text-[10px] font-black uppercase">Berbayar</span>}
                     </div>
                   </div>
                   <div className="p-5 flex-1 flex flex-col">
                     <h4 className="font-bold text-sm mb-1 line-clamp-1">{c.title}</h4>
                     <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{c.description}</p>
                     <div className="mt-auto pt-4 border-t flex items-center justify-between">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => deleteCourse(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button onClick={() => { setView({ type: "content", courseId: c.id }); fetchContent(c.id); }} variant="outline" size="sm" className="text-[10px] h-8 font-black uppercase tracking-widest gap-1 rounded-lg">
                           Materi <ChevronRight className="h-3 w-3" />
                        </Button>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-muted/50 border-b border-border/50">
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Siswa</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kursus</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Harga</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Aksi</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/30">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">Memuat data pendaftaran...</td></tr>
                    ) : enrollments.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">Belum ada pendaftaran.</td></tr>
                    ) : (
                      enrollments.map((en) => (
                        <tr key={en.id} className="hover:bg-muted/30 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-foreground">{en.display_name}</span>
                                 <span className="text-[10px] text-muted-foreground">{en.user_email}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm font-medium">{en.course_title}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm font-black text-primary">
                                 {en.course_price === 0 ? "GRATIS" : `Rp ${en.course_price.toLocaleString("id-ID")}`}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              {en.status === "active" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20 px-2 rounded-lg font-black text-[10px]">AKTIF</Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-amber-500/20 px-2 rounded-lg font-black text-[10px]">PENDING</Badge>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 {en.status === "pending" && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => updateEnrollment(en.id, "active")}
                                     className="h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase px-4"
                                   >
                                      Aktifkan
                                   </Button>
                                 )}
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   onClick={() => { if(confirm("Hapus pendaftaran ini?")) updateEnrollment(en.id, "cancelled") }}
                                   className="h-8 w-8 rounded-xl text-destructive"
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Course Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kursus" : "Tambah Kursus Baru"}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Lengkapi informasi kursus di bawah ini.</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
             <div className="col-span-2 space-y-2">
               <Label>Judul Kursus</Label>
               <Input value={form.title} onChange={e => setForm({...form, title: e.target.value, slug: editing ? form.slug : e.target.value.toLowerCase().replace(/ /g, "-")})} />
             </div>
             <div className="space-y-2">
               <Label>Slug URL</Label>
               <Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Instruktur</Label>
               <Input value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setForm({...form, level: v})}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="Pemula">Pemula</SelectItem>
                      <SelectItem value="Menengah">Menengah</SelectItem>
                      <SelectItem value="Lanjut">Lanjut</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="col-span-2 space-y-2">
               <Label>Deskripsi Singkat</Label>
               <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
             </div>
             <div className="col-span-2 space-y-2">
                <Label>Thumbnail Kursus</Label>
                <div className="flex gap-4">
                   <div className="h-20 w-32 rounded-xl bg-muted overflow-hidden border">
                      {form.thumbnail ? <img src={form.thumbnail} className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ImagePlus className="h-6 w-6" /></div>}
                   </div>
                   <div className="flex-1">
                      <Input value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})} placeholder="URL Gambar atau Upload..." className="mb-2" />
                      <Button variant="outline" size="sm" className="w-full gap-2 relative overflow-hidden" disabled={uploading}>
                         <ImagePlus className="h-3 w-3" /> {uploading ? "Mengunggah..." : "Upload File"}
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                      </Button>
                   </div>
                </div>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Simpan Kursus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog - Premium Styled */}
      <Dialog open={modOpen} onOpenChange={setModOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-xl border-primary/20 shadow-2xl rounded-[2rem]">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
               <Plus className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Modul Baru</DialogTitle>
            <p className="text-xs text-muted-foreground">Kelompokkan materi kursus dalam bab yang rapi.</p>
          </DialogHeader>
          <div className="py-6 space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Nama Modul</Label>
                <Input 
                   placeholder="Contoh: Pengenalan Tajwid" 
                   className="h-12 rounded-xl bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background transition-all"
                   value={modForm.title} 
                   onChange={e => setModForm({...modForm, title: e.target.value})} 
                />
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setModOpen(false)}>Batal</Button>
             <Button className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20" onClick={onAddModule}>Buat Modul</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog - Premium Styled */}
      <Dialog open={lessOpen} onOpenChange={setLessOpen}>
        <DialogContent className="sm:max-w-xl bg-background/80 backdrop-blur-xl border-primary/20 shadow-2xl rounded-[2.5rem]">
          <DialogHeader className="items-center text-center">
             <div className="h-14 w-14 rounded-3xl bg-secondary/20 flex items-center justify-center mb-2">
                <Video className="h-7 w-7 text-secondary-foreground" />
             </div>
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Tambah Materi Pelajaran</DialogTitle>
             <p className="text-xs text-muted-foreground">Masukkan detail materi untuk meningkatkan pemahaman siswa.</p>
          </DialogHeader>
          <div className="py-6 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Judul Materi</Label>
                <Input 
                   placeholder="Masukan judul pelajaran..." 
                   className="h-12 rounded-2xl bg-muted/40 border-none focus:ring-2 focus:ring-primary/20"
                   value={lessForm.title} 
                   onChange={e => setLessForm({...lessForm, title: e.target.value})} 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Tipe Konten</Label>
                   <Select value={lessForm.content_type} onValueChange={v => setLessForm({...lessForm, content_type: v})}>
                      <SelectTrigger className="h-12 rounded-2xl bg-muted/40 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-primary/10">
                         <SelectItem value="video">Video YouTube</SelectItem>
                         <SelectItem value="text">Artikel/Teks</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                   {lessForm.content_type === "video" ? "Gunakan link Embed YouTube" : "Konten Materi"}
                </Label>
                <Textarea 
                   placeholder={lessForm.content_type === "video" ? "Contoh: https://www.youtube.com/embed/..." : "Tuliskan materi pelajaran di sini..."} 
                   className="min-h-[120px] rounded-2xl bg-muted/40 border-none focus:ring-2 focus:ring-primary/20"
                   value={lessForm.content} 
                   onChange={e => setLessForm({...lessForm, content: e.target.value})} 
                />
             </div>
          </div>
          <DialogFooter className="sm:justify-center gap-3">
             <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold border-primary/20" onClick={() => setLessOpen(false)}>Batal</Button>
             <Button className="rounded-2xl h-12 px-12 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95" onClick={onAddLesson}>
                Simpan Materi
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
