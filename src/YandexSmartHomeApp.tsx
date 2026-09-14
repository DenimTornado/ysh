import { useEffect, useState } from 'react';
import 'bulma/css/bulma.min.css';
import './YandexSmartHomeApp.css';
import { TOKEN_KEY } from './api';
import { capability, deviceAliases, deviceName } from './model';
import { dashboardEntries, defaultVisible, readings } from './dashboard-model';
import { CommandContext } from './hooks/use-command';
import { useHome } from './hooks/use-home';
import { usePreferences } from './hooks/use-preferences';
import { Navbar } from './components/navbar/navbar';
import type { DashboardTab } from './components/navbar/navbar';
import CapabilityControls from './components/capability-controls';
import ReadingsPanel from './components/readings-panel';
import ScenariosPanel from './components/scenarios-panel';
import PowerGroup from './components/power-group';

function HomeDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
    const { home, busy, loading, error, updated, refresh, execute } = useHome(token);
    const { preferences, save, error: settingsError } = usePreferences();
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<DashboardTab>('devices');
    const entries = dashboardEntries(home, preferences);
    const visible = entries.filter((entry) => preferences.visibility[entry.id] ?? defaultVisible());
    const roomName = (id?: string) => home.rooms.find((room) => room.id === id)?.name || 'Без комнаты';
    return <CommandContext.Provider value={{ busy, execute }}>
        <main className="mainApp">
            <Navbar onLogout={onLogout} onRefresh={() => void refresh()} loading={loading} busy={busy}
                deviceCount={home.devices.length} readingCount={readings(home).length} scenarioCount={home.scenarios.length}
                activeTab={activeTab} onTab={setActiveTab} />
            {error && <p className="notification is-danger is-light" role="alert">{error}</p>}
            {settingsError && <p role="alert">{settingsError}</p>}
            {activeTab === 'readings' && <div id="readings-panel" role="tabpanel">
                <ReadingsPanel home={home} visibility={preferences.readingVisibility} order={preferences.readingOrder} weights={preferences.readingWeights}
                    onVisibility={(readingVisibility) => save({ ...preferences, readingVisibility })}
                    onLayout={(readingOrder, readingWeights) => save({ ...preferences, readingOrder, readingWeights })}
                    onWeight={(id, weight) => save({ ...preferences, readingWeights: { ...preferences.readingWeights, [id]: weight } })} />
            </div>}
            {activeTab === 'devices' && <section id="devices-panel" role="tabpanel" className="dashboard-section" aria-label="Устройства">
                <div className="section-tools">
                    <span className="muted">Показано {visible.length} из {entries.length}</span>
                </div>
                <details className="layout-settings">
                    <summary>Настроить устройства</summary>
                    <p className="muted">Новые устройства появляются автоматически. Датчики настраиваются отдельно.</p>
                    {entries.map((entry, index) => {
                        const checked = preferences.visibility[entry.id] ?? defaultVisible();
                        const move = (offset: number) => {
                            const order = entries.map((entry) => entry.id);
                            [order[index], order[index + offset]] = [order[index + offset], order[index]];
                            save({ ...preferences, order, weights: Object.fromEntries(order.map((id, position) => [id, (position + 1) * 10])) });
                        };
                        return <div className="settings-row" key={entry.id}>
                            <label><input type="checkbox" checked={checked} onChange={(event) => save({ ...preferences,
                                visibility: { ...preferences.visibility, [entry.id]: event.target.checked } })} /> {entry.name}
                                {entry.device && <span className="muted"> · {roomName(entry.device.room)}</span>}
                                {entry.device && deviceAliases(entry.device).length > 0 &&
                                    <span className="muted"> · также: {deviceAliases(entry.device).join(', ')}</span>}
                            </label>
                            <div className="buttons">
                                <label className="weight-control">Вес<input className="input" type="number" step="1"
                                    value={preferences.weights[entry.id] ?? (index + 1) * 10}
                                    onChange={(event) => Number.isFinite(event.target.valueAsNumber) && save({ ...preferences,
                                        weights: { ...preferences.weights, [entry.id]: event.target.valueAsNumber } })} /></label>
                                <button className="button is-small" disabled={index === 0} aria-label={`Выше: ${entry.name}`} onClick={() => move(-1)}>↑</button>
                                <button className="button is-small" disabled={index === entries.length - 1} aria-label={`Ниже: ${entry.name}`} onClick={() => move(1)}>↓</button>
                                {entry.group && <button className="button is-small" onClick={() => save({ ...preferences,
                                    groups: preferences.groups.filter((group) => group.id !== entry.id),
                                    ungrouped: [...preferences.ungrouped, entry.id],
                                })}>Разъединить</button>}
                            </div>
                        </div>;
                    })}
                    <details className="layout-settings">
                        <summary>Объединить управление питанием</summary>
                        <form className="group-form" onSubmit={(event) => {
                            event.preventDefault();
                            if (!groupName.trim() || groupMembers.length < 2) return;
                            save({ ...preferences, groups: [...preferences.groups, { id: `group:${crypto.randomUUID()}`, name: groupName.trim(), deviceIds: groupMembers }] });
                            setGroupMembers([]); setGroupName('');
                        }}>
                            <label>Название группы<input className="input" value={groupName} required maxLength={80} onChange={(event) => setGroupName(event.target.value)} /></label>
                            {home.devices.filter((device) => capability(device, 'on_off') && !preferences.groups.some((group) => group.deviceIds.includes(device.id)))
                                .map((device) => <label key={device.id}>
                                    <input type="checkbox" checked={groupMembers.includes(device.id)} onChange={(event) => setGroupMembers(event.target.checked ? [...groupMembers, device.id] : groupMembers.filter((id) => id !== device.id))} />
                                    {' '}{deviceName(device)} · {roomName(device.room)}
                                </label>)}
                            <button className="button" disabled={!groupName.trim() || groupMembers.length < 2}>Создать группу</button>
                        </form>
                    </details>
                </details>
                <div className="device-grid">{visible.map((entry) => {
                    if (entry.group) return <article className="device-card" key={entry.id}><PowerGroup group={entry.group} devices={home.devices} /></article>;
                    const device = entry.device!;
                    const media = device.type.startsWith('devices.types.media_device') || !!capability(device, 'range', 'volume') || !!capability(device, 'toggle', 'pause');
                    return <article className="device-card" key={entry.id}>
                        {media ? <details className="universal-remote">
                            <summary>{entry.name}<span className="muted"> · {roomName(device.room)}</span></summary>
                            <div className="universal-remote__body"><CapabilityControls device={device} /></div>
                        </details> : <>
                            <h3>{entry.name}</h3><p className="device-room">{roomName(device.room)}</p>
                            <CapabilityControls device={device} />
                        </>}
                    </article>;
                })}</div>
                {!updated && loading && <p className="muted">Загрузка устройств…</p>}
                {updated && !visible.length && <p className="muted">Нет видимых устройств. Выберите их в настройках.</p>}
            </section>}
            {activeTab === 'scenarios' && <div id="scenarios-panel" role="tabpanel">
                <ScenariosPanel scenarios={home.scenarios} />
            </div>}
        </main>
    </CommandContext.Provider>;
}
export default function YandexSmartHomeApp() {
    const [token, setToken] = useState<string | null>(null);
    const [authError, setAuthError] = useState('');
    useEffect(() => {
        try {
            const hash = new URLSearchParams(window.location.hash.slice(1));
            const received = hash.get('access_token');
            if (received) {
                localStorage.setItem(TOKEN_KEY, received);
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            if (hash.has('error')) setAuthError('Яндекс не предоставил доступ. Попробуйте войти ещё раз.');
            setToken(received || localStorage.getItem(TOKEN_KEY));
        } catch { setAuthError('Разрешите хранение данных сайта для входа.'); }
    }, []);
    if (token) return <HomeDashboard token={token} onLogout={() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }} />;
    const clientId = import.meta.env.VITE_YANDEX_CLIENT_ID;
    const authUrl = new URL('https://oauth.yandex.ru/authorize');
    authUrl.search = new URLSearchParams({ response_type: 'token', client_id: clientId || '',
        redirect_uri: window.location.origin + window.location.pathname, scope: 'iot:view iot:control' }).toString();
    return <main className="mainApp login"><h1>Мой дом</h1><p>Войдите, чтобы управлять светом, климатом и приставкой.</p>
        {authError && <p role="alert">{authError}</p>}
        {clientId ? <a className="button is-link" href={authUrl.toString()}>Войти через Яндекс</a> :
            <p role="alert">Не настроен VITE_YANDEX_CLIENT_ID.</p>}
    </main>;
}
