import { useState } from 'react';
import type { Device } from '../model';
import { updatedAt } from '../model';

export default function WaterMeters({ devices }: { devices: Device[] }) {
    const [message, setMessage] = useState('');
    const readings = devices.map((device) => {
        const property = device.properties?.find((item) => item.parameters.instance === 'water_meter');
        const value = property?.state?.value;
        return { id: device.id, name: device.name, date: updatedAt(property?.last_updated),
            value: typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : null };
    });
    return <div className="card-layout__root">
        {readings.map((reading) => <div className="meter-reading" key={reading.id}>
            <span>{reading.name}</span><strong>{reading.value ? `${reading.value} м³` : 'Нет показаний'}</strong><small>{reading.date}</small>
        </div>)}
        <button className="button" disabled={!readings.some((reading) => reading.value !== null)} onClick={async () => {
            try {
                await navigator.clipboard.writeText(readings.filter((reading) => reading.value !== null)
                    .map((reading) => `${reading.name}: ${reading.value} м³`).join('\n'));
                setMessage('Показания скопированы');
            } catch { setMessage('Не удалось скопировать. Выделите показания вручную.'); }
        }}>Скопировать показания</button>
        <p role="status">{message}</p>
    </div>;
}
