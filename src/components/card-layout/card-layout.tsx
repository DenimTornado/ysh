import React, { ReactNode } from 'react';
import { createCn } from 'bem-react-classname';
import './card-layout.css';

interface Device {
    id: string;
    name: string;
}

interface CardLayoutRootProps {
    device: Device;
    room?: string;
    children?: ReactNode; // сюда пойдут кастомные actions
}

const cn = createCn('card-layout');

const CardLayoutRoot: React.FC<CardLayoutRootProps> = ({ device, room, children }) => {
    return (
        <div className={ cn('root') }>
            <CardLayout.Header>{ device.name }</CardLayout.Header>
            <CardLayout.Content>
                { room && <div>Комната: <span className={cn('room')}>{ room }</span></div> }
            </CardLayout.Content>
            { children }
            <CardLayout.Id>{ device.id }</CardLayout.Id>
        </div>
    );
};

const Header: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className={ cn('header') }>
        { children }
    </div>
);

const Content: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className={ cn('content') }>
        { children }
    </div>
);

const Actions: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className={ cn('actions') }>
        { children }
    </div>
);

const Id: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className={ cn('id') }>
        ID: { children }
    </div>
);

export const CardLayout = Object.assign(CardLayoutRoot, {
    Header,
    Content,
    Actions,
    Id
});
