import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Question {
  id?: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

interface QuizManagerProps {
  articleId: string;
  articleContent: string;
}

export function QuizManager({ articleId, articleContent }: QuizManagerProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/articles/${articleId}/quiz`)
      .then(({ data }) => {
        if (data) setQuestions(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [articleId]);

  const addQuestion = () => {
    if (questions.length >= 5) {
      toast({ title: "Maksimal 5 soal", description: "Satu artikel maksimal punya 5 soal kuis." });
      return;
    }
    setQuestions([...questions, {
      question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", explanation: ""
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/articles/${articleId}/quiz`, questions);
      toast({ title: "Berhasil", description: "Kuis artikel telah diperbarui." });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const generateAIQuiz = () => {
    toast({ title: "AI Magic...", description: "Menganalisis konten artikel untuk membuat kuis..." });
    
    // Simulate AI extraction from articleContent
    // In a real scenario, this would call an LLM API
    setTimeout(() => {
      const mockQuestions: Question[] = [
        { 
          question: `Apa poin utama dari pembahasan di artikel ini?`,
          option_a: "Pembahasan tentang sejarah",
          option_b: "Penjelasan fiqih praktis",
          option_c: "Kisah inspiratif sahabat",
          option_d: "Hukum kontemporer",
          correct_option: "B",
          explanation: "Isi artikel secara mendalam membahas tentang tata cara dan hukum fiqih."
        },
        {
          question: `Berdasarkan artikel, apa hukum asal dari perkara yang dibahas?`,
          option_a: "Wajib", option_b: "Sunnah", option_c: "Mubah", option_d: "Makruh",
          correct_option: "A",
          explanation: "Penulis menyebutkan dalil kuat yang menunjukkan hukumnya adalah wajib."
        }
      ];
      setQuestions([...questions, ...mockQuestions].slice(0, 5));
      toast({ title: "Kuis Tergenerate!", description: "AI telah membuat draf kuis. Silakan tinjau dan simpan." });
    }, 1500);
  };

  if (loading) return <div className="p-8 text-center">Memuat kuis...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h4 className="text-lg font-bold">Kuis Artikel</h4>
           <p className="text-sm text-muted-foreground">Maksimal 5 soal pilihan ganda.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={generateAIQuiz} className="gap-2 text-primary border-primary/20 hover:bg-primary/5">
              <Sparkles className="h-4 w-4" /> Auto-Generate AI
           </Button>
           <Button size="sm" onClick={addQuestion} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Soal
           </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="border-2 border-dashed rounded-2xl p-12 text-center">
           <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
           <p className="text-muted-foreground">Belum ada kuis untuk artikel ini.</p>
           <Button variant="link" onClick={generateAIQuiz} className="text-primary">Generate kuis otomatis dengan AI</Button>
        </div>
      ) : (
        <div className="space-y-6">
           {questions.map((q, i) => (
             <div key={i} className="bg-muted/30 rounded-2xl p-6 border relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeQuestion(i)}
                >
                   <Trash2 className="h-4 w-4" />
                </Button>
                
                <div className="grid gap-4 mb-4">
                   <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                         {i + 1}
                      </span>
                      <Input 
                        value={q.question} 
                        onChange={e => updateQuestion(i, "question", e.target.value)} 
                        placeholder="Tuliskan pertanyaan disini..." 
                        className="flex-1 font-bold"
                      />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold w-4">A.</span>
                         <Input value={q.option_a} onChange={e => updateQuestion(i, "option_a", e.target.value)} placeholder="Opsi A" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold w-4">B.</span>
                         <Input value={q.option_b} onChange={e => updateQuestion(i, "option_b", e.target.value)} placeholder="Opsi B" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold w-4">C.</span>
                         <Input value={q.option_c} onChange={e => updateQuestion(i, "option_c", e.target.value)} placeholder="Opsi C" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold w-4">D.</span>
                         <Input value={q.option_d} onChange={e => updateQuestion(i, "option_d", e.target.value)} placeholder="Opsi D" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-1">
                         <Label className="text-[10px] uppercase font-bold mb-1 block">Jawaban Benar</Label>
                         <div className="flex gap-2">
                            {["A", "B", "C", "D"].map(opt => (
                              <button
                                key={opt}
                                onClick={() => updateQuestion(i, "correct_option", opt)}
                                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                                  q.correct_option === opt ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-muted"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-[10px] uppercase font-bold mb-1 block">Penjelasan (Muncul setelah dijawab)</Label>
                        <Input value={q.explanation} onChange={e => updateQuestion(i, "explanation", e.target.value)} placeholder="Kenapa jawaban ini benar?" />
                      </div>
                   </div>
                </div>
             </div>
           ))}
           
           <Button onClick={handleSave} disabled={saving} className="w-full gap-2 py-6 text-lg font-bold">
              <Save className="h-5 w-5" /> {saving ? "Menyimpan..." : "Simpan Semua Kuis"}
           </Button>
        </div>
      )}
    </div>
  );
}
