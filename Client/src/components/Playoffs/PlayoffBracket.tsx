import React from 'react';
import { BracketMatch } from './BracketMatch';

// A recursive component that physically builds the bracket as a tree of flexbox containers.
// This GUARANTEES that every parent match is perfectly vertically centered relative to its two children.
const BracketNode: React.FC<{ matchNumber: number, roundLevel: number }> = ({ matchNumber, roundLevel }) => {
  // Base case: Round of 32 (Leaf nodes)
  if (roundLevel === 1) {
    return (
      <div className="w-[290px]">
        <BracketMatch matchNumber={matchNumber} label="Round of 32" />
      </div>
    );
  }

  // Determine children and label based on round level
  let child1 = 0, child2 = 0, label = "";
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
    <div className="flex flex-row items-center gap-10">
      {/* Left side: The two feeder matches stacked vertically */}
      <div className="flex flex-col gap-4">
        <BracketNode matchNumber={child1} roundLevel={roundLevel - 1} />
        <BracketNode matchNumber={child2} roundLevel={roundLevel - 1} />
      </div>
      
      {/* Right side: The current match, automatically centered vertically by items-center */}
      <div className="w-[290px]">
        <BracketMatch matchNumber={matchNumber} label={label} />
      </div>
    </div>
  );
};

export const PlayoffBracket: React.FC = () => {
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
        
        {/* The Bracket Container */}
        <div className="min-w-max h-max mx-auto flex flex-row items-center justify-start gap-12 p-8">
          
          {/* Left Side: The entire bracket tree (Matches 1-30).
              We combine the two Semi Finals (29 and 30) here. */}
          <div className="flex flex-col gap-4">
            <BracketNode matchNumber={29} roundLevel={4} />
            <BracketNode matchNumber={30} roundLevel={4} />
          </div>

          {/* Right Side: The Final and 3rd Place Match */}
          <div className="flex flex-col justify-center items-center px-4 w-[350px]">
            
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
              <div className="ring-4 ring-yellow-400 rounded-md shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-[1.15] z-10 bg-white w-[290px]">
                <BracketMatch matchNumber={32} label="World Cup Final" />
              </div>
            </div>

            <div className="mt-16 opacity-95 w-[290px]">
              <BracketMatch matchNumber={31} label="Third Place Play-off" />
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
};