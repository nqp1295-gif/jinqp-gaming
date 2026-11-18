import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playerArtDir = path.resolve(__dirname, "../nova-arcade/player/public/art");
const adminArtDir = path.resolve(__dirname, "../nova-arcade/admin/public/art");

fs.mkdirSync(playerArtDir, { recursive: true });
fs.mkdirSync(adminArtDir, { recursive: true });

// Helper to construct rich SVG
function makeSvg(id, title, category, badgeColor, bgGradient, graphicContent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="none">
  <defs>
    ${bgGradient}
    <filter id="glow-${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="500" fill="url(#bg-${id})" />

  <!-- Background Ambient Glow -->
  <circle cx="400" cy="240" r="190" fill="${badgeColor}" opacity="0.12" filter="url(#glow-${id})" />

  <!-- Focal Illustration -->
  ${graphicContent}

  <!-- Category & Game Branding Accent -->
  <g transform="translate(40, 420)">
    <rect width="130" height="30" rx="6" fill="#000000" fill-opacity="0.45" stroke="${badgeColor}" stroke-width="1.5" stroke-opacity="0.6"/>
    <text x="65" y="20" fill="${badgeColor}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" text-anchor="middle">${category.toUpperCase()}</text>
  </g>

  <!-- Subtle Vignette Frame -->
  <rect width="800" height="500" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="2"/>
</svg>`;
}

const games = [
  // ==================== TRÍ TUỆ (7) ====================
  {
    id: "memory",
    title: "Memory Garden",
    category: "Trí tuệ",
    color: "#10B981",
    bg: `<linearGradient id="bg-memory" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041F1A"/><stop offset="0.6" stop-color="#0A3A2F"/><stop offset="1" stop-color="#02120F"/></linearGradient>`,
    graphic: `
      <!-- Zen Garden Lotus & Memory Cards -->
      <g transform="translate(400, 230)">
        <ellipse cx="0" cy="50" rx="140" ry="35" fill="#052E26" stroke="#10B981" stroke-width="2" stroke-opacity="0.4"/>
        <!-- Lotus Petals -->
        <path d="M0 -60 C-30 -20 -40 20 0 40 C40 20 30 -20 0 -60 Z" fill="#34D399" opacity="0.9"/>
        <path d="M-40 -40 C-70 -10 -60 30 -10 35 C-20 0 -10 -20 -40 -40 Z" fill="#10B981" opacity="0.8"/>
        <path d="M40 -40 C70 -10 60 30 10 35 C20 0 10 -20 40 -40 Z" fill="#10B981" opacity="0.8"/>
        <path d="M-70 -10 C-100 20 -70 50 -30 40 C-50 20 -40 0 -70 -10 Z" fill="#059669" opacity="0.7"/>
        <path d="M70 -10 C100 20 70 50 30 40 C50 20 40 0 70 -10 Z" fill="#059669" opacity="0.7"/>
        <circle cx="0" cy="0" r="14" fill="#FBBF24"/>
        <!-- Glowing Memory Cards floating -->
        <g transform="translate(-160, -90) rotate(-12)">
          <rect width="64" height="88" rx="8" fill="#064E3B" stroke="#34D399" stroke-width="2.5"/>
          <circle cx="32" cy="44" r="14" fill="#6EE7B7"/>
        </g>
        <g transform="translate(100, -80) rotate(15)">
          <rect width="64" height="88" rx="8" fill="#064E3B" stroke="#34D399" stroke-width="2.5"/>
          <path d="M32 28 L40 44 L24 44 Z" fill="#6EE7B7"/>
        </g>
      </g>`
  },
  {
    id: "number",
    title: "Number Rush",
    category: "Trí tuệ",
    color: "#38BDF8",
    bg: `<linearGradient id="bg-number" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#081A36"/><stop offset="0.6" stop-color="#0E2F5C"/><stop offset="1" stop-color="#040D1E"/></linearGradient>`,
    graphic: `
      <!-- Fast Numbers & Speed Calculations -->
      <g transform="translate(400, 230)">
        <circle cx="0" cy="0" r="110" fill="#0B2545" stroke="#38BDF8" stroke-width="2" stroke-dasharray="8 6"/>
        <text x="-65" y="25" fill="#38BDF8" font-family="monospace" font-size="70" font-weight="900" filter="url(#glow-number)">7</text>
        <text x="5" y="25" fill="#F59E0B" font-family="monospace" font-size="50" font-weight="900">×</text>
        <text x="45" y="25" fill="#38BDF8" font-family="monospace" font-size="70" font-weight="900" filter="url(#glow-number)">9</text>
        <!-- Orbiting math symbols -->
        <circle cx="-130" cy="-60" r="24" fill="#0284C7" opacity="0.8"/>
        <text x="-130" y="-52" fill="#FFFFFF" font-family="system-ui" font-size="24" font-weight="bold" text-anchor="middle">+</text>
        <circle cx="140" cy="50" r="26" fill="#D97706" opacity="0.8"/>
        <text x="140" y="58" fill="#FFFFFF" font-family="system-ui" font-size="26" font-weight="bold" text-anchor="middle">÷</text>
        <circle cx="100" cy="-80" r="20" fill="#38BDF8" opacity="0.6"/>
        <text x="100" y="-73" fill="#FFFFFF" font-family="system-ui" font-size="20" font-weight="bold" text-anchor="middle">=</text>
      </g>`
  },
  {
    id: "matrix-mind",
    title: "Matrix Mind",
    category: "Trí tuệ",
    color: "#22C55E",
    bg: `<linearGradient id="bg-matrix-mind" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#021408"/><stop offset="0.6" stop-color="#062E12"/><stop offset="1" stop-color="#010A04"/></linearGradient>`,
    graphic: `
      <!-- Cyber CPU & Binary Matrix -->
      <g transform="translate(400, 230)">
        <!-- Microchip Body -->
        <rect x="-70" y="-70" width="140" height="140" rx="14" fill="#052E16" stroke="#22C55E" stroke-width="3" filter="url(#glow-matrix-mind)"/>
        <!-- Inner Core -->
        <rect x="-40" y="-40" width="80" height="80" rx="8" fill="#021A0C" stroke="#4ADE80" stroke-width="2"/>
        <path d="M-20 -20 H20 V20 H-20 Z" fill="#22C55E" opacity="0.8"/>
        <!-- Circuit Pins -->
        <path d="M-70 -40 H-95 M-70 -15 H-95 M-70 15 H-95 M-70 40 H-95 M70 -40 H95 M70 -15 H95 M70 15 H95 M70 40 H95" stroke="#22C55E" stroke-width="3" stroke-linecap="round"/>
        <path d="M-40 -70 V-95 M-15 -70 V-95 M15 -70 V-95 M40 -70 V-95 M-40 70 V95 M-15 70 V95 M15 70 V95 M40 70 V95" stroke="#22C55E" stroke-width="3" stroke-linecap="round"/>
        <!-- Binary waterfall streams -->
        <text x="-160" y="-20" fill="#22C55E" opacity="0.4" font-family="monospace" font-size="13">1 0 1 0 1</text>
        <text x="-160" y="5" fill="#22C55E" opacity="0.7" font-family="monospace" font-size="13">0 1 1 0 0</text>
        <text x="120" y="-20" fill="#22C55E" opacity="0.6" font-family="monospace" font-size="13">1 1 0 1 0</text>
        <text x="120" y="5" fill="#22C55E" opacity="0.3" font-family="monospace" font-size="13">0 0 1 1 1</text>
      </g>`
  },
  {
    id: "super-recall",
    title: "Super Recall",
    category: "Trí tuệ",
    color: "#A855F7",
    bg: `<linearGradient id="bg-super-recall" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#190A2E"/><stop offset="0.6" stop-color="#2D1152"/><stop offset="1" stop-color="#0E041A"/></linearGradient>`,
    graphic: `
      <!-- Brainwave Waves & Prism Recall -->
      <g transform="translate(400, 230)">
        <circle cx="0" cy="0" r="115" stroke="#A855F7" stroke-width="2" stroke-dasharray="4 8" opacity="0.6"/>
        <!-- Brain Outline Hologram -->
        <path d="M-30 -50 C-70 -50 -80 -10 -70 20 C-60 45 -40 60 -15 65 C-5 45 -5 10 -5 -10 C-5 -30 -10 -50 -30 -50 Z" fill="#6B21A8" stroke="#C084FC" stroke-width="2.5" opacity="0.8"/>
        <path d="M30 -50 C70 -50 80 -10 70 20 C60 45 40 60 15 65 C5 45 5 10 5 -10 C5 -30 10 -50 30 -50 Z" fill="#6B21A8" stroke="#C084FC" stroke-width="2.5" opacity="0.8"/>
        <!-- Neural Synapse Sparks -->
        <circle cx="-35" cy="-10" r="6" fill="#F472B6"/>
        <circle cx="35" cy="-10" r="6" fill="#F472B6"/>
        <circle cx="0" cy="20" r="7" fill="#38BDF8"/>
        <path d="M-35 -10 L0 20 L35 -10" stroke="#E879F9" stroke-width="2"/>
        <!-- Concentric Brainwave Rings -->
        <circle cx="0" cy="0" r="60" stroke="#E879F9" stroke-width="1.5" opacity="0.4"/>
        <circle cx="0" cy="0" r="90" stroke="#C084FC" stroke-width="1.5" opacity="0.3"/>
      </g>`
  },
  {
    id: "logic-master",
    title: "Logic Master",
    category: "Trí tuệ",
    color: "#EAB308",
    bg: `<linearGradient id="bg-logic-master" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#211704"/><stop offset="0.6" stop-color="#3D2B09"/><stop offset="1" stop-color="#120C02"/></linearGradient>`,
    graphic: `
      <!-- Isometric Logic Cube & Brass Gears -->
      <g transform="translate(400, 230)">
        <!-- 3D Isometric Cube -->
        <!-- Top Face -->
        <polygon points="0,-70 65,-35 0,0 -65,-35" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
        <!-- Left Face -->
        <polygon points="-65,-35 0,0 0,75 -65,40" fill="#CA8A04" stroke="#A16207" stroke-width="2"/>
        <!-- Right Face -->
        <polygon points="0,0 65,-35 65,40 0,75" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
        <!-- Inner Cube grid lines -->
        <line x1="0" y1="-70" x2="0" y2="0" stroke="#A16207" stroke-width="1.5"/>
        <line x1="-32" y1="-52" x2="32" y2="-18" stroke="#A16207" stroke-width="1.5"/>
        <line x1="32" y1="-52" x2="-32" y2="-18" stroke="#A16207" stroke-width="1.5"/>
        <!-- Floating Gear Icons -->
        <g transform="translate(-130, -50) scale(0.6)">
          <circle cx="0" cy="0" r="30" fill="none" stroke="#FDE047" stroke-width="10" stroke-dasharray="14 10"/>
          <circle cx="0" cy="0" r="14" fill="#FDE047"/>
        </g>
        <g transform="translate(130, 40) scale(0.7)">
          <circle cx="0" cy="0" r="30" fill="none" stroke="#FDE047" stroke-width="10" stroke-dasharray="14 10"/>
          <circle cx="0" cy="0" r="14" fill="#FDE047"/>
        </g>
      </g>`
  },
  {
    id: "reverse-think",
    title: "Reverse Think",
    category: "Trí tuệ",
    color: "#06B6D4",
    bg: `<linearGradient id="bg-reverse-think" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041E26"/><stop offset="0.6" stop-color="#0A3845"/><stop offset="1" stop-color="#021014"/></linearGradient>`,
    graphic: `
      <!-- Reverse Hourglass & Flip Arrows -->
      <g transform="translate(400, 230)">
        <!-- Hourglass Frame -->
        <path d="M-45 -70 H45 L0 0 L45 70 H-45 L0 0 Z" fill="#0E4A59" stroke="#06B6D4" stroke-width="3"/>
        <rect x="-55" y="-76" width="110" height="12" rx="4" fill="#0891B2"/>
        <rect x="-55" y="64" width="110" height="12" rx="4" fill="#0891B2"/>
        <!-- Glowing sand floating UPWARD -->
        <polygon points="-25,55 25,55 0,15" fill="#22D3EE"/>
        <circle cx="0" cy="-5" r="3" fill="#67E8F9"/>
        <circle cx="0" cy="-20" r="3" fill="#67E8F9"/>
        <circle cx="0" cy="-35" r="4" fill="#67E8F9"/>
        <polygon points="-30,-60 30,-60 0,-40" fill="#22D3EE" opacity="0.6"/>
        <!-- Orbiting Reverse Arrows -->
        <path d="M-80 -30 A 90 90 0 0 1 80 -30" fill="none" stroke="#F97316" stroke-width="3.5" stroke-dasharray="8 4" marker-end="url(#arrow)"/>
        <path d="M80 30 A 90 90 0 0 1 -80 30" fill="none" stroke="#F97316" stroke-width="3.5" stroke-dasharray="8 4"/>
      </g>`
  },
  {
    id: "iq-arena",
    title: "IQ Arena",
    category: "Trí tuệ",
    color: "#F43F5E",
    bg: `<linearGradient id="bg-iq-arena" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240712"/><stop offset="0.6" stop-color="#420D22"/><stop offset="1" stop-color="#120309"/></linearGradient>`,
    graphic: `
      <!-- Championship Trophy & Diamond Crown -->
      <g transform="translate(400, 230)">
        <circle cx="0" cy="-20" r="105" fill="#4C0519" stroke="#F43F5E" stroke-width="2" opacity="0.5"/>
        <!-- Golden Crown with Red Rubies -->
        <path d="M-60 30 L-70 -30 L-25 -5 L0 -45 L25 -5 L70 -30 L60 30 Z" fill="#FB7185" stroke="#FFF" stroke-width="2.5" filter="url(#glow-iq-arena)"/>
        <circle cx="-70" cy="-30" r="7" fill="#FFE4E6"/>
        <circle cx="0" cy="-45" r="9" fill="#FDE047"/>
        <circle cx="70" cy="-30" r="7" fill="#FFE4E6"/>
        <!-- Trophy Pedestal -->
        <rect x="-40" y="30" width="80" height="20" rx="4" fill="#881337" stroke="#FDA4AF" stroke-width="2"/>
        <polygon points="-25,50 25,50 35,75 -35,75" fill="#9F1239"/>
        <rect x="-50" y="75" width="100" height="15" rx="3" fill="#E11D48"/>
      </g>`
  },

  // ==================== HÀNH ĐỘNG (7) ====================
  {
    id: "shadow-strike",
    title: "Shadow Strike",
    category: "Hành động",
    color: "#8B5CF6",
    bg: `<linearGradient id="bg-shadow-strike" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#120A24"/><stop offset="0.6" stop-color="#221345"/><stop offset="1" stop-color="#090514"/></linearGradient>`,
    graphic: `
      <!-- Ninja Shuriken & Stealth Crescent -->
      <g transform="translate(400, 230)">
        <!-- Giant Glowing Shuriken -->
        <g filter="url(#glow-shadow-strike)">
          <path d="M0 -90 L18 -25 L85 -25 L32 12 L50 80 L0 40 L-50 80 L-32 12 L-85 -25 L-18 -25 Z" fill="#8B5CF6" stroke="#C4B5FD" stroke-width="2"/>
          <circle cx="0" cy="8" r="18" fill="#1E1B4B" stroke="#A78BFA" stroke-width="3"/>
        </g>
        <!-- Shadow Slash Swirls -->
        <path d="M-130 50 Q 0 -120 130 50" stroke="#C084FC" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/>
        <path d="M-110 70 Q 0 -90 110 70" stroke="#DDD6FE" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
      </g>`
  },
  {
    id: "ninja-slash",
    title: "Ninja Slash",
    category: "Hành động",
    color: "#EF4444",
    bg: `<linearGradient id="bg-ninja-slash" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240707"/><stop offset="0.6" stop-color="#450E0E"/><stop offset="1" stop-color="#120303"/></linearGradient>`,
    graphic: `
      <!-- Twin Flaming Katana Slash -->
      <g transform="translate(400, 230)">
        <!-- Fiery Slash X -->
        <path d="M-150 -100 L150 100" stroke="#EF4444" stroke-width="14" stroke-linecap="round" filter="url(#glow-ninja-slash)"/>
        <path d="M-150 -100 L150 100" stroke="#FEF08A" stroke-width="4" stroke-linecap="round"/>
        <path d="M150 -100 L-150 100" stroke="#F97316" stroke-width="10" stroke-linecap="round" filter="url(#glow-ninja-slash)"/>
        <path d="M150 -100 L-150 100" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
        <!-- Katana Blade Silhouette -->
        <g transform="rotate(45)">
          <rect x="-140" y="-5" width="280" height="10" rx="3" fill="#E2E8F0"/>
          <rect x="70" y="-18" width="12" height="36" rx="3" fill="#DC2626"/>
          <rect x="82" y="-8" width="60" height="16" rx="3" fill="#18181B" stroke="#F87171" stroke-width="1.5"/>
        </g>
      </g>`
  },
  {
    id: "cyber-warrior",
    title: "Cyber Warrior",
    category: "Hành động",
    color: "#06B6D4",
    bg: `<linearGradient id="bg-cyber-warrior" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#051C24"/><stop offset="0.6" stop-color="#0B3747"/><stop offset="1" stop-color="#020E12"/></linearGradient>`,
    graphic: `
      <!-- Cyber Mech Helmet Visor & Hex Shield -->
      <g transform="translate(400, 230)">
        <!-- Hex Shield -->
        <polygon points="0,-95 80,-45 80,45 0,95 -80,45 -80,-45" fill="#083344" stroke="#06B6D4" stroke-width="3" filter="url(#glow-cyber-warrior)"/>
        <!-- Inner Hex Grid -->
        <polygon points="0,-75 60,-35 60,35 0,75 -60,35 -60,-35" fill="#0E4A5E" stroke="#22D3EE" stroke-width="2"/>
        <!-- Glowing Visor Eye -->
        <rect x="-45" y="-10" width="90" height="20" rx="6" fill="#67E8F9" filter="url(#glow-cyber-warrior)"/>
        <line x1="-70" y1="0" x2="70" y2="0" stroke="#FFFFFF" stroke-width="2"/>
      </g>`
  },
  {
    id: "street-fighter",
    title: "Street Fighter",
    category: "Hành động",
    color: "#F97316",
    bg: `<linearGradient id="bg-street-fighter" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#241005"/><stop offset="0.6" stop-color="#451E0A"/><stop offset="1" stop-color="#120702"/></linearGradient>`,
    graphic: `
      <!-- Power Fist & Impact Shockwave -->
      <g transform="translate(400, 230)">
        <circle cx="0" cy="0" r="110" fill="#431407" stroke="#F97316" stroke-width="2" stroke-dasharray="10 6" opacity="0.6"/>
        <!-- Armored Combat Fist -->
        <path d="M-45 35 L-45 -15 C-45 -35 -25 -50 0 -50 C25 -50 45 -35 45 -15 L45 35 Z" fill="#EA580C" stroke="#FED7AA" stroke-width="3" filter="url(#glow-street-fighter)"/>
        <!-- Knuckle Guards -->
        <rect x="-40" y="-35" width="18" height="25" rx="5" fill="#7C2D12" stroke="#FDBA74" stroke-width="2"/>
        <rect x="-18" y="-45" width="18" height="30" rx="5" fill="#9A3412" stroke="#FDBA74" stroke-width="2"/>
        <rect x="4" y="-45" width="18" height="30" rx="5" fill="#9A3412" stroke="#FDBA74" stroke-width="2"/>
        <rect x="24" y="-35" width="18" height="25" rx="5" fill="#7C2D12" stroke="#FDBA74" stroke-width="2"/>
        <!-- Thumb -->
        <path d="M-40 0 C-60 10 -55 40 -35 40 Z" fill="#C2410C" stroke="#FDBA74" stroke-width="2"/>
        <!-- Impact Sparks -->
        <path d="M-80 -70 L-50 -40 M80 -70 L50 -40 M-90 20 L-60 10 M90 20 L60 10" stroke="#FDE047" stroke-width="4" stroke-linecap="round"/>
      </g>`
  },
  {
    id: "beast-hunter",
    title: "Beast Hunter",
    category: "Hành động",
    color: "#84CC16",
    bg: `<linearGradient id="bg-beast-hunter" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#141E04"/><stop offset="0.6" stop-color="#263A09"/><stop offset="1" stop-color="#0A0F02"/></linearGradient>`,
    graphic: `
      <!-- Beast Claws Rip & Forest Fangs -->
      <g transform="translate(400, 230)">
        <!-- 3 Giant Claw Slash Marks -->
        <g filter="url(#glow-beast-hunter)">
          <path d="M-75 -90 Q-60 10 -40 90" stroke="#84CC16" stroke-width="12" stroke-linecap="round" fill="none"/>
          <path d="M-15 -100 Q0 0 20 100" stroke="#A3E635" stroke-width="14" stroke-linecap="round" fill="none"/>
          <path d="M45 -90 Q60 10 80 90" stroke="#84CC16" stroke-width="12" stroke-linecap="round" fill="none"/>
        </g>
        <!-- Inner white slash highlights -->
        <path d="M-75 -90 Q-60 10 -40 90" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M-15 -100 Q0 0 20 100" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M45 -90 Q60 10 80 90" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>`
  },
  {
    id: "secret-agent",
    title: "Secret Agent",
    category: "Hành động",
    color: "#64748B",
    bg: `<linearGradient id="bg-secret-agent" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#0F172A"/><stop offset="0.6" stop-color="#1E293B"/><stop offset="1" stop-color="#0A0E17"/></linearGradient>`,
    graphic: `
      <!-- Night Vision Crosshairs & Spy Target -->
      <g transform="translate(400, 230)">
        <!-- Crosshair Radar Rings -->
        <circle cx="0" cy="0" r="105" stroke="#EF4444" stroke-width="2" fill="none" opacity="0.6"/>
        <circle cx="0" cy="0" r="70" stroke="#EF4444" stroke-width="2" fill="none" opacity="0.8"/>
        <circle cx="0" cy="0" r="30" stroke="#EF4444" stroke-width="3" fill="#EF4444" fill-opacity="0.15" filter="url(#glow-secret-agent)"/>
        <!-- Reticle Lines -->
        <line x1="-130" y1="0" x2="-40" y2="0" stroke="#EF4444" stroke-width="3"/>
        <line x1="40" y1="0" x2="130" y2="0" stroke="#EF4444" stroke-width="3"/>
        <line x1="0" y1="-130" x2="0" y2="-40" stroke="#EF4444" stroke-width="3"/>
        <line x1="0" y1="40" x2="0" y2="130" stroke="#EF4444" stroke-width="3"/>
        <circle cx="0" cy="0" r="4" fill="#FFFFFF"/>
      </g>`
  },
  {
    id: "master-archer",
    title: "Master Archer",
    category: "Hành động",
    color: "#F59E0B",
    bg: `<linearGradient id="bg-master-archer" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#241604"/><stop offset="0.6" stop-color="#422908"/><stop offset="1" stop-color="#120A02"/></linearGradient>`,
    graphic: `
      <!-- Golden Recurve Bow & Arrow -->
      <g transform="translate(400, 230)">
        <!-- Bow Curve -->
        <path d="M-40 -110 Q-100 0 -40 110" stroke="#F59E0B" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#glow-master-archer)"/>
        <!-- Bow String -->
        <path d="M-40 -110 L25 0 L-40 110" stroke="#FEF3C7" stroke-width="2.5" fill="none"/>
        <!-- Arrow -->
        <line x1="-50" y1="0" x2="110" y2="0" stroke="#FFFFFF" stroke-width="4"/>
        <polygon points="110,0 85,-12 85,12" fill="#F59E0B"/>
        <!-- Arrow Fletching -->
        <path d="M-50 0 L-65 -12 M-50 0 L-65 12 M-40 0 L-55 -12 M-40 0 L-55 12" stroke="#FBBF24" stroke-width="3"/>
      </g>`
  },

  // ==================== PHẢN XẠ (7) ====================
  {
    id: "reflex",
    title: "Neon Reflex",
    category: "Phản xạ",
    color: "#00F0FF",
    bg: `<linearGradient id="bg-reflex" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041F28"/><stop offset="0.6" stop-color="#083747"/><stop offset="1" stop-color="#020E13"/></linearGradient>`,
    graphic: `
      <!-- Strobe Push Button & Lightning Waves -->
      <g transform="translate(400, 230)">
        <circle cx="0" cy="0" r="115" stroke="#00F0FF" stroke-width="3" stroke-dasharray="12 8" opacity="0.6"/>
        <circle cx="0" cy="0" r="85" fill="#082F3B" stroke="#00F0FF" stroke-width="4" filter="url(#glow-reflex)"/>
        <circle cx="0" cy="0" r="60" fill="#00F0FF" opacity="0.9"/>
        <!-- Central Lightning Zap -->
        <path d="M-10 -35 L12 -5 L-4 5 L10 35 L-12 5 L4 -5 Z" fill="#FFFFFF"/>
      </g>`
  },
  {
    id: "speed-tap",
    title: "Speed Tap",
    category: "Phản xạ",
    color: "#FACC15",
    bg: `<linearGradient id="bg-speed-tap" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#241B04"/><stop offset="0.6" stop-color="#423108"/><stop offset="1" stop-color="#120D02"/></linearGradient>`,
    graphic: `
      <!-- Finger Tap & Sonic Ripple Rings -->
      <g transform="translate(400, 230)">
        <!-- Ripple Rings -->
        <circle cx="0" cy="20" r="30" stroke="#FACC15" stroke-width="3" fill="none" opacity="0.9"/>
        <circle cx="0" cy="20" r="60" stroke="#FACC15" stroke-width="2.5" fill="none" opacity="0.6"/>
        <circle cx="0" cy="20" r="95" stroke="#FACC15" stroke-width="2" stroke-dasharray="8 6" fill="none" opacity="0.4"/>
        <circle cx="0" cy="20" r="130" stroke="#FACC15" stroke-width="1.5" stroke-dasharray="4 8" fill="none" opacity="0.2"/>
        <!-- Golden Pointer Hand / Lightning Touch -->
        <path d="M0 -70 L0 20" stroke="#FDE047" stroke-width="8" stroke-linecap="round" filter="url(#glow-speed-tap)"/>
        <circle cx="0" cy="20" r="14" fill="#FFFFFF" filter="url(#glow-speed-tap)"/>
      </g>`
  },
  {
    id: "bullseye-blitz",
    title: "Bullseye Blitz",
    category: "Phản xạ",
    color: "#DC2626",
    bg: `<linearGradient id="bg-bullseye-blitz" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240707"/><stop offset="0.6" stop-color="#450E0E"/><stop offset="1" stop-color="#120303"/></linearGradient>`,
    graphic: `
      <!-- 100-pt Target & Laser Dart Hit -->
      <g transform="translate(400, 230)">
        <circle cx="0" cy="0" r="110" fill="#1C1917" stroke="#DC2626" stroke-width="4"/>
        <circle cx="0" cy="0" r="85" fill="#DC2626" opacity="0.3"/>
        <circle cx="0" cy="0" r="60" fill="#1C1917" stroke="#DC2626" stroke-width="3"/>
        <circle cx="0" cy="0" r="35" fill="#EF4444" filter="url(#glow-bullseye-blitz)"/>
        <circle cx="0" cy="0" r="14" fill="#FFFFFF"/>
        <!-- Starburst of score points -->
        <text x="0" y="7" fill="#DC2626" font-family="system-ui" font-size="14" font-weight="900" text-anchor="middle">100</text>
      </g>`
  },
  {
    id: "green-light-rush",
    title: "Green Light Rush",
    category: "Phản xạ",
    color: "#22C55E",
    bg: `<linearGradient id="bg-green-light-rush" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#031A0B"/><stop offset="0.6" stop-color="#083818"/><stop offset="1" stop-color="#010D05"/></linearGradient>`,
    graphic: `
      <!-- Cyberpunk Traffic Light: Glowing Green GO -->
      <g transform="translate(400, 230)">
        <!-- Traffic Light Casing -->
        <rect x="-45" y="-105" width="90" height="210" rx="20" fill="#0F172A" stroke="#334155" stroke-width="3"/>
        <!-- Red Light (Dim) -->
        <circle cx="0" cy="-60" r="24" fill="#7F1D1D" stroke="#991B1B" stroke-width="2"/>
        <!-- Yellow Light (Dim) -->
        <circle cx="0" cy="0" r="24" fill="#78350F" stroke="#92400E" stroke-width="2"/>
        <!-- Green Light (BLAZING GO!) -->
        <circle cx="0" cy="60" r="26" fill="#22C55E" stroke="#86EFAC" stroke-width="3" filter="url(#glow-green-light-rush)"/>
        <circle cx="0" cy="60" r="12" fill="#FFFFFF"/>
      </g>`
  },
  {
    id: "diamond-snatch",
    title: "Diamond Snatch",
    category: "Phản xạ",
    color: "#38BDF8",
    bg: `<linearGradient id="bg-diamond-snatch" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#06182E"/><stop offset="0.6" stop-color="#0B2F57"/><stop offset="1" stop-color="#030C17"/></linearGradient>`,
    graphic: `
      <!-- Giant Cut Diamond on Pedestal -->
      <g transform="translate(400, 220)">
        <!-- Faceted Diamond -->
        <polygon points="-70,-30 70,-30 100,5 0,85 -100,5" fill="#0284C7" stroke="#38BDF8" stroke-width="3" filter="url(#glow-diamond-snatch)"/>
        <!-- Diamond Facet lines -->
        <polygon points="-40,-30 40,-30 55,5 0,85 -55,5" fill="#38BDF8" opacity="0.6"/>
        <polygon points="-20,-30 20,-30 0,5" fill="#E0F2FE"/>
        <line x1="-70" y1="-30" x2="-55" y2="5" stroke="#BAE6FD" stroke-width="2"/>
        <line x1="70" y1="-30" x2="55" y2="5" stroke="#BAE6FD" stroke-width="2"/>
        <line x1="-100" y1="5" x2="100" y2="5" stroke="#BAE6FD" stroke-width="2"/>
        <!-- Sparkle Star -->
        <path d="M50 -55 Q50 -35 70 -35 Q50 -35 50 -15 Q50 -35 30 -35 Q50 -35 50 -55" fill="#FFFFFF"/>
      </g>`
  },
  {
    id: "voltage-jump",
    title: "Voltage Jump",
    category: "Phản xạ",
    color: "#A855F7",
    bg: `<linearGradient id="bg-voltage-jump" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#1A0A2E"/><stop offset="0.6" stop-color="#341259"/><stop offset="1" stop-color="#0C0417"/></linearGradient>`,
    graphic: `
      <!-- Tesla Coil Discharge & Electric Arcs -->
      <g transform="translate(400, 230)">
        <!-- Tesla Toroid Dome -->
        <ellipse cx="0" cy="-60" rx="75" ry="24" fill="#581C87" stroke="#C084FC" stroke-width="3" filter="url(#glow-voltage-jump)"/>
        <ellipse cx="0" cy="-60" rx="35" ry="10" fill="#E9D5FF"/>
        <!-- Coil Body Rings -->
        <rect x="-25" y="-36" width="50" height="90" rx="4" fill="#3B0764" stroke="#A855F7" stroke-width="2"/>
        <line x1="-25" y1="-18" x2="25" y2="-18" stroke="#D8B4FE" stroke-width="3"/>
        <line x1="-25" y1="2" x2="25" y2="2" stroke="#D8B4FE" stroke-width="3"/>
        <line x1="-25" y1="22" x2="25" y2="22" stroke="#D8B4FE" stroke-width="3"/>
        <!-- High Voltage Lightning Arcs -->
        <path d="M-60 -60 L-110 -90 L-90 -50 L-140 -60" stroke="#C084FC" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M60 -60 L110 -90 L90 -50 L140 -60" stroke="#C084FC" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      </g>`
  },
  {
    id: "whack-master",
    title: "Whack Master",
    category: "Phản xạ",
    color: "#E11D48",
    bg: `<linearGradient id="bg-whack-master" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240710"/><stop offset="0.6" stop-color="#470D1E"/><stop offset="1" stop-color="#120308"/></linearGradient>`,
    graphic: `
      <!-- Heavy Thunder Hammer Smashing Pad -->
      <g transform="translate(400, 230)">
        <!-- Ground Hole Ring -->
        <ellipse cx="0" cy="60" rx="100" ry="30" fill="#1C1917" stroke="#E11D48" stroke-width="3"/>
        <!-- Giant Hammer Swung Down -->
        <g transform="translate(-10, -20) rotate(-25)">
          <!-- Handle -->
          <rect x="-8" y="-100" width="16" height="120" rx="4" fill="#78350F" stroke="#F59E0B" stroke-width="2"/>
          <!-- Hammer Head -->
          <rect x="-55" y="10" width="110" height="60" rx="10" fill="#334155" stroke="#E11D48" stroke-width="4" filter="url(#glow-whack-master)"/>
          <line x1="-55" y1="40" x2="55" y2="40" stroke="#94A3B8" stroke-width="3"/>
        </g>
        <!-- Impact Stars -->
        <polygon points="60,30 68,45 85,45 72,55 77,70 60,60 43,70 48,55 35,45 52,45" fill="#FBBF24"/>
      </g>`
  },

  // ==================== GIẢI ĐỐ (7) ====================
  {
    id: "word",
    title: "Word Voyage",
    category: "Giải đố",
    color: "#F59E0B",
    bg: `<linearGradient id="bg-word" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#1F1504"/><stop offset="0.6" stop-color="#3B2808"/><stop offset="1" stop-color="#100B02"/></linearGradient>`,
    graphic: `
      <!-- Word Tiles Grid & Crossword -->
      <g transform="translate(400, 230)">
        <g transform="translate(-105, -70)">
          <rect width="60" height="60" rx="10" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>
          <text x="30" y="42" fill="#78350F" font-family="system-ui" font-size="32" font-weight="900" text-anchor="middle">W</text>
        </g>
        <g transform="translate(-35, -70)">
          <rect width="60" height="60" rx="10" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>
          <text x="30" y="42" fill="#78350F" font-family="system-ui" font-size="32" font-weight="900" text-anchor="middle">O</text>
        </g>
        <g transform="translate(35, -70)">
          <rect width="60" height="60" rx="10" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>
          <text x="30" y="42" fill="#78350F" font-family="system-ui" font-size="32" font-weight="900" text-anchor="middle">R</text>
        </g>
        <!-- Interlocking Column -->
        <g transform="translate(35, 0)">
          <rect width="60" height="60" rx="10" fill="#FDE68A" stroke="#D97706" stroke-width="2.5"/>
          <text x="30" y="42" fill="#78350F" font-family="system-ui" font-size="32" font-weight="900" text-anchor="middle">D</text>
        </g>
        <g transform="translate(35, 70)">
          <rect width="60" height="60" rx="10" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>
          <text x="30" y="42" fill="#78350F" font-family="system-ui" font-size="32" font-weight="900" text-anchor="middle">S</text>
        </g>
      </g>`
  },
  {
    id: "word-master",
    title: "Word Master",
    category: "Giải đố",
    color: "#8B5CF6",
    bg: `<linearGradient id="bg-word-master" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#140826"/><stop offset="0.6" stop-color="#28114C"/><stop offset="1" stop-color="#0A0414"/></linearGradient>`,
    graphic: `
      <!-- Open Magical Grimoire & Glowing Runes -->
      <g transform="translate(400, 230)">
        <!-- Book Pages -->
        <path d="M0 30 C-40 10 -90 10 -130 25 L-130 -55 C-90 -70 -40 -70 0 -50 C40 -70 90 -70 130 -55 L130 25 C90 10 40 10 0 30 Z" fill="#DDD6FE" stroke="#8B5CF6" stroke-width="3" filter="url(#glow-word-master)"/>
        <!-- Spine -->
        <line x1="0" y1="-50" x2="0" y2="30" stroke="#7C3AED" stroke-width="3"/>
        <!-- Glowing Runic Letters Floating Up -->
        <text x="-60" y="-10" fill="#6D28D9" font-family="serif" font-size="28" font-weight="bold">A B C</text>
        <text x="30" y="-10" fill="#6D28D9" font-family="serif" font-size="28" font-weight="bold">X Y Z</text>
        <text x="-25" y="-80" fill="#C4B5FD" font-family="monospace" font-size="24" font-weight="bold">Ψ Ω Σ</text>
      </g>`
  },
  {
    id: "anagram-quest",
    title: "Anagram Quest",
    category: "Giải đố",
    color: "#EAB308",
    bg: `<linearGradient id="bg-anagram-quest" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#211804"/><stop offset="0.6" stop-color="#3D2C08"/><stop offset="1" stop-color="#120D02"/></linearGradient>`,
    graphic: `
      <!-- Treasure Chest & Cryptic Letter Scramble -->
      <g transform="translate(400, 230)">
        <!-- Chest Lid -->
        <path d="M-70 -20 C-70 -60 70 -60 70 -20 Z" fill="#B45309" stroke="#FDE047" stroke-width="3"/>
        <!-- Chest Base -->
        <rect x="-70" y="-20" width="140" height="80" rx="6" fill="#78350F" stroke="#FDE047" stroke-width="3"/>
        <!-- Lock -->
        <rect x="-15" y="-15" width="30" height="25" rx="4" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
        <circle cx="0" cy="-3" r="4" fill="#78350F"/>
        <!-- Scrambled Letter Tokens floating out -->
        <g transform="translate(-50, -75)">
          <circle cx="0" cy="0" r="18" fill="#FDE047" stroke="#B45309" stroke-width="2"/>
          <text x="0" y="7" fill="#78350F" font-family="system-ui" font-size="18" font-weight="bold" text-anchor="middle">K</text>
        </g>
        <g transform="translate(0, -90)">
          <circle cx="0" cy="0" r="18" fill="#FDE047" stroke="#B45309" stroke-width="2"/>
          <text x="0" y="7" fill="#78350F" font-family="system-ui" font-size="18" font-weight="bold" text-anchor="middle">E</text>
        </g>
        <g transform="translate(50, -75)">
          <circle cx="0" cy="0" r="18" fill="#FDE047" stroke="#B45309" stroke-width="2"/>
          <text x="0" y="7" fill="#78350F" font-family="system-ui" font-size="18" font-weight="bold" text-anchor="middle">Y</text>
        </g>
      </g>`
  },
  {
    id: "mystic-maze",
    title: "Mystic Maze",
    category: "Giải đố",
    color: "#10B981",
    bg: `<linearGradient id="bg-mystic-maze" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041F17"/><stop offset="0.6" stop-color="#093B2C"/><stop offset="1" stop-color="#02120E"/></linearGradient>`,
    graphic: `
      <!-- Isometric Glowing Labyrinth Pathway -->
      <g transform="translate(400, 230)">
        <!-- Maze Walls -->
        <rect x="-90" y="-90" width="180" height="180" rx="14" fill="#064E3B" stroke="#10B981" stroke-width="3" filter="url(#glow-mystic-maze)"/>
        <!-- Internal Maze Walls -->
        <path d="M-60 -90 V-30 H-10 V30 H-60 V90" stroke="#34D399" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-10 -90 V-60 H60 V0 H20 V60 H60" stroke="#34D399" stroke-width="4" fill="none" stroke-linecap="round"/>
        <!-- Golden Exit Orb -->
        <circle cx="60" cy="60" r="12" fill="#FDE047" filter="url(#glow-mystic-maze)"/>
      </g>`
  },
  {
    id: "circuit-connect",
    title: "Circuit Connect",
    category: "Giải đố",
    color: "#06B6D4",
    bg: `<linearGradient id="bg-circuit-connect" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041B24"/><stop offset="0.6" stop-color="#093547"/><stop offset="1" stop-color="#020E13"/></linearGradient>`,
    graphic: `
      <!-- Glowing Motherboard PCB Node Network -->
      <g transform="translate(400, 230)">
        <!-- Central Chip -->
        <rect x="-40" y="-40" width="80" height="80" rx="10" fill="#083344" stroke="#06B6D4" stroke-width="3" filter="url(#glow-circuit-connect)"/>
        <circle cx="0" cy="0" r="16" fill="#22D3EE"/>
        <!-- Circuit Traces & Connecting Nodes -->
        <path d="M-40 -20 H-90 L-120 -50" stroke="#22D3EE" stroke-width="3" fill="none"/>
        <circle cx="-120" cy="-50" r="8" fill="#67E8F9"/>
        <path d="M40 -20 H90 L120 -50" stroke="#22D3EE" stroke-width="3" fill="none"/>
        <circle cx="120" cy="-50" r="8" fill="#67E8F9"/>
        <path d="M-40 20 H-90 L-120 50" stroke="#22D3EE" stroke-width="3" fill="none"/>
        <circle cx="-120" cy="50" r="8" fill="#67E8F9"/>
        <path d="M40 20 H90 L120 50" stroke="#22D3EE" stroke-width="3" fill="none"/>
        <circle cx="120" cy="50" r="8" fill="#67E8F9"/>
      </g>`
  },
  {
    id: "rope-rescue",
    title: "Rope Rescue",
    category: "Giải đố",
    color: "#F97316",
    bg: `<linearGradient id="bg-rope-rescue" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#241005"/><stop offset="0.6" stop-color="#451F0A"/><stop offset="1" stop-color="#120702"/></linearGradient>`,
    graphic: `
      <!-- Intertwined Climbing Ropes & Carabiner Clip -->
      <g transform="translate(400, 230)">
        <!-- Carabiner Hook -->
        <path d="M-30 -60 C-60 -60 -70 -20 -70 20 C-70 60 -40 70 0 70 C40 70 70 60 70 20 C70 -20 60 -60 30 -60" stroke="#FB923C" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#glow-rope-rescue)"/>
        <!-- Locking Gate -->
        <rect x="20" y="-30" width="16" height="40" rx="4" fill="#FED7AA" stroke="#EA580C" stroke-width="2"/>
        <!-- Braided Rope Loops -->
        <path d="M-120 -80 Q-40 0 0 10 Q40 0 120 -80" stroke="#FDE047" stroke-width="5" stroke-dasharray="10 5" fill="none"/>
        <path d="M-120 80 Q-40 0 0 -10 Q40 0 120 80" stroke="#FDE047" stroke-width="5" stroke-dasharray="10 5" fill="none"/>
      </g>`
  },
  {
    id: "riddle-realm",
    title: "Riddle Realm",
    category: "Giải đố",
    color: "#C084FC",
    bg: `<linearGradient id="bg-riddle-realm" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#190A2E"/><stop offset="0.6" stop-color="#311259"/><stop offset="1" stop-color="#0D0417"/></linearGradient>`,
    graphic: `
      <!-- Mystic Portal & Giant Radiant Question Mark -->
      <g transform="translate(400, 230)">
        <!-- Arch Portal -->
        <path d="M-80 90 V-10 C-80 -70 80 -70 80 -10 V90" stroke="#A855F7" stroke-width="6" fill="#3B0764" fill-opacity="0.4" filter="url(#glow-riddle-realm)"/>
        <!-- Glowing Question Mark -->
        <path d="M-25 -35 C-25 -65 25 -65 25 -35 C25 -15 0 -10 0 15" stroke="#F472B6" stroke-width="12" stroke-linecap="round" fill="none" filter="url(#glow-riddle-realm)"/>
        <circle cx="0" cy="45" r="7" fill="#F472B6" filter="url(#glow-riddle-realm)"/>
      </g>`
  },

  // ==================== ĐUA XE (7) ====================
  {
    id: "turbo-highway",
    title: "Turbo Highway",
    category: "Đua xe",
    color: "#00F0FF",
    bg: `<linearGradient id="bg-turbo-highway" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#140826"/><stop offset="0.6" stop-color="#2D114D"/><stop offset="1" stop-color="#0A0414"/></linearGradient>`,
    graphic: `
      <!-- Perspective Speed Highway & Nitro Flame Supercar -->
      <g transform="translate(400, 260)">
        <!-- Highway lines -->
        <path d="M-300 150 L-60 -80 M300 150 L60 -80 M0 150 L0 -80" stroke="#FF2E93" stroke-width="3" stroke-opacity="0.6"/>
        <!-- Supercar Tail -->
        <g transform="translate(0, 40)">
          <path d="M-60 10 L-45 -15 Q0 -25 45 -15 L60 10 L50 25 Q0 30 -50 25 Z" fill="#18181B" stroke="#00F0FF" stroke-width="3"/>
          <path d="M-50 15 Q0 10 50 15" stroke="#FF0055" stroke-width="6" stroke-linecap="round"/>
          <!-- Dual Nitro Exhaust Flames -->
          <ellipse cx="-35" cy="28" rx="8" ry="18" fill="#00F0FF" filter="url(#glow-turbo-highway)"/>
          <ellipse cx="35" cy="28" rx="8" ry="18" fill="#00F0FF" filter="url(#glow-turbo-highway)"/>
        </g>
      </g>`
  },
  {
    id: "neon-drift",
    title: "Neon Drift",
    category: "Đua xe",
    color: "#EC4899",
    bg: `<linearGradient id="bg-neon-drift" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240718"/><stop offset="0.6" stop-color="#470C30"/><stop offset="1" stop-color="#12030C"/></linearGradient>`,
    graphic: `
      <!-- Sideways Drifting Sports Car & Tire Smoke -->
      <g transform="translate(400, 240)">
        <!-- Curved Skid Marks -->
        <path d="M-150 70 Q -30 20 60 70" stroke="#F43F5E" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6"/>
        <path d="M-130 90 Q -10 40 80 90" stroke="#F43F5E" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6"/>
        <!-- Angled Drift Car Body -->
        <g transform="rotate(-18)">
          <rect x="-65" y="-20" width="130" height="45" rx="10" fill="#1F2937" stroke="#EC4899" stroke-width="3" filter="url(#glow-neon-drift)"/>
          <polygon points="-30,-20 -15,-40 25,-40 40,-20" fill="#111827" stroke="#F472B6" stroke-width="2"/>
          <!-- Neon Underglow -->
          <ellipse cx="0" cy="25" rx="65" ry="8" fill="#F43F5E" filter="url(#glow-neon-drift)"/>
        </g>
      </g>`
  },
  {
    id: "grand-prix-apex",
    title: "Grand Prix Apex",
    category: "Đua xe",
    color: "#EAB308",
    bg: `<linearGradient id="bg-grand-prix-apex" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#1F1704"/><stop offset="0.6" stop-color="#3B2C08"/><stop offset="1" stop-color="#100C02"/></linearGradient>`,
    graphic: `
      <!-- Formula 1 Aerodynamic Single-Seater Nose & Checkered Flag -->
      <g transform="translate(400, 230)">
        <!-- Apex Curbs -->
        <path d="M-180 80 Q 0 20 180 80" stroke="#EF4444" stroke-width="12" stroke-dasharray="24 24" fill="none"/>
        <!-- F1 Car Top View Silhouette -->
        <path d="M0 -90 L12 -20 L35 0 L25 70 L-25 70 L-35 0 L-12 -20 Z" fill="#EAB308" stroke="#CA8A04" stroke-width="3" filter="url(#glow-grand-prix-apex)"/>
        <!-- Front Wing -->
        <rect x="-60" y="-85" width="120" height="12" rx="3" fill="#18181B" stroke="#FDE047" stroke-width="2"/>
        <!-- Rear Wing -->
        <rect x="-50" y="60" width="100" height="14" rx="3" fill="#18181B" stroke="#FDE047" stroke-width="2"/>
        <!-- Helmet -->
        <circle cx="0" cy="15" r="9" fill="#EF4444"/>
      </g>`
  },
  {
    id: "monster-offroad",
    title: "Monster Offroad",
    category: "Đua xe",
    color: "#F97316",
    bg: `<linearGradient id="bg-monster-offroad" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#241005"/><stop offset="0.6" stop-color="#451E09"/><stop offset="1" stop-color="#120702"/></linearGradient>`,
    graphic: `
      <!-- Monster Truck Giant Knobby Tires & Chassis -->
      <g transform="translate(400, 230)">
        <!-- Giant Left Wheel -->
        <rect x="-95" y="10" width="40" height="70" rx="10" fill="#0F172A" stroke="#F97316" stroke-width="3"/>
        <line x1="-95" y1="30" x2="-55" y2="30" stroke="#475569" stroke-width="3"/>
        <line x1="-95" y1="50" x2="-55" y2="50" stroke="#475569" stroke-width="3"/>
        <!-- Giant Right Wheel -->
        <rect x="55" y="10" width="40" height="70" rx="10" fill="#0F172A" stroke="#F97316" stroke-width="3"/>
        <line x1="55" y1="30" x2="95" y2="30" stroke="#475569" stroke-width="3"/>
        <line x1="55" y1="50" x2="95" y2="50" stroke="#475569" stroke-width="3"/>
        <!-- Elevated Body & Roll Cage -->
        <polygon points="-60,10 -50,-35 50,-35 60,10" fill="#EA580C" stroke="#FED7AA" stroke-width="3" filter="url(#glow-monster-offroad)"/>
        <!-- Heavy Shock Absorber Springs -->
        <line x1="-40" y1="10" x2="-40" y2="40" stroke="#FBBF24" stroke-width="5"/>
        <line x1="40" y1="10" x2="40" y2="40" stroke="#FBBF24" stroke-width="5"/>
      </g>`
  },
  {
    id: "cosmic-racer",
    title: "Cosmic Racer",
    category: "Đua xe",
    color: "#8B5CF6",
    bg: `<linearGradient id="bg-cosmic-racer" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#140826"/><stop offset="0.6" stop-color="#28114C"/><stop offset="1" stop-color="#0A0414"/></linearGradient>`,
    graphic: `
      <!-- Anti-gravity Hover Speeder & Space Raceway -->
      <g transform="translate(400, 230)">
        <!-- Hover Pod Body -->
        <polygon points="0,-90 40,-20 60,40 -60,40 -40,-20" fill="#6D28D9" stroke="#C4B5FD" stroke-width="3" filter="url(#glow-cosmic-racer)"/>
        <!-- Cockpit Glass -->
        <ellipse cx="0" cy="-15" rx="16" ry="30" fill="#00F0FF" opacity="0.8"/>
        <!-- Antigravity Rings -->
        <ellipse cx="-45" cy="45" rx="18" ry="6" fill="#A855F7" filter="url(#glow-cosmic-racer)"/>
        <ellipse cx="45" cy="45" rx="18" ry="6" fill="#A855F7" filter="url(#glow-cosmic-racer)"/>
        <!-- Plasma Trail -->
        <polygon points="-20,40 0,90 20,40" fill="#38BDF8" opacity="0.8"/>
      </g>`
  },
  {
    id: "highway-pursuit",
    title: "Highway Pursuit",
    category: "Đua xe",
    color: "#3B82F6",
    bg: `<linearGradient id="bg-highway-pursuit" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#081426"/><stop offset="0.6" stop-color="#0F284C"/><stop offset="1" stop-color="#040A14"/></linearGradient>`,
    graphic: `
      <!-- Police Interceptor & Strobe Flashers -->
      <g transform="translate(400, 230)">
        <!-- Pursuit Car Body -->
        <rect x="-65" y="-15" width="130" height="60" rx="10" fill="#0F172A" stroke="#94A3B8" stroke-width="3"/>
        <polygon points="-40,-15 -25,-45 25,-45 40,-15" fill="#1E293B" stroke="#CBD5E1" stroke-width="2"/>
        <!-- Police Lightbar on Roof: Blue and Red Flash -->
        <g transform="translate(0, -50)">
          <rect x="-35" y="-8" width="30" height="12" rx="3" fill="#3B82F6" filter="url(#glow-highway-pursuit)"/>
          <rect x="5" y="-8" width="30" height="12" rx="3" fill="#EF4444" filter="url(#glow-highway-pursuit)"/>
        </g>
        <!-- Headlights Beam -->
        <polygon points="-50,45 -120,120 120,120 50,45" fill="#FEF08A" opacity="0.2"/>
      </g>`
  },
  {
    id: "cyber-bus-2099",
    title: "Cyber Bus 2099",
    category: "Đua xe",
    color: "#10B981",
    bg: `<linearGradient id="bg-cyber-bus-2099" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041F16"/><stop offset="0.6" stop-color="#093A2A"/><stop offset="1" stop-color="#02120D"/></linearGradient>`,
    graphic: `
      <!-- Flying Double-Decker Aerobus -->
      <g transform="translate(400, 230)">
        <!-- Bus Body -->
        <rect x="-85" y="-60" width="170" height="95" rx="16" fill="#064E3B" stroke="#10B981" stroke-width="3" filter="url(#glow-cyber-bus-2099)"/>
        <!-- Window strips -->
        <rect x="-70" y="-45" width="140" height="20" rx="4" fill="#6EE7B7" opacity="0.8"/>
        <rect x="-70" y="-15" width="140" height="20" rx="4" fill="#6EE7B7" opacity="0.8"/>
        <!-- Hover Thruster Jets -->
        <rect x="-75" y="35" width="35" height="12" rx="3" fill="#047857"/>
        <rect x="40" y="35" width="35" height="12" rx="3" fill="#047857"/>
        <ellipse cx="-57" cy="48" rx="14" ry="6" fill="#00F0FF" filter="url(#glow-cyber-bus-2099)"/>
        <ellipse cx="57" cy="48" rx="14" ry="6" fill="#00F0FF" filter="url(#glow-cyber-bus-2099)"/>
      </g>`
  },

  // ==================== KHÔNG GIAN (7) ====================
  {
    id: "orbit",
    title: "Orbit Runner",
    category: "Không gian",
    color: "#6366F1",
    bg: `<linearGradient id="bg-orbit" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#0E0F2E"/><stop offset="0.6" stop-color="#1B1D59"/><stop offset="1" stop-color="#070817"/></linearGradient>`,
    graphic: `
      <!-- Ringed Planet & Orbiting Space Shuttle -->
      <g transform="translate(400, 230)">
        <!-- Planet -->
        <circle cx="0" cy="0" r="65" fill="#4338CA" stroke="#818CF8" stroke-width="3" filter="url(#glow-orbit)"/>
        <!-- Orbit Rings -->
        <ellipse cx="0" cy="0" rx="140" ry="40" stroke="#A5B4FC" stroke-width="3" fill="none" transform="rotate(-15)"/>
        <!-- Shuttle on Orbit -->
        <g transform="translate(110, -25) rotate(45)">
          <polygon points="0,-18 10,12 -10,12" fill="#FFFFFF"/>
          <polygon points="0,12 5,20 -5,20" fill="#F43F5E"/>
        </g>
      </g>`
  },
  {
    id: "galaxy-fire",
    title: "Galaxy Fire",
    category: "Không gian",
    color: "#EF4444",
    bg: `<linearGradient id="bg-galaxy-fire" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240707"/><stop offset="0.6" stop-color="#450E0E"/><stop offset="1" stop-color="#120303"/></linearGradient>`,
    graphic: `
      <!-- Star Destroyer Battleship & Dual Plasma Blasts -->
      <g transform="translate(400, 230)">
        <!-- Wedge Battleship -->
        <polygon points="0,-90 65,50 0,35 -65,50" fill="#1F2937" stroke="#EF4444" stroke-width="3" filter="url(#glow-galaxy-fire)"/>
        <!-- Command Bridge -->
        <rect x="-15" y="10" width="30" height="15" rx="3" fill="#DC2626"/>
        <!-- Dual Plasma Beams -->
        <line x1="-35" y1="-20" x2="-35" y2="-120" stroke="#F87171" stroke-width="6" stroke-linecap="round" filter="url(#glow-galaxy-fire)"/>
        <line x1="35" y1="-20" x2="35" y2="-120" stroke="#F87171" stroke-width="6" stroke-linecap="round" filter="url(#glow-galaxy-fire)"/>
        <line x1="-35" y1="-20" x2="-35" y2="-120" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        <line x1="35" y1="-20" x2="35" y2="-120" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      </g>`
  },
  {
    id: "mars-lander",
    title: "Mars Lander",
    category: "Không gian",
    color: "#EA580C",
    bg: `<linearGradient id="bg-mars-lander" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#260F04"/><stop offset="0.6" stop-color="#4A1D09"/><stop offset="1" stop-color="#140702"/></linearGradient>`,
    graphic: `
      <!-- Mars Exploration Capsule & Lunar Landing Legs -->
      <g transform="translate(400, 230)">
        <!-- Mars Surface Dune -->
        <path d="M-180 80 Q 0 40 180 80" stroke="#EA580C" stroke-width="4" fill="#7C2D12"/>
        <!-- Lander Capsule -->
        <polygon points="-35,20 -25,-40 25,-40 35,20" fill="#D97706" stroke="#FDE68A" stroke-width="2.5" filter="url(#glow-mars-lander)"/>
        <circle cx="0" cy="-15" r="12" fill="#0284C7"/>
        <!-- Landing Strut Legs -->
        <line x1="-30" y1="20" x2="-65" y2="65" stroke="#E2E8F0" stroke-width="4"/>
        <circle cx="-65" cy="65" r="8" fill="#94A3B8"/>
        <line x1="30" y1="20" x2="65" y2="65" stroke="#E2E8F0" stroke-width="4"/>
        <circle cx="65" cy="65" r="8" fill="#94A3B8"/>
      </g>`
  },
  {
    id: "black-hole-escape",
    title: "Black Hole Escape",
    category: "Không gian",
    color: "#EC4899",
    bg: `<linearGradient id="bg-black-hole-escape" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#140414"/><stop offset="0.6" stop-color="#2D0B2D"/><stop offset="1" stop-color="#0A020A"/></linearGradient>`,
    graphic: `
      <!-- Swirling Black Hole Event Horizon Vortex -->
      <g transform="translate(400, 230)">
        <!-- Accretion Disk Glow -->
        <ellipse cx="0" cy="0" rx="140" ry="45" fill="none" stroke="#EC4899" stroke-width="12" filter="url(#glow-black-hole-escape)" transform="rotate(-20)"/>
        <ellipse cx="0" cy="0" rx="140" ry="45" fill="none" stroke="#FDE047" stroke-width="3" transform="rotate(-20)"/>
        <!-- The Black Hole Center -->
        <circle cx="0" cy="0" r="50" fill="#000000" stroke="#F472B6" stroke-width="3"/>
        <!-- Escape Ship -->
        <g transform="translate(80, -70) rotate(-45)">
          <polygon points="0,-15 10,10 -10,10" fill="#38BDF8"/>
          <!-- Rocket Thrust -->
          <polygon points="-5,10 0,25 5,10" fill="#F97316"/>
        </g>
      </g>`
  },
  {
    id: "satellite-gatherer",
    title: "Satellite Gatherer",
    category: "Không gian",
    color: "#06B6D4",
    bg: `<linearGradient id="bg-satellite-gatherer" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041A24"/><stop offset="0.6" stop-color="#083447"/><stop offset="1" stop-color="#020E13"/></linearGradient>`,
    graphic: `
      <!-- Orbital Satellite with Blue Solar Wings -->
      <g transform="translate(400, 230)">
        <!-- Satellite Main Chassis -->
        <rect x="-25" y="-30" width="50" height="60" rx="6" fill="#E2E8F0" stroke="#06B6D4" stroke-width="2.5" filter="url(#glow-satellite-gatherer)"/>
        <circle cx="0" cy="0" r="10" fill="#0284C7"/>
        <!-- Left Solar Wing -->
        <rect x="-115" y="-20" width="80" height="40" rx="4" fill="#0369A1" stroke="#38BDF8" stroke-width="2"/>
        <line x1="-75" y1="-20" x2="-75" y2="20" stroke="#67E8F9" stroke-width="1.5"/>
        <line x1="-115" y1="0" x2="-35" y2="0" stroke="#67E8F9" stroke-width="1.5"/>
        <!-- Right Solar Wing -->
        <rect x="35" y="-20" width="80" height="40" rx="4" fill="#0369A1" stroke="#38BDF8" stroke-width="2"/>
        <line x1="75" y1="-20" x2="75" y2="20" stroke="#67E8F9" stroke-width="1.5"/>
        <line x1="35" y1="0" x2="115" y2="0" stroke="#67E8F9" stroke-width="1.5"/>
        <!-- Dish Antenna -->
        <path d="M-15 -30 Q0 -55 15 -30" stroke="#FACC15" stroke-width="3" fill="none"/>
      </g>`
  },
  {
    id: "station-defense",
    title: "Station Defense",
    category: "Không gian",
    color: "#3B82F6",
    bg: `<linearGradient id="bg-station-defense" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#081426"/><stop offset="0.6" stop-color="#0F294D"/><stop offset="1" stop-color="#040A14"/></linearGradient>`,
    graphic: `
      <!-- Torus Space Station & Forcefield Barrier -->
      <g transform="translate(400, 230)">
        <!-- Protective Hex Forcefield Dome -->
        <circle cx="0" cy="0" r="120" stroke="#60A5FA" stroke-width="2" stroke-dasharray="10 8" fill="#1D4ED8" fill-opacity="0.1" filter="url(#glow-station-defense)"/>
        <!-- Torus Ring Station -->
        <circle cx="0" cy="0" r="60" stroke="#94A3B8" stroke-width="16" fill="none"/>
        <circle cx="0" cy="0" r="60" stroke="#3B82F6" stroke-width="4" fill="none"/>
        <!-- Central Hub -->
        <circle cx="0" cy="0" r="22" fill="#E2E8F0" stroke="#1D4ED8" stroke-width="3"/>
        <!-- 4 Station Spokes -->
        <line x1="-60" y1="0" x2="60" y2="0" stroke="#64748B" stroke-width="6"/>
        <line x1="0" y1="-60" x2="0" y2="60" stroke="#64748B" stroke-width="6"/>
      </g>`
  },
  {
    id: "wormhole-warp",
    title: "Wormhole Warp",
    category: "Không gian",
    color: "#A855F7",
    bg: `<linearGradient id="bg-wormhole-warp" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#140826"/><stop offset="0.6" stop-color="#2A104F"/><stop offset="1" stop-color="#0A0414"/></linearGradient>`,
    graphic: `
      <!-- Hyperspace Warp Speed Tunnel Rings -->
      <g transform="translate(400, 230)">
        <ellipse cx="0" cy="0" rx="130" ry="90" stroke="#A855F7" stroke-width="4" fill="none" opacity="0.3"/>
        <ellipse cx="0" cy="0" rx="95" ry="65" stroke="#C084FC" stroke-width="3.5" fill="none" opacity="0.5"/>
        <ellipse cx="0" cy="0" rx="60" ry="40" stroke="#E879F9" stroke-width="3" fill="none" opacity="0.7"/>
        <ellipse cx="0" cy="0" rx="30" ry="20" stroke="#FFFFFF" stroke-width="2" fill="#F472B6" filter="url(#glow-wormhole-warp)"/>
        <!-- Speed Streaks -->
        <line x1="-150" y1="-100" x2="-30" y2="-20" stroke="#38BDF8" stroke-width="2"/>
        <line x1="150" y1="-100" x2="30" y2="-20" stroke="#38BDF8" stroke-width="2"/>
        <line x1="-150" y1="100" x2="-30" y2="20" stroke="#38BDF8" stroke-width="2"/>
        <line x1="150" y1="100" x2="30" y2="20" stroke="#38BDF8" stroke-width="2"/>
      </g>`
  },

  // ==================== XẾP HÌNH (8) ====================
  {
    id: "blocks",
    title: "Block District",
    category: "Xếp hình",
    color: "#3B82F6",
    bg: `<linearGradient id="bg-blocks" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#081426"/><stop offset="0.6" stop-color="#0E284C"/><stop offset="1" stop-color="#040A14"/></linearGradient>`,
    graphic: `
      <!-- Classic Neon Tetromino Blocks Grid -->
      <g transform="translate(400, 230)">
        <!-- T-Shape Cyan -->
        <rect x="-60" y="-60" width="36" height="36" rx="6" fill="#00F0FF" stroke="#A5F3FC" stroke-width="2" filter="url(#glow-blocks)"/>
        <rect x="-20" y="-60" width="36" height="36" rx="6" fill="#00F0FF" stroke="#A5F3FC" stroke-width="2" filter="url(#glow-blocks)"/>
        <rect x="20" y="-60" width="36" height="36" rx="6" fill="#00F0FF" stroke="#A5F3FC" stroke-width="2" filter="url(#glow-blocks)"/>
        <rect x="-20" y="-20" width="36" height="36" rx="6" fill="#00F0FF" stroke="#A5F3FC" stroke-width="2" filter="url(#glow-blocks)"/>
        <!-- L-Shape Orange -->
        <rect x="-60" y="20" width="36" height="36" rx="6" fill="#F97316" stroke="#FED7AA" stroke-width="2"/>
        <rect x="-20" y="20" width="36" height="36" rx="6" fill="#F97316" stroke="#FED7AA" stroke-width="2"/>
        <rect x="20" y="20" width="36" height="36" rx="6" fill="#F97316" stroke="#FED7AA" stroke-width="2"/>
        <rect x="20" y="-20" width="36" height="36" rx="6" fill="#F97316" stroke="#FED7AA" stroke-width="2"/>
      </g>`
  },
  {
    id: "wood-block-puzzle",
    title: "Wood Block Puzzle",
    category: "Xếp hình",
    color: "#D97706",
    bg: `<linearGradient id="bg-wood-block-puzzle" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#211504"/><stop offset="0.6" stop-color="#3D2708"/><stop offset="1" stop-color="#120B02"/></linearGradient>`,
    graphic: `
      <!-- Natural Oak Wood Blocks & Grain Texture -->
      <g transform="translate(400, 230)">
        <!-- 3x3 Wood Blocks Set -->
        <rect x="-65" y="-65" width="40" height="40" rx="5" fill="#B45309" stroke="#FDE68A" stroke-width="2"/>
        <rect x="-20" y="-65" width="40" height="40" rx="5" fill="#92400E" stroke="#FDE68A" stroke-width="2"/>
        <rect x="25" y="-65" width="40" height="40" rx="5" fill="#B45309" stroke="#FDE68A" stroke-width="2"/>
        <rect x="-65" y="-20" width="40" height="40" rx="5" fill="#92400E" stroke="#FDE68A" stroke-width="2"/>
        <rect x="-20" y="-20" width="40" height="40" rx="5" fill="#78350F" stroke="#FDE68A" stroke-width="2"/>
        <rect x="25" y="-20" width="40" height="40" rx="5" fill="#92400E" stroke="#FDE68A" stroke-width="2"/>
        <rect x="-65" y="25" width="40" height="40" rx="5" fill="#B45309" stroke="#FDE68A" stroke-width="2"/>
        <rect x="-20" y="25" width="40" height="40" rx="5" fill="#92400E" stroke="#FDE68A" stroke-width="2"/>
        <rect x="25" y="25" width="40" height="40" rx="5" fill="#B45309" stroke="#FDE68A" stroke-width="2"/>
      </g>`
  },
  {
    id: "crystal-match",
    title: "Crystal Match",
    category: "Xếp hình",
    color: "#EC4899",
    bg: `<linearGradient id="bg-crystal-match" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240718"/><stop offset="0.6" stop-color="#450C2E"/><stop offset="1" stop-color="#12030C"/></linearGradient>`,
    graphic: `
      <!-- Trio of Sparkling Jewels (Ruby, Sapphire, Emerald) -->
      <g transform="translate(400, 230)">
        <!-- Left Jewel: Emerald Hexagon -->
        <polygon points="-70,-45 -45,-60 -45,-15 -70,0 -95,-15 -95,-60" fill="#10B981" stroke="#A7F3D0" stroke-width="2.5" filter="url(#glow-crystal-match)"/>
        <!-- Right Jewel: Sapphire Diamond -->
        <polygon points="70,-70 95,-35 70,0 45,-35" fill="#3B82F6" stroke="#BFDBFE" stroke-width="2.5" filter="url(#glow-crystal-match)"/>
        <!-- Center Giant Jewel: Ruby Heart/Octagon -->
        <polygon points="-25,0 0,-30 25,0 40,40 -40,40" fill="#EF4444" stroke="#FECACA" stroke-width="3" filter="url(#glow-crystal-match)"/>
        <!-- Sparkle Points -->
        <path d="M0 -50 Q0 -40 10 -40 Q0 -40 0 -30 Q0 -40 -10 -40 Q0 -40 0 -50" fill="#FFFFFF"/>
      </g>`
  },
  {
    id: "merge-2048",
    title: "Merge 2048",
    category: "Xếp hình",
    color: "#EAB308",
    bg: `<linearGradient id="bg-merge-2048" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#211704"/><stop offset="0.6" stop-color="#3D2B08"/><stop offset="1" stop-color="#120D02"/></linearGradient>`,
    graphic: `
      <!-- Golden 2048 Number Tile Fusing -->
      <g transform="translate(400, 230)">
        <rect x="-70" y="-70" width="140" height="140" rx="18" fill="#EAB308" stroke="#FEF08A" stroke-width="4" filter="url(#glow-merge-2048)"/>
        <text x="0" y="16" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="44" font-weight="900" text-anchor="middle" letter-spacing="-1">2048</text>
        <!-- Orbiting Merge Mini Tiles -->
        <g transform="translate(-105, -50)">
          <rect width="45" height="45" rx="8" fill="#F97316"/>
          <text x="22" y="30" fill="#FFF" font-family="system-ui" font-size="16" font-weight="bold" text-anchor="middle">512</text>
        </g>
        <g transform="translate(60, -50)">
          <rect width="45" height="45" rx="8" fill="#F59E0B"/>
          <text x="22" y="30" fill="#FFF" font-family="system-ui" font-size="16" font-weight="bold" text-anchor="middle">1024</text>
        </g>
      </g>`
  },
  {
    id: "ice-tetris",
    title: "Ice Tetris",
    category: "Xếp hình",
    color: "#38BDF8",
    bg: `<linearGradient id="bg-ice-tetris" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#06182B"/><stop offset="0.6" stop-color="#0C3157"/><stop offset="1" stop-color="#030C17"/></linearGradient>`,
    graphic: `
      <!-- Crystalline Frozen Ice Bricks & Icicles -->
      <g transform="translate(400, 230)">
        <g filter="url(#glow-ice-tetris)">
          <!-- Ice Block 1 -->
          <rect x="-60" y="-40" width="45" height="45" rx="4" fill="#0284C7" stroke="#BAE6FD" stroke-width="2.5"/>
          <path d="M-60 -40 L-15 5" stroke="#E0F2FE" stroke-width="1.5"/>
          <!-- Ice Block 2 -->
          <rect x="-15" y="-40" width="45" height="45" rx="4" fill="#0369A1" stroke="#BAE6FD" stroke-width="2.5"/>
          <!-- Ice Block 3 -->
          <rect x="30" y="-40" width="45" height="45" rx="4" fill="#0284C7" stroke="#BAE6FD" stroke-width="2.5"/>
          <!-- Ice Block 4 on top -->
          <rect x="-15" y="-85" width="45" height="45" rx="4" fill="#38BDF8" stroke="#BAE6FD" stroke-width="2.5"/>
        </g>
        <!-- Icicles -->
        <polygon points="-50,5 -45,30 -40,5" fill="#E0F2FE"/>
        <polygon points="-5,5 0,40 5,5" fill="#E0F2FE"/>
        <polygon points="40,5 45,30 50,5" fill="#E0F2FE"/>
      </g>`
  },
  {
    id: "classic-brick",
    title: "Classic Brick",
    category: "Xếp hình",
    color: "#84CC16",
    bg: `<linearGradient id="bg-classic-brick" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#141E04"/><stop offset="0.6" stop-color="#283D08"/><stop offset="1" stop-color="#0A0F02"/></linearGradient>`,
    graphic: `
      <!-- Retro Monochrome 8-bit Pixel Brick Game -->
      <g transform="translate(400, 230)">
        <!-- LCD Screen Frame -->
        <rect x="-70" y="-90" width="140" height="180" rx="10" fill="#84CC16" opacity="0.9" stroke="#365314" stroke-width="5"/>
        <!-- Pixel Bricks (Dark Green) -->
        <g fill="#14532D">
          <!-- Falling Piece -->
          <rect x="-20" y="-70" width="18" height="18" rx="2"/>
          <rect x="0" y="-70" width="18" height="18" rx="2"/>
          <rect x="-20" y="-50" width="18" height="18" rx="2"/>
          <rect x="0" y="-50" width="18" height="18" rx="2"/>
          <!-- Bottom Stack -->
          <rect x="-55" y="45" width="18" height="18" rx="2"/>
          <rect x="-35" y="45" width="18" height="18" rx="2"/>
          <rect x="-15" y="45" width="18" height="18" rx="2"/>
          <rect x="5" y="45" width="18" height="18" rx="2"/>
          <rect x="25" y="45" width="18" height="18" rx="2"/>
          <rect x="-55" y="65" width="18" height="18" rx="2"/>
          <rect x="-35" y="65" width="18" height="18" rx="2"/>
          <rect x="5" y="65" width="18" height="18" rx="2"/>
          <rect x="25" y="65" width="18" height="18" rx="2"/>
          <rect x="45" y="65" width="18" height="18" rx="2"/>
        </g>
      </g>`
  },
  {
    id: "dice-matcher",
    title: "Dice Matcher",
    category: "Xếp hình",
    color: "#F43F5E",
    bg: `<linearGradient id="bg-dice-matcher" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#240712"/><stop offset="0.6" stop-color="#450C22"/><stop offset="1" stop-color="#120309"/></linearGradient>`,
    graphic: `
      <!-- Glowing 3D Casino Dice Pair -->
      <g transform="translate(400, 230)">
        <!-- Dice 1 (Left Angled) -->
        <g transform="translate(-40, -10) rotate(-15)">
          <rect x="-40" y="-40" width="80" height="80" rx="14" fill="#E11D48" stroke="#FFE4E6" stroke-width="3" filter="url(#glow-dice-matcher)"/>
          <!-- Five Dots -->
          <circle cx="-20" cy="-20" r="6" fill="#FFFFFF"/>
          <circle cx="20" cy="-20" r="6" fill="#FFFFFF"/>
          <circle cx="0" cy="0" r="6" fill="#FFFFFF"/>
          <circle cx="-20" cy="20" r="6" fill="#FFFFFF"/>
          <circle cx="20" cy="20" r="6" fill="#FFFFFF"/>
        </g>
        <!-- Dice 2 (Right Angled) -->
        <g transform="translate(50, 15) rotate(20)">
          <rect x="-35" y="-35" width="70" height="70" rx="12" fill="#BE123C" stroke="#FFE4E6" stroke-width="3"/>
          <!-- Six Dots -->
          <circle cx="-16" cy="-20" r="5" fill="#FFFFFF"/>
          <circle cx="-16" cy="0" r="5" fill="#FFFFFF"/>
          <circle cx="-16" cy="20" r="5" fill="#FFFFFF"/>
          <circle cx="16" cy="-20" r="5" fill="#FFFFFF"/>
          <circle cx="16" cy="0" r="5" fill="#FFFFFF"/>
          <circle cx="16" cy="20" r="5" fill="#FFFFFF"/>
        </g>
      </g>`
  },
  {
    id: "mecha-assembly",
    title: "Mecha Assembly",
    category: "Xếp hình",
    color: "#06B6D4",
    bg: `<linearGradient id="bg-mecha-assembly" x2="800" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#041B26"/><stop offset="0.6" stop-color="#08374D"/><stop offset="1" stop-color="#020E14"/></linearGradient>`,
    graphic: `
      <!-- Blueprint Schematics & Robot Fusion Core -->
      <g transform="translate(400, 230)">
        <!-- Blueprint Grid Square -->
        <rect x="-90" y="-90" width="180" height="180" rx="12" fill="#082F49" stroke="#0284C7" stroke-width="2"/>
        <line x1="-90" y1="0" x2="90" y2="0" stroke="#0284C7" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="0" y1="-90" x2="0" y2="90" stroke="#0284C7" stroke-width="1" stroke-dasharray="4 4"/>
        <!-- Central Fusion Reactor Core -->
        <circle cx="0" cy="0" r="45" fill="#0C4A6E" stroke="#06B6D4" stroke-width="4" filter="url(#glow-mecha-assembly)"/>
        <circle cx="0" cy="0" r="25" fill="#38BDF8"/>
        <!-- Mechanical Assembly Gears -->
        <circle cx="0" cy="0" r="65" stroke="#38BDF8" stroke-width="6" stroke-dasharray="14 12" fill="none"/>
      </g>`
  }
];

console.log(`Generating ${games.length} custom SVG thumbnails...`);

for (const g of games) {
  const svg = makeSvg(g.id, g.title, g.category, g.color, g.bg, g.graphic);
  const playerFile = path.join(playerArtDir, `${g.id}.svg`);
  const adminFile = path.join(adminArtDir, `${g.id}.svg`);
  fs.writeFileSync(playerFile, svg, "utf-8");
  fs.writeFileSync(adminFile, svg, "utf-8");
}

console.log("Successfully generated all 50 unique game SVG files!");
