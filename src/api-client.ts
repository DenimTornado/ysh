import type { Action, Home } from './model';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value);

function checkErrors(value: unknown): void {
    if (!record(value)) return;
    if (value.error_code || value.status === 'error' || value.status === 'ERROR' || value.error) {
        throw new Error(typeof value.error_message === 'string' ? value.error_message :
            typeof value.error === 'string' ? value.error : `Ошибка команды: ${String(value.error_code ?? value.status)}`);
    }
    if (record(value.action_result)) {
        checkErrors(value.action_result);
        if (value.action_result.status !== 'DONE') throw new Error('Устройство не подтвердило выполнение команды.');
    }
    for (const key of ['state', 'payload']) {
        if (record(value[key])) checkErrors(value[key]);
    }
    for (const key of ['devices', 'capabilities', 'actions']) {
        if (Array.isArray(value[key])) value[key].forEach(checkErrors);
    }
}

export function createApiClient(url: string | undefined, getToken: () => string | null, fetcher: typeof fetch = fetch) {
    async function request(endpoint: string, payload?: unknown, signal?: AbortSignal) {
        if (!url) throw new Error('Не настроен адрес сервера VITE_API_URL.');
        const token = getToken();
        if (!token) throw new Error('Войдите через Яндекс.');
        const response = await fetcher(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, endpoint, ...(payload === undefined ? {} : { payload }) }),
            signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
        });
        if (!response.ok) {
            throw new Error(response.status === 401 || response.status === 403 ?
                'Доступ отклонён. Выйдите и снова войдите через Яндекс.' : `Сервер вернул ошибку ${response.status}.`);
        }
        let data: unknown;
        try { data = await response.json(); }
        catch { throw new Error('Сервер вернул некорректный ответ.'); }
        if (!record(data)) throw new Error('Сервер вернул некорректный ответ.');
        checkErrors(data);
        return data;
    }

    return {
        async getUserInfo(signal?: AbortSignal): Promise<Home> {
            const data = await request('user-info', undefined, signal);
            if (!Array.isArray(data.devices) || !Array.isArray(data.rooms) || !Array.isArray(data.scenarios)) {
                throw new Error('В ответе сервера отсутствуют устройства, комнаты или сценарии.');
            }
            if (!data.devices.every((item) => record(item) && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.type === 'string') ||
                ![...data.rooms, ...data.scenarios].every((item) => record(item) && typeof item.id === 'string' && typeof item.name === 'string')) {
                throw new Error('Сервер вернул некорректный список устройств.');
            }
            return data as unknown as Home;
        },
        async sendActions(devices: { id: string; actions: Action[] }[]) {
            if (!devices.length || devices.some((device) => !device.actions.length)) throw new Error('Нет доступных команд.');
            for (const device of devices) for (const { state } of device.actions) {
                const values = typeof state.value === 'object' ? Object.values(state.value) : [state.value];
                if (values.some((value) => typeof value === 'number' && !Number.isFinite(value))) {
                    throw new Error('Введите числовое значение.');
                }
            }
            await request('device-action', { devices });
        },
        async runScenario(id: string) { await request('run-scenario', { scenario_id: id }); },
    };
}
