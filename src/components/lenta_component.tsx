import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { sendAction } from '../api';
import { CardLayout } from './card-layout/card-layout';
import Button from './button/button';
import switchOffIcon from '../assets/icons/poweroff.png';
import switchOnIcon from '../assets/icons/poweron.png';
import plusIcon from '../assets/icons/plus.png';
import minusIcon from '../assets/icons/minus.png';
import CustomInput from './custom-input/custom-input';

type Property = {
    type: string;
    parameters: { instance: string };
    state?: {
        instance: string;
        value: any;
    };
};

type ColorScene = {
    id: string;
    name?: string;
};

type Capability = {
    type: string;
    parameters: {
        instance?: string;
        color_model?: string;
        temperature_k?: { min?: number; max?: number };
        color_scene?: { scenes?: ColorScene[] };
        range?: { min?: number; max?: number; precision?: number };
    };
    state?: {
        instance: string;
        value: any;
    };
};

type Device = {
    id: string;
    name: string;
    properties?: Property[];
    capabilities?: Capability[];
};

type Props = {
    device: Device;
    room?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '');
    const int = parseInt(normalized, 16);

    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

const rgbToHsv = (r: number, g: number, b: number) => {
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
        h: Math.round(h),
        s: Math.round(max === 0 ? 0 : (delta / max) * 100),
        v: Math.round(max * 100),
    };
};

