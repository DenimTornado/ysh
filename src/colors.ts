export const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '');
    const int = parseInt(normalized, 16);

    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

export const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

export const rgbToHsv = (r: number, g: number, b: number) => {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === red) {
            h = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            h = 60 * ((blue - red) / delta + 2);
        } else {
            h = 60 * ((red - green) / delta + 4);
        }
    }

    if (h < 0) {
        h += 360;
    }

    return {
        h: Math.round(h) % 360,
        s: Math.round(max === 0 ? 0 : (delta / max) * 100),
        v: Math.round(max * 100),
    };
};

export const hsvToRgb = (h: number, s: number, v: number) => {
    const saturation = s / 100;
    const value = v / 100;
    const c = value * saturation;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = value - c;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
        r = c;
        g = x;
    } else if (h < 120) {
        r = x;
        g = c;
    } else if (h < 180) {
        g = c;
        b = x;
    } else if (h < 240) {
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
};


export const FAVORITE_COLORS = [
    { name: 'iOS 8 Water', hex: '#2D89B8' },
    { name: 'Diablo IV Lilith', hex: '#8A0012' },
    { name: 'Cyberpunk 2077', hex: '#D8C600' },
];

export const rgbIntToHex = (value: number) => {
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return rgbToHex(r, g, b);
};

