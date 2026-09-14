import { sendActions } from '../api';
import { action, capability, deviceName } from '../model';
import type { Action, DeviceProps } from '../model';
import { useCommand } from '../hooks/use-command';
import './tv-remote.css';

function RemoteIcon({ kind }: { kind: 'power' | 'mute' | 'pause' }) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {kind === 'power' && <><path d="M12 3v9" /><path d="M6.3 5.8a8 8 0 1 0 11.4 0" /></>}
        {kind === 'mute' && <><path d="M11 4 5 9H2v6h3l6 5Z" /><path d="m16 9 6 6m0-6-6 6" /></>}
        {kind === 'pause' && <><path d="M8 5v14M16 5v14" strokeWidth="4" /></>}
    </svg>;
}

export default function TvPristavkaComponent({ device }: DeviceProps) {
    const { busy, execute } = useCommand();
    const send = (command: Action) => void execute(() => sendActions([{ id: device.id, actions: [command] }]));
    const power = capability(device, 'on_off');
    const volume = capability(device, 'range', 'volume');
    const toggle = (instance: string) => {
        const cap = capability(device, 'toggle', instance);
        const known = cap?.retrievable !== false && typeof cap?.state?.value === 'boolean';
        send(action(instance, known ? !cap?.state?.value : true, 'toggle'));
    };
    return <details className="remote-details">
        <summary>{deviceName(device)}</summary>
        <div className="tv-remote" aria-label="Пульт приставки" aria-busy={busy}>
            {power && <div className="tv-remote__power">
                <button type="button" className="tv-remote__key tv-remote__key--on" disabled={busy} onClick={() => send(action('on', true))}>
                    <RemoteIcon kind="power" /><span>Включить</span>
                </button>
                <button type="button" className="tv-remote__key tv-remote__key--off" disabled={busy} onClick={() => send(action('on', false))}>
                    <RemoteIcon kind="power" /><span>Выключить</span>
                </button>
            </div>}
            {volume && <div className="tv-remote__volume" role="group" aria-label="Громкость">
                <button type="button" className="tv-remote__key" disabled={busy} aria-label="Прибавить громкость" onClick={() => send(action('volume', 1, 'range', true))}>+</button>
                <span>Громкость</span>
                <button type="button" className="tv-remote__key" disabled={busy} aria-label="Убавить громкость" onClick={() => send(action('volume', -1, 'range', true))}>−</button>
            </div>}
            <div className="tv-remote__playback">
                {capability(device, 'toggle', 'mute') && <button type="button" className="tv-remote__key" disabled={busy} onClick={() => toggle('mute')}>
                    <RemoteIcon kind="mute" /><span>Без звука</span>
                </button>}
                {capability(device, 'toggle', 'pause') && <button type="button" className="tv-remote__key" disabled={busy} onClick={() => toggle('pause')}>
                    <RemoteIcon kind="pause" /><span>Пауза</span>
                </button>}
            </div>
            <p className="tv-remote__note">ИК-пульт · без обратной связи</p>
        </div>
    </details>;
}
