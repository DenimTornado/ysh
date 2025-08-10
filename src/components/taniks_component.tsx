import React from 'react';
import { sendAction } from '../api';
import { CardLayout } from './card-layout/card-layout';

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
                                        value: true
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

    const setPause = () => {
        sendAction('1000000', true, 'devices.capabilities.custom.button', device);
    }

    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>IR Команды:</h4>
                <button className={ 'button' } onClick={ setPause }>Пауза</button>
                <button className={ 'button' } onClick={ sendPause }>Пауза</button>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default TaniksComponent;
