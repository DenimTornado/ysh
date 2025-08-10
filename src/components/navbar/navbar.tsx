import * as React from 'react';
import homeIcon from '../../assets/icons/home.png'
import { createCn } from 'bem-react-classname';
import './navbar.css';

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

const cn = createCn('navbar');

const dataMap = {
    battery_level: { value: 'Заряд', units: '%' },
    temperature: { value: 'Температура', units: '°C' },
    humidity: { value: 'Влажность', units: '%' },
    pressure: { value: 'Давление', units: 'мм рт. ст.' }
}

export const Navbar: React.FC<Props> = ({ device }) => {
    const logout = () => {
        localStorage.removeItem('yandex_smart_home_token');
        window.location.reload();
    }

    const logoutButton = <button className={ 'button is-danger has-background-danger has-text-white' }
                                 onClick={ logout }>Выйти</button>;

    return <React.Fragment>
        <div className={ cn() }>
            <div className={ cn('brand') }>
                <img src={ homeIcon } alt="Home"/>

                <div className={ cn('mobile-logout') }>
                    { logoutButton }
                </div>
            </div>

            <div className={ cn('content') }>
                { device.properties && device.properties.map((prop, index) => (
                    prop.state?.value !== undefined && (
                        <div key={ index }>
                            { dataMap[prop.parameters.instance].value }: { prop.state.value.toFixed(
                            2) }{ dataMap[prop.parameters.instance].units }
                        </div>
                    )
                )) }

                <div className={ cn('logout') }>
                    { logoutButton }
                </div>
            </div>
        </div>
    </React.Fragment>
}
