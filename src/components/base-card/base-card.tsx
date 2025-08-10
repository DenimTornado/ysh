import React, { useCallback, useEffect, useState } from 'react';
import switchOffIcon from '../assets/icons/poweroff.png';
import switchOnIcon from '../assets/icons/poweron.png';
import { createCn } from 'bem-react-classname';
import { sendAction } from '../../api';
import { CardLayout } from '../card-layout/card-layout';
import Button from '../button/button';

import 'base-card.css';

const cn = createCn('base-card');

type Property = {
    type: string;
    parameters: { instance: string };
    state?: {
        instance: any;
        value: any;
    };
};

type Capability = {
    type: string;
    parameters: { instance: string };
    state?: {
        instance: any;
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

const BaseCard: React.FC<Props> = ({ device, room }) => {
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

    useEffect(() => {
        setPowered(getInitialState());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.capabilities]);

    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>Управление температурой:</h4>
                <div className={ cn('buttons') }>
                    <Button alt={ 'Mute' } onClick={ setStatus } icon={ powered ? switchOffIcon : switchOnIcon }/>
                </div>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default BaseCard;
