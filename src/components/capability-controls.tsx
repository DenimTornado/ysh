import type { Capability, Device } from '../model';
import { capabilityKind, instanceName, isPublicControl, unitName } from '../dashboard-model';
import { PowerControl, RangeControl, ModeControl, ToggleControl } from './device-controls';
import ColorControls from './color-controls';

function Control({ device, cap }: { device: Device; cap: Capability }) {
    const kind = capabilityKind(cap.type);
    const instance = cap.parameters?.instance || cap.state?.instance;
    if (kind === 'on_off') return <PowerControl device={device} />;
    if (kind === 'color_setting') return <ColorControls device={device} />;
    if (!instance) return <p className="muted">Возможность {kind}: сервер не указал функцию управления.</p>;
    const label = [instanceName(instance), unitName(cap.parameters?.unit)].filter(Boolean).join(', ');
    if (kind === 'range') return <RangeControl device={device} instance={instance} label={label} />;
    if (kind === 'mode' && !cap.parameters?.modes?.length) return <p className="muted">{label}: сервер не передал варианты режима.</p>;
    if (kind === 'mode') return <ModeControl device={device} instance={instance} label={label} />;
    if (kind === 'toggle') return <ToggleControl device={device} instance={instance} label={label} />;
    return null;
}

export default function CapabilityControls({ device, omitPower = false }: { device: Device; omitPower?: boolean }) {
    const caps = device.capabilities ?? [];
    const order = ['on_off', 'mode', 'range', 'toggle', 'color_setting'];
    const controls = caps.filter((cap) => isPublicControl(cap.type) && !(omitPower && capabilityKind(cap.type) === 'on_off'))
        .sort((a, b) => order.indexOf(capabilityKind(a.type)) - order.indexOf(capabilityKind(b.type)));
    const unsupported = caps.filter((cap) => !isPublicControl(cap.type));
    return <div className="capability-controls">
        {controls.map((cap, index) => <Control key={`${cap.type}:${cap.parameters?.instance || index}`} device={device} cap={cap} />)}
        {!caps.length && <p className="muted">Устройство не передало доступных команд.</p>}
        {unsupported.length > 0 && <details className="unsupported-controls">
            <summary>Дополнительные возможности · {unsupported.length}</summary>
            <p className="muted">Для этих возможностей нет подключённого способа управления. Полученные данные доступны ниже.</p>
            {unsupported.map((cap, index) => <details key={`${cap.type}:${index}`}>
                <summary>{instanceName(cap.parameters?.instance || capabilityKind(cap.type))}</summary>
                <pre>{JSON.stringify({ parameters: cap.parameters, state: cap.state }, null, 2)}</pre>
            </details>)}
        </details>}
    </div>;
}
