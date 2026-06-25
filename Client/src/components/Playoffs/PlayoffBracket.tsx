import React from 'react';
import { BracketMatch } from './BracketMatch';

// The recursive node automatically draws the connecting lines.
// Because it uses absolute positioning anchored to the flexbox flow, 
// the lines mathematically guarantee perfect T-junctions connecting the teams.
const BracketNode: React.FC<{ matchNumber: number, roundLevel: number, position?: 'top' | 'bottom' | 'root' }> = ({ matchNumber, roundLevel, position = 'root' }) => {
  let child1 = 0, child2 = 0, label = "Round of 32";
  if (roundLevel === 2) {
    child1 = (matchNumber - 17) * 2 + 1;
    child2 = (matchNumber - 17) * 2 + 2;
    label = "Round of 16";
  } else if (roundLevel === 3) {
    child1 = (matchNumber - 25) * 2 + 17;
    child2 = (matchNumber - 25) * 2 + 18;
    label = "Quarter Final";
  } else if (roundLevel === 4) {
    child1 = (matchNumber - 29) * 2 + 25;
    child2 = (matchNumber - 29) * 2 + 26;
    label = "Semi Final";
  }

  return (
    <div className="flex flex-row items-stretch">
      
      {/* 1. Left Side: Children Subtrees */}
      {roundLevel > 1 && (
        <div className="flex flex-col gap-4">
          <BracketNode matchNumber={child1} roundLevel={roundLevel - 1} position="top" />
          <BracketNode matchNumber={child2} roundLevel={roundLevel - 1} position="bottom" />
        </div>
      )}

      {/* 2. Incoming Line (connecting children's vertical line to this match) */}
      {roundLevel > 1 && (
        <div className="w-10 relative">
          <div className="absolute top-[calc(50%+21px)] left-0 right-0 h-[2px] bg-black/40" />
        </div>
      )}

      {/* 3. The Match Box */}
      <div className="w-[290px] flex items-center relative z-10">
        <BracketMatch matchNumber={matchNumber} label={label} />
      </div>

      {/* 4. Outgoing Lines (connecting this match to the parent's incoming line) */}
      {position !== 'root' && (
        <div className="w-10 relative">
          {/* Horizontal line leaving the box from exactly the team separator */}
          <div className="absolute top-[calc(50%+21px)] left-0 right-0 h-[2px] bg-black/40" />
          
          {/* Vertical lines connecting the top/bottom boxes. 
              The math constants (-29px and 13px) are exactly calculated based on 
              the 16px gap and the 21px separator offset to meet flawlessly in the middle. */}
          {position === 'top' && (
            <div className="absolute top-[calc(50%+21px)] right-0 bottom-[-29px] w-[2px] bg-black/40" />
          )}
          {position === 'bottom' && (
            <div className="absolute top-[13px] right-0 bottom-[calc(50%-21px)] w-[2px] bg-black/40" />
          )}
        </div>
      )}

    </div>
  );
};

export const PlayoffBracket: React.FC = () => {
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-transparent">
      
      {/* Custom Scrollbar CSS */}
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

      <div className="flex-1 w-full h-full overflow-auto bracket-scroll pb-6 pt-12">
        
        {/* The top-level flex layout */}
        <div className="min-w-max h-max mx-auto flex flex-row items-center justify-start gap-0 px-8">
          
          {/* Left Side: The complete recursive bracket tree */}
          <div className="flex flex-col gap-4">
            <BracketNode matchNumber={29} roundLevel={4} position="top" />
            <BracketNode matchNumber={30} roundLevel={4} position="bottom" />
          </div>

          {/* Right Side: Final & 3rd Place */}
          <div className="flex flex-row items-stretch">
            
            {/* Incoming line specifically for the Final */}
            <div className="w-12 relative">
              {/* Scaled final box slightly offsets the visual center, so we use +24px */}
              <div className="absolute top-[calc(50%+24px)] left-0 right-0 h-[2px] bg-black/40" />
            </div>

            <div className="relative flex justify-center w-[350px]">
              
              <div className="absolute bottom-full mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-500 z-20">
                <img 
                  src="/trophy.png" 
                  alt="FIFA World Cup Trophy" 
                  className="w-28 sm:w-36 drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] object-contain"
                />
              </div>

              <div className="absolute -top-10 z-20 text-center text-yellow-400 font-black text-2xl uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Final
              </div>

              <div className="ring-4 ring-yellow-400 rounded-md shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-[1.15] z-10 bg-white w-[290px]">
                <BracketMatch matchNumber={32} label="World Cup Final" />
              </div>

              <div className="absolute top-full mt-16 opacity-95 w-[290px]">
                <BracketMatch matchNumber={31} label="Third Place Play-off" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};