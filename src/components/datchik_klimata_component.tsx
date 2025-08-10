import React from 'react';
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

const dataMap = {
    battery_level: 'Заряд',
    temperature: 'Температура',
    humidity: 'Влажность',
    pressure: 'Давление'
}

const DatchikKlimataComponent: React.FC<Props> = ({ device, room }) => {
    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>Показания:</h4>
                <ul>
                    { device.properties.map((prop, index) => (
                        prop.state?.value !== undefined && (
                            <li key={ index }>
                                { dataMap[prop.parameters.instance] }: { prop.state.value.toFixed(2) }
                            </li>
                        )
                    )) }
                </ul>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default DatchikKlimataComponent;
