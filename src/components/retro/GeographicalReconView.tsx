import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  Calendar,
  Layers,
  Shield,
  ExternalLink,
  Target,
  FileText,
} from 'lucide-react';
import { GeoLocationPoint } from '../../types.ts';
import { archiveGeoPoints } from '../../data/archiveVaultData.ts';
import { soundEngine } from '../../utils/soundEngine.ts';

interface GeographicalReconViewProps {
  onOpenCase?: (slug: string) => void;
}

export const GeographicalReconView: React.FC<GeographicalReconViewProps> = ({ onOpenCase }) => {
  const [selectedPointId, setSelectedPointId] = useState<string>(archiveGeoPoints[0].id);
  const [activeCaseFilter, setActiveCaseFilter] = useState<string>('All');

  const activePoint = archiveGeoPoints.find((p) => p.id === selectedPointId) || archiveGeoPoints[0];

  const filteredPoints = archiveGeoPoints.filter((pt) => {
    if (activeCaseFilter === 'All') return true;
    return pt.caseNumber.includes(activeCaseFilter);
  });

  const handleSelectPoint = (id: string) => {
    soundEngine.playKeyClick();
    setSelectedPointId(id);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#080b0f] text-zinc-300 font-tech select-none overflow-hidden">
      {/* Left Sidebar: Location Index */}
      <div className="w-full md:w-80 bg-[#0e1218] border-b md:border-b-0 md:border-r border-[#262c36] flex flex-col">
        <div className="p-3 border-b border-[#262c36] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-phosphor">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">GEO RECON MAP // SITES</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            RADAR ACTIVE
          </span>
        </div>

        {/* Filter Bar */}
        <div className="p-2 border-b border-[#262c36] flex items-center space-x-1 bg-zinc-950 text-[10px] font-mono">
          <span className="text-zinc-500 mr-1">CASE:</span>
          {['All', '001', '002', '003'].map((code) => (
            <button
              key={code}
              onClick={() => {
                soundEngine.playKeyClick();
                setActiveCaseFilter(code);
              }}
              className={`px-2 py-0.5 rounded ${
                activeCaseFilter === code
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {code === 'All' ? 'ALL DOCKETS' : `CASE ${code}`}
            </button>
          ))}
        </div>

        {/* Location Point Cards List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {filteredPoints.map((pt, idx) => {
            const isSelected = pt.id === activePoint.id;
            return (
              <button
                key={pt.id}
                onClick={() => handleSelectPoint(pt.id)}
                className={`w-full p-3 text-left transition-colors flex flex-col space-y-1 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-l-4 border-emerald-500'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400 font-bold">SEQ #{pt.timelineOrder}</span>
                  <span className="text-zinc-500 uppercase">{pt.caseNumber}</span>
                </div>
                <div className="text-xs font-bold text-zinc-200 line-clamp-1 font-mono">
                  {pt.title}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {pt.region} • {pt.dateRelevance}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Geographical Radar Surface */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07090d] relative">
        {/* Radar Map Grid Background */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#163828_1px,transparent_1px)] [background-size:24px_24px] p-6 flex flex-col justify-between">
          {/* Circular Radar Sweep Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
            <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/40" />
            <div className="w-[320px] h-[320px] rounded-full border border-emerald-500/30 absolute" />
            <div className="w-[160px] h-[160px] rounded-full border border-emerald-500/20 absolute" />
            <div className="w-full h-[1px] bg-emerald-500/30 absolute" />
            <div className="h-full w-[1px] bg-emerald-500/30 absolute" />
          </div>

          {/* Top Status Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/80 border border-zinc-800 p-2.5 rounded backdrop-blur text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">
                GEOGRAPHIC RECON // VERIFIED PUBLIC VENUES
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              COORDINATE GRID: WGS-84 AUDITED
            </span>
          </div>

          {/* Interactive Radar Location Pins on Map */}
          <div className="relative flex-1 w-full h-full my-4">
            {filteredPoints.map((pt) => {
              const isSelected = pt.id === activePoint.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => handleSelectPoint(pt.id)}
                  style={{
                    left: `${pt.coordinates.x}%`,
                    top: `${pt.coordinates.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group`}
                >
                  {/* Pin radar wave */}
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`absolute w-7 h-7 rounded-full animate-ping opacity-75 ${
                        isSelected ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                    />
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                        isSelected
                          ? 'bg-amber-500 border-white text-zinc-950 font-bold'
                          : 'bg-zinc-900 border-emerald-400 text-emerald-400'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Pin label preview */}
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 text-[10px] font-mono text-zinc-200 rounded shadow pointer-events-none group-hover:border-emerald-400">
                    {pt.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Location Detail Inspector Sheet */}
          <div className="relative z-10 bg-zinc-950/95 border-2 border-emerald-600/80 rounded-lg p-4 shadow-2xl backdrop-blur font-mono text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px] rounded">
                  {activePoint.pointType}
                </span>
                <span className="text-zinc-500">{activePoint.caseNumber}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-300 text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activePoint.dateRelevance}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-editorial">
                {activePoint.title}
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                {activePoint.locationName} ({activePoint.region})
              </p>
            </div>

            <p className="text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 border border-zinc-800/80 rounded">
              {activePoint.summary}
            </p>

            <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div>
                <span className="text-zinc-500">OFFICIAL RECORD SOURCE: </span>
                <span className="text-amber-300">{activePoint.verifiedSource}</span>
              </div>

              {onOpenCase && activePoint.caseSlug && (
                <button
                  onClick={() => onOpenCase(activePoint.caseSlug)}
                  className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 rounded flex items-center space-x-1 text-xs"
                >
                  <span>INSPECT FULL CASE DOSSIER</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
