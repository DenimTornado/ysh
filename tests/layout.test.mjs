import test from 'node:test';
import assert from 'node:assert/strict';
import { hallLightGroupId, hallLightIds, mergeLayout, waterGroupId, waterMeterIds } from '../src/device-config.ts';

test('saved switch cards become one hall card at the same position', () => {
    const layout = mergeLayout([
        { id: 'before', visible: true },
        { id: hallLightIds[0], visible: false },
        { id: hallLightIds[1], visible: true },
        { id: 'after', visible: true },
    ]);
    assert.deepEqual(layout.slice(0, 3), [
        { id: 'before', visible: true }, { id: hallLightGroupId, visible: true }, { id: 'after', visible: true },
    ]);
    assert.ok(!layout.some((item) => hallLightIds.includes(item.id)));
});

test('hidden switches stay hidden and a saved group preference takes precedence', () => {
    const hidden = hallLightIds.map((id) => ({ id, visible: false }));
    assert.equal(mergeLayout(hidden).find((item) => item.id === hallLightGroupId).visible, false);
    const layout = mergeLayout([{ id: hallLightGroupId, visible: false }, ...hallLightIds.map((id) => ({ id, visible: true }))]);
    assert.equal(layout.filter((item) => item.id === hallLightGroupId).length, 1);
    assert.equal(layout.find((item) => item.id === hallLightGroupId).visible, false);
});

test('legacy water entries normalize to one stable group during repeated renders', () => {
    const legacy = waterMeterIds.map((id) => ({ id, visible: true }));
    const migrated = mergeLayout(legacy);
    assert.deepEqual(migrated.filter((item) => item.id === waterGroupId), [{ id: waterGroupId, visible: true }]);
    assert.ok(!migrated.some((item) => waterMeterIds.includes(item.id)));
    assert.deepEqual(mergeLayout(migrated), migrated);
});
