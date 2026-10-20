// Line-and-fill illustrations for the sign-in screens, in the Zenvy Brutal style.
// Colours come from design tokens (fill-* / stroke-* utilities), never raw hex.

type IllustrationProps = { className?: string; title?: string };

function Frame({ title, className, viewBox, children }: IllustrationProps & { viewBox: string; children: React.ReactNode }) {
  return (
    <svg viewBox={viewBox} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {children}
    </svg>
  );
}

function Star({ x, y, size = 15, className = "fill-focus", delay = "0s" }: { x: number; y: number; size?: number; className?: string; delay?: string }) {
  const s = size;
  return (
    <path
      d={`M${x} ${y - s} C${x + 1} ${y - s / 3} ${x + s / 3} ${y - 1} ${x + s} ${y} C${x + s / 3} ${y + 1} ${x + 1} ${y + s / 3} ${x} ${y + s} C${x - 1} ${y + s / 3} ${x - s / 3} ${y + 1} ${x - s} ${y} C${x - s / 3} ${y - 1} ${x - 1} ${y - s / 3} ${x} ${y - s} Z`}
      className={`${className} stroke-ink animate-nb-twinkle`}
      strokeWidth={2}
      style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: delay }}
    />
  );
}

export function MatchingIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 480 320" {...props}>
      <g className="stroke-ink" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <rect x="48" y="58" width="150" height="196" rx="14" className="fill-ink" />
        <rect x="40" y="50" width="150" height="196" rx="14" className="fill-card" />
        <circle cx="115" cy="118" r="32" className="fill-paper" />
        <path d="M83 112 C83 80 147 76 147 112 C132 100 104 98 83 112 Z" className="fill-ink" />
        <circle cx="104" cy="124" r="3" className="fill-ink" />
        <circle cx="126" cy="124" r="3" className="fill-ink" />
        <path d="M106 136 C112 141 118 141 124 136" fill="none" />
        <path d="M72 230 C72 190 92 166 115 166 C138 166 158 190 158 230 Z" className="fill-chat" />
        <rect x="298" y="58" width="150" height="196" rx="14" className="fill-ink" />
        <rect x="290" y="50" width="150" height="196" rx="14" className="fill-card" />
        <circle cx="365" cy="118" r="32" className="fill-paper" />
        <path d="M331 120 C326 78 404 74 399 120 L399 150 C394 124 384 104 365 102 C350 102 337 110 331 120 Z" className="fill-ink" />
        <circle cx="354" cy="126" r="3" className="fill-ink" />
        <circle cx="376" cy="126" r="3" className="fill-ink" />
        <path d="M356 138 C362 143 368 143 374 138" fill="none" />
        <path d="M322 230 C322 190 342 166 365 166 C388 166 408 190 408 230 Z" className="fill-live" />
        <rect x="128" y="270" width="104" height="34" rx="17" className="fill-match" />
        <rect x="248" y="270" width="104" height="34" rx="17" className="fill-card" />
      </g>
      <path d="M192 150 C 222 92, 258 92, 288 150" fill="none" className="stroke-ink animate-nb-ants" strokeWidth={3} strokeDasharray="8 8" strokeLinecap="round" />
      <g className="animate-nb-float">
        <rect x="206" y="64" width="80" height="40" rx="10" className="fill-ink" />
        <rect x="200" y="58" width="80" height="40" rx="10" className="fill-focus stroke-ink" strokeWidth={3} />
        <text x="240" y="85" textAnchor="middle" className="fill-ink font-jetbrains" fontWeight={700} fontSize={19}>
          92%
        </text>
      </g>
      <g className="fill-ink font-grotesk" fontWeight={700} fontSize={15} textAnchor="middle">
        <text x="180" y="292">CSE 220</text>
        <text x="300" y="292">Tue 7 PM</text>
      </g>
      <Star x={440} y={22} />
    </Frame>
  );
}

