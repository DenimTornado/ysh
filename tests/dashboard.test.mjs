import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardEntries, discoverPowerGroups, emptyPreferences, readings, formatReading, parsePreferences, defaultVisible } from '../src/dashboard-model.ts';
import { deviceAliases, deviceName } from '../src/model.ts';
const power = { type: 'devices.capabilities.on_off', state: { instance: 'on', value: false } };
const device = (id, extra = {}) => ({ id, name: id, type: 'devices.types.light', capabilities: [power], ...extra });
const home = (devices) => ({ devices, rooms: [{ id: 'room', name: 'Зал' }], scenarios: [] });

test('any new device ID appears without a code change and saved order is retained', () => {
    const data = home([device('new-light'), device('old-light'), device('new-vacuum', { type: 'devices.types.vacuum_cleaner' })]);
    const entries = dashboardEntries(data, { ...emptyPreferences, order: ['old-light'] });
    assert.deepEqual(entries.map((entry) => entry.id), ['old-light', 'new-light', 'new-vacuum']);
});

test('absolute weights take precedence over saved device and sensor order', () => {
    const properties = [
        { type: 'devices.properties.float', parameters: { instance: 'temperature' }, state: { value: 20 } },
        { type: 'devices.properties.float', parameters: { instance: 'humidity' }, state: { value: 40 } },
    ];
    const data = home([device('first', { properties }), device('second')]);
    assert.deepEqual(dashboardEntries(data, { ...emptyPreferences, order: ['first'], weights: { second: 1, first: 50 } })
        .map((entry) => entry.id), ['second', 'first']);
    const sensors = readings(data);
    assert.deepEqual(readings(data, sensors.map((item) => item.id), { [sensors[1].id]: 1, [sensors[0].id]: 50 })
        .map((item) => item.id), [sensors[1].id, sensors[0].id]);
});

test('all measurements, including null, zero, event and unknown types, have distinct stable IDs', () => {
    const properties = [
        { type: 'devices.properties.float', parameters: { instance: 'temperature', unit: 'unit.temperature.celsius' }, state: { value: 0 } },
        { type: 'devices.properties.float', parameters: { instance: 'new_sensor' }, state: null },
        { type: 'devices.properties.event', parameters: { instance: 'open' }, state: { value: 'opened' } },
    ];
    const list = readings(home([device('a', { properties }), device('b', { properties })]));
    assert.equal(list.length, 6);
    assert.equal(new Set(list.map((item) => item.id)).size, 6);
    assert.equal(formatReading(properties[0]), '0 °C');
    assert.equal(formatReading(properties[1]), 'Нет данных');
    assert.equal(formatReading(properties[2]), 'opened');
    assert.equal(readings(home([device('a', { properties: [...properties].reverse() })]))[2].id, list[0].id);
});

test('only channels of the same physical switch and room group automatically', () => {
    const data = home([
        device('left', { room: 'room', external_id: 'iot_zigbee_ABC' }),
        device('right', { room: 'room', external_id: 'iot_zigbee_ABC_2' }),
        device('other', { room: 'room', external_id: 'iot_zigbee_XYZ' }),
        device('different-room', { room: 'other-room', external_id: 'iot_zigbee_ABC_3' }),
    ]);
    const groups = discoverPowerGroups(data);
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].deviceIds, ['left', 'right']);
    const entries = dashboardEntries(data, emptyPreferences);
    assert.equal(entries.length, 3);
    const ungrouped = dashboardEntries(data, { ...emptyPreferences, ungrouped: [groups[0].id] });
    assert.equal(ungrouped.length, 4);
});

test('manual power groups take precedence and keep missing members for honest status', () => {
    const group = { id: 'manual', name: 'Свет', deviceIds: ['present', 'missing'] };
    const entries = dashboardEntries(home([device('present')]), { ...emptyPreferences, groups: [group] });
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0].group.deviceIds, ['present', 'missing']);
});

test('pure meters remain visible as devices and also live in readings', () => {
    const properties = [{ type: 'devices.properties.float', parameters: { instance: 'water_meter', unit: 'unit.cubic_meter' }, state: { value: 13.931 } }];
    const data = home([device('meter', { capabilities: [], properties }), device('climate-control', { properties })]);
    assert.deepEqual(dashboardEntries(data, emptyPreferences).map((entry) => entry.id), ['meter', 'climate-control']);
    assert.equal(readings(data).length, 2);
    assert.equal(formatReading(properties[0]), '13,931 м³');
});

test('corrupt settings fall back safely and all device types are visible by default', () => {
    const prefs = parsePreferences({ visibility: { a: false, b: 'invalid' }, order: ['a', 'a', 2], readingOrder: ['sensor', 'sensor', null],
        weights: { a: 10, bad: 'no' }, readingWeights: { sensor: -5, invalid: null }, groups: [{ id: 'bad' }] });
    assert.deepEqual(prefs.visibility, { a: false });
    assert.deepEqual(prefs.order, ['a']);
    assert.deepEqual(prefs.readingOrder, ['sensor']);
    assert.deepEqual(prefs.weights, { a: 10 });
    assert.deepEqual(prefs.readingWeights, { sensor: -5 });
    assert.deepEqual(prefs.groups, []);
    assert.equal(defaultVisible(), true);
});

test('sensor order is saved independently from device order', () => {
    const first = { type: 'devices.properties.float', parameters: { instance: 'temperature' }, state: { value: 21 } };
    const second = { type: 'devices.properties.float', parameters: { instance: 'humidity' }, state: { value: 45 } };
    const data = home([device('sensor', { properties: [first, second] })]);
    const initial = readings(data);
    assert.deepEqual(readings(data, [initial[1].id, initial[0].id]).map((item) => item.id), [initial[1].id, initial[0].id]);
});

test('specific device name wins over alias while generic names use a useful alias', () => {
    assert.equal(deviceName({ name: 'Таникс', aliases: ['Бокс'] }), 'Таникс');
    assert.deepEqual(deviceAliases({ name: 'Таникс', aliases: ['Бокс'] }), ['Бокс']);
    assert.equal(deviceName({ name: 'Переключатель', aliases: ['Кладовка'] }), 'Кладовка');
    assert.deepEqual(deviceAliases({ name: 'Переключатель', aliases: ['Кладовка'] }), ['Переключатель']);
});

test('duplicate device names are disambiguated by type', () => {
    const data = home([
        device('socket', { name: 'Лампа', type: 'devices.types.socket' }),
        device('strip', { name: 'Лампа', type: 'devices.types.light.strip' }),
    ]);
    assert.deepEqual(dashboardEntries(data, emptyPreferences).map((entry) => entry.name), ['Лампа · Розетка', 'Лампа · Световая лента']);
});
