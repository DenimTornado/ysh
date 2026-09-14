import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/api-client.ts';
import { action, boundedValue, capability, capabilityValue, updatedAt } from '../src/model.ts';
import { rgbToHsv, hsvToRgb } from '../src/colors.ts';

function mockClient(data, status = 200) {
    const calls = [];
    const client = createApiClient('https://test.invalid/api', () => 'test-token', async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        return new Response(typeof data === 'string' ? data : JSON.stringify(data), { status });
    });
    return { client, calls };
}

test('IR volume uses a relative range command and never an absolute volume', async () => {
    const { client, calls } = mockClient({ status: 'ok' });
    await client.sendActions([{ id: 'box', actions: [action('volume', -1, 'range', true)] }]);
    assert.deepEqual(calls[0].body, { token: 'test-token', endpoint: 'device-action', payload: {
        devices: [{ id: 'box', actions: [{ type: 'devices.capabilities.range', state: { instance: 'volume', value: -1, relative: true } }] }],
    } });
});

test('missing state does not become an invented power value', () => {
    const device = { capabilities: [{ type: 'devices.capabilities.on_off', parameters: { split: true }, state: null }] };
    assert.equal(capability(device, 'on_off').state, null);
    assert.equal(capability(device, 'range', 'volume'), undefined);
});

test('a value with an explicit zero update timestamp is stale', () => {
    assert.equal(capabilityValue({ retrievable: true, last_updated: 0, state: { value: true } }), undefined);
    assert.equal(capabilityValue({ retrievable: true, last_updated: 10, state: { value: false } }), false);
});

test('numeric limits, step precision, and invalid input', () => {
    assert.equal(boundedValue(32, 16, 30), 30);
    assert.equal(boundedValue(10, 16, 30), 16);
    assert.equal(boundedValue(21.8, 16, 30), 22);
    assert.equal(boundedValue(0.31, 0, 1, 0.1), 0.3);
    for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => boundedValue(value, 1, 100));
});

test('invalid numbers cannot be serialized to null in a device command', async () => {
    const { client, calls } = mockClient({ status: 'ok' });
    await assert.rejects(client.sendActions([{ id: 'strip', actions: [action('brightness', NaN, 'range')] }]));
    await assert.rejects(client.sendActions([{ id: 'strip', actions: [action('hsv', { h: 0, s: 100, v: Infinity }, 'color_setting')] }]));
    assert.equal(calls.length, 0);
});

test('HTTP errors and invalid JSON are rejected', async () => {
    await assert.rejects(mockClient({}, 401).client.getUserInfo(), /снова войдите/);
    await assert.rejects(mockClient({}, 500).client.getUserInfo(), /500/);
    await assert.rejects(mockClient('broken JSON').client.getUserInfo(), /некорректный ответ/);
});

test('a partial device failure is not reported as success or automatically retried', async () => {
    const { client, calls } = mockClient({ status: 'ok', devices: [
        { id: 'left', capabilities: [{ state: {}, action_result: { status: 'DONE' } }] },
        { id: 'right', capabilities: [{ state: { instance: 'on', action_result: { status: 'ERROR', error_code: 'DEVICE_UNREACHABLE' } } }] },
    ] });
    await assert.rejects(client.sendActions([
        { id: 'left', actions: [action('on', false)] }, { id: 'right', actions: [action('on', false)] },
    ]), /DEVICE_UNREACHABLE/);
    assert.equal(calls.length, 1);
});

test('scenario errors are propagated, and scenario ID is preserved', async () => {
    const { client, calls } = mockClient({ status: 'error', error_message: 'Сценарий недоступен' });
    await assert.rejects(client.runScenario('pause'), /Сценарий недоступен/);
    assert.deepEqual(calls[0].body.payload, { scenario_id: 'pause' });
});

test('incomplete home responses do not erase the last valid home', async () => {
    await assert.rejects(mockClient({ status: 'ok' }).client.getUserInfo(), /отсутствуют/);
    await assert.rejects(mockClient({ devices: [{}], rooms: [], scenarios: [] }).client.getUserInfo(), /некорректный список/);
    const home = { devices: [{ id: 'climate', name: 'Климат', type: 'devices.types.sensor.climate', properties: [{ parameters: { instance: 'signal_level' }, state: null }] }], rooms: [], scenarios: [] };
    assert.deepEqual(await mockClient(home).client.getUserInfo(), home);
});

test('missing configuration or token prevents requests', async () => {
    const fetcher = () => { throw new Error('Unexpected network call'); };
    await assert.rejects(createApiClient(undefined, () => 'token', fetcher).getUserInfo(), /VITE_API_URL/);
    await assert.rejects(createApiClient('https://test.invalid', () => null, fetcher).getUserInfo(), /Войдите/);
});

test('zero timestamps remain unknown and colors wrap hue below 360 degrees', () => {
    assert.equal(updatedAt(0), 'Время обновления неизвестно');
    assert.deepEqual(rgbToHsv(255, 0, 1), { h: 0, s: 100, v: 100 });
    assert.deepEqual(hsvToRgb(0, 100, 100), { r: 255, g: 0, b: 0 });
});
