const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'yandex_smart_home_token';

export const sendAction = async (
    capability: string,
    value: any,
    type: string = 'devices.capabilities.on_off',
    device: unknown
): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        console.error('No auth token found');
        return;
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                endpoint: 'device-action',
                payload: {
                    devices: [
                        {
                            id: device.id,
                            actions: [
                                {
                                    type,
                                    state: {
                                        instance: capability,
                                        value
                                    }
                                }
                            ]
                        }
                    ]
                }
            })
        });
    }
    catch (error) {
        console.error('sendAction error:', error);
    }
};

export const getUserInfo = async (): Promise<any | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, endpoint: 'user-info' })
        });
        const text = await response.text();
        return JSON.parse(text);
    }
    catch (error) {
        console.error('getUserInfo error:', error);
        return null;
    }
};

export const getScenarios = async (): Promise<any[] | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, endpoint: 'get-scenarios' })
        });
        const text = await response.text();
        const data = JSON.parse(text);
        return Array.isArray(data.scenarios) ? data.scenarios : null;
    }
    catch (error) {
        console.error('getScenarios error:', error);
        return null;
    }
};

export const runScenario = async (scenarioId: string): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                endpoint: 'run-scenario',
                payload: {
                    scenario_id: scenarioId
                }
            })
        });

        const text = await response.text();
        console.log('Scenario run result:', text);
    }
    catch (error) {
        console.error('runScenario error:', error);
    }
};

export const sendIrAction = async (): Promise<void> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        console.error('No auth token found');
        return;
    }

    try {
        await fetch('https://iot.quasar.yandex.ru/m/user/devices/d679f0a0-556d-4187-82bb-96f06707c276/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'actions': [
                    {
                        'type': 'devices.capabilities.custom.button',
                        'state': { 'instance': '1000001', 'value': true }
                    }
                ]
            })
        });
    }
    catch (error) {
        console.error('sendAction error:', error);
    }
};
