import { useState } from 'react';
import { emptyPreferences, parsePreferences } from '../dashboard-model';
import type { Preferences } from '../dashboard-model';

const KEY = 'yandex_smart_home_v3';
function read() {
    try {
        const saved = localStorage.getItem(KEY);
        if (saved) return parsePreferences(JSON.parse(saved));
        const versionTwo = localStorage.getItem('yandex_smart_home_v2');
        if (versionTwo) {
            const previous = parsePreferences(JSON.parse(versionTwo));
            return { ...previous, visibility: {} };
        }
        const legacy: unknown = JSON.parse(localStorage.getItem('yandex_smart_home_layout') || 'null');
        if (Array.isArray(legacy)) return parsePreferences({ order: legacy.map((entry) => entry?.id) });
    } catch { /* Недоступные настройки не блокируют загрузку устройств. */ }
    return emptyPreferences;
}
export function usePreferences() {
    const [preferences, setPreferences] = useState(read);
    const [error, setError] = useState('');
    const save = (next: Preferences) => {
        setPreferences(next);
        try { localStorage.setItem(KEY, JSON.stringify(next)); setError(''); }
        catch { setError('Настройки действуют только до закрытия вкладки: сохранение недоступно.'); }
    };
    return { preferences, save, error };
}
