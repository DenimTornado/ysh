import type { DeviceProps } from '../model';
import { CardLayout } from './card-layout/card-layout';
import { ModeControl, PowerControl, RangeControl, ToggleControl } from './device-controls';

export default function KonditsionerComponent({ device, room }: DeviceProps) {
    const measured = device.properties?.find((item) => item.parameters.instance === 'temperature')?.state?.value;
    return <CardLayout device={device} room={room}>
        <PowerControl device={device} />
        {typeof measured === 'number' && <p className="muted">Датчик кондиционера: {measured} °C</p>}
        <RangeControl device={device} instance="temperature" label="Целевая температура, °C" />
        <ModeControl device={device} instance="thermostat" label="Режим работы" />
        <ModeControl device={device} instance="fan_speed" label="Скорость вентилятора" />
        <ModeControl device={device} instance="swing" label="Направление обдува" />
        <ToggleControl device={device} instance="backlight" label="Подсветка" />
    </CardLayout>;
}