export function StudyTogetherIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="20 120 540 400" {...props}>
      <g className="stroke-ink" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <line x1="24" y1="504" x2="540" y2="504" />
        <circle cx="497" cy="165" r="30" className="fill-ink" />
        <circle cx="490" cy="158" r="30" className="fill-focus" />
        <line x1="490" y1="158" x2="490" y2="140" />
        <line x1="490" y1="158" x2="503" y2="164" />
        <rect x="46" y="380" width="480" height="18" rx="4" className="fill-ink" />
        <rect x="40" y="374" width="480" height="18" rx="4" className="fill-card" />
        <rect x="80" y="392" width="14" height="112" className="fill-card" />
        <rect x="466" y="392" width="14" height="112" className="fill-card" />
        <path d="M96 374 C96 296 118 258 150 258 C182 258 204 296 204 374 Z" className="fill-chat" />
        <circle cx="150" cy="206" r="36" className="fill-card" />
        <path d="M114 200 C114 166 186 160 186 198 C170 186 140 184 114 200 Z" className="fill-ink" />
        <circle cx="138" cy="214" r="3" className="fill-ink" />
        <circle cx="162" cy="214" r="3" className="fill-ink" />
        <path d="M186 300 C214 320 236 344 252 368" fill="none" />
        <rect x="252" y="306" width="96" height="66" rx="6" className="fill-ink" />
        <rect x="246" y="300" width="96" height="66" rx="6" className="fill-card" />
        <line x1="262" y1="320" x2="314" y2="320" className="stroke-chat" />
        <line x1="262" y1="334" x2="326" y2="334" />
        <line x1="262" y1="348" x2="298" y2="348" />
        <path d="M368 374 C368 294 390 250 420 250 C450 250 472 294 472 374 Z" className="fill-match" />
        <circle cx="420" cy="196" r="36" className="fill-card" />
        <path d="M384 196 C380 156 460 152 456 196 L456 226 C452 200 440 180 420 178 C404 178 390 186 384 196 Z" className="fill-ink" />
        <circle cx="408" cy="204" r="3" className="fill-ink" />
        <circle cx="432" cy="204" r="3" className="fill-ink" />
        <path d="M384 296 C366 322 358 346 356 368" fill="none" />
        <path d="M368 374 C382 362 400 362 412 370 C424 362 442 362 456 374 Z" className="fill-focus" />
        <rect x="54" y="350" width="72" height="14" rx="3" className="fill-match" />
        <rect x="60" y="336" width="62" height="14" rx="3" className="fill-chat" />
        <rect x="50" y="322" width="68" height="14" rx="3" className="fill-focus" />
        <path d="M486 344 V374 H512 V344 Z" className="fill-live" />
        <path d="M512 352 C524 352 524 368 512 368" fill="none" />
      </g>
      <g className="animate-nb-sway" style={{ transformBox: "fill-box", transformOrigin: "left center" }}>
        <path d="M46 156 H134 A12 12 0 0 1 146 168 V190 A12 12 0 0 1 134 202 H76 L60 216 L64 202 H46 A12 12 0 0 1 34 190 V168 A12 12 0 0 1 46 156 Z" className="fill-ink" />
        <path
          d="M40 150 H128 A12 12 0 0 1 140 162 V184 A12 12 0 0 1 128 196 H70 L54 210 L58 196 H40 A12 12 0 0 1 28 184 V162 A12 12 0 0 1 40 150 Z"
          className="fill-chat stroke-ink"
          strokeWidth={3}
        />
        <text x="84" y="179" textAnchor="middle" className="fill-ink font-grotesk" fontWeight={700} fontSize={14}>
          Library at 7?
        </text>
      </g>
    </Frame>
  );
}

export function FocusIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 480 320" {...props}>
      <g className="stroke-ink" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <line x1="20" y1="300" x2="460" y2="300" />
        <rect x="30" y="26" width="120" height="104" rx="8" className="fill-chat" />
        <line x1="90" y1="26" x2="90" y2="130" />
        <line x1="30" y1="78" x2="150" y2="78" />
        <circle cx="122" cy="52" r="14" className="fill-paper" />
        <circle cx="248" cy="158" r="104" className="fill-ink" />
        <circle cx="240" cy="150" r="104" className="fill-card" />
        <circle cx="240" cy="150" r="80" fill="none" className="stroke-quiet-shade" strokeWidth={20} />
        <circle cx="240" cy="150" r="80" fill="none" className="stroke-focus" strokeWidth={20} pathLength={100} strokeDasharray="70 100" transform="rotate(-90 240 150)" />
        <circle cx="240" cy="150" r="90" fill="none" />
        <circle cx="240" cy="150" r="70" fill="none" />
        <path d="M48 240 V300 H96 V240 Z" className="fill-live" />
        <path d="M96 252 C110 252 110 284 96 284" fill="none" />
        <path d="M62 230 C58 220 66 216 62 206 M80 230 C76 220 84 216 80 206" fill="none" className="animate-nb-blink" />
        <path d="M370 262 C370 214 446 214 446 262" fill="none" strokeWidth={7} />
        <rect x="358" y="254" width="24" height="44" rx="9" className="fill-match" />
        <rect x="434" y="254" width="24" height="44" rx="9" className="fill-match" />
      </g>
      <text x="240" y="160" textAnchor="middle" className="fill-ink font-jetbrains" fontWeight={700} fontSize={40}>
        18:42
      </text>
      <text x="240" y="186" textAnchor="middle" className="fill-ink font-grotesk" fontWeight={700} fontSize={14}>
        Session 2 of 4
      </text>
      <Star x={420} y={45} className="fill-match" />
    </Frame>
  );
}

