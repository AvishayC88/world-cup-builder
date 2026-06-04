import React from 'react';
import { BracketMatch } from './BracketMatch';
import { useTournamentStore } from '../../store/tournamentStore';

export const PlayoffBracket: React.FC = () => {
  const genArray = (length: number, startIdx: number = 1) => 
    Array.from({ length }, (_, i) => i + startIdx);

  return (
    // Outer container: hides everything overflowing and sets up relative positioning
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-transparent">
      
      {/* Injecting Custom Scrollbar CSS directly. */}
      <style dangerouslySetInnerHTML={{__html: `
        .bracket-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .bracket-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .bracket-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .bracket-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}} />

      {/* The Scrollable Area */}
      <div className="flex-1 w-full h-full overflow-auto bracket-scroll pb-6">
        
        {/* The Bracket Container (The Fix is here): 
          Removed 'justify-center'. mx-auto ensures it's centered IF possible,
          but starts at the left edge if it's wider than the screen.
          Using a minimum width of 1500px to guarantee the tree layout.
        */}
        <div className="min-w-[1500px] h-full mx-auto flex items-center justify-between gap-6 p-8">
          
          {/* LEFT WING - Spacing and vertical gaps create the hierarchy */}
          <div className="flex flex-col gap-4 justify-around h-full py-8">
            {genArray(8, 1).map(i => <BracketMatch key={i} matchNumber={i} label={`R32 - Match ${i}`} />)}
          </div>
          <div className="flex flex-col gap-12 justify-around h-full py-16">
            {genArray(4, 17).map(i => <BracketMatch key={i} matchNumber={i} label={`R16 - Match ${i}`} />)}
          </div>
          <div className="flex flex-col gap-24 justify-around h-full py-24">
            {genArray(2, 25).map(i => <BracketMatch key={i} matchNumber={i} label={`QF - Match ${i}`} />)}
          </div>
          <div className="flex flex-col justify-around h-full">
            <BracketMatch matchNumber={29} label="Semi-Final 1" />
          </div>

          {/* CENTER TOWER (Trophy and Final) */}
          <div className="flex flex-col justify-center items-center px-4 min-w-[320px]">
            
            <div className="mb-4 drop-shadow-2xl hover:scale-105 transition-transform duration-500">
              <img 
                src="/trophy.png" 
                alt="FIFA World Cup Trophy" 
                className="w-28 sm:w-36 drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] object-contain"
              />
            </div>

            <div className="relative w-full flex justify-center mt-2">
              <div className="absolute -top-10 z-20 text-center text-yellow-400 font-black text-2xl uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Final
              </div>
              <div className="ring-4 ring-yellow-400 rounded-md shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-[1.15] z-10 bg-white">
                <BracketMatch matchNumber={32} label="World Cup Final" />
              </div>
            </div>

            <div className="mt-16 opacity-95">
              <BracketMatch matchNumber={31} label="Third-Place Play-off" />
            </div>
          </div>

          {/* RIGHT WING */}
          <div className="flex flex-col justify-around h-full">
            <BracketMatch matchNumber={30} label="Semi-Final 2" isReversed={true} />
          </div>
          <div className="flex flex-col gap-24 justify-around h-full py-24">
            {genArray(2, 27).map(i => <BracketMatch key={i} matchNumber={i} label={`QF - Match ${i}`} isReversed={true} />)}
          </div>
          <div className="flex flex-col gap-12 justify-around h-full py-16">
            {genArray(4, 21).map(i => <BracketMatch key={i} matchNumber={i} label={`R16 - Match ${i}`} isReversed={true} />)}
          </div>
          <div className="flex flex-col gap-4 justify-around h-full py-8">
            {genArray(8, 9).map(i => <BracketMatch key={i} matchNumber={i} label={`R32 - Match ${i}`} isReversed={true} />)}
          </div>

        </div>
      </div>
    </div>
  );
};