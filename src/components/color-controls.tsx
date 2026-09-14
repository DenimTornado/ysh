import { useEffect, useState } from 'react';
import { sendActions } from '../api';
import { action, boundedValue, capability } from '../model';
import type { Action, DeviceProps } from '../model';
import { hexToRgb, hsvToRgb, rgbIntToHex, rgbToHex, rgbToHsv } from '../colors';
import { useCommand } from '../hooks/use-command';
import { useColorPresets, useLightPresets } from '../hooks/use-light-presets';
import CustomInput from './custom-input/custom-input';

export default function ColorControls({ device }: DeviceProps) {
    const { busy, execute } = useCommand();
    const colorCap = capability(device, 'color_setting');
    const brightness = capability(device, 'range', 'brightness');
    const { presets, add: addPreset, remove: removePreset, error: presetError } = useLightPresets(device.id);
    const { presets: colorPresets, add: addColorPreset, remove: removeColorPreset, error: colorPresetError } = useColorPresets(device.id);
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
    const [colorPresetName, setColorPresetName] = useState('');
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
    const minBrightness = brightness?.parameters?.range?.min ?? 1;
    const maxBrightness = brightness?.parameters?.range?.max ?? 100;
    const brightnessStep = brightness?.parameters?.range?.precision || 1;
    const currentTemperature = state?.instance === 'temperature_k' && typeof state.value === 'number' ? state.value : minTemperature;
    const currentBrightness = typeof brightness?.state?.value === 'number' ? brightness.state.value : maxBrightness;
    const [presetName, setPresetName] = useState('');
    const [presetTemperature, setPresetTemperature] = useState(currentTemperature);
    const [presetBrightness, setPresetBrightness] = useState(currentBrightness);
    const scenes = colorCap?.parameters?.color_scene?.scenes ?? [];
    const preset = (temperature: number, level: number) => {
        const actions = [action('temperature_k', boundedValue(temperature, minTemperature, maxTemperature), 'color_setting')];
        if (capability(device, 'on_off')) actions.unshift(action('on', true));
        if (brightness) actions.push(action('brightness', boundedValue(level, minBrightness, maxBrightness, brightnessStep), 'range'));
        return send(actions);
    };
    const supportsColor = ['rgb', 'hsv'].includes(colorCap?.parameters?.color_model ?? '');
    return <div className="color-controls">
        {temperatureRange && brightness && <div className="control-group">
            <p>Быстрый свет</p>
            {presets.length > 0 && <div className="buttons">
                {presets.map((item) => <button key={item.id} className="button" disabled={busy}
                    onClick={() => void preset(item.temperature, item.brightness)}>{item.name} · {item.brightness}%</button>)}
            </div>}
            <details className="preset-editor">
                <summary>Настроить быстрый свет</summary>
                <form onSubmit={(event) => {
                    event.preventDefault();
                    const name = presetName.trim();
                    if (!name) return;
                    addPreset({ name, temperature: boundedValue(presetTemperature, minTemperature, maxTemperature),
                        brightness: boundedValue(presetBrightness, minBrightness, maxBrightness, brightnessStep) });
                    setPresetName('');
                }}>
                    <label>Название<input className="input" required maxLength={40} value={presetName}
                        onChange={(event) => setPresetName(event.target.value)} /></label>
                    <label>Температура, K<input className="input" type="number" required min={minTemperature} max={maxTemperature}
                        value={presetTemperature} onChange={(event) => setPresetTemperature(event.target.valueAsNumber)} /></label>
                    <label>Яркость, %<input className="input" type="number" required min={minBrightness} max={maxBrightness} step={brightnessStep}
                        value={presetBrightness} onChange={(event) => setPresetBrightness(event.target.valueAsNumber)} /></label>
                    <button className="button" disabled={busy || !presetName.trim()}>Сохранить пресет</button>
                </form>
                {presets.map((item) => <div className="settings-row" key={item.id}>
                    <span>{item.name}<span className="muted"> · {item.temperature} K · {item.brightness}%</span></span>
                    <button className="button is-small" onClick={() => removePreset(item.id)}>Удалить</button>
                </div>)}
                {presetError && <p role="alert">{presetError}</p>}
            </details>
        </div>}
        {supportsColor && <div className="control-group">
            <p>Цвет</p>
            <form className="color-preset-form" onSubmit={(event) => {
                    event.preventDefault();
                    const name = colorPresetName.trim();
                    if (!name) return;
                    addColorPreset({ name, color });
                    setColorPresetName('');
                }}>
                <label className="color-picker">
                    <span className="color-picker__control">
                        <span className="color-picker__preview" style={{ backgroundColor: color }} aria-hidden="true" />
                        <span>Выбрать цвет</span>
                        <input type="color" aria-label="Цвет" value={color} disabled={busy} onChange={(event) => setColor(event.target.value)} />
                    </span>
                </label>
                <label className="color-preset-name"><span className="is-sr-only">Название цвета</span>
                    <input className="input" maxLength={40} placeholder="Название для сохранения" value={colorPresetName}
                        onChange={(event) => setColorPresetName(event.target.value)} />
                </label>
                <div className="buttons color-preset-actions">
                    <button type="button" className="button" disabled={busy} onClick={() => void send([colorAction(color)])}>Применить цвет</button>
                    <button className="button" disabled={busy || !colorPresetName.trim()}>Сохранить цвет</button>
                </div>
            </form>
            {colorPresets.length > 0 && <div className="favorite-colors">{colorPresets.map((item) => <div className="saved-color" key={item.id}>
                <button className="button favorite-color" disabled={busy} onClick={() => { setColor(item.color); void send([colorAction(item.color)]); }}>
                    <span className="color-swatch" style={{ background: item.color }} />{item.name}
                </button>
                <button className="button is-small saved-color__remove" aria-label={`Удалить цвет: ${item.name}`}
                    onClick={() => removeColorPreset(item.id)}>Удалить</button>
            </div>)}</div>}
            {colorPresetError && <p role="alert">{colorPresetError}</p>}
        </div>}
        {temperatureRange && <CustomInput label="Температура света, K" min={minTemperature} max={maxTemperature}
            value={state?.instance === 'temperature_k' && typeof state.value === 'number' ? state.value : undefined}
            disabled={busy} onApply={(value) => send([action('temperature_k', boundedValue(value, minTemperature, maxTemperature), 'color_setting')])} />}
        {scenes.length > 0 && <label className="control-group">Световой эффект
            <select className="input" aria-label="Световой эффект" disabled={busy} value={state?.instance === 'scene' && typeof state.value === 'string' ? state.value : ''}
                onChange={(event) => void send([action('scene', event.target.value, 'color_setting')])}>
                <option value="" disabled>Выберите эффект</option>
                {scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name?.includes('�') ? scene.id : scene.name || scene.id}</option>)}
            </select>
        </label>}
    </div>;
}