export function JobsIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 480 320" {...props}>
      <g className="stroke-ink" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <line x1="20" y1="300" x2="460" y2="300" />
        <rect x="58" y="38" width="160" height="220" rx="10" className="fill-ink" />
        <rect x="50" y="30" width="160" height="220" rx="10" className="fill-card" />
        <circle cx="90" cy="74" r="20" className="fill-focus" />
        <line x1="122" y1="66" x2="186" y2="66" />
        <line x1="122" y1="82" x2="166" y2="82" />
        <line x1="72" y1="120" x2="188" y2="120" />
        <line x1="72" y1="140" x2="176" y2="140" />
        <line x1="72" y1="160" x2="188" y2="160" />
        <line x1="72" y1="180" x2="150" y2="180" />
        <rect x="72" y="206" width="70" height="26" rx="13" className="fill-career" />
        <circle cx="206" cy="40" r="22" className="fill-live" />
        <path d="M196 40 L203 47 L216 33" fill="none" />
        <rect x="268" y="168" width="160" height="112" rx="10" className="fill-ink" />
        <rect x="260" y="160" width="160" height="112" rx="10" className="fill-career" />
        <path d="M300 160 V146 A8 8 0 0 1 308 138 H372 A8 8 0 0 1 380 146 V160" fill="none" />
        <line x1="260" y1="200" x2="420" y2="200" />
        <rect x="326" y="190" width="28" height="20" rx="3" className="fill-focus" />
      </g>
      <path d="M240 140 C 290 120, 320 80, 400 50" fill="none" className="stroke-ink animate-nb-ants" strokeWidth={3} strokeDasharray="8 8" strokeLinecap="round" />
      <path d="M386 40 L404 48 L394 64" fill="none" className="stroke-ink" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Star x={440} y={85} />
    </Frame>
  );
}

export function EnvelopeIllustration({ tone = "chat", ...props }: IllustrationProps & { tone?: "chat" | "focus" }) {
  const fill = tone === "chat" ? "fill-chat" : "fill-focus";
  return (
    <Frame viewBox="0 0 240 160" {...props}>
      <g className="stroke-ink" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <rect x="28" y="38" width="200" height="116" rx="10" className="fill-ink" />
        <rect x="20" y="30" width="200" height="116" rx="10" className={fill} />
        <rect x="44" y="8" width="152" height="90" rx="6" className="fill-card" />
        <line x1="62" y1="30" x2="150" y2="30" />
        <line x1="62" y1="46" x2="176" y2="46" />
        <path d="M20 30 L120 100 L220 30 V146 H20 Z" className={fill} />
        <path d="M20 146 L96 86 M220 146 L144 86" fill="none" />
        <circle cx="120" cy="96" r="13" className="fill-match" />
      </g>
      <Star x={222} y={14} size={12} />
    </Frame>
  );
}

/* ---- Password reset story: one picture per step ---- */

