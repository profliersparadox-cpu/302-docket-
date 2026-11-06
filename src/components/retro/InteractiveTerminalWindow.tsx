import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, CornerDownLeft, Sparkles, Folder, Play } from 'lucide-react';
import { CaseFile } from '../../types.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface InteractiveTerminalWindowProps {
  cases: CaseFile[];
  onSelectCase: (slug: string) => void;
  onOpenApp: (appId: string) => void;
  onShutdown: () => void;
}

interface CommandLog {
  id: string;
  command: string;
  output: React.ReactNode;
}

const KNOWN_COMMANDS = [
  'help',
  'cases',
  'dir',
  'list',
  'search',
  'open case 001',
  'open case 002',
  'open case 003',
  'evidence',
  'timeline',
  'interviews',
  'docs',
  'map',
  'exercises',
  'trial',
  'trialsim',
  'courtroom',
  'stamps',
  'about',
  'clear',
  'cls',
  'secret',
  'spooky',
  'hoover',
  'codis',
  'status',
  'shutdown',
  'reboot',
];

export const InteractiveTerminalWindow: React.FC<InteractiveTerminalWindowProps> = ({
  cases,
  onSelectCase,
  onOpenApp,
  onShutdown,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init-1',
      command: 'sys.kernel --version',
      output: (
        <div className="text-zinc-400 space-y-1">
          <div className="text-phosphor font-bold">THE 302 DOCKET // INVESTIGATIVE DOS KERNEL v4.19</div>
          <div className="text-zinc-500">
            Type <span className="text-amber-400 font-bold">HELP</span> for directory of instructions. Autocomplete available via <span className="text-zinc-300 font-bold">[TAB]</span>.
          </div>
        </div>
      ),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const recordCommandInStorage = (cmd: string) => {
    try {
      const saved = localStorage.getItem('docket_unlocked_stamps');
      const stamps = saved ? JSON.parse(saved) : ['STAMP_FIRST_BOOT'];
      if (!stamps.includes('STAMP_TERMINAL_HACKER')) {
        stamps.push('STAMP_TERMINAL_HACKER');
        localStorage.setItem('docket_unlocked_stamps', JSON.stringify(stamps));
      }
    } catch (_) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim().toLowerCase();
      if (current) {
        const match = KNOWN_COMMANDS.find((k) => k.startsWith(current));
        if (match) {
          setInputVal(match);
          soundEngine.playKeyClick();
        }
      }
    }
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputVal.trim();
    if (!raw) return;

    soundEngine.playKeyClick();
    setCommandHistory((prev) => [...prev, raw]);
    setHistoryIndex(-1);
    setInputVal('');
    recordCommandInStorage(raw);

    const lower = raw.toLowerCase();

    // 1. Clear Screen
    if (lower === 'clear' || lower === 'cls') {
      setLogs([]);
      return;
    }

    let outputNode: React.ReactNode;

    // 2. HELP
    if (lower === 'help') {
      outputNode = (
        <div className="space-y-1.5 text-zinc-300">
          <div className="text-amber-400 font-bold border-b border-zinc-800 pb-1">
            BUREAU COMMAND DIRECTORY (DOS-302):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
            <div><span className="text-phosphor">CASES / DIR</span> - Display case dossier catalog</div>
            <div><span className="text-phosphor">SEARCH &lt;term&gt;</span> - Search all exhibits & dockets</div>
            <div><span className="text-phosphor">OPEN CASE 001</span> - Load JonBenét Ramsey file</div>
            <div><span className="text-phosphor">OPEN CASE 002</span> - Load Golden State Killer file</div>
            <div><span className="text-phosphor">OPEN CASE 003</span> - Load Gabby Petito file</div>
            <div><span className="text-phosphor">EVIDENCE</span> - Launch Evidence Pinboard window</div>
            <div><span className="text-phosphor">TIMELINE</span> - Launch Chrono Reconstruction</div>
            <div><span className="text-phosphor">INTERVIEWS</span> - Launch FD-302 Interview Vault</div>
            <div><span className="text-phosphor">DOCS</span> - Open Classified Document Room</div>
            <div><span className="text-phosphor">MAP</span> - Launch Geographical Radar Recon</div>
            <div><span className="text-phosphor">EXERCISES</span> - Open Fictional Training Lab</div>
            <div><span className="text-phosphor">STAMPS</span> - View Collectibles & Badge Album</div>
            <div><span className="text-phosphor">ABOUT</span> - Archive Constitution & Ethics</div>
            <div><span className="text-phosphor">SHUTDOWN</span> - Power off system terminal</div>
            <div><span className="text-phosphor">CLEAR</span> - Flush terminal screen buffer</div>
          </div>
          <div className="text-zinc-500 text-[10px] pt-1">
            TIP: Autocomplete commands with [TAB] key. Revisit history with [UP]/[DOWN] arrow keys.
          </div>
        </div>
      );
    }
    // 3. CASES / DIR / LIST
    else if (lower === 'cases' || lower === 'dir' || lower === 'list') {
      outputNode = (
        <div className="space-y-1 text-zinc-300">
          <div className="text-zinc-500 mb-1 border-b border-zinc-800 pb-1 flex justify-between">
            <span>INDEX OF VERIFIED INVESTIGATIVE DOSSIERS:</span>
            <span>{cases.length} ENTRIES FOUND</span>
          </div>
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                soundEngine.playFileAccess();
                onSelectCase(c.slug);
              }}
              className="hover:text-phosphor cursor-pointer flex items-center justify-between py-1 border-b border-zinc-900 group"
            >
              <div className="flex items-center space-x-2">
                <span className="text-red-400 font-mono font-bold">{c.caseNumber}</span>
                <span className="text-zinc-200 group-hover:underline">{c.title}</span>
              </div>
              <div className="text-zinc-500 text-xs font-mono">
                [{c.status}]
              </div>
            </div>
          ))}
        </div>
      );
    }
    // 4. OPEN CASE 001
    else if (lower === 'open case 001' || lower === 'case 001' || lower === 'ramsey') {
      const ramsey = cases.find((c) => c.slug.includes('ramsey') || c.caseNumber.includes('001'));
      if (ramsey) {
        onSelectCase(ramsey.slug);
        outputNode = (
          <div className="text-emerald-400">
            [MOUNTING SECTORS] Retrieving Case 001: JONBENÉT RAMSEY (Boulder PD #96-15795)...
          </div>
        );
      } else {
        outputNode = <div className="text-red-400">ERROR: Case 001 file record not accessible.</div>;
      }
    }
    // 5. OPEN CASE 002
    else if (lower === 'open case 002' || lower === 'case 002' || lower === 'gsk') {
      const gsk = cases.find((c) => c.slug.includes('deangelo') || c.slug.includes('golden') || c.caseNumber.includes('002'));
      if (gsk) {
        onSelectCase(gsk.slug);
        outputNode = (
          <div className="text-emerald-400">
            [MOUNTING SECTORS] Retrieving Case 002: THE GOLDEN STATE KILLER (CA DOJ #18FE008012)...
          </div>
        );
      } else {
        outputNode = <div className="text-red-400">ERROR: Case 002 file record not accessible.</div>;
      }
    }
    // 6. OPEN CASE 003
    else if (lower === 'open case 003' || lower === 'case 003' || lower === 'petito') {
      const petito = cases.find((c) => c.slug.includes('petito') || c.caseNumber.includes('003'));
      if (petito) {
        onSelectCase(petito.slug);
        outputNode = (
          <div className="text-emerald-400">
            [MOUNTING SECTORS] Retrieving Case 003: GABBY PETITO (FBI Denver #WY-21-09)...
          </div>
        );
      } else {
        outputNode = <div className="text-red-400">ERROR: Case 003 file record not accessible.</div>;
      }
    }
    // 7. Apps launching
    else if (lower === 'evidence' || lower === 'board') {
      onOpenApp('evidence_board');
      outputNode = <div className="text-emerald-400">LAUNCHING: EVIDENCE_PINBOARD.EXE on desktop workspace...</div>;
    } else if (lower === 'timeline' || lower === 'chrono') {
      onOpenApp('timeline');
      outputNode = <div className="text-emerald-400">LAUNCHING: CHRONO_RECON.EXE on desktop workspace...</div>;
    } else if (lower === 'interviews' || lower === 'fd302') {
      onOpenApp('interviews');
      outputNode = <div className="text-emerald-400">LAUNCHING: FD302_TRANSCRIPTS.EXE on desktop workspace...</div>;
    } else if (lower === 'docs' || lower === 'documents') {
      onOpenApp('document_room');
      outputNode = <div className="text-emerald-400">LAUNCHING: DOCUMENT_ROOM.EXE on desktop workspace...</div>;
    } else if (lower === 'map' || lower === 'geo') {
      onOpenApp('geo_recon');
      outputNode = <div className="text-emerald-400">LAUNCHING: GEO_RECON.EXE radar subsystem on desktop...</div>;
    } else if (lower === 'exercises' || lower === 'training') {
      onOpenApp('exercises');
      outputNode = <div className="text-emerald-400">LAUNCHING: INVESTIGATIVE_LAB.EXE training suite...</div>;
    } else if (lower === 'trial' || lower === 'trialsim' || lower === 'courtroom' || lower === 'prosecute') {
      onOpenApp('trial_sim');
      outputNode = <div className="text-emerald-400">LAUNCHING: TRIAL_SIM.EXE - Courtroom Prosecution Simulator on desktop...</div>;
    } else if (lower === 'stamps' || lower === 'badges' || lower === 'collectibles') {
      onOpenApp('collectibles');
      outputNode = <div className="text-emerald-400">LAUNCHING: ARCHIVE_STAMPS.EXE badge viewer...</div>;
    }
    // 8. SEARCH <query>
    else if (lower.startsWith('search ')) {
      const q = lower.replace('search ', '').trim();
      const results = cases.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      );

      if (results.length === 0) {
        outputNode = (
          <div className="text-amber-400">
            NO RECORDS RETURNED MATCHING QUERY: &quot;{q}&quot;.
          </div>
        );
      } else {
        outputNode = (
          <div className="space-y-1">
            <div className="text-emerald-400 mb-1">FOUND {results.length} REPOSITORY MATCHES FOR &quot;{q}&quot;:</div>
            {results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  soundEngine.playFileAccess();
                  onSelectCase(r.slug);
                }}
                className="cursor-pointer hover:text-phosphor py-0.5 text-zinc-300 flex justify-between"
              >
                <span>{r.caseNumber} - {r.title}</span>
                <span className="text-zinc-500">[{r.location}]</span>
              </div>
            ))}
          </div>
        );
      }
    }
    // 9. ABOUT
    else if (lower === 'about') {
      outputNode = (
        <div className="space-y-1.5 text-zinc-300">
          <div className="text-amber-400 font-bold">THE 302 DOCKET // SYSTEM CONSTITUTION</div>
          <p className="text-zinc-400 leading-normal">
            An independent investigative archive inspired by FBI investigative casework and Form FD-302 documentation.
            Every interview leaves a record. Every case leaves a paper trail.
          </p>
          <div className="text-zinc-500 text-[10px]">
            Strictly not affiliated with the FBI, Department of Justice, or any law enforcement entity.
          </div>
        </div>
      );
    }
    // 10. Easter Egg Commands
    else if (lower === 'hoover') {
      try {
        const saved = localStorage.getItem('docket_unlocked_stamps');
        const stamps = saved ? JSON.parse(saved) : [];
        if (!stamps.includes('STAMP_EASTER_EGG_HOOVER')) {
          stamps.push('STAMP_EASTER_EGG_HOOVER');
          localStorage.setItem('docket_unlocked_stamps', JSON.stringify(stamps));
        }
      } catch (_) {}

      outputNode = (
        <div className="space-y-1 text-amber-300">
          <div className="font-bold text-red-400">[HISTORICAL NOTE: FORM FD-302 & J. EDGAR HOOVER]</div>
          <p className="text-zinc-300 text-xs">
            Form FD-302 is the official FBI memorandum used by Special Agents to document interviews and interrogations. Created under Director J. Edgar Hoover to ensure contemporaneous notes were permanently archived for federal court proceedings.
          </p>
          <div className="text-emerald-400 text-[11px] font-bold">
            ★ BADGE UNLOCKED: Director\'s Special Clearance (View in STAMPS.EXE)
          </div>
        </div>
      );
    } else if (lower === 'codis') {
      outputNode = (
        <div className="space-y-1 text-indigo-300">
          <div className="font-bold text-phosphor">[FORENSIC RECON // FBI CODIS ARCHIVE]</div>
          <p className="text-zinc-300 text-xs">
            The Combined DNA Index System (CODIS) was established by the DNA Identification Act of 1994 (42 U.S.C. § 14132). It links local, state, and national DNA indexes across 20 core STR loci to match unsolved crime scenes with offender profiles.
          </p>
        </div>
      );
    } else if (lower === 'spooky' || lower === 'secret') {
      outputNode = (
        <div className="space-y-1 text-red-400">
          <div className="font-bold">[EASTER EGG // CLASSIFIED MEMO 302-X]</div>
          <p className="text-zinc-300 text-xs">
            &quot;The truth is rarely pure and never simple. But every paper trail points toward the light.&quot; Check the hidden folder on the desktop for top secret files.
          </p>
        </div>
      );
    } else if (lower === 'shutdown') {
      onShutdown();
      return;
    } else if (lower === 'reboot') {
      sessionStorage.removeItem('docket_boot_done');
      window.location.reload();
      return;
    }
    // 11. Humorous Entertaining Retro Error Responses
    else {
      const errorMessages = [
        `ERROR 404: Sector '${raw}' not found in /dev/archive_hd0. Type 'HELP' for valid instructions.`,
        `SYNTAX ERROR: Command '${raw}' rejected by Bureau OS kernel. Did you misplace your security badge?`,
        `SECURITY VIOLATION: Command '${raw}' requires Director Clearance. Type 'HELP' to view approved commands.`,
        `ERR_SECTOR_CORRUPTED: '${raw}' returned zero records in index. Try searching with 'SEARCH <term>'.`,
        `ACCESS DENIED: Kernel instruction '${raw}' unmapped. Try 'CASES' or 'HELP'.`,
      ];
      const randomMsg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      outputNode = (
        <div className="text-red-400 space-y-0.5">
          <div>{randomMsg}</div>
          <div className="text-zinc-500 text-[10px]">Type <span className="text-amber-400">HELP</span> to view authorized commands.</div>
        </div>
      );
    }

    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        command: raw,
        output: outputNode,
      },
    ]);
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex flex-col h-full bg-[#050709] text-zinc-300 font-terminal select-text overflow-hidden p-3 text-sm sm:text-base cursor-text"
    >
      {/* Logs Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs sm:text-sm pr-1">
        {logs.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center space-x-2 text-zinc-400">
              <span className="text-red-400 font-bold">&gt;</span>
              <span className="text-zinc-200 font-bold">{item.command}</span>
            </div>
            <div className="pl-4">{item.output}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Form at Bottom */}
      <form onSubmit={handleExecute} className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center space-x-2 font-mono text-xs sm:text-sm">
        <span className="text-phosphor font-bold">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent text-phosphor focus:outline-none placeholder-zinc-700"
          placeholder="Type command (e.g. HELP, CASES, EVIDENCE, OPEN CASE 001)..."
        />
        <span className="inline-block w-2.5 h-4 bg-emerald-400 cursor-blink shrink-0" />
        <button
          type="submit"
          className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs hover:text-zinc-200 rounded"
        >
          ENTER
        </button>
      </form>
    </div>
  );
};
