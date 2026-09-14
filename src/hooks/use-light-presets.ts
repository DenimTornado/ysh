import { useState } from 'react';

export interface LightPreset {
    id: string;
    deviceId: string;
    name: string;
    temperature: number;
    brightness: number;
}

const KEY = 'yandex_smart_home_light_presets_v1';
const COLOR_KEY = 'yandex_smart_home_color_presets_v1';

function read(): LightPreset[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is LightPreset => !!item && typeof item === 'object' &&
            typeof item.id === 'string' && typeof item.deviceId === 'string' && typeof item.name === 'string' &&
            typeof item.temperature === 'number' && Number.isFinite(item.temperature) &&
            typeof item.brightness === 'number' && Number.isFinite(item.brightness));
    } catch {
        return [];
    }
}

export function useLightPresets(deviceId: string) {
    const [all, setAll] = useState(read);
    const [error, setError] = useState('');
    const save = (next: LightPreset[]) => {
        setAll(next);
        try {
            localStorage.setItem(KEY, JSON.stringify(next));
            setError('');
        } catch {
            setError('Пресет действует только до закрытия вкладки: сохранение недоступно.');
        }
    };
    return {
        presets: all.filter((preset) => preset.deviceId === deviceId),
        error,
        add: (preset: Omit<LightPreset, 'id' | 'deviceId'>) => save([...all, { ...preset, id: crypto.randomUUID(), deviceId }]),
        remove: (id: string) => save(all.filter((preset) => preset.id !== id)),
    };
}

interface ColorPreset { id: string; deviceId: string; name: string; color: string }

function readColors(): ColorPreset[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(COLOR_KEY) || '[]');
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is ColorPreset => !!item && typeof item === 'object' &&
            typeof item.id === 'string' && typeof item.deviceId === 'string' && typeof item.name === 'string' &&
            typeof item.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.color));
    } catch {
        return [];
    }
}

export function useColorPresets(deviceId: string) {
    const [all, setAll] = useState(readColors);
    const [error, setError] = useState('');
    const save = (next: ColorPreset[]) => {
        setAll(next);
        try {
            localStorage.setItem(COLOR_KEY, JSON.stringify(next));
            setError('');
        } catch {
            setError('Цвет действует только до закрытия вкладки: сохранение недоступно.');
        }
    };
    return {
        presets: all.filter((preset) => preset.deviceId === deviceId),
        error,
        add: (preset: Omit<ColorPreset, 'id' | 'deviceId'>) => save([...all, { ...preset, id: crypto.randomUUID(), deviceId }]),
        remove: (id: string) => save(all.filter((preset) => preset.id !== id)),
    };
}
