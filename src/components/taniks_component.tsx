import React from 'react';
import { sendAction, sendIrAction } from '../api';
import { CardLayout } from './card-layout/card-layout';
import homeIcon from '../assets/icons/home.png';
import pauseIcon from '../assets/icons/pause.png';
import Button from './button/button';

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
    // const sendPause = () => {
    //     fetch('https://functions.yandexcloud.net/d4eja6sthgsr6jbjrifg', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             token: localStorage.getItem('yandex_smart_home_token'),
    //             endpoint: 'device-action',
    //             payload: {
    //                 devices: [
    //                     {
    //                         id: device.id,
    //                         actions: [
    //                             {
    //                                 type: 'devices.capabilities.custom.button',
    //                                 state: {
    //                                     instance: '1000000',
    //                                     value: true
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             }
    //         })
    //     })
    //     .then((res) => res.text())
    //     .then(console.log)
    //     .catch(console.error);
    // };
    //
    // const setPause = () => {
    //     sendAction('1000000', true, 'devices.capabilities.custom.button', device);
    // }

    return (
        <CardLayout
            device={ device }
            room={ room }
        >
            <CardLayout.Actions>
                <h4>IR Команды:</h4>
                <div className="buttons">
                    <Button alt={ 'Mute' } onClick={ () => {sendAction('1000000', true, 'devices.capabilities.custom.button', device);} } icon={ pauseIcon }/>
                    <Button alt={ 'Mute' } onClick={ () => {sendAction('1000001', true, 'devices.capabilities.custom.button', device);} } icon={ homeIcon }/>
                    <Button alt={ 'Mute' } onClick={ () => { sendIrAction() } } icon={ homeIcon }/>

                {/*    runIrCommand*/}
                </div>
            </CardLayout.Actions>
        </CardLayout>
    );
};

export default TaniksComponent;