export function LostKeyIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 400 280" {...props}>
      <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="20" y1="250" x2="380" y2="250" />
        <rect x="40" y="206" width="96" height="16" rx="3" className="fill-match" />
        <rect x="48" y="190" width="84" height="16" rx="3" className="fill-focus" />
        <rect x="36" y="174" width="90" height="16" rx="3" className="fill-live" />
        <rect x="40" y="222" width="104" height="28" rx="3" className="fill-quiet-card" />
        <path d="M170 250 L182 210 L246 214 L238 250 Z" className="fill-card" />
        <line x1="190" y1="224" x2="230" y2="226" />
        <line x1="187" y1="236" x2="222" y2="238" />
        <path d="M206 250 L230 198 L284 214 L264 250 Z" className="fill-card" />
        <line x1="236" y1="214" x2="268" y2="224" />
        <path d="M306 206 V250 H342 V206 Z" className="fill-chat" />
        <path d="M342 216 C356 216 356 240 342 240" />
        <path d="M316 196 C312 186 320 182 316 172 M330 196 C326 186 334 182 330 172" className="animate-nb-blink" />
      </g>
      <g className="animate-nb-float">
        <circle cx="168" cy="106" r="46" className="fill-card stroke-quiet-ink" strokeWidth={2.5} />
        <circle cx="168" cy="106" r="36" className="fill-chat/25 stroke-quiet-ink" strokeWidth={2.5} />
        <path d="M201 139 L236 174" className="stroke-quiet-ink" strokeWidth={10} strokeLinecap="round" />
        <path d="M201 139 L236 174" className="stroke-chat" strokeWidth={5} strokeLinecap="round" />
        <text x="168" y="122" textAnchor="middle" className="fill-quiet-ink font-grotesk" fontWeight={700} fontSize={44}>
          ?
        </text>
      </g>
      <g className="animate-nb-nudge">
        <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="300" cy="80" r="16" className="fill-focus" />
          <path d="M316 80 H356 M344 80 V92 M334 80 V88" />
        </g>
      </g>
    </Frame>
  );
}

export function KeyInMailIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 400 280" {...props}>
      <path d="M30 230 C 90 230, 100 150, 170 150" fill="none" className="stroke-quiet-ink animate-nb-ants" strokeWidth={2.5} strokeDasharray="7 7" strokeLinecap="round" />
      <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 60 C60 44 84 44 86 58 C96 50 110 58 106 70 H56 C48 70 50 60 60 60 Z" className="fill-quiet-card" />
        <path d="M300 220 C300 206 322 206 324 218 C334 212 346 220 342 230 H296 C288 230 290 220 300 220 Z" className="fill-quiet-card" />
        <rect x="296" y="96" width="76" height="62" rx="8" className="fill-quiet-shade" />
        <path d="M296 128 H318 L326 140 H342 L350 128 H372" />
      </g>
      <g className="animate-nb-fly">
        <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="164" y="98" width="120" height="80" rx="8" className="fill-chat" />
          <path d="M164 98 L224 142 L284 98" />
          <g transform="rotate(-20 224 96)">
            <circle cx="204" cy="86" r="12" className="fill-focus" />
            <path d="M216 86 H250 M240 86 V96 M232 86 V92" />
          </g>
          <path d="M134 120 H150 M126 136 H150 M138 152 H150" />
        </g>
      </g>
    </Frame>
  );
}

export function KeyToLockIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 400 280" {...props}>
      <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M226 132 V96 C226 62 298 62 298 96 V132" strokeWidth={14} />
        <path d="M226 132 V96 C226 62 298 62 298 96 V132" className="stroke-quiet-shade" strokeWidth={8} />
        <rect x="206" y="128" width="112" height="100" rx="14" className="fill-focus" />
        <circle cx="262" cy="170" r="10" className="fill-quiet-ink" />
        <path d="M262 178 V200" strokeWidth={7} />
      </g>
      <g className="animate-nb-nudge">
        <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="74" cy="176" r="24" className="fill-chat" />
          <circle cx="74" cy="176" r="8" className="fill-quiet-card" />
          <path d="M98 176 H186 M170 176 V194 M154 176 V188" strokeWidth={7} />
        </g>
      </g>
    </Frame>
  );
}

export function UnlockedIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 400 280" {...props}>
      <g className="animate-nb-pop-in" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "500ms" }} fill="none">
        <path
          d="M150 170 H126 M374 170 H398 M262 252 V272 M176 96 L160 80 M348 96 L364 80 M176 244 L160 260 M348 244 L364 260"
          className="stroke-quiet-ink"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </g>
      <g className="animate-nb-unlock" style={{ transformBox: "view-box", transformOrigin: "262px 150px" }} fill="none" strokeLinecap="round">
        <path d="M226 132 V96 C226 62 298 62 298 96 V132" className="stroke-quiet-ink" strokeWidth={14} />
        <path d="M226 132 V96 C226 62 298 62 298 96 V132" className="stroke-quiet-shade" strokeWidth={8} />
      </g>
      <g fill="none" className="stroke-quiet-ink" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="206" y="128" width="112" height="100" rx="14" className="fill-live" />
        <path d="M238 178 L254 194 L288 160" strokeWidth={7} />
      </g>
    </Frame>
  );
}
