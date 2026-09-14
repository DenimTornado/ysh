import { useEffect, useState } from 'react';
import 'bulma/css/bulma.min.css';
import './YandexSmartHomeApp.css';
import { runScenario, TOKEN_KEY } from './api';
import type { Device } from './model';
import { deviceName } from './model';
import { climateSensorId, deviceConfig, hallLightGroupId, hallLightIds, mergeLayout, waterGroupId, waterMeterIds } from './device-config';
import type { Layout } from './device-config';
import HallLight from './components/hall-light';
import { CommandContext } from './hooks/use-command';
import { useHome } from './hooks/use-home';
import { Navbar } from './components/navbar/navbar';
import LentaComponent from './components/lenta_component';
import KonditsionerComponent from './components/konditsioner_component';
import TvPristavkaComponent from './components/tv_pristavka_component';
import LampaComponent from './components/lampa_component';
import WaterMeters from './components/water-meters';
import { CardLayout } from './components/card-layout/card-layout';
import { ModeControl, PowerControl } from './components/device-controls';

const SETTINGS_KEY = 'yandex_smart_home_layout';
function readLayout(): Layout {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
        if (Array.isArray(parsed) && parsed.every((item) => typeof item?.id === 'string' && typeof item?.visible === 'boolean')) {
            return mergeLayout(parsed as Layout);
        }
    } catch { /* Повреждённые или недоступные настройки не должны блокировать пульт. */ }
    return deviceConfig;
}

function DeviceCard({ device, room }: { device: Device; room?: string }) {
    if (device.type === 'devices.types.light.strip') return <LentaComponent device={device} room={room} />;
    if (device.type === 'devices.types.thermostat.ac') return <KonditsionerComponent device={device} room={room} />;
    if (device.type === 'devices.types.media_device.tv_box') return <TvPristavkaComponent device={device} room={room} />;
    if (device.type === 'devices.types.humidifier') return <CardLayout device={device} room={room}>
        <p className="muted">Сезонное устройство. Включайте после подключения.</p>
        <PowerControl device={device} /><ModeControl device={device} instance="fan_speed" label="Интенсивность" />
    </CardLayout>;
    return <LampaComponent device={device} room={room} />;
}

function HomeDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
    const { home, busy, loading, error, updated, refresh, execute } = useHome(token);
    const [savedLayout, setLayout] = useState(readLayout);
    const layout = mergeLayout(savedLayout);
    const [settingsError, setSettingsError] = useState('');
    const saveLayout = (next: Layout) => {
        setLayout(next);
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); setSettingsError(''); }
        catch { setSettingsError('Настройки изменены только для этой вкладки: сохранение недоступно.'); }
    };
    const hallLights = home.devices.filter((device) => hallLightIds.includes(device.id));
    const waterDevices = home.devices.filter((device) => waterMeterIds.includes(device.id));
    const displayDevices: Device[] = [
        ...home.devices.filter((device) => !hallLightIds.includes(device.id) && !waterMeterIds.includes(device.id)),
        ...(waterDevices.length ? [{ id: waterGroupId, name: 'Показания воды', type: 'local.water_group' }] : []),
        ...(hallLights.length ? [{ id: hallLightGroupId, name: 'Свет в зале', type: 'local.light_group' }] : []),
    ];
    const visibleDevices = layout.filter((item) => item.visible).flatMap((item) => {
        const device = displayDevices.find((device) => device.id === item.id);
        return device ? [device] : [];
    });
    const remotes = visibleDevices.filter((device) => device.type === 'devices.types.media_device.tv_box');
    const pinnedIds = [waterGroupId, ...displayDevices.filter((device) => device.type === 'devices.types.media_device.tv_box').map((device) => device.id)];
    const meters = visibleDevices.some((device) => device.id === waterGroupId) ? waterDevices : [];
    const availableLayout = layout.filter((item) => displayDevices.some((device) => device.id === item.id));
    const cardLayout = availableLayout.filter((item) => !pinnedIds.includes(item.id));
    const settingsLayout = [...pinnedIds.flatMap((id) => availableLayout.filter((item) => item.id === id)), ...cardLayout];
    const activeScenarios = home.scenarios.filter((scenario) => scenario.is_active !== false);
    const inactiveScenarios = home.scenarios.filter((scenario) => scenario.is_active === false);
    return <CommandContext.Provider value={{ busy, execute }}>
        <main className="mainApp">
            <Navbar device={home.devices.find((device) => device.id === climateSensorId)} onLogout={onLogout}
                onRefresh={() => void refresh()} loading={loading} busy={busy} />
            {error && <p className="notification is-danger is-light" role="alert">{error}</p>}
            {meters.length > 0 && <details className="water-details">
                <summary>Показания воды</summary>
                <WaterMeters devices={meters} />
            </details>}
            {remotes.map((device) => <TvPristavkaComponent key={device.id} device={device} />)}
            <details className="layout-settings">
                <summary>Настроить главный экран</summary>
                <p className="muted">Видимость и порядок сохраняются в этом браузере. Увлажнитель можно вернуть на зиму.</p>
                {settingsLayout.map((item) => {
                    const device = displayDevices.find((device) => device.id === item.id);
                    if (!device) return null;
                    const index = cardLayout.findIndex((entry) => entry.id === item.id);
                    const name = deviceName(device);
                    const move = (offset: number) => {
                        const next = [...layout];
                        const current = next.findIndex((entry) => entry.id === item.id);
                        const target = next.findIndex((entry) => entry.id === cardLayout[index + offset].id);
                        [next[current], next[target]] = [next[target], next[current]];
                        saveLayout(next);
                    };
                    return <div className="settings-row" key={item.id}>
                        <label><input type="checkbox" checked={item.visible} onChange={(event) => saveLayout(layout.map((entry) =>
                            entry.id === item.id ? { ...entry, visible: event.target.checked } : entry))} /> {name}</label>
                        {!pinnedIds.includes(item.id) && <div className="buttons">
                            <button className="button is-small" disabled={index === 0} aria-label={`Выше: ${name}`} onClick={() => move(-1)}>↑</button>
                            <button className="button is-small" disabled={index === cardLayout.length - 1} aria-label={`Ниже: ${name}`} onClick={() => move(1)}>↓</button>
                        </div>}
                    </div>;
                })}
                {settingsError && <p role="alert">{settingsError}</p>}
            </details>
            <div className="device-grid">
                {visibleDevices.filter((device) => !pinnedIds.includes(device.id)).map((device) => <section className="device-card" key={device.id}>
                    {device.id === hallLightGroupId ? <HallLight devices={hallLights} /> :
                        <DeviceCard device={device} room={home.rooms.find((room) => room.id === device.room)?.name} />}
                </section>)}
            </div>
            {updated && visibleDevices.length === 0 && <p>На главном экране нет устройств. Проверьте настройки видимости.</p>}
            {activeScenarios.length > 0 && <section className="scenarios">
                <h2>Сценарии</h2>
                <div className="buttons">{activeScenarios.map((scenario) => <button key={scenario.id} className="button" disabled={busy}
                    onClick={() => void execute(() => runScenario(scenario.id))}>{scenario.name}</button>)}</div>
            </section>}
            {inactiveScenarios.length > 0 && <details className="layout-settings"><summary>Неактивные сценарии · {inactiveScenarios.length}</summary>
                <p className="muted">Отключены в Яндексе. Для возвращения сезонного управления включите нужные сценарии в «Доме с Алисой».</p>
                <ul>{inactiveScenarios.map((scenario) => <li key={scenario.id}>{scenario.name}</li>)}</ul>
            </details>}
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
