import type { Device } from '../../model';
import { ClimateReadings } from '../datchik_klimata_component';
import './navbar.css';

export function Navbar({ device, onLogout, onRefresh, loading, busy }: {
    device?: Device;
    onLogout: () => void;
    onRefresh: () => void;
    loading: boolean;
    busy: boolean;
}) {
    return <header className="home-header">
        {device && <ClimateReadings device={device} />}
        <div className="buttons">
            <button className="button" disabled={loading || busy} onClick={onRefresh}>
                {loading ? 'Обновление…' : 'Обновить'}
            </button>
            <button className="button" onClick={onLogout}>Выйти</button>
        </div>
    </header>;
}
