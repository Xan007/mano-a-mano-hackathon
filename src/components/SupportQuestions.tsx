import { useId, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, MessageCircle, Phone, Sparkles } from "lucide-react";
import { SUPPORT_CAST, SUPPORT_QUESTIONS } from "../../config/supportQuestions";
import { PlushArt } from "./PlushArt";
import { AnimatedText } from "./AnimatedText";
import { useCalmMotion } from "../lib/motion";

export function SupportQuestions() {
  const id = useId();
  const [open,setOpen] = useState(false);
  const [selected,setSelected] = useState<string | null>("enough");
  const reduce = useCalmMotion();
  return <section className="support-questions overflow-hidden rounded-2xl border-2 border-ink bg-mist shadow-[3px_3px_0_var(--color-ink)]">
    <button type="button" aria-expanded={open} aria-controls={`${id}-questions`} onClick={()=>setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
      <span className="flex shrink-0 -space-x-3" aria-hidden="true">{SUPPORT_CAST.slice(0,3).map(pet=><PlushArt key={pet.name} imagePath={pet.image} alt="" className="h-11 w-11 border-paper shadow-sm" blend={false} />)}</span>
      <span className="min-w-0 flex-1"><span className="block text-xl font-bold">¿Te preocupa algo?</span><span className="mt-1 block text-xs text-ink/70">Los peluches te cuentan, duda por duda.</span></span>
      <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
    <AnimatePresence initial={false}>
      {open && <m.div id={`${id}-questions`} initial={reduce ? false : {opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}} className="border-t-2 border-ink/15 bg-paper p-3 sm:p-5">
        <div className="support-cast mb-4 flex items-end justify-center gap-3 rounded-2xl bg-[#f6ecd9] px-3 pb-3 pt-5" aria-hidden="true">
          {SUPPORT_CAST.map((pet,index)=><div key={pet.name} className="text-center"><div className="support-plush-sway" style={{animationDelay:`${index * -.7}s`}}><PlushArt imagePath={pet.image} alt="" className="h-14 w-14 sm:h-20 sm:w-20" blend={false} /></div><span className="mt-2 block text-[11px] font-bold">{pet.name}</span></div>)}
        </div>
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-ink/70"><Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />Una charla para conocer opciones. Sin contar tus datos.</p>
        <div className="space-y-2">
          {SUPPORT_QUESTIONS.map((topic,index)=>{
            const active=selected===topic.id;
            return <div key={topic.id} className={`overflow-hidden rounded-xl border-2 ${active ? "border-ink bg-[#fffaf0]" : "border-ink/15 bg-paper"}`}>
              <h3><button type="button" id={`${id}-${topic.id}-button`} aria-expanded={active} aria-controls={`${id}-${topic.id}-answer`} onClick={()=>setSelected(active?null:topic.id)} className="flex min-h-12 w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold"><MessageCircle className="h-4 w-4 shrink-0 text-ink/50" aria-hidden="true" /><span className="flex-1">{topic.question}</span><ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${active?"rotate-180":""}`} aria-hidden="true" /></button></h3>
              <AnimatePresence initial={false}>{active && <m.div id={`${id}-${topic.id}-answer`} role="region" aria-labelledby={`${id}-${topic.id}-button`} initial={reduce?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}} className="space-y-4 px-3 pb-4 sm:px-4">
                {topic.replies.map((reply,replyIndex)=>{
                  const pet=SUPPORT_CAST[(index+replyIndex)%SUPPORT_CAST.length];
                  return <m.div key={`${topic.id}-${replyIndex}`} initial={reduce?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.3,delay:reduce?0:replyIndex*.16}} className={`flex items-start gap-2 sm:gap-3 ${replyIndex%2 ? "flex-row-reverse" : ""}`}>
                    <PlushArt imagePath={pet.image} alt="" className="mt-1 h-10 w-10 border-ink/15 sm:h-12 sm:w-12" blend={false} />
                    <div className={`support-speech min-w-0 flex-1 rounded-2xl border border-ink/10 p-3 ${replyIndex%2 ? "rounded-tr-sm" : "rounded-tl-sm"}`} style={{background:pet.color}}><p className="mb-1 text-[11px] font-extrabold">{pet.name}</p><p className="text-sm leading-relaxed"><AnimatedText text={reply} /></p></div>
                  </m.div>;
                })}
                {topic.emergency && <a href="tel:123" className="btn btn-ink w-full"><Phone className="h-4 w-4" aria-hidden="true" />Llamar al 123</a>}
              </m.div>}</AnimatePresence>
            </div>;
          })}
        </div>
      </m.div>}
    </AnimatePresence>
  </section>;
}
