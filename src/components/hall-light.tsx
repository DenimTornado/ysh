import { sendActions } from '../api';
import { hallLightGroupId, hallLightIds } from '../device-config';
import { useCommand } from '../hooks/use-command';
import { action, capability } from '../model';
import type { Device } from '../model';
import { CardLayout } from './card-layout/card-layout';

export default function HallLight({ devices }: { devices: Device[] }) {
    const { busy, execute } = useCommand();
    const controls = hallLightIds.map((id) => {
        const device = devices.find((device) => device.id === id);
        return device ? capability(device, 'on_off') : undefined;
    });
    const ready = controls.every(Boolean);
    const states = controls.map((control) => control?.retrievable === false ? undefined : control?.state?.value);
    const known = states.every((state) => typeof state === 'boolean');
    const status = !known ? 'Состояние света неизвестно' : states.every(Boolean) ? 'Включён' :
        states.every((state) => !state) ? 'Выключен' : 'Включён частично';
    return <CardLayout device={{ id: hallLightGroupId, name: 'Свет в зале' }}>
        <p className="muted">{status}</p>
        <div className="buttons">{[true, false].map((powered) => <button className="button" key={String(powered)} disabled={busy || !ready}
            onClick={() => void execute(() => sendActions(hallLightIds.map((id) => ({ id, actions: [action('on', powered)] }))))}>
            {powered ? 'Включить' : 'Выключить'}
        </button>)}</div>
        {!ready && <p className="muted">Для общего управления нужны оба выключателя.</p>}
    </CardLayout>;
}
