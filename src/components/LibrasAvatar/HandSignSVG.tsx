import React from 'react';

interface HandSignSVGProps {
  letterOrNumber: string;
  size?: number;
  highlightColor?: string;
  className?: string;
}

export const HandSignSVG: React.FC<HandSignSVGProps> = ({
  letterOrNumber,
  size = 120,
  highlightColor = '#06b6d4',
  className = '',
}) => {
  const char = letterOrNumber.toUpperCase().trim()[0] || 'A';

  // Render stylized, high-contrast anatomical Libras hand configuration
  const renderSignGraphic = () => {
    switch (char) {
      case 'A':
        return (
          <g>
            {/* Palm & Closed fingers */}
            <rect x="35" y="45" width="45" height="50" rx="14" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            {/* 4 curled fingers */}
            <path d="M 40 50 C 40 40, 50 40, 50 55 L 50 70" fill="none" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 50 48 C 50 38, 60 38, 60 55 L 60 70" fill="none" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 60 50 C 60 40, 70 40, 70 55 L 70 70" fill="none" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 70 54 C 70 44, 78 44, 78 57 L 78 72" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            {/* Thumb upright resting on the side */}
            <rect x="23" y="38" width="16" height="38" rx="8" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            {/* Thumb nail */}
            <circle cx="31" cy="45" r="3" fill="#ffffff" />
          </g>
        );

      case 'B':
        return (
          <g>
            {/* 4 upright extended fingers */}
            <rect x="36" y="16" width="10" height="54" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="47" y="12" width="10" height="58" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="58" y="14" width="10" height="56" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="69" y="22" width="9" height="48" rx="4.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            {/* Palm base */}
            <path d="M 33 60 C 33 55, 80 55, 80 65 L 78 95 C 78 102, 35 102, 35 95 Z" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            {/* Thumb folded across the palm */}
            <path d="M 30 78 C 45 78, 62 82, 65 72 C 65 65, 52 68, 30 68 Z" fill="#f43f5e" stroke="#334155" strokeWidth="3" />
          </g>
        );

      case 'C':
        return (
          <g>
            {/* Curved fingers forming a C */}
            <path
              d="M 72 26 C 45 20, 22 42, 22 62 C 22 84, 45 104, 75 98 C 65 92, 42 85, 42 62 C 42 40, 62 34, 72 26 Z"
              fill="#fbcfe8"
              stroke="#334155"
              strokeWidth="3.5"
            />
            {/* Thumb below in C curve */}
            <path
              d="M 75 98 C 65 92, 48 90, 42 75 C 38 88, 55 108, 75 98 Z"
              fill="#fda4af"
              stroke="#334155"
              strokeWidth="2.5"
            />
            {/* Finger separators */}
            <path d="M 60 25 L 56 36" stroke="#334155" strokeWidth="2.5" />
            <path d="M 45 32 L 40 44" stroke="#334155" strokeWidth="2.5" />
          </g>
        );

      case 'D':
        return (
          <g>
            {/* Palm & circle base */}
            <circle cx="52" cy="74" r="22" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            {/* Hole formed by thumb & other fingers */}
            <circle cx="50" cy="72" r="10" fill="#0f172a" />
            {/* Extended Index finger pointing up */}
            <rect x="35" y="12" width="12" height="62" rx="6" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            {/* Thumb curving to touch fingers */}
            <path d="M 30 82 C 30 62, 58 60, 62 72" fill="none" stroke="#334155" strokeWidth="3" />
          </g>
        );

      case 'E':
        return (
          <g>
            {/* Palm */}
            <rect x="34" y="48" width="46" height="48" rx="12" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            {/* Curled fingertips resting against thumb */}
            <rect x="36" y="32" width="10" height="24" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="47" y="30" width="10" height="26" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="58" y="32" width="10" height="24" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="69" y="36" width="9" height="20" rx="4.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            {/* Thumb folded underneath */}
            <path d="M 32 75 C 48 75, 68 75, 75 68 C 75 62, 55 62, 32 66 Z" fill="#f43f5e" stroke="#334155" strokeWidth="2.5" />
          </g>
        );

      case 'F':
        return (
          <g>
            {/* 3 Upright fingers (Middle, Ring, Pinky) */}
            <rect x="48" y="16" width="10" height="54" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="59" y="20" width="10" height="50" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="70" y="28" width="9" height="42" rx="4.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            {/* Palm */}
            <rect x="36" y="55" width="44" height="45" rx="10" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            {/* Bent Index finger */}
            <path d="M 38 52 C 38 35, 52 35, 52 52" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            {/* Thumb ON THE OUTSIDE (Regra do F: Fora!) */}
            <rect x="22" y="42" width="16" height="32" rx="7" fill="#38bdf8" stroke="#0284c7" strokeWidth="3.5" />
            <text x="30" y="62" fontSize="9" fontWeight="900" fill="#ffffff" textAnchor="middle">OUT</text>
          </g>
        );

      case 'T':
        return (
          <g>
            {/* 3 Upright fingers */}
            <rect x="48" y="16" width="10" height="54" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="59" y="20" width="10" height="50" rx="5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <rect x="70" y="28" width="9" height="42" rx="4.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            {/* Thumb ON THE INSIDE/BEHIND index */}
            <rect x="40" y="42" width="14" height="30" rx="7" fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
            {/* Bent Index finger OVER the thumb (Regra do T: Trás/Dentro!) */}
            <path d="M 32 60 C 32 38, 48 38, 54 58" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            <rect x="34" y="56" width="46" height="44" rx="10" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            <text x="47" y="60" fontSize="8" fontWeight="bold" fill="#000">IN</text>
          </g>
        );

      case 'I':
        return (
          <g>
            {/* Closed fist */}
            <rect x="32" y="46" width="46" height="52" rx="12" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            <path d="M 36 62 Q 52 62 72 62" stroke="#334155" strokeWidth="3" />
            {/* Thumb crossed in front */}
            <path d="M 30 70 C 44 65, 58 65, 62 76" fill="#f43f5e" stroke="#334155" strokeWidth="3" />
            {/* Extended Pinky finger pointing high */}
            <rect x="68" y="14" width="11" height="54" rx="5.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
          </g>
        );

      case 'L':
        return (
          <g>
            {/* Palm */}
            <rect x="38" y="50" width="40" height="48" rx="10" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            {/* Folded fingers (Middle, Ring, Pinky) */}
            <circle cx="58" cy="62" r="6" fill="#fbcfe8" stroke="#334155" strokeWidth="2.5" />
            <circle cx="68" cy="64" r="5" fill="#fbcfe8" stroke="#334155" strokeWidth="2.5" />
            {/* Extended Index finger up */}
            <rect x="36" y="12" width="12" height="62" rx="6" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            {/* Extended Thumb horizontal forming L */}
            <rect x="12" y="60" width="34" height="12" rx="6" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
          </g>
        );

      case 'V':
      case '2':
        return (
          <g>
            {/* Palm */}
            <rect x="34" y="52" width="44" height="46" rx="12" fill="#fda4af" stroke="#334155" strokeWidth="3" />
            {/* Folded Ring and Pinky */}
            <circle cx="62" cy="64" r="6" fill="#fbcfe8" stroke="#334155" strokeWidth="2.5" />
            <circle cx="70" cy="68" r="5.5" fill="#fbcfe8" stroke="#334155" strokeWidth="2.5" />
            {/* Thumb crossed over */}
            <path d="M 32 74 C 44 66, 62 66, 64 74" fill="none" stroke="#334155" strokeWidth="3.5" />
            {/* Index & Middle open in V */}
            <g transform="rotate(-14 44 55)">
              <rect x="36" y="12" width="11" height="58" rx="5.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            </g>
            <g transform="rotate(14 58 55)">
              <rect x="54" y="12" width="11" height="58" rx="5.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            </g>
          </g>
        );

      case 'O':
      case '0':
        return (
          <g>
            {/* Perfect O round circle */}
            <circle cx="56" cy="58" r="32" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            <circle cx="56" cy="58" r="16" fill="#0f172a" stroke="#334155" strokeWidth="3" />
            <path d="M 62 30 C 72 35, 78 50, 76 65" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />
          </g>
        );

      case 'Y':
        return (
          <g>
            {/* Folded center fingers */}
            <rect x="34" y="44" width="44" height="52" rx="12" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            <path d="M 40 58 Q 56 58 70 58" stroke="#334155" strokeWidth="3" />
            {/* Extended Thumb pointing left/up */}
            <g transform="rotate(-30 25 50)">
              <rect x="12" y="32" width="14" height="42" rx="7" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            </g>
            {/* Extended Pinky pointing right/up */}
            <g transform="rotate(30 80 50)">
              <rect x="74" y="32" width="12" height="44" rx="6" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            </g>
          </g>
        );

      case '1':
        return (
          <g>
            {/* Palm */}
            <rect x="34" y="46" width="44" height="52" rx="12" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            {/* Folded fingers */}
            <path d="M 46 60 Q 60 60 72 60" stroke="#334155" strokeWidth="3" />
            {/* Single extended Index finger */}
            <rect x="48" y="10" width="13" height="64" rx="6.5" fill="#fbcfe8" stroke="#334155" strokeWidth="3.5" />
            {/* Thumb folded */}
            <path d="M 30 70 C 44 65, 58 65, 62 76" fill="#f43f5e" stroke="#334155" strokeWidth="3" />
          </g>
        );

      default:
        // Generic clean hand representation with letter badge
        return (
          <g>
            <rect x="32" y="32" width="48" height="62" rx="16" fill="#fda4af" stroke="#334155" strokeWidth="3.5" />
            <rect x="48" y="12" width="14" height="50" rx="7" fill="#fbcfe8" stroke="#334155" strokeWidth="3" />
            <circle cx="56" cy="62" r="14" fill="#0f172a" />
            <text x="56" y="68" fontSize="16" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
              {char}
            </text>
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-xs p-2 transition-transform hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 112 112" width="100%" height="100%" className="overflow-visible">
        {/* Glow backdrop */}
        <circle cx="56" cy="56" r="48" fill={highlightColor} fillOpacity="0.08" />
        {renderSignGraphic()}
      </svg>
      <span className="absolute bottom-1 right-2 text-xs font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 shadow-xs">
        {char}
      </span>
    </div>
  );
};
