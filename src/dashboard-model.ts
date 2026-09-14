import type { Device, Home, Property } from './model';
import { deviceName, deviceTypeName } from './model.ts';

export interface PowerGroup { id: string; name: string; deviceIds: string[] }
export interface Preferences {
    visibility: Record<string, boolean>;
    readingVisibility: Record<string, boolean>;
    order: string[];
    readingOrder: string[];
    weights: Record<string, number>;
    readingWeights: Record<string, number>;
    groups: PowerGroup[];
    ungrouped: string[];
}
export const emptyPreferences: Preferences = { visibility: {}, readingVisibility: {}, order: [], readingOrder: [],
    weights: {}, readingWeights: {}, groups: [], ungrouped: [] };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function parsePreferences(value: unknown): Preferences {
    if (!record(value)) return emptyPreferences;
    const flags = (input: unknown) => record(input) ? Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean> : {};
    const numbers = (input: unknown) => record(input) ? Object.fromEntries(Object.entries(input)
        .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))) as Record<string, number> : {};
    const strings = (input: unknown) => Array.isArray(input) ? [...new Set(input.filter((item): item is string => typeof item === 'string'))] : [];
    const groups = Array.isArray(value.groups) ? value.groups.flatMap((item) => {
        if (!record(item) || typeof item.id !== 'string' || typeof item.name !== 'string') return [];
        const deviceIds = strings(item.deviceIds);
        return deviceIds.length >= 2 ? [{ id: item.id, name: item.name, deviceIds }] : [];
    }) : [];
    return { visibility: flags(value.visibility), readingVisibility: flags(value.readingVisibility), order: strings(value.order),
        readingOrder: strings(value.readingOrder), weights: numbers(value.weights), readingWeights: numbers(value.readingWeights),
        groups, ungrouped: strings(value.ungrouped) };
}

export const controlTypes = ['on_off', 'range', 'mode', 'toggle', 'color_setting'];
export function capabilityKind(type: string) { return type.replace('devices.capabilities.', ''); }
export function isPublicControl(type: string) { return controlTypes.includes(capabilityKind(type)); }
export function defaultVisible() { return true; }
export function readingId(device: Device, property: Property) {
    return JSON.stringify([device.id, property.type, property.parameters.instance]);
}
export function readings(home: Home, order: string[] = [], weights: Record<string, number> = {}) {
    return home.devices.flatMap((device) => (device.properties ?? []).map((property) => ({
        id: readingId(device, property), device, property,
        room: home.rooms.find((room) => room.id === device.room)?.name || '',
    }))).sort((a, b) => {
        const weightDifference = (weights[a.id] ?? Infinity) - (weights[b.id] ?? Infinity);
        if (weightDifference) return weightDifference;
        const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
        return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
    });
}

export function discoverPowerGroups(home: Home): PowerGroup[] {
    const endpoints = new Map<string, Device[]>();
    for (const device of home.devices) {
        if (device.type !== 'devices.types.light' || !device.external_id?.startsWith('iot_zigbee_') ||
            !device.capabilities?.some((cap) => capabilityKind(cap.type) === 'on_off') ||
            device.capabilities.some((cap) => isPublicControl(cap.type) && capabilityKind(cap.type) !== 'on_off')) continue;
        const key = JSON.stringify([device.household_id, device.room, device.external_id.replace(/_\d+$/, '')]);
        endpoints.set(key, [...(endpoints.get(key) ?? []), device]);
    }
    return [...endpoints.entries()].filter(([, members]) => members.length > 1).map(([key, members]) => ({
        id: `physical:${key}`, name: `Свет · ${home.rooms.find((room) => room.id === members[0].room)?.name || deviceName(members[0])}`,
        deviceIds: members.map((device) => device.id),
    }));
}

