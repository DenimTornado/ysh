export const waterGroupId = 'water-meters';
export const waterMeterIds = ['2408c45d-0099-45e0-9206-9a2f99aa9968', 'd36c540a-fe8b-4fba-a9c4-2c8543a56057'];
export const hallLightGroupId = 'hall-light';
export const hallLightIds = [
    '8166152c-f343-4796-9e77-f8b937598939',
    '7679e9ac-eb79-4d87-9ac5-ec5e56b5e778',
];

export const deviceConfig = [
    { id: '8ccb68e1-4ddb-470a-9ccd-7d91685a4946', visible: true },
    { id: 'd1e02587-9d72-4b11-9518-c69799732a72', visible: true },
    { id: '2a02257c-86a5-4f4a-8772-2c3de32e4e11', visible: true },
    { id: hallLightGroupId, visible: true },
    { id: 'ba0deb1c-aa2b-4adc-8d58-4103917f8240', visible: true },
    { id: waterGroupId, visible: true },
    { id: '129d3f81-efb7-4dbb-8c77-893ad20f33c9', visible: false },
];
export const climateSensorId = '0f3ed5ec-9765-48dc-a2db-96c40de94455';

export type Layout = { id: string; visible: boolean }[];

export function mergeLayout(saved: Layout): Layout {
    let migrated = saved;
    for (const [groupId, memberIds] of [[hallLightGroupId, hallLightIds], [waterGroupId, waterMeterIds]] as const) {
        const group = migrated.find((item) => item.id === groupId);
        const visible = migrated.some((item) => memberIds.includes(item.id) && item.visible);
        migrated = migrated.flatMap((item) => {
            if (!memberIds.includes(item.id)) return [item];
            return group ? [] : [{ id: groupId, visible }];
        });
    }
    const unique = migrated.filter((item, index) => migrated.findIndex((other) => other.id === item.id) === index);
    return [...unique, ...deviceConfig.filter((item) => !unique.some((saved) => saved.id === item.id))];
}
