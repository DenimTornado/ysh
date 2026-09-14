import { sendActions } from '../api';
import { action, boundedValue, capability } from '../model';
import type { Device } from '../model';
import { useCommand } from '../hooks/use-command';
import CustomInput from './custom-input/custom-input';

export function PowerControl({ device }: { device: Device }) {
    const { busy, execute } = useCommand();
    const cap = capability(device, 'on_off');
    if (!cap) return null;
    const powered = cap.state?.value;
    const known = cap.retrievable !== false && typeof powered === 'boolean';
    const send = (value: boolean) => execute(() => sendActions([{ id: device.id, actions: [action('on', value)] }]));
    return <div className="control-group">
        <p className="muted">{known ? (powered ? 'Включено' : 'Выключено') : 'Состояние питания неизвестно'}</p>
        <div className="buttons">
            {known ? <button className="button" disabled={busy} onClick={() => void send(!powered)}>{powered ? 'Выключить' : 'Включить'}</button> : <>
                <button className="button" disabled={busy} onClick={() => void send(true)}>Включить</button>
                <button className="button" disabled={busy} onClick={() => void send(false)}>Выключить</button>
            </>}
        </div>
    </div>;
}

export function RangeControl({ device, instance, label }: { device: Device; instance: string; label: string }) {
    const { busy, execute } = useCommand();
    const cap = capability(device, 'range', instance);
    if (!cap) return null;
    const current = typeof cap.state?.value === 'number' && Number.isFinite(cap.state.value) ? cap.state.value : undefined;
    const min = cap.parameters?.range?.min;
    const max = cap.parameters?.range?.max;
    const step = cap.parameters?.range?.precision || 1;
    const send = (value: number, relative = false) => execute(() => sendActions([{ id: device.id,
        actions: [action(instance, relative ? value : boundedValue(value, min!, max!, step), 'range', relative)] }]));
    if (cap.parameters?.random_access === false) return <div className="control-group">
        <p>{label}</p><div className="buttons">
            <button className="button" disabled={busy} aria-label={`Убавить: ${label}`} onClick={() => void send(-1, true)}>−</button>
            <button className="button" disabled={busy} aria-label={`Прибавить: ${label}`} onClick={() => void send(1, true)}>+</button>
        </div>
    </div>;
    if (min === undefined || max === undefined) return null;
    return <div className="control-group">
        <CustomInput label={label} value={current} min={min} max={max} step={step} disabled={busy} onApply={(value) => send(value)} />
        <div className="buttons">
            <button className="button" disabled={busy || current === undefined || current <= min} aria-label={`Убавить: ${label}`} onClick={() => void send(current! - step)}>−</button>
            <button className="button" disabled={busy || current === undefined || current >= max} aria-label={`Прибавить: ${label}`} onClick={() => void send(current! + step)}>+</button>
        </div>
    </div>;
}

const modeNames: Record<string, string> = {
    fan_only: 'Вентиляция', cool: 'Охлаждение', heat: 'Обогрев', dry: 'Осушение', auto: 'Авто',
    normal: 'Обычная', min: 'Минимальная', max: 'Максимальная', quiet: 'Тихая', turbo: 'Турбо',
    stationary: 'Неподвижно', vertical: 'Вертикально', horizontal: 'Горизонтально',
    low: 'Низкая', medium: 'Средняя', high: 'Высокая',
};

export function ModeControl({ device, instance, label }: { device: Device; instance: string; label: string }) {
    const { busy, execute } = useCommand();
    const cap = capability(device, 'mode', instance);
    const modes = cap?.parameters?.modes;
    if (!modes?.length) return null;
    const current = typeof cap?.state?.value === 'string' && modes.some((mode) => mode.value === cap.state?.value) ? cap.state.value : '';
    return <label className="control-group">{label}
        <select className="input" disabled={busy} value={current} onChange={(event) => {
            const value = event.target.value;
            void execute(() => sendActions([{ id: device.id, actions: [action(instance, value, 'mode')] }]));
        }}>
            <option value="" disabled>Неизвестно</option>
            {modes.map((mode) => <option key={mode.value} value={mode.value}>{mode.name || modeNames[mode.value] || mode.value}</option>)}
        </select>
    </label>;
}

export function ToggleControl({ device, instance, label }: { device: Device; instance: string; label: string }) {
    const { busy, execute } = useCommand();
    const cap = capability(device, 'toggle', instance);
    if (!cap) return null;
    const value = cap.state?.value;
    const known = cap.retrievable !== false && typeof value === 'boolean';
    return <button className="button" disabled={busy} aria-pressed={known ? value : undefined} onClick={() => void execute(() =>
        sendActions([{ id: device.id, actions: [action(instance, known ? !value : true, 'toggle')] }]))}>
        {label}{known ? (value ? ': вкл.' : ': выкл.') : ''}
    </button>;
}
