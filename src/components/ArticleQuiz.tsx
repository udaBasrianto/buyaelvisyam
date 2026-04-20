import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ChevronRight, Lock, Trophy, RefreshCcw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

interface ArticleQuizProps {
  articleId: string;
}

export function ArticleQuiz({ articleId }: ArticleQuizProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: start, 1: quiz, 2: result
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    api.get(`/articles/${articleId}/quiz`)
      .then(({ data }) => {
        if (data && data.length > 0) setQuestions(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) return <div className="py-8 text-center text-muted-foreground animate-pulse">Menyiapkan kuis...</div>;
  if (questions.length === 0) return null;

  if (!user) {
    return (
      <div className="my-12 p-8 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Uji Pemahaman Kamu!</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Daftar atau Login sekarang untuk mengikuti kuis interaktif berdasarkan isi artikel yang baru kamu baca.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/auth?mode=register">
            <Button className="rounded-full px-8">Daftar Sekarang</Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="rounded-full px-8">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const score = Object.entries(answers).reduce((acc, [idx, ans]) => (
    ans === questions[Number(idx)].correct_option ? acc + 1 : acc
  ), 0);

  const handleAnswer = (option: string) => {
    if (showExplanation) return;
    setAnswers({ ...answers, [currentIndex]: option });
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentStep(2);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setCurrentIndex(0);
    setAnswers({});
    setShowExplanation(false);
  };

  if (currentStep === 0) {
    return (
      <div className="my-12 p-8 rounded-3xl border border-primary/20 bg-card card-shadow overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <HelpCircle className="h-32 w-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Challenge</span>
             <span className="text-muted-foreground text-xs">{questions.length} Pertanyaan</span>
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3">Kuis Pemahaman Artikel</h3>
          <p className="text-muted-foreground mb-6 max-w-lg italic">
            "Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga."
          </p>
          <Button onClick={() => setCurrentStep(1)} className="rounded-full gap-2 px-8 py-6 text-lg">
            Mulai Kuis <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    const isPerfect = score === questions.length;
    return (
      <div className="my-12 p-10 rounded-3xl border border-primary/20 bg-card card-shadow text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Trophy className={cn("h-10 w-10", isPerfect ? "text-yellow-500" : "text-primary")} />
        </div>
        <h3 className="text-3xl font-black mb-2">{isPerfect ? "Maa Shaa Allah!" : "Alhamdulillah!"}</h3>
        <p className="text-muted-foreground mb-8">
           Kamu menjawab <span className="text-primary font-bold">{score}</span> dari <span className="font-bold">{questions.length}</span> soal dengan benar.
        </p>
        
        <div className="w-full bg-muted h-3 rounded-full mb-8 overflow-hidden">
           <div 
             className="bg-primary h-full transition-all duration-1000 ease-out" 
             style={{ width: `${(score / questions.length) * 100}%` }}
           />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={resetQuiz} variant="outline" className="rounded-full gap-2">
            <RefreshCcw className="h-4 w-4" /> Ulangi Kuis
          </Button>
          <Button className="rounded-full gap-2">
            Share Hasil <Trophy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  return (
    <div className="my-12 p-6 md:p-10 rounded-3xl border border-primary/20 bg-card card-shadow">
      <div className="flex justify-between items-center mb-8">
         <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pertanyaan {currentIndex + 1} / {questions.length}</span>
         <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={cn("h-1.5 w-8 rounded-full transition-colors", i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-primary/40" : "bg-muted")} />
            ))}
         </div>
      </div>

      <h4 className="text-xl md:text-2xl font-bold mb-8 leading-tight">{currentQuestion.question}</h4>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {options.map((opt) => {
          const isSelected = answers[currentIndex] === opt.key;
          const isCorrect = opt.key === currentQuestion.correct_option;
          
          let stateStyles = "border-border hover:border-primary/50 bg-background";
          if (showExplanation) {
             if (isCorrect) stateStyles = "border-emerald-500 bg-emerald-50 text-emerald-900";
             else if (isSelected) stateStyles = "border-destructive bg-destructive/5 text-destructive-foreground";
             else stateStyles = "opacity-50 border-border";
          } else if (isSelected) {
            stateStyles = "border-primary bg-primary/5 ring-1 ring-primary";
          }

          return (
            <button
              key={opt.key}
              disabled={showExplanation}
              onClick={() => handleAnswer(opt.key)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200",
                stateStyles
              )}
            >
              <span className={cn(
                "h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center text-sm font-bold",
                isSelected || (showExplanation && isCorrect) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {opt.key}
              </span>
              <span className="flex-1 font-medium">{opt.text}</span>
              {showExplanation && isCorrect && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
              {showExplanation && isSelected && !isCorrect && <XCircle className="h-6 w-6 text-destructive" />}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 mb-6">
            <h5 className="font-bold text-primary mb-1 text-sm uppercase tracking-wide">Penjelasan:</h5>
            <p className="text-sm text-foreground/80 leading-relaxed">{currentQuestion.explanation}</p>
          </div>
          <Button onClick={nextQuestion} className="w-full py-6 rounded-2xl text-lg font-bold">
            {currentIndex < questions.length - 1 ? "Pertanyaan Selanjutnya" : "Lihat Hasil Akhir"}
          </Button>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
