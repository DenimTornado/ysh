import React, { useEffect, useState } from 'react';
import { sendAction } from '../api';
import { CardLayout } from './card-layout/card-layout';
import minusIcon from '../assets/icons/minus.png';
import plusIcon from '../assets/icons/plus.png';
import muteIcon from '../assets/icons/mute.png';
import Button from './button/button';
import CustomInput from './custom-input/custom-input';

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

    const handleVolumeChange = (delta: number) => {
        const newVal = volume + delta;
        setVolume(newVal);
        sendAction('volume', newVal, 'devices.capabilities.range', device);
    };

    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>Управление звуком:</h4>
                <div className="buttons">
                    <Button alt={ 'Mute' } onClick={ () => handleVolumeChange(+5) } icon={ plusIcon }/>
                    <Button alt={ 'Mute' } onClick={ () => handleVolumeChange(-5) } icon={ minusIcon }/>
                    <Button alt={ 'Mute' }
                            onClick={ () => sendAction('mute', true, 'devices.capabilities.toggle', device) }
                            icon={ muteIcon }/>
                </div>

                <CustomInput
                    value={ volume }
                    onChange={
                        (e) => {
                            const newVal = parseInt(e.target.value) || 0;
                            setVolume(newVal);
                            sendAction('volume', newVal, 'devices.capabilities.range', device);
                        }
                    }
                    onClick={
                        () => sendAction('volume', volume, 'devices.capabilities.range',
                            device)
                    }/>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default TelevizorComponent;
