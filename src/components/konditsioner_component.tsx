import React, { useEffect, useState } from 'react';

type Property = {
    type: string;
    parameters: { instance: string };
    state?: {
        instance: string;
        value: any;
    };
};

type Capability = {
    type: string;
    parameters: { instance: string };
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

const KonditsionerComponent: React.FC<Props> = ({ device, room }) => {
    const getInitialTemperature = (): number => {
        const tempCap = device.capabilities?.find(
            (c) => c.parameters.instance === 'temperature' && typeof c.state?.value === 'number'
        );
        return tempCap?.state?.value ?? 24;
    };

    const [temperature, setTemperature] = useState<number>(getInitialTemperature);

    useEffect(() => {
        setTemperature(getInitialTemperature());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.capabilities]);

    const sendAction = (capability: string, value: any, type = 'devices.capabilities.range') => {
        fetch('https://functions.yandexcloud.net/d4eja6sthgsr6jbjrifg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: localStorage.getItem('yandex_smart_home_token'),
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
                                        value,
                                    },
                                },
                            ],
                        },
                    ],
                },
            }),
        })
        .then((res) => res.text())
        .then(console.log)
        .catch(console.error);
    };

    return (
        <div>
            <h3>{device.name}</h3>
            <p><strong>ID:</strong> {device.id}</p>
            <p><strong>Комната:</strong> {room}</p>

            <div className={'buttons are-small'}>
                <h4>Управление температурой:</h4>
                <button className={'button'} onClick={() => setTemperature((prev) => Math.max(16, prev - 1))}>−1</button>
                <button className={'button'} onClick={() => setTemperature((prev) => Math.min(30, prev + 1))}>+1</button>
                <div>
                    <label>
                        Установить:
                        <input
                            className={'input'}
                            type="number"
                            value={temperature}
                            onChange={(e) => setTemperature(Math.max(16, Math.min(30, parseInt(e.target.value) || 16)))}
                            min={16}
                            max={30}
                        />
                    </label>
                    <button onClick={() => sendAction('temperature', temperature)}>Применить</button>
                </div>
                <div>
                    <button onClick={() => sendAction('on', true, 'devices.capabilities.on_off')}>Включить</button>
                    <button onClick={() => sendAction('on', false, 'devices.capabilities.on_off')}>Выключить</button>
                </div>
            </div>
        </div>
    );
};

export default KonditsionerComponent;