const hsvToRgb = (h: number, s: number, v: number) => {
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


const FAVORITE_COLORS = [
    { name: 'iOS 8 Water', hex: '#2D89B8' },
    { name: 'Diablo IV Lilith', hex: '#8A0012' },
    { name: 'Cyberpunk 2077', hex: '#D8C600' },
];

const rgbIntToHex = (value: number) => {
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return rgbToHex(r, g, b);
};

const LentaComponent: React.FC<Props> = ({ device, room }) => {
    const onOffCapability = useMemo(
        () => device.capabilities?.find((c) => c.type === 'devices.capabilities.on_off'),
        [device.capabilities],
    );

    const brightnessCapability = useMemo(
        () => device.capabilities?.find(
            (c) => c.type === 'devices.capabilities.range' && c.parameters.instance === 'brightness',
        ),
        [device.capabilities],
    );

    const colorCapability = useMemo(
        () => device.capabilities?.find((c) => c.type === 'devices.capabilities.color_setting'),
        [device.capabilities],
    );

    const scenes = colorCapability?.parameters.color_scene?.scenes ?? [];

    const getInitialPower = () => Boolean(onOffCapability?.state?.value);
    const getInitialBrightness = () => Number(brightnessCapability?.state?.value ?? 50);

    const getInitialColor = () => {
        if (colorCapability?.state?.instance === 'rgb' && typeof colorCapability.state.value === 'number') {
            return rgbIntToHex(colorCapability.state.value);
        }

        if (colorCapability?.state?.instance === 'hsv' && colorCapability.state.value) {
            const { h, s, v } = colorCapability.state.value;
            const rgb = hsvToRgb(h, s, v);
            return rgbToHex(rgb.r, rgb.g, rgb.b);
        }

        return '#cbcbcb';
    };

    const getInitialTemperature = () => {
        if (colorCapability?.state?.instance === 'temperature_k') {
            return Number(colorCapability.state.value);
        }

        return colorCapability?.parameters.temperature_k?.min ?? 2700;
    };

    const [powered, setPowered] = useState<boolean>(getInitialPower);
    const [brightness, setBrightness] = useState<number>(getInitialBrightness);
    const [color, setColor] = useState<string>(getInitialColor);
    const [temperature, setTemperature] = useState<number>(getInitialTemperature);
    const [scene, setScene] = useState<string>('');

    const minBrightness = brightnessCapability?.parameters?.range?.min ?? 1;
    const maxBrightness = brightnessCapability?.parameters?.range?.max ?? 100;
    const minTemperature = colorCapability?.parameters.temperature_k?.min ?? 2700;
    const maxTemperature = colorCapability?.parameters.temperature_k?.max ?? 6500;

    const setStatus = useCallback(() => {
        sendAction('on', !powered, 'devices.capabilities.on_off', device);
        setPowered((prev) => !prev);
    }, [device, powered]);

    const sendBrightness = useCallback((value: number) => {
        const nextValue = clamp(value, minBrightness, maxBrightness);
        sendAction('brightness', nextValue, 'devices.capabilities.range', device);
        setBrightness(nextValue);
    }, [device, maxBrightness, minBrightness]);

    const sendColor = useCallback((hex: string) => {
        const { r, g, b } = hexToRgb(hex);
        const hsv = rgbToHsv(r, g, b);

        sendAction('hsv', hsv, 'devices.capabilities.color_setting', device);
        setColor(hex);
        setScene('');
    }, [device]);

    const sendTemperature = useCallback((value: number) => {
        const nextValue = clamp(value, minTemperature, maxTemperature);
        sendAction('temperature_k', nextValue, 'devices.capabilities.color_setting', device);
        setTemperature(nextValue);
        setScene('');
    }, [device, maxTemperature, minTemperature]);

    const sendScene = useCallback((value: string) => {
        if (!value) {
            return;
        }

        sendAction('scene', value, 'devices.capabilities.color_setting', device);
        setScene(value);
    }, [device]);

    useEffect(() => {
        setPowered(getInitialPower());
        setBrightness(getInitialBrightness());
        setColor(getInitialColor());
        setTemperature(getInitialTemperature());
        setScene(colorCapability?.state?.instance === 'scene' ? String(colorCapability.state.value) : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.capabilities]);

    return (
        <CardLayout device={ device } room={ room }>
            <CardLayout.Actions>
                <h4>Управление лентой:</h4>

                <div className="buttons">
                    <Button alt="Убавить яркость" onClick={ () => sendBrightness(brightness - 10) } icon={ minusIcon } />
                    <Button alt="Прибавить яркость" onClick={ () => sendBrightness(brightness + 10) } icon={ plusIcon } />
                    <Button alt="Питание" onClick={ setStatus } icon={ powered ? switchOffIcon : switchOnIcon } />
                </div>

                <CustomInput
                    value={ brightness }
                    onChange={ (e) => setBrightness(parseInt(e.target.value, 10)) }
                    onClick={ () => sendBrightness(brightness) }
                />

                <input
                    type="color"
                    value={ color }
                    onChange={ (e) => setColor(e.target.value) }
                    onBlur={ (e) => sendColor(e.target.value) }
                    style={ { width: '100%', height: 42, marginTop: 12 } }
                />

                <div style={ { marginTop: 12 } }>
                    <div style={ { marginBottom: 8, fontSize: 14, opacity: 0.8 } }>Избранные цвета:</div>

                    <div style={ { display: 'grid', gap: 8 } }>
                        { FAVORITE_COLORS.map((item) => (
                            <button
                                key={ item.hex }
                                type="button"
                                onClick={ () => sendColor(item.hex) }
                                style={ {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    minHeight: 42,
                                    padding: '8px 10px',
                                    border: item.hex.toLowerCase() === color.toLowerCase() ? '2px solid currentColor' : '1px solid rgba(255, 255, 255, 0.25)',
                                    borderRadius: 8,
                                    background: 'transparent',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                } }
                            >
                                <span
                                    style={ {
                                        display: 'inline-block',
                                        width: 22,
                                        height: 22,
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        background: item.hex,
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                    } }
                                />
                                <span style={ { flexGrow: 1, textAlign: 'left' } }>{ item.name }</span>
                                <span style={ { fontFamily: 'monospace', opacity: 0.7 } }>{ item.hex }</span>
                            </button>
                        )) }
                    </div>
                </div>

                { colorCapability?.parameters.temperature_k && (
                    <CustomInput
                        value={ temperature }
                        onChange={ (e) => setTemperature(parseInt(e.target.value, 10)) }
                        onClick={ () => sendTemperature(temperature) }
                    />
                ) }

                { scenes.length > 0 && (
                    <select
                        value={ scene }
                        onChange={ (e) => sendScene(e.target.value) }
                        style={ { width: '100%', height: 42, marginTop: 12 } }
                        className={'select is-fullwidth is-medium is-rounded'}
                    >
                        <option value="">Сценарий цвета</option>
                        { scenes.map((item) => (
                            <option key={ item.id } value={ item.id }>
                                { item.name ?? item.id }
                            </option>
                        )) }
                    </select>
                ) }
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default LentaComponent;
