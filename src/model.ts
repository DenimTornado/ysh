export type ActionValue = boolean | number | string | { h: number; s: number; v: number };

export interface Capability {
    type: string;
    retrievable?: boolean;
    reportable?: boolean;
    parameters?: {
        instance?: string;
        split?: boolean;
        random_access?: boolean;
        range?: { min?: number; max?: number; precision?: number };
        modes?: { value: string; name?: string }[];
        color_model?: string;
        temperature_k?: { min?: number; max?: number };
        color_scene?: { scenes?: { id: string; name?: string }[] };
    };
    state?: { instance?: string; value?: unknown } | null;
    last_updated?: number;
}

export interface Property {
    type: string;
    parameters: { instance: string; unit?: string };
    state?: { instance?: string; value?: unknown } | null;
    last_updated?: number;
}

export interface Device {
    id: string;
    name: string;
    type: string;
    aliases?: string[] | null;
    room?: string;
    capabilities?: Capability[];
    properties?: Property[];
}

export interface Scenario {
    id: string;
    name: string;
    is_active?: boolean;
}

export interface Home {
    devices: Device[];
    rooms: { id: string; name: string }[];
    scenarios: Scenario[];
}

export interface DeviceProps {
    device: Device;
    room?: string;
}

export interface Action {
    type: string;
    state: { instance: string; value: ActionValue; relative?: boolean };
}

export function capability(device: Device, type: string, instance?: string) {
    return device.capabilities?.find((item) => item.type === `devices.capabilities.${type}` &&
        (!instance || item.parameters?.instance === instance || item.state?.instance === instance));
}

export function action(instance: string, value: ActionValue, type = 'on_off', relative?: boolean): Action {
    return { type: `devices.capabilities.${type}`, state: { instance, value, ...(relative === undefined ? {} : { relative }) } };
}

export function boundedValue(value: number, min: number, max: number, step = 1) {
    if (!Number.isFinite(value)) throw new Error('Введите числовое значение.');
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max || step <= 0) {
        throw new Error('Некорректный диапазон устройства.');
    }
    const bounded = Math.min(max, Math.max(min, value));
    return Number(Math.min(max, Math.max(min, min + Math.round((bounded - min) / step) * step)).toFixed(6));
}

export function updatedAt(timestamp?: number) {
    if (!timestamp || !Number.isFinite(timestamp)) return 'Время обновления неизвестно';
    return `Обновлено ${new Date(timestamp * 1000).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', year: 'numeric' })}`;
}

export function deviceName(device: { name: string; aliases?: string[] | null }) {
    return device.aliases?.[0] || device.name;
}