export function dashboardEntries(home: Home, prefs: Preferences) {
    const assigned = new Set<string>();
    const groups = [...prefs.groups, ...discoverPowerGroups(home).filter((group) => !prefs.ungrouped.includes(group.id))].filter((group) => {
        if (group.deviceIds.some((id) => assigned.has(id))) return false;
        if (!group.deviceIds.some((id) => home.devices.some((device) => device.id === id))) return false;
        group.deviceIds.forEach((id) => assigned.add(id));
        return true;
    });
    const nameCounts = new Map<string, number>();
    home.devices.forEach((device) => nameCounts.set(deviceName(device), (nameCounts.get(deviceName(device)) ?? 0) + 1));
    const entries: { id: string; name: string; device?: Device; group?: PowerGroup }[] = [
        ...home.devices.filter((device) => !assigned.has(device.id))
            .map((device) => ({ id: device.id, name: nameCounts.get(deviceName(device))! > 1
                ? `${deviceName(device)} · ${deviceTypeName(device)}` : deviceName(device), device })),
        ...groups.map((group) => ({ id: group.id, name: group.name, group })),
    ];
    return entries.sort((a, b) => {
        const weightDifference = (prefs.weights[a.id] ?? Infinity) - (prefs.weights[b.id] ?? Infinity);
        if (weightDifference) return weightDifference;
        const ai = prefs.order.indexOf(a.id), bi = prefs.order.indexOf(b.id);
        return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
    });
}

export const instanceNames: Record<string, string> = {
    on: 'Питание', temperature: 'Температура', humidity: 'Влажность', pressure: 'Давление', battery_level: 'Батарея',
    water_meter: 'Вода', electricity_meter: 'Электроэнергия', gas_meter: 'Газ', heat_meter: 'Тепло',
    power: 'Мощность', voltage: 'Напряжение', amperage: 'Ток', signal_level: 'Уровень сигнала',
    illumination: 'Освещённость', co2_level: 'CO₂', pm1_density: 'PM1', 'pm2.5_density': 'PM2.5', pm10_density: 'PM10',
    tvoc: 'Летучие соединения', food_level: 'Уровень корма', water_level: 'Уровень воды',
    open: 'Открытие', motion: 'Движение', smoke: 'Дым', gas: 'Газ', water_leak: 'Протечка', button: 'Кнопка', vibration: 'Вибрация',
    brightness: 'Яркость', volume: 'Громкость', channel: 'Канал', thermostat: 'Режим работы', fan_speed: 'Скорость вентилятора',
    swing: 'Направление обдува', input_source: 'Источник сигнала', cleanup_mode: 'Режим уборки', work_speed: 'Скорость работы',
    program: 'Программа', mute: 'Без звука', pause: 'Пауза', backlight: 'Подсветка', ionization: 'Ионизация',
    oscillation: 'Вращение', controls_locked: 'Блокировка', keep_warm: 'Поддержание тепла',
};
export function instanceName(instance: string) { return instanceNames[instance] || instance; }
const units: Record<string, string> = {
    'unit.percent': '%', 'unit.temperature.celsius': '°C', 'unit.temperature.kelvin': 'K',
    'unit.pressure.mmhg': 'мм рт. ст.', 'unit.pressure.pascal': 'Па', 'unit.pressure.bar': 'бар',
    'unit.cubic_meter': 'м³', 'unit.watt': 'Вт', 'unit.volt': 'В', 'unit.ampere': 'А',
    'unit.kilowatt_hour': 'кВт·ч', 'unit.illumination.lux': 'лк', 'unit.ppm': 'ppm', 'unit.density.mcg_m3': 'мкг/м³',
};
export function unitName(unit?: string) { return unit ? units[unit] || unit.replace(/^unit\./, '') : ''; }
export function formatReading(property: Property) {
    const value = property.state?.value;
    if (value === undefined || value === null || typeof value === 'number' && !Number.isFinite(value)) return 'Нет данных';
    const formatted = typeof value === 'number' ? value.toLocaleString('ru-RU', {
        minimumFractionDigits: property.parameters.instance === 'water_meter' ? 3 : 0,
        maximumFractionDigits: property.parameters.instance.endsWith('_meter') ? 3 : 2,
    }) : typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return [formatted, unitName(property.parameters.unit)].filter(Boolean).join(' ');
}
