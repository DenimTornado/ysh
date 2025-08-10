import React, { useState } from 'react';
import { CardLayout } from './card-layout/card-layout';
import Button from './button/button';
import plusIcon from '../assets/icons/plus.png';
import minusIcon from '../assets/icons/minus.png';
import { sendAction } from '../api';
import muteIcon from '../assets/icons/mute.png';
import pauseIcon from '../assets/icons/pause.png';
import CustomInput from './custom-input/custom-input';

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

const TvPristavkaComponent: React.FC<Props> = ({ device, room }) => {
    const [volume, setVolume] = useState<number>(50);

    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>Управление звуком:</h4>

                <div className="buttons">
                    <Button alt={ 'Mute' }
                            onClick={ () => sendAction('volume', volume + 5, 'devices.capabilities.range', device) }
                            icon={ plusIcon }/>
                    <Button alt={ 'Mute' }
                            onClick={ () => sendAction('volume', volume - 5, 'devices.capabilities.range', device) }
                            icon={ minusIcon }/>
                    <Button alt={ 'Mute' }
                            onClick={ () => sendAction('mute', true, 'devices.capabilities.toggle', device) }
                            icon={ muteIcon }/>
                    <Button alt={ 'Mute' }
                            onClick={ () => sendAction('pause', true, 'devices.capabilities.toggle', device) }
                            icon={ pauseIcon }/>
                </div>

                <CustomInput
                    value={ volume }
                    onChange={
                        (e) => setVolume(parseInt(e.target.value) || 0)
                    }
                    onClick={
                        () => sendAction('volume', volume, 'devices.capabilities.toggle',
                            device)
                    }/>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default TvPristavkaComponent;
