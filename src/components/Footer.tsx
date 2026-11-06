import React from 'react';
import { Shield, Lock, ExternalLink, HeartHandshake, PhoneCall } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { soundEngine } from '../utils/soundEngine.ts';

interface FooterProps {
  onOpenLogin: () => void;
  onOpenMethodology: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLogin, onOpenMethodology }) => {
  const { settings } = useArchive();
  const { isAuthenticated } = useAuth();

  return (
    <footer className="border-t border-[#2d333b] bg-[#07090b] text-zinc-400 font-tech text-xs">
      {/* Survivor Support Resources Section */}
      <div className="border-b border-[#21262d] bg-black/60 px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-red-400 font-pixel text-xs font-bold">
            <HeartHandshake className="w-4 h-4 text-red-500" />
            <span>CRISIS & SURVIVOR SUPPORT RESOURCES (FREE & CONFIDENTIAL):</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-tech text-zinc-300">
            <div className="flex items-center space-x-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-zinc-500" />
              <span>National Sexual Assault Hotline (RAINN):</span>
              <span className="text-amber-400 font-bold font-mono">1-800-656-4673</span>
            </div>

            <span className="hidden sm:inline text-zinc-700">|</span>

            <div className="flex items-center space-x-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-zinc-500" />
              <span>National Center for Missing & Exploited Children:</span>
              <span className="text-amber-400 font-bold font-mono">1-800-843-5678</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-pixel font-bold tracking-widest text-zinc-100 text-sm">
                THE 302 DOCKET
              </span>
              <span className="retro-stamp text-[8px] py-0 px-1">INDEPENDENT</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              {settings.disclaimer ||
                'An independent cyber-investigative archive inspired by 1990s law enforcement terminals, Form FD-302 casework, and public judicial records. Not affiliated with the FBI or any law enforcement agency.'}
            </p>
            <p className="font-terminal text-sm text-phosphor">
              &gt; "Every case leaves a paper trail."
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-pixel text-[11px] text-zinc-200 uppercase">
              Investigative Series
            </h4>
            <ul className="space-y-1 text-xs text-zinc-400 font-tech">
              <li>&bull; Crimes Against Children</li>
              <li>&bull; Homicide & Cold Case Forensics</li>
              <li>&bull; Abduction & Missing Persons</li>
              <li>&bull; Special Victims / Exploitation</li>
              <li>&bull; Organised Crime Casework</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-pixel text-[11px] text-zinc-200 uppercase">
              Governance & Integrity
            </h4>
            <ul className="space-y-1 text-xs font-tech">
              <li>
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    onOpenMethodology();
                  }}
                  className="hover:text-zinc-200 transition-colors text-left"
                >
                  Editorial Constitution
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    onOpenMethodology();
                  }}
                  className="hover:text-zinc-200 transition-colors text-left"
                >
                  Survivor Dignity & Minor Privacy
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => {
                    soundEngine.playKeyClick();
                    onOpenLogin();
                  }}
                  className="flex items-center text-zinc-500 hover:text-zinc-300 transition-colors text-[11px]"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Investigator Terminal Login
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-[#21262d] flex flex-col sm:flex-row items-center justify-between text-[11px] font-tech text-zinc-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} THE 302 DOCKET. All public case records and transcripts cited from official state and federal judicial dockets.
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 font-pixel text-[10px]">TERMINAL_STATUS: ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
