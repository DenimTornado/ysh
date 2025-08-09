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

const DatchikKlimataComponent: React.FC<Props> = ({ device, room }) => {
    return (
        <div>
            <h3>{device.name}</h3>
            <p><strong>ID:</strong> {device.id}</p>
            <p><strong>Комната:</strong> {room}</p>

            {device.properties && device.properties.length > 0 && (
                <div>
                    <h4>Показания:</h4>
                    <ul>
                        {device.properties.map((prop, index) => (
                            prop.state?.value !== undefined && (
                                <li key={index}>
                                    {prop.parameters.instance}: {prop.state.value}
                                </li>
                            )
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DatchikKlimataComponent;
