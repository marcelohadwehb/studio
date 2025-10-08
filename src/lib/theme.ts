export interface AppTheme {
  primary: string;
  background: string;
  accent: string;
}

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

export function applyTheme(theme: AppTheme) {
  const root = getRootElement();
  if (!root) return;

  const primaryHsl = hexToHsl(theme.primary);
  const backgroundHsl = hexToHsl(theme.background);
  const accentHsl = hexToHsl(theme.accent);

  if (primaryHsl) {
    root.style.setProperty('--primary', `${primaryHsl[0]} ${primaryHsl[1]}% ${primaryHsl[2]}%`);
    // A simple foreground logic
    const primaryFg = primaryHsl[2] > 50 ? '0 0% 10%' : '0 0% 98%';
    root.style.setProperty('--primary-foreground', primaryFg);
    root.style.setProperty('--ring', `${primaryHsl[0]} ${primaryHsl[1]}% ${primaryHsl[2]}%`);
  }

  if (backgroundHsl) {
    root.style.setProperty('--background', `${backgroundHsl[0]} ${backgroundHsl[1]}% ${backgroundHsl[2]}%`);
     const backgroundFg = backgroundHsl[2] > 50 ? '0 0% 10%' : '0 0% 98%';
    root.style.setProperty('--foreground', backgroundFg);
  }

  if (accentHsl) {
    root.style.setProperty('--accent', `${accentHsl[0]} ${accentHsl[1]}% ${accentHsl[2]}%`);
     const accentFg = accentHsl[2] > 50 ? '0 0% 10%' : '0 0% 98%';
    root.style.setProperty('--accent-foreground', accentFg);
  }
}

export function getDefaultTheme(): AppTheme {
    const root = getRootElement();
    if (!root) {
        return {
            primary: hslToHex(200, 82, 50),
            background: hslToHex(220, 13, 96),
            accent: hslToHex(240, 67, 94),
        };
    }
    const computedStyle = getComputedStyle(root);
    
    const parseHsl = (hslStr: string): [number, number, number] => {
        const [h, s, l] = hslStr.trim().split(' ').map(parseFloat);
        return [h, s, l];
    };

    const primaryHsl = parseHsl(computedStyle.getPropertyValue('--primary').trim());
    const backgroundHsl = parseHsl(computedStyle.getPropertyValue('--background').trim());
    const accentHsl = parseHsl(computedStyle.getPropertyValue('--accent').trim());

    return {
        primary: hslToHex(primaryHsl[0], primaryHsl[1], primaryHsl[2]),
        background: hslToHex(backgroundHsl[0], backgroundHsl[1], backgroundHsl[2]),
        accent: hslToHex(accentHsl[0], accentHsl[1], accentHsl[2]),
    };
}
