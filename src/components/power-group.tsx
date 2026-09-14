import type { Device } from '../model';
import { action, capability, capabilityValue, deviceName } from '../model';
import type { PowerGroup as Group } from '../dashboard-model';
import { useCommand } from '../hooks/use-command';
import { sendActions } from '../api';
import CapabilityControls from './capability-controls';

export default function PowerGroup({ group, devices }: { group: Group; devices: Device[] }) {
    const { busy, execute } = useCommand();
    const members = group.deviceIds.map((id) => devices.find((device) => device.id === id));
    const caps = members.map((device) => device && capability(device, 'on_off'));
    const ready = caps.every(Boolean);
    const values = caps.map((cap) => capabilityValue(cap || undefined));
    const known = values.every((value) => typeof value === 'boolean');
    return <div className="power-group">
        <h3>{group.name}</h3>
        <p className="muted">{members.map((device) => device ? deviceName(device) : 'Устройство недоступно').join(' · ')}</p>
        <p>{!known ? 'Состояние неизвестно' : values.every(Boolean) ? 'Включено' : values.every((value) => !value) ? 'Выключено' : 'Включено частично'}</p>
        <div className="buttons">{[true, false].map((value) => <button key={String(value)} className="button" disabled={busy || !ready}
            onClick={() => void execute(() => sendActions(group.deviceIds.map((id) => ({ id, actions: [action('on', value)] }))))}>{value ? 'Включить' : 'Выключить'}</button>)}</div>
        {!ready && <p className="muted">Для команды нужны все устройства группы.</p>}
        <details><summary>Дополнительное управление</summary>{members.map((device) => device && <div key={device.id}>
            <h4>{deviceName(device)}</h4><CapabilityControls device={device} omitPower />
        </div>)}</details>
    </div>;
}
