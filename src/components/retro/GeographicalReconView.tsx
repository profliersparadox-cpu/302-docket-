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
        <div className="p-2 border-b border-[#262c36] flex flex-wrap items-center gap-1 bg-zinc-950 text-[10px] font-mono">
          <span className="text-zinc-500 mr-1 font-bold">CASE:</span>
          {['All', '001', '002', '003', '004', '005', '006', '007'].map((code) => (
            <button
              key={code}
              onClick={() => {
                soundEngine.playKeyClick();
                setActiveCaseFilter(code);
              }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                activeCaseFilter === code
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {code === 'All' ? 'ALL' : `#${code}`}
            </button>
          ))}
        </div>

        {/* Location Point Cards List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {filteredPoints.map((pt) => {
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[#040609] relative">
        {/* Radar Map Grid Background */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#123020_1px,transparent_1px)] [background-size:20px_20px] p-4 sm:p-6 flex flex-col justify-between">
          {/* Circular Radar Sweep Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
            {/* Concentric distance rings */}
            <div className="w-[580px] h-[580px] rounded-full border border-emerald-500/30" />
            <div className="w-[420px] h-[420px] rounded-full border border-emerald-500/40 absolute" />
            <div className="w-[260px] h-[260px] rounded-full border border-emerald-500/50 absolute" />
            <div className="w-[100px] h-[100px] rounded-full border border-emerald-500/60 absolute" />
            {/* Crosshairs */}
            <div className="w-full h-[1px] bg-emerald-500/40 absolute" />
            <div className="h-full w-[1px] bg-emerald-500/40 absolute" />
            {/* Diagonal guides */}
            <div className="w-full h-[1px] bg-emerald-500/20 absolute rotate-45" />
            <div className="w-full h-[1px] bg-emerald-500/20 absolute -rotate-45" />
          </div>

          {/* Top Status Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/90 border border-emerald-900/60 p-2.5 rounded backdrop-blur text-xs font-mono shadow-lg">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold tracking-wider">
                TACTICAL GEO-RADAR // AUDITED INCIDENT VENUES
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[10px] text-zinc-400 font-mono">
              <span className="text-amber-400">POINTS LOGGED: {filteredPoints.length}</span>
              <span>&bull;</span>
              <span>SECTOR: CONUS WGS-84</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-bold">RADAR: ONLINE</span>
            </div>
          </div>

          {/* Radar Legend Bar */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 text-[9px] font-pixel bg-black/80 p-1.5 px-3 rounded border border-zinc-800 text-zinc-300 mt-2">
            <span className="text-zinc-500 uppercase">VENUE CLASSIFICATION:</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_#f59e0b]" />
              <span>INCIDENT LOCATION</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#ef4444]" />
              <span>DISCOVERY SITE</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block shadow-[0_0_6px_#3b82f6]" />
              <span>COMMAND / HEADQUARTERS</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block shadow-[0_0_6px_#a855f7]" />
              <span>SUSPECT BASE</span>
            </span>
          </div>

          {/* Interactive Radar Location Pins on Map */}
          <div className="relative flex-1 w-full h-full my-4">
            {filteredPoints.map((pt) => {
              const isSelected = pt.id === activePoint.id;
              const pointColor =
                pt.pointType === 'Discovery Site'
                  ? 'border-red-500 bg-red-950 text-red-300'
                  : pt.pointType === 'Law Enforcement Command'
                  ? 'border-blue-500 bg-blue-950 text-blue-300'
                  : pt.pointType === 'Suspect Base'
                  ? 'border-purple-500 bg-purple-950 text-purple-300'
                  : 'border-amber-500 bg-amber-950 text-amber-300';

              const pulseColor =
                pt.pointType === 'Discovery Site'
                  ? 'bg-red-500'
                  : pt.pointType === 'Law Enforcement Command'
                  ? 'bg-blue-400'
                  : pt.pointType === 'Suspect Base'
                  ? 'bg-purple-400'
                  : 'bg-amber-400';

              return (
                <div
                  key={pt.id}
                  onClick={() => handleSelectPoint(pt.id)}
                  style={{
                    left: `${pt.coordinates.x}%`,
                    top: `${pt.coordinates.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  {/* Pin radar wave */}
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`absolute w-8 h-8 rounded-full animate-ping opacity-60 ${pulseColor}`}
                    />
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-xl transition-transform group-hover:scale-125 ${
                        isSelected
                          ? 'border-white bg-emerald-500 text-black font-bold scale-110 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
                          : pointColor
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Pin label preview */}
                  <div
                    className={`absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded shadow-lg text-[10px] font-mono pointer-events-none transition-all ${
                      isSelected
                        ? 'bg-emerald-950 border border-emerald-400 text-emerald-200 font-bold z-30'
                        : 'bg-zinc-950/90 border border-zinc-800 text-zinc-300 group-hover:border-emerald-500 group-hover:text-white'
                    }`}
                  >
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
