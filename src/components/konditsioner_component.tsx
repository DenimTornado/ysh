import React, { useCallback, useEffect, useState } from 'react';
import { sendAction } from '../api';
import { CardLayout } from './card-layout/card-layout';
import Button from './button/button';
import switchOffIcon from '../assets/icons/poweroff.png';
import switchOnIcon from '../assets/icons/poweron.png';
import plusIcon from '../assets/icons/plus.png';
import minusIcon from '../assets/icons/minus.png';
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

const KonditsionerComponent: React.FC<Props> = ({ device, room }) => {
    const getInitialState = (): number => {
        const tempCap = device.capabilities?.find(
            (c) => {
                return c.state.instance === 'on' && typeof c.state?.value === 'boolean'
            }
        );
        return tempCap?.state?.value;
    };

    const [powered, setPowered] = useState<boolean>(getInitialState);

    const setStatus = useCallback(() => {
        sendAction('on', !powered, 'devices.capabilities.on_off', device);
        setPowered((prev) => !prev);
    }, [powered]);

    const getInitialTemperature = (): number => {
        const tempCap = device.capabilities?.find(
            (c) => c.parameters.instance === 'temperature' && typeof c.state?.value === 'number'
        );
        return tempCap?.state?.value;
    };

    const [temperature, setTemperature] = useState<number>(getInitialTemperature);

    const setTemperatureByOne = useCallback((direction: 'up' | 'down') => {
        const currentValue = direction === 'up' ? temperature + 1 : temperature - 1;
        sendAction('temperature', currentValue, 'devices.capabilities.range', device);
        setTemperature(currentValue);
    }, [temperature])

    useEffect(() => {
        setTemperature(getInitialTemperature());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.capabilities]);

    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>Управление температурой:</h4>
                <div className="buttons">
                    <Button alt={ 'Mute' } onClick={ () => {setTemperatureByOne('up')} } icon={ plusIcon }/>
                    <Button alt={ 'Mute' } onClick={ () => {setTemperatureByOne('down')}  } icon={ minusIcon }/>
                    <Button alt={ 'Mute' } onClick={ setStatus } icon={ powered ? switchOffIcon : switchOnIcon }/>
                </div>

                <CustomInput
                    value={ temperature }
                    onChange={
                        (e) => setTemperature(parseInt(e.target.value))
                    }
                    onClick={
                        () => sendAction('temperature', temperature, 'devices.capabilities.range',
                            device)
                    }/>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default KonditsionerComponent;
