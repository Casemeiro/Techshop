import { useRef, useState } from 'react';
import {
  SoapBubbleButton,
  SoapBubbleIconButton,
  SoapBubbleMaterial,
  SoapBubbleMenu,
  SoapBubbleSearch,
  SoapBubbleSlider,
  SoapBubbleToggle,
  type SoapBubbleSettings,
} from './components/soap-bubble';

type Theme = 'light' | 'dark';

/**
 * Approved catalog defaults. Applied only where the integration config below
 * does not supply a value, so any user-tuned Oil control survives untouched.
 */
const MATERIAL_PRESETS: Record<Theme, Partial<SoapBubbleSettings>> = {
  light: {
    glass: 0.95,
    iridescence: 0.5,
    filmScale: 4.85,
    oilOpacity: 1,
    oilCoverage: 0.73,
    oilEdge: 18,
    oilEdgeFade: 2.33,
    clearCenter: 0.57,
    thickness: 480,
    drainage: 0.35,
    swirl: 0.5,
    reflectivity: 1.3,
    refraction: 0.15,
    dispersion: 1,
    bevel: 14,
  },
  dark: {
    glass: 0.95,
    iridescence: 2,
    filmScale: 4.85,
    oilOpacity: 1,
    oilCoverage: 1,
    oilEdge: 18,
    oilEdgeFade: 1,
    clearCenter: 0.73,
    thickness: 480,
    drainage: 0.35,
    swirl: 0.5,
    reflectivity: 1.3,
    refraction: 0.15,
    dispersion: 1,
    bevel: 14,
  },
};

/** Lighting and reflection settings from the supplied configuration. */
const LIGHTING: Partial<SoapBubbleSettings> = {
  windowLength: 1.3,
  windowMargin: 0.85,
  windowBend: 0.75,
  windowSize: 0.75,
  windowWidth: 0.8,
  windowGradient: 0.96,
  windowHead: 0.7,
  windowTail: 0.6,
  glintSize: 1.65,
  glintIntensity: 0,
  glintDistance: -0.45,
  glintHeight: 0.65,
  windowIntensity: 0.85,
  windowTwin: false,
  bottomShade: true,
  bottomShadeColor: '#ffffff00',
};

const PAGE_STYLE: Record<Theme, { background: string; color: string }> = {
  dark: { background: '#000', color: '#f2f3f7' },
  light: { background: '#f2f3f7', color: '#101114' },
};

export function App() {
  const page = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [wifi, setWifi] = useState(true);
  const [volume, setVolume] = useState(40);

  const material = { ...MATERIAL_PRESETS[theme], ...LIGHTING };

  return (
    <div ref={page} className="page" data-theme={theme} style={PAGE_STYLE[theme]}>
      <div className="demo-bar">
        <span className="demo-name">Bubble UI</span>
        <button
          className="demo-theme"
          type="button"
          onClick={() => setTheme(current => (current === 'dark' ? 'light' : 'dark'))}
          aria-pressed={theme === 'light'}
        >
          {theme === 'dark' ? 'Rainbow glass' : 'Light glass'}
        </button>
      </div>

      <main className="demo-stage">
        <SoapBubbleMaterial backdrop={page} {...material}>
          <div style={{ display: 'grid', gap: '1em', fontSize: 28 }}>
            <header style={{ display: 'flex', gap: '0.55em' }}>
              <SoapBubbleMenu
                round
                label="•••"
                triggerLabel="More"
                items={[{ label: 'Select chats' }, { label: 'Read all' }]}
              />
              <SoapBubbleIconButton aria-label="Camera" style={{ marginLeft: 'auto' }}>
                📷
              </SoapBubbleIconButton>
              <SoapBubbleIconButton aria-label="New" tint="rgb(52 199 89)" opacity={0.92}>
                +
              </SoapBubbleIconButton>
            </header>
            <SoapBubbleSearch placeholder="Search" />
            <SoapBubbleToggle
              checked={wifi}
              onCheckedChange={setWifi}
              aria-label="Wi-Fi"
              scale={2.75}
            />
            <SoapBubbleSlider
              value={volume}
              onValueChange={setVolume}
              label="Volume"
              from="#0a84ff"
              scale={3}
            />
            <SoapBubbleButton>Continue</SoapBubbleButton>
          </div>
        </SoapBubbleMaterial>
      </main>
    </div>
  );
}
