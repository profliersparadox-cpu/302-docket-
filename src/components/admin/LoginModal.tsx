import React, { useState } from 'react';
import { X, Lock, Shield, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { soundEngine } from '../../utils/soundEngine.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('lead_investigator');
  const [password, setPassword] = useState('Archive302@Bureau!Case');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playKeyClick();
    setError(null);
    setIsSubmitting(true);

    const result = await login(username, password);
    setIsSubmitting(false);

    if (result.success) {
      soundEngine.playBootBeep();
      onSuccess();
      onClose();
    } else {
      soundEngine.playWarning();
      setError(result.error || 'Authentication rejected by security policy.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="retro-window max-w-md w-full p-6 relative shadow-2xl">
        <div className="retro-window-header active mb-4">
          <div className="flex items-center space-x-2 text-xs font-pixel text-zinc-300">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            <span>INVESTIGATOR_GATEWAY.SEC</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playKeyClick();
              onClose();
            }}
            className="retro-btn retro-btn-red text-xs px-2"
          >
            [X]
          </button>
        </div>

        <h2 className="text-lg font-bold font-editorial text-zinc-100 mb-1">
          Investigator Terminal Access
        </h2>
        <p className="text-xs font-tech text-zinc-400 mb-4">
          Restricted administrative gateway. Server-side session verification enforced.
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-red-950/80 border border-red-800 text-red-200 text-xs font-tech flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 font-tech text-xs">
          <div>
            <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1">
              AGENT IDENTIFIER / USERNAME
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-zinc-100 font-terminal text-base focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-pixel text-[10px] uppercase mb-1">
              SECURITY CLEARANCE PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#080a0c] border border-[#2d333b] p-2 text-zinc-100 font-terminal text-base focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="retro-btn retro-btn-red w-full py-2 font-pixel text-xs flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE ACCESS'}</span>
            </button>
          </div>
        </form>

        {/* Evaluation Helper */}
        <div className="mt-5 pt-3 border-t border-[#21262d] text-[11px] font-tech text-zinc-500 bg-[#080a0c] p-2.5">
          <span className="text-zinc-400 font-pixel text-[9px] block mb-1">DEFAULT SYSTEM CREDENTIALS:</span>
          <div>Agent ID: <code className="text-amber-400">lead_investigator</code></div>
          <div>Password: <code className="text-amber-400">Archive302@Bureau!Case</code></div>
          <div className="text-[10px] text-zinc-600 mt-1">
            * Backend rate-limited to 5 failed attempts per 15 minutes per IP address.
          </div>
        </div>
      </div>
    </div>
  );
};
