import React from 'react';

type Property = {
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
};

type Props = {
    device: Device;
    room?: string;
};

const TaniksComponent: React.FC<Props> = ({ device, room }) => {
    const sendPause = () => {
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
                                    type: 'devices.capabilities.custom.button',
                                    state: {
                                        instance: '1000000',
                                        value: true,
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
                <h4>IR Команды:</h4>
                <button className={'button'} onClick={sendPause}>Пауза</button>
            </div>
        </div>
    );
};

export default TaniksComponent;
