import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, Search, CornerDownLeft } from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface RetroSearchTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseFile[];
  onSelectCase: (slug: string) => void;
}

interface CommandLog {
  command: string;
  output: React.ReactNode;
}

export const RetroSearchTerminal: React.FC<RetroSearchTerminalProps> = ({
  isOpen,
  onClose,
  cases,
  onSelectCase,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandLog[]>([
    {
      command: 'sys.init',
      output: (
        <div className="text-zinc-400 space-y-1">
          <div>THE 302 DOCKET COMMAND LINE // REPOSITORY QUERY SYSTEM</div>
          <div className="text-zinc-500">
            Type <span className="text-phosphor">help</span> for commands, or type any case name or search query.
          </div>
        </div>
      ),
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      soundEngine.playKeyClick();
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    soundEngine.playKeyClick();
    const lower = cmd.toLowerCase();

    let outputNode: React.ReactNode;

    if (lower === 'clear' || lower === 'cls') {
      setHistory([]);
      setInputVal('');
      return;
    } else if (lower === 'help') {
      outputNode = (
        <div className="space-y-1 text-zinc-300">
          <div className="text-amber-400 font-bold">AVAILABLE COMMANDS:</div>
          <div><span className="text-phosphor">list / dir</span> - Display all indexed case dossiers</div>
          <div><span className="text-phosphor">case 001 / ramsey</span> - Open Case 001 (JonBenét Ramsey)</div>
          <div><span className="text-phosphor">case 002 / gsk</span> - Open Case 002 (Golden State Killer)</div>
          <div><span className="text-phosphor">case 003 / petito</span> - Open Case 003 (Gabby Petito)</div>
          <div><span className="text-phosphor">unsolved / cold</span> - List unsolved investigations</div>
          <div><span className="text-phosphor">clear</span> - Clear terminal buffer</div>
          <div><span className="text-phosphor">&lt;query&gt;</span> - Search all titles, suspects, and forensic exhibits</div>
        </div>
      );
    } else if (lower === 'list' || lower === 'dir' || lower === 'cases') {
      outputNode = (
        <div className="space-y-1 text-zinc-300">
          <div className="text-zinc-500 mb-1">INDEX OF CASE DOCKETS IN REPOSITORY:</div>
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                soundEngine.playFileAccess();
                onSelectCase(c.slug);
                onClose();
              }}
              className="hover:text-phosphor cursor-pointer flex items-center justify-between py-0.5 border-b border-zinc-900"
            >
              <span className="text-red-400 mr-2">{c.caseNumber}</span>
              <span className="text-zinc-200">{c.title}</span>
              <span className="text-zinc-500 text-xs">[{c.status}]</span>
            </div>
          ))}
        </div>
      );
    } else if (lower.includes('001') || lower.includes('ramsey') || lower.includes('jonbenet')) {
      const match = cases.find((c) => c.slug.includes('ramsey') || c.caseNumber.includes('001'));
      if (match) {
        soundEngine.playFileAccess();
        onSelectCase(match.slug);
        onClose();
        return;
      }
    } else if (lower.includes('002') || lower.includes('gsk') || lower.includes('deangelo') || lower.includes('golden')) {
      const match = cases.find((c) => c.slug.includes('deangelo') || c.caseNumber.includes('002'));
      if (match) {
        soundEngine.playFileAccess();
        onSelectCase(match.slug);
        onClose();
        return;
      }
    } else if (lower.includes('003') || lower.includes('petito') || lower.includes('laundrie')) {
      const match = cases.find((c) => c.slug.includes('petito') || c.caseNumber.includes('003'));
      if (match) {
        soundEngine.playFileAccess();
        onSelectCase(match.slug);
        onClose();
        return;
      }
    } else {
      // General search
      const results = cases.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.caseNumber.toLowerCase().includes(lower) ||
          c.summary.toLowerCase().includes(lower) ||
          c.category.toLowerCase().includes(lower) ||
          c.personsOfInterest?.some((p) => p.name.toLowerCase().includes(lower)) ||
          c.evidence?.some((e) => e.title.toLowerCase().includes(lower))
      );

      if (results.length > 0) {
        outputNode = (
          <div className="space-y-1 text-zinc-300">
            <div className="text-emerald-400">LOCATED {results.length} MATCHING DOCKET(S):</div>
            {results.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  soundEngine.playFileAccess();
                  onSelectCase(c.slug);
                  onClose();
                }}
                className="hover:text-phosphor cursor-pointer p-1 bg-zinc-950 border border-zinc-800 rounded my-1"
              >
                <div className="text-red-400 text-xs">{c.caseNumber} &bull; {c.status}</div>
                <div className="text-zinc-100 font-bold">{c.title}</div>
                <div className="text-zinc-400 text-xs line-clamp-1">{c.summary}</div>
              </div>
            ))}
          </div>
        );
      } else {
        outputNode = (
          <div className="text-red-400">
            ERROR: No matching docket found for query: "{cmd}". Type <span className="text-phosphor">list</span> to see all available cases.
          </div>
        );
      }
    }

    setHistory((prev) => [...prev, { command: cmd, output: outputNode }]);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="retro-window max-w-2xl w-full rounded-none overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Title bar */}
        <div className="retro-window-header active">
          <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-phosphor" />
            <span>COMMAND_TERMINAL.EXE // REPOSITORY SEARCH</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              onClose();
            }}
            className="retro-btn retro-btn-red text-xs px-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Terminal Body */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 bg-[#080a0c] p-4 overflow-y-auto font-terminal text-base text-zinc-300 space-y-3 cursor-text"
        >
          {history.map((h, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center space-x-2 text-zinc-400">
                <span className="text-red-500 font-bold">DOCKET:\&gt;</span>
                <span className="text-zinc-100 font-bold">{h.command}</span>
              </div>
              <div className="pl-4">{h.output}</div>
            </div>
          ))}

          {/* Prompt line */}
          <form onSubmit={handleCommand} className="flex items-center space-x-2 pt-2">
            <span className="text-red-500 font-bold">DOCKET:\&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type command or search terms..."
              className="flex-1 bg-transparent border-none outline-none text-phosphor font-terminal text-lg placeholder-zinc-700"
            />
            <button type="submit" className="text-zinc-500 hover:text-zinc-300">
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </form>

          <div ref={bottomRef} />
        </div>

        {/* Terminal Quick Command Footer */}
        <div className="bg-[#12161b] border-t border-[#2d333b] p-2 flex flex-wrap gap-2 text-xs font-tech text-zinc-400">
          <span className="text-zinc-500">QUICK CMDS:</span>
          {['list', 'case 001', 'case 002', 'case 003', 'unsolved', 'help'].map((btn) => (
            <button
              key={btn}
              onClick={() => {
                setInputVal(btn);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="retro-btn px-2 py-0.5 text-[11px]"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
