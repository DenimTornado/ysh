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

const TelevizorComponent: React.FC<Props> = ({ device, room }) => {
    const getInitialVolume = (): number => {
        const volCap = device.capabilities?.find(
            (c) => c.parameters.instance === 'volume' && typeof c.state?.value === 'number'
        );
        return volCap?.state?.value ?? 50;
    };

    const [volume, setVolume] = useState<number>(getInitialVolume);

    useEffect(() => {
        setVolume(getInitialVolume());
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
                                        value
                                    }
                                }
                            ]
                        }
                    ]
                }
            })
        })
        .then((res) => res.text())
        .then(console.log)
        .catch(console.error);
    };

    const handleVolumeChange = (delta: number) => {
        const newVal = Math.max(0, Math.min(100, volume + delta));
        setVolume(newVal);
        sendAction('volume', newVal);
    };

    return (
        <div>
            <h3>{ device.name }</h3>
            <p><strong>ID:</strong> { device.id }</p>
            <p><strong>Комната:</strong> { room }</p>

            <div className={'buttons are-small'}>
                <h4>Управление звуком:</h4>
                <button className={'button'} onClick={ () => handleVolumeChange(+5) }>Громкость +5</button>
                <button className={'button'} onClick={ () => handleVolumeChange(-5) }>Громкость -5</button>
                <div>
                    <label>
                        Установить громкость:
                        <input
                            className={'input mb-2'}
                            type="number"
                            value={ volume }
                            onChange={ (e) => {
                                const newVal = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                setVolume(newVal);
                                sendAction('volume', newVal);
                            } }
                            min={ 0 }
                            max={ 100 }
                        />
                    </label>
                    <button className={'button'} onClick={ () => sendAction('volume', volume) }>Применить</button>
                </div>
                <button className={'button'} onClick={ () => sendAction('mute', true, 'devices.capabilities.toggle') }>Mute</button>
            </div>
        </div>
    );
};

export default TelevizorComponent;
