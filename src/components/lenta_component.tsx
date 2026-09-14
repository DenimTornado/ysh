import { useEffect, useState } from 'react';
import { sendActions } from '../api';
import { action, boundedValue, capability } from '../model';
import type { Action, DeviceProps } from '../model';
import { FAVORITE_COLORS, hexToRgb, hsvToRgb, rgbIntToHex, rgbToHex, rgbToHsv } from '../colors';
import { useCommand } from '../hooks/use-command';
import { CardLayout } from './card-layout/card-layout';
import { PowerControl, RangeControl } from './device-controls';
import CustomInput from './custom-input/custom-input';

export default function LentaComponent({ device, room }: DeviceProps) {
    const { busy, execute } = useCommand();
    const colorCap = capability(device, 'color_setting');
    const brightness = capability(device, 'range', 'brightness');
    const state = colorCap?.state;
    let reportedColor = '#cbcbcb';
    if (state?.instance === 'rgb' && typeof state.value === 'number') reportedColor = rgbIntToHex(state.value);
    if (state?.instance === 'hsv' && typeof state.value === 'object' && state.value !== null &&
        'h' in state.value && 's' in state.value && 'v' in state.value &&
        typeof state.value.h === 'number' && typeof state.value.s === 'number' && typeof state.value.v === 'number') {
        const rgb = hsvToRgb(state.value.h, state.value.s, state.value.v);
        reportedColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    const [color, setColor] = useState(reportedColor);
    useEffect(() => { setColor(reportedColor); }, [reportedColor]);
    const send = (actions: Action[]) => execute(() => sendActions([{ id: device.id, actions }]));
    const colorAction = (hex: string) => {
        const { r, g, b } = hexToRgb(hex);
        return colorCap?.parameters?.color_model === 'rgb' ? action('rgb', (r << 16) + (g << 8) + b, 'color_setting') :
            action('hsv', rgbToHsv(r, g, b), 'color_setting');
    };
    const temperatureRange = colorCap?.parameters?.temperature_k;
    const minTemperature = temperatureRange?.min ?? 2700;
    const maxTemperature = temperatureRange?.max ?? 6500;
    const scenes = colorCap?.parameters?.color_scene?.scenes ?? [];
    const preset = (temperature: number, level: number) => {
        const actions = [action('temperature_k', boundedValue(temperature, minTemperature, maxTemperature), 'color_setting')];
        if (capability(device, 'on_off')) actions.unshift(action('on', true));
        if (brightness) actions.push(action('brightness', boundedValue(level, brightness.parameters?.range?.min ?? 1,
            brightness.parameters?.range?.max ?? 100, brightness.parameters?.range?.precision || 1), 'range'));
        return send(actions);
    };
    const supportsColor = ['rgb', 'hsv'].includes(colorCap?.parameters?.color_model ?? '');
    return <CardLayout device={device} room={room}>
        <PowerControl device={device} />
        {temperatureRange && brightness && <div className="control-group">
            <p>Быстрый свет</p><div className="buttons">
                <button className="button" disabled={busy} onClick={() => void preset(2700, 25)}>Вечер · 25%</button>
                <button className="button" disabled={busy} onClick={() => void preset(4000, 85)}>Чтение · 85%</button>
                <button className="button" disabled={busy} onClick={() => void preset(2700, 95)}>Тёплый · 95%</button>
            </div>
        </div>}
        <RangeControl device={device} instance="brightness" label="Яркость, %" />
        {supportsColor && <div className="control-group">
            <label className="color-picker">
                <span>Цвет</span>
                <span className="color-picker__control">
                    <span className="color-picker__preview" style={{ backgroundColor: color }} aria-hidden="true" />
                    <span>Выбрать цвет</span>
                    <input type="color" aria-label="Цвет ленты" value={color} disabled={busy} onChange={(event) => setColor(event.target.value)} />
                </span>
            </label>
            <button className="button" disabled={busy} onClick={() => void send([colorAction(color)])}>Применить цвет</button>
            <p>Избранные цвета</p>
            <div className="favorite-colors">{FAVORITE_COLORS.map((item) => <button key={item.hex} className="button favorite-color"
                disabled={busy} onClick={() => { setColor(item.hex); void send([colorAction(item.hex)]); }}>
                <span className="color-swatch" style={{ background: item.hex }} />{item.name}
            </button>)}</div>
        </div>}
        {temperatureRange && <CustomInput label="Температура света, K" min={minTemperature} max={maxTemperature}
            value={state?.instance === 'temperature_k' && typeof state.value === 'number' ? state.value : undefined}
            disabled={busy} onApply={(value) => send([action('temperature_k', boundedValue(value, minTemperature, maxTemperature), 'color_setting')])} />}
        {scenes.length > 0 && <label className="control-group">Световой эффект
            <select className="input" disabled={busy} value={state?.instance === 'scene' && typeof state.value === 'string' ? state.value : ''}
                onChange={(event) => void send([action('scene', event.target.value, 'color_setting')])}>
                <option value="" disabled>Выберите эффект</option>
                {scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name?.includes('�') ? scene.id : scene.name || scene.id}</option>)}
            </select>
        </label>}
    </CardLayout>;
}
