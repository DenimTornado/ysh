// YandexSmartHomeApp.tsx
import React, { useEffect, useState } from 'react';
import TelevizorComponent from './components/televizor_component';
import TvPristavkaComponent from './components/tv_pristavka_component';
import TaniksComponent from './components/taniks_component';
import KonditsionerComponent from './components/konditsioner_component';
import DatchikKlimataComponent from './components/datchik_klimata_component';
import { getUserInfo } from './api';
import 'bulma/css/bulma.min.css';

import './YandexSmartHomeApp.css';

const CLIENT_ID = '5ed1511c7dc34170897c9bf024cd4bb1';
const REDIRECT_URI = window.location.href;
const SCOPE = 'iot:view iot:control';

const devicesMap = {
    'datchikKlimata': { id: '0f3ed5ec-9765-48dc-a2db-96c40de94455', enabled: true, weight: 5 },
    'tvPristavka': { id: '2a02257c-86a5-4f4a-8772-2c3de32e4e11', enabled: true, weight: 2 },
    'lampa': { id: '5d97750c-b5b2-432e-b27c-921d9677c5ae', enabled: false, weight: 0 },
    'pravyiVyklyuchatel': { id: '7679e9ac-eb79-4d87-9ac5-ec5e56b5e778', enabled: false, weight: 0 },
    'levyiVyklyuchatel': { id: '8166152c-f343-4796-9e77-f8b937598939', enabled: false, weight: 0 },
    'khab': { id: 'ac7a7525-5a0f-411b-a1ad-0f07b17b88d4', enabled: false, weight: 0 },
    'televizor': { id: 'b363271e-4ff4-40fc-8dfb-32f9fecf572f', enabled: true, weight: 1 },
    'konditsioner': { id: 'd1e02587-9d72-4b11-9518-c69799732a72', enabled: true, weight: 4 },
    'taniks': { id: 'd679f0a0-556d-4187-82bb-96f06707c276', enabled: true, weight: 3 },
    'stantsiyaMini3': { id: 'ff9370f7-daca-4951-b477-b45ab10aa8b5', enabled: false, weight: 0 },
    'pereklyuchatel': { id: 'ba0deb1c-aa2b-4adc-8d58-4103917f8240', enabled: false, weight: 0 }
};

const getRoomName = (rooms: Room[], roomId?: string): string => {
    if (!roomId) {
        return '';
    }
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : '';
};

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
    room?: string;
    properties?: Property[];
};

type Room = {
    id: string;
    name: string;
};

type Scenario = {
    id: string;
    name: string;
};

export default function YandexSmartHomeApp() {
    const [token, setToken] = useState<string | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);

    useEffect(() => {
        const hash = new URLSearchParams(window.location.hash.replace('#', '?'));
        const accessToken = hash.get('access_token');
        if (accessToken) {
            setToken(accessToken);
            localStorage.setItem('yandex_smart_home_token', accessToken);
            window.history.replaceState(null, '', window.location.pathname);
            return;
        }

        const storedToken = localStorage.getItem('yandex_smart_home_token');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        if (!token) {
            return;
        }

        getUserInfo().then((data) => {
            if (!data) {
                return;
            }
            if (Array.isArray(data.devices)) {
                setDevices(data.devices);
            }
            if (Array.isArray(data.rooms)) {
                setRooms(data.rooms);
            }
            if (Array.isArray(data.scenarios)) {
                setScenarios(data.scenarios);
            }
        });
    }, [token]);

    if (!token) {
        const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${ CLIENT_ID }&redirect_uri=${ REDIRECT_URI }&scope=${ encodeURIComponent(
            SCOPE) }`;
        return (
            <div>
                <h2>Авторизация в Яндексе</h2>
                <a href={ authUrl }>Войти через Яндекс</a>
            </div>
        );
    }

    const visibleDevices = Object.entries(devicesMap)
    .filter(([_, meta]) => meta.enabled)
    .sort((a, b) => a[1].weight - b[1].weight)
    .map(([key, meta]) => devices.find((d) => d.id === meta.id))
    .filter((d): d is Device => !!d);

    return (
        <div>
            <h2>Ваши устройства</h2>
            <div className="device-grid">

                { visibleDevices.map((device) => {
                    const room = getRoomName(rooms, device.room);
                    switch (device.id) {
                        case devicesMap.televizor.id:
                            return <div key={ device.id }><TelevizorComponent device={ device } room={ room }/></div>;
                        case devicesMap.tvPristavka.id:
                            return <div key={ device.id }><TvPristavkaComponent device={ device } room={ room }/></div>;
                        case devicesMap.taniks.id:
                            return <div key={ device.id }><TaniksComponent device={ device } room={ room }/></div>;
                        case devicesMap.konditsioner.id:
                            return <div key={ device.id }><KonditsionerComponent device={ device } room={ room }/>
                            </div>;
                        case devicesMap.datchikKlimata.id:
                            return <div key={ device.id }><DatchikKlimataComponent device={ device } room={ room }/>
                            </div>;
                        default:
                            return (
                                <div className="device-card" key={ device.id }>
                                    <h3>{ device.name }</h3>
                                    <p><strong>ID:</strong> { device.id }</p>
                                    <p><strong>Комната:</strong> { room }</p>
                                </div>
                            );
                    }
                }) }
            </div>

            <h2>Сценарии</h2>
            { scenarios.length > 0 ? (
                <ul>
                    { scenarios.map((s) => (
                        <li key={ s.id }>
                            <strong>{ s.name }</strong> (ID: { s.id })
                        </li>
                    )) }
                </ul>
            ) : (
                <p>Сценарии не найдены.</p>
            ) }
        </div>
    );
}
