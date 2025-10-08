export interface AppTheme {
  primary: string;
  background: string;
  accent: string;
  balanceBorder: string;
  buttonPrimary: string;
  buttonIncome: string;
  buttonExpense: string;
  buttonChart: string;
  buttonBudget: string;
  buttonRecords: string;
  buttonCategories: string;
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
      balanceBorder: '#a2d2ff',
      buttonPrimary: '#a2d2ff',
      buttonIncome: '#CFFDDF',
      buttonExpense: '#FFD6D6',
      buttonChart: '#bde0fe',
      buttonBudget: '#e9edc9',
      buttonRecords: '#e9edc9',
      buttonCategories: '#e9edc9',
    },
  },
  {
    name: 'Océano',
    colors: {
      primary: '#0077b6',
      background: '#eaf4f4',
      accent: '#90e0ef',
      balanceBorder: '#0077b6',
      buttonPrimary: '#0077b6',
      buttonIncome: '#48cae4',
      buttonExpense: '#ef476f',
      buttonChart: '#0077b6',
      buttonBudget: '#adb5bd',
      buttonRecords: '#adb5bd',
      buttonCategories: '#adb5bd',
    },
  },
  {
    name: 'Neón',
    colors: {
      primary: '#f72585',
      background: '#1f1f1f',
      accent: '#7209b7',
      balanceBorder: '#f72585',
      buttonPrimary: '#f72585',
      buttonIncome: '#39ff14',
      buttonExpense: '#f72585',
      buttonChart: '#4cc9f0',
      buttonBudget: '#480ca8',
      buttonRecords: '#480ca8',
      buttonCategories: '#480ca8',
    },
  },
  {
    name: 'Bosque',
    colors: {
      primary: '#588157',
      background: '#f0ead2',
      accent: '#a3b18a',
      balanceBorder: '#588157',
      buttonPrimary: '#588157',
      buttonIncome: '#588157',
      buttonExpense: '#c1121f',
      buttonChart: '#3a5a40',
      buttonBudget: '#dad7cd',
      buttonRecords: '#dad7cd',
      buttonCategories: '#dad7cd',
    },
  },
  {
    name: 'Atardecer',
    colors: {
      primary: '#f77f00',
      background: '#fff3e0',
      accent: '#fcbf49',
      balanceBorder: '#f77f00',
      buttonPrimary: '#f77f00',
      buttonIncome: '#fca311',
      buttonExpense: '#e63946',
      buttonChart: '#f77f00',
      buttonBudget: '#ffd6a5',
      buttonRecords: '#ffd6a5',
      buttonCategories: '#ffd6a5',
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
        // Special logic to set foreground color for buttons to ensure readability
        const isDarkBackground = hsl[2] < 50;
        if (varName.startsWith('--button-') || varName === '--primary') {
             const foregroundVarName = `${varName}-foreground`;
             const foregroundValue = isDarkBackground ? '210 40% 98%' : '240 10% 3.9%';
             root.style.setProperty(foregroundVarName, foregroundValue);
        }
    }
};

export function applyTheme(theme: AppTheme) {
  const root = getRootElement();
  if (!root) return;

  setCssVar(root, '--primary', theme.primary);
  setCssVar(root, '--background', theme.background);
  setCssVar(root, '--accent', theme.accent);
  setCssVar(root, '--balance-border', theme.balanceBorder);
  setCssVar(root, '--button-primary', theme.buttonPrimary);
  setCssVar(root, '--button-income', theme.buttonIncome);
  setCssVar(root, '--button-expense', theme.buttonExpense);
  setCssVar(root, '--button-chart', theme.buttonChart);
  setCssVar(root, '--button-budget', theme.buttonBudget);
  setCssVar(root, '--button-records', theme.buttonRecords);
  setCssVar(root, '--button-categories', theme.buttonCategories);

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
    balanceBorder: '#3b82f6',
    buttonPrimary: '#3b82f6',
    buttonIncome: '#22c55e', // Green
    buttonExpense: '#ef4444', // Red
    buttonChart: '#3b82f6', // Blue
    buttonBudget: '#d1d5db', // Gray-300
    buttonRecords: '#d1d5db', // Gray-300
    buttonCategories: '#d1d5db', // Gray-300
  };
}
