import { useState } from 'react';
import type { Home } from '../model';
import { deviceName, updatedAt } from '../model';
import { readings, formatReading, instanceName } from '../dashboard-model';

export default function ReadingsPanel({ home, visibility, order, weights, onVisibility, onLayout, onWeight }: {
    home: Home;
    visibility: Record<string, boolean>;
    order: string[];
    weights: Record<string, number>;
    onVisibility: (value: Record<string, boolean>) => void;
    onLayout: (order: string[], weights: Record<string, number>) => void;
    onWeight: (id: string, weight: number) => void;
}) {
    const [copyMessage, setCopyMessage] = useState('');
    const all = readings(home, order, weights);
    const visible = all.filter((reading) => visibility[reading.id] !== false);
    return <section className="readings-panel" aria-label="Датчики">
        <div className="section-tools">
            <span className="muted">Показано {visible.length} из {all.length}</span>
        </div>
        <details className="layout-settings">
            <summary>Настроить датчики</summary>
            <div className="buttons">
                <button className="button is-small" onClick={() => onVisibility(Object.fromEntries(all.map((item) => [item.id, true])))}>Показать все</button>
                <button className="button is-small" onClick={() => onVisibility(Object.fromEntries(all.map((item) => [item.id, false])))}>Скрыть все</button>
            </div>
            {all.map((reading, index) => {
                const move = (offset: number) => {
                    const next = all.map((item) => item.id);
                    [next[index], next[index + offset]] = [next[index + offset], next[index]];
                    onLayout(next, Object.fromEntries(next.map((id, position) => [id, (position + 1) * 10])));
                };
                return <div className="settings-row" key={reading.id}>
                    <label><input type="checkbox" checked={visibility[reading.id] !== false}
                        onChange={(event) => onVisibility({ ...visibility, [reading.id]: event.target.checked })} />
                        {' '}{instanceName(reading.property.parameters.instance)}
                        <span className="muted"> · {deviceName(reading.device)}{reading.room ? ` · ${reading.room}` : ''}</span>
                    </label>
                    <div className="buttons">
                        <label className="weight-control">Вес<input className="input" type="number" step="1"
                            value={weights[reading.id] ?? (index + 1) * 10}
                            onChange={(event) => Number.isFinite(event.target.valueAsNumber) && onWeight(reading.id, event.target.valueAsNumber)} /></label>
                        <button className="button is-small" disabled={index === 0} aria-label={`Выше: ${instanceName(reading.property.parameters.instance)}`} onClick={() => move(-1)}>↑</button>
                        <button className="button is-small" disabled={index === all.length - 1} aria-label={`Ниже: ${instanceName(reading.property.parameters.instance)}`} onClick={() => move(1)}>↓</button>
                    </div>
                </div>;
            })}
        </details>
        <div className="readings-grid">{visible.map((reading) => <article className="reading-card" key={reading.id}>
            <span>{instanceName(reading.property.parameters.instance)}</span>
            <strong>{formatReading(reading.property)}</strong>
            <span className="muted">{deviceName(reading.device)}{reading.room ? ` · ${reading.room}` : ''}</span>
            <small>{updatedAt(reading.property.last_updated)}</small>
        </article>)}</div>
        {!visible.length && <p className="muted">{all.length ? 'Все датчики скрыты. Выберите нужные в настройках.' : 'Устройства пока не передали данных.'}</p>}
        {visible.length > 0 && <button className="button" onClick={async () => {
            try {
                await navigator.clipboard.writeText(visible.map((reading) => `${deviceName(reading.device)}${reading.room ? ` (${reading.room})` : ''} — ${instanceName(reading.property.parameters.instance)}: ${formatReading(reading.property)}`).join('\n'));
                setCopyMessage('Показания скопированы');
            } catch { setCopyMessage('Не удалось скопировать. Можно выделить показания вручную.'); }
        }}>Скопировать видимые показания</button>}
        <p role="status">{copyMessage}</p>
    </section>;
}
