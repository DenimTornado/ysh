import type { DeviceProps } from '../model';
import { CardLayout } from './card-layout/card-layout';
import { PowerControl } from './device-controls';

export default function LampaComponent({ device, room }: DeviceProps) {
    return <CardLayout device={device} room={room}><PowerControl device={device} /></CardLayout>;
}
