import { useEffect, useRef, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { useAction, useQuery } from "convex/react";
import { Link } from "react-router";
import { Bot, Send, X } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { guideAnswer } from "../../config/guide";
import { useSession } from "../lib/session";
import { errorMessage } from "../lib/errors";
import { AnimatePresence, m } from "motion/react";
import { useCalmMotion } from "../lib/motion";
import { AnimatedText } from "./AnimatedText";
import { play } from "../lib/audio";

type Reply = ReturnType<typeof guideAnswer>;
type Exchange = { id: string; question: string; reply: Reply };

function GuideDialog({
  token,
  open,
  onClose,
}: {
  token: string;
  open: boolean;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const latestReply = useRef<HTMLDivElement>(null);
  const ask = useAction(api.moderation.guide);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState("");
  const sending = useRef(false);
  const reduce = useCalmMotion();
  useEffect(() => {
    if (!open) return;
    const container = transcript.current;
    if (container) {
      if (busy) container.scrollTop = container.scrollHeight;
      else if (latestReply.current) {
        container.scrollTop +=
          latestReply.current.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          16;
      }
    }
    if (!busy) input.current?.focus();
  }, [messages, busy, open]);
  async function send(question = draft) {
    question = question.trim();
    if (!question || sending.current) return;
    sending.current = true;
    setBusy(true);
    setPendingQuestion(question);
    setDraft("");
    setError("");
    try {
      const history = messages
        .flatMap((message) => [
          { role: "user" as const, content: message.question },
          { role: "assistant" as const, content: message.reply.text },
        ])
        .slice(-6);
      const [reply] = await Promise.all([
        ask({ token, question, history }),
        new Promise<void>((resolve) => window.setTimeout(resolve, 700)),
      ]);
      setMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), question, reply },
      ]);
      if (open) play("message");
    } catch (caught) {
      setDraft(question);
      setError(
        errorMessage(caught, "No pudimos responder ahora. Intenta de nuevo."),
      );
    } finally {
      sending.current = false;
      setPendingQuestion("");
      setBusy(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }
  return (
    <AnimatePresence>
    {open && (
    <Modal
      labelledBy="guide-title"
      onClose={() => onClose()}
      align="chat"
      className="flex h-[min(34rem,75dvh)] w-full max-w-sm flex-col overflow-hidden rounded-[1.5rem] border-2 border-ink bg-paper text-ink shadow-[6px_6px_0_var(--color-ink)]"
    >
      <header className="flex shrink-0 items-center gap-3 border-b-2 border-ink bg-mist p-4">
        <Bot className="h-6 w-6 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h2 id="guide-title" className="text-xl">
            Tu asistente
          </h2>
          <p className="mt-1 text-xs">Charlemos. O explora la app conmigo.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar guía"
          className="btn btn-ghost h-11 w-11 p-0"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div
        ref={transcript}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Preguntas y respuestas de la guía"
      >
        <p className="text-sm text-ink/75">
          ¡Hola! Podemos charlar o explorar Mano a Mano. No doy consejos de
          salud.
        </p>
        {messages.length === 0 && !busy && (
          <div className="space-y-2">
            {[
              "Canales de apoyo",
              "¿Cómo viajan los peluches?",
              "¿Cómo escribo una nota?",
            ].map((question) => (
              <button
                type="button"
                key={question}
                disabled={busy}
                onClick={() => {
                  void send(question);
                }}
                className="btn btn-ghost min-h-11 w-full justify-start rounded-xl text-left text-xs"
              >
                {question}
              </button>
            ))}
          </div>
        )}
        {messages.map((exchange, index) => (
          <div key={exchange.id} className="space-y-3">
            <p className="ml-6 rounded-2xl border-2 border-ink bg-mango p-3 text-sm leading-relaxed">
              {exchange.question}
            </p>
            <div
              ref={index === messages.length - 1 ? latestReply : undefined}
              data-testid="guide-reply"
              className="postit space-y-3"
            >
              <p className="text-sm leading-relaxed">
                <AnimatedText text={exchange.reply.text} />
              </p>
              {exchange.reply.link && (
                <Link
                  to={exchange.reply.link}
                  onClick={onClose}
                  className="btn btn-ink w-full text-xs"
                >
                  {exchange.reply.label}
                </Link>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="space-y-3">
            <p className="ml-6 rounded-2xl border-2 border-ink bg-mango p-3 text-sm leading-relaxed">{pendingQuestion}</p>
            <m.div role="status" aria-label="El asistente está pensando" data-testid="guide-thinking" className="inline-flex min-h-12 items-center gap-3 rounded-2xl rounded-tl-sm border-2 border-ink bg-mist px-4 py-3" initial={{opacity:0}} animate={{opacity:1}}>
              <Bot className="h-5 w-5 text-lagoon" aria-hidden="true" />
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {[0,1,2].map(dot => <m.span key={dot} className="h-2 w-2 rounded-full bg-lagoon" animate={reduce ? undefined : { y:[0,-4,0], opacity:[0.45,1,0.45] }} transition={{duration:0.75,repeat:Infinity,delay:dot*0.12,ease:"easeInOut"}} />)}
              </span>
            </m.div>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-blush p-3 text-sm">
            {error}
          </p>
        )}
      </div>
      <form
        onSubmit={submit}
        className="flex shrink-0 items-center gap-2 border-t-2 border-ink bg-paper p-3"
      >
        <label htmlFor="guide-question" className="sr-only">
          Tu pregunta para la guía
        </label>
        <input
          ref={input}
          id="guide-question"
          value={draft}
          maxLength={400}
          disabled={busy}
          onChange={(event) => setDraft(event.target.value)}
          className="field min-w-0 flex-1 text-sm"
          placeholder="Escribe aquí…"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Enviar pregunta"
          className="btn btn-ink h-11 w-11 shrink-0 p-0"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
      <p className="shrink-0 bg-paper px-4 pb-3 text-[11px] text-ink/60">
        IA con Groq · La conversación sigue al cerrar. Evita datos personales.
      </p>
    </Modal>
    )}
    </AnimatePresence>
  );
}

function Guide({ token }: { token: string }) {
  const me = useQuery(api.auth.me, { token });
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const reduce = useCalmMotion();
  const nextHint = useRef(0);
  const eligible = Boolean(me?.companion && me.firstJourneyAt && !me.bannedAt);
  useEffect(() => {
    if (open || !eligible) return;
    let idle: number, dismiss: number;
    function reset() {
      window.clearTimeout(idle);
      window.clearTimeout(dismiss);
      setHint(false);
      if (document.hidden) return;
      idle = window.setTimeout(() => {
        if (Date.now() < nextHint.current) return;
        setHint(true);
        play("message");
        nextHint.current = Date.now() + 120_000;
        dismiss = window.setTimeout(() => setHint(false), 6500);
      }, 45_000);
    }
    const events = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange",
    ] as const;
    events.forEach((event) =>
      document.addEventListener(event, reset, { passive: true }),
    );
    reset();
    return () => {
      window.clearTimeout(idle);
      window.clearTimeout(dismiss);
      events.forEach((event) => document.removeEventListener(event, reset));
    };
  }, [open, eligible]);
  if (!eligible) return null;
  return (
    <>
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 md:bottom-6">
        <AnimatePresence>
          {!open && hint && (
            <m.span
              className="pointer-events-none rounded-2xl border-2 border-ink bg-paper px-4 py-2 text-sm font-bold shadow-[3px_3px_0_var(--color-ink)]"
              initial={{ opacity: 0, x: reduce ? 0 : 12, y: reduce ? 0 : 4, rotate: reduce ? 0 : -3, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              ¿Una mano?
            </m.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!open && (
            <m.button
              type="button"
              data-tour="guide"
              onClick={() => {
                setHint(false);
                setOpen(true);
              }}
              aria-label="Abrir asistente"
              className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-paper shadow-[3px_3px_0_var(--color-ink)]"
              initial={{ opacity: 0, scale: 0.95 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              animate={
                hint && !reduce
                  ? {
                      opacity: 1,
                      scale: [1, 1.16, 0.96, 1.06, 1],
                      rotate: [0, -10, 9, -5, 0],
                      y: [0, -8, 0, -3, 0],
                    }
                  : { opacity: 1, scale: 1, rotate: 0, y: 0 }
              }
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Bot className="h-6 w-6" aria-hidden="true" />
            </m.button>
          )}
        </AnimatePresence>
      </div>
      <GuideDialog token={token} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ChatGuide() {
  const { token } = useSession();
  return token ? <Guide key={token} token={token} /> : null;
}
