import type { ReactNode } from 'react';
import { deviceName } from '../../model';
import './card-layout.css';

type Children = { children: ReactNode };
function CardLayoutRoot({ device, room, children }: { device: { id: string; name: string; aliases?: string[] | null }; room?: string; children?: ReactNode }) {
    return <div className="card-layout__root">
        <h2 className="card-layout__header">{deviceName(device)}</h2>
        {room && <p className="card-layout__room">{room}</p>}
        {children}
    </div>;
}
const Actions = ({ children }: Children) => <div className="card-layout__actions">{children}</div>;
export const CardLayout = Object.assign(CardLayoutRoot, { Actions });
