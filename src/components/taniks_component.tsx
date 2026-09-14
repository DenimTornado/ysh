import type { DeviceProps } from '../model';
import { CardLayout } from './card-layout/card-layout';

export default function TaniksComponent({ device, room }: DeviceProps) {
    return <CardLayout device={device} room={room}>
        <p>Используйте сохранённый сценарий «Бокс пауза». Прямые ИК-команды этого устройства не подтверждены.</p>
    </CardLayout>;
}
