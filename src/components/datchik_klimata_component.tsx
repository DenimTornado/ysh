import type { DeviceProps } from '../model';
import { updatedAt } from '../model';
import { CardLayout } from './card-layout/card-layout';

const properties: Record<string, { label: string; unit: string; digits: number }> = {
    temperature: { label: 'Температура', unit: '°C', digits: 1 },
    humidity: { label: 'Влажность', unit: '%', digits: 1 },
    pressure: { label: 'Давление', unit: 'мм рт. ст.', digits: 0 },
    battery_level: { label: 'Батарея', unit: '%', digits: 0 },
};

export function ClimateReadings({ device }: DeviceProps) {
    return <div className="climate-readings">{device.properties?.map((property) => {
        const description = properties[property.parameters.instance];
        const value = property.state?.value;
        if (!description || typeof value !== 'number' || !Number.isFinite(value)) return null;
        return <div key={property.parameters.instance}>
            <span>{description.label}</span>
            <strong>{value.toLocaleString('ru-RU', { maximumFractionDigits: description.digits })} {description.unit}</strong>
            <small>{updatedAt(property.last_updated)}</small>
        </div>;
    })}</div>;
}

export default function DatchikKlimataComponent({ device, room }: DeviceProps) {
    return <CardLayout device={device} room={room}><ClimateReadings device={device} /></CardLayout>;
}
