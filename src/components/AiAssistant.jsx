import { useState, useRef, useEffect } from 'react';
import { matchFaq } from '../data/lmsFaq';

const THEMES = {
  landing: {
    buttonBg:   'bg-indigo-600 hover:bg-indigo-700',
    panelBg:    'bg-white',
    headerBg:   'bg-indigo-600 text-white',
    botBubble:  'bg-slate-100 text-slate-800',
    userBubble: 'bg-indigo-600 text-white',
    chipBg:     'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    inputFocus: 'focus:ring-indigo-500',
    title:      'Ask me about admissions',
    subtitle:   'I can help with applications, fees, programmes, and more.',
  },
  lms: {
    buttonBg:   'bg-blue-600 hover:bg-blue-700',
    panelBg:    'bg-white',
    headerBg:   'bg-blue-600 text-white',
    botBubble:  'bg-slate-100 text-slate-800',
    userBubble: 'bg-blue-600 text-white',
    chipBg:     'bg-blue-50 text-blue-700 hover:bg-blue-100',
    inputFocus: 'focus:ring-blue-500',
    title:      'LMS Assistant',
    subtitle:   'Ask about assignments, quizzes, grades, or how to use the LMS.',
  },
};

const WELCOME = {
  landing: "👋 Hi! I'm here to help with admissions and general questions. Try asking \"How do I apply?\" or click a suggestion below.",
  lms: "👋 Hi! I can help with the LMS — assignments, quizzes, grades, attendance, and more. Click a suggestion below or type your question.",
};

export default function AiAssistant({ theme = 'lms', faqs = [] }) {
  const t = THEMES[theme] || THEMES.lms;

  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'bot', text: WELCOME[theme] || WELCOME.lms }]);
    }
  }, [open]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async (text) => {
    const q = String(text || '').trim();
    if (!q) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setThinking(true);

    await new Promise((r) => setTimeout(r, 350));

    const match = matchFaq(q, faqs);
    if (!match) {
      setThinking(false);
      setMessages((prev) => [...prev, {
        role: 'bot',
        text: "🤔 I didn't quite catch that. Try one of the suggested questions below, or rephrase your question.",
      }]);
      return;
    }

    try {
      const answer = typeof match.answer === 'function'
        ? await match.answer()
        : match.answer;
      setMessages((prev) => [...prev, { role: 'bot', text: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', text: '⚠️ ' + (err.message || 'Something went wrong.') }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = (faqs || []).slice(0, 4).map((f) => f.q);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={'fixed bottom-4 right-4 z-50 ' + t.buttonBg + ' text-white rounded-full shadow-2xl w-14 h-14 flex items-center justify-center text-2xl transition hover:scale-105'}
        aria-label="Open assistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div
          className={'fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden ' + t.panelBg}
          style={{ height: '70vh', maxHeight: '70vh' }}
        >
          <div className={'px-4 py-3 ' + t.headerBg}>
            <h3 className="font-bold text-sm">{t.title}</h3>
            <p className="text-xs opacity-90 mt-0.5">{t.subtitle}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ' + (m.role === 'user' ? t.userBubble : t.botBubble)}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className={'max-w-[80%] px-3 py-2 rounded-2xl text-sm ' + t.botBubble}>
                  <span className="inline-block animate-pulse">● ● ●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="px-3 pb-2 bg-slate-50 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className={'text-[11px] px-2.5 py-1 rounded-full ' + t.chipBg}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="border-t border-gray-200 p-3 flex gap-2 bg-white"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              className={'flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ' + t.inputFocus}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className={t.buttonBg + ' text-white px-3 py-2 rounded-lg text-sm disabled:opacity-40'}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
