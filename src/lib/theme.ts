export interface AppTheme {
  primary: string;
  background: string;
  accent: string;
  buttonPrimary: string;
  chart1: string;
  chart2: string;
  chart3: string;
}

export interface PresetTheme {
  name: string;
  colors: AppTheme;
}

export const presetThemes: PresetTheme[] = [
  {
    name: 'Pastel',
    colors: {
      primary: '#a2d2ff',
      background: '#fefae0',
      accent: '#bde0fe',
      buttonPrimary: '#a2d2ff',
      chart1: '#ffc8dd',
      chart2: '#cdb4db',
      chart3: '#bde0fe',
    },
  },
  {
    name: 'Océano',
    colors: {
      primary: '#0077b6',
      background: '#eaf4f4',
      accent: '#90e0ef',
      buttonPrimary: '#0077b6',
      chart1: '#00b4d8',
      chart2: '#48cae4',
      chart3: '#ade8f4',
    },
  },
  {
    name: 'Neón',
    colors: {
      primary: '#f72585',
      background: '#1f1f1f',
      accent: '#7209b7',
      buttonPrimary: '#f72585',
      chart1: '#3a0ca3',
      chart2: '#4cc9f0',
      chart3: '#f72585',
    },
  },
  {
    name: 'Bosque',
    colors: {
      primary: '#588157',
      background: '#f0ead2',
      accent: '#a3b18a',
      buttonPrimary: '#588157',
      chart1: '#3a5a40',
      chart2: '#344e41',
      chart3: '#a3b18a',
    },
  },
  {
    name: 'Atardecer',
    colors: {
      primary: '#f77f00',
      background: '#fff3e0',
      accent: '#fcbf49',
      buttonPrimary: '#f77f00',
      chart1: '#d62828',
      chart2: '#fcbf49',
      chart3: '#eae2b7',
    },
  },
];


function hexToHsl(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}


function getRootElement(): HTMLElement | null {
  if (typeof window === 'undefined') return null;
  return document.documentElement;
}

const setCssVar = (root: HTMLElement, varName: string, hexColor: string) => {
    const hsl = hexToHsl(hexColor);
    if (hsl) {
        root.style.setProperty(varName, `${hsl[0]} ${hsl[1]}% ${hsl[2]}%`);
        if (varName === '--primary' || varName === '--button-primary') {
            const fg = hsl[2] > 50 ? '240 10% 3.9%' : '210 40% 98%';
            root.style.setProperty(`${varName}-foreground`, fg);
        }
    }
};

export function applyTheme(theme: AppTheme) {
  const root = getRootElement();
  if (!root) return;

  setCssVar(root, '--primary', theme.primary);
  setCssVar(root, '--background', theme.background);
  setCssVar(root, '--accent', theme.accent);
  setCssVar(root, '--button-primary', theme.buttonPrimary);
  setCssVar(root, '--chart-1', theme.chart1);
  setCssVar(root, '--chart-2', theme.chart2);
  setCssVar(root, '--chart-3', theme.chart3);

  const primaryHsl = hexToHsl(theme.primary);
  if (primaryHsl) {
    root.style.setProperty('--ring', `${primaryHsl[0]} ${primaryHsl[1]}% ${primaryHsl[2]}%`);
  }
  
  const backgroundHsl = hexToHsl(theme.background);
  if (backgroundHsl) {
    const bgFg = backgroundHsl[2] > 50 ? '240 10% 3.9%' : '0 0% 98%';
    root.style.setProperty('--foreground', bgFg);
    
    // Set card and popover based on background
    const cardBg = backgroundHsl[2] > 50 ? '0 0% 100%' : '240 10% 3.9%';
    const cardFg = backgroundHsl[2] > 50 ? '240 10% 3.9%' : '0 0% 98%';
    root.style.setProperty('--card', cardBg);
    root.style.setProperty('--card-foreground', cardFg);
    root.style.setProperty('--popover', cardBg);
    root.style.setProperty('--popover-foreground', cardFg);
  }
}

export function getDefaultTheme(): AppTheme {
  // Return hardcoded default values to ensure reset is always correct.
  return {
    primary: '#3b82f6',     // Blue
    background: '#f0f0f0', // Light Gray
    accent: '#bfdbfe',      // Soft Blue
    buttonPrimary: '#3b82f6',
    chart1: '#3b82f6',      // Blue
    chart2: '#ef4444',      // Red
    chart3: '#22c55e',      // Green
  };
}