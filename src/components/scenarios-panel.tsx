import type { Scenario } from '../model';
import { runScenario } from '../api';
import { useCommand } from '../hooks/use-command';

export default function ScenariosPanel({ scenarios }: { scenarios: Scenario[] }) {
    const { busy, execute } = useCommand();
    return <section className="dashboard-section" aria-label="Сценарии">
        <p className="muted">Включение и отключение сценариев доступно в «Доме с Алисой». Подключённый API поддерживает запуск.</p>
        <div className="scenario-grid">{scenarios.map((scenario) => <article className="scenario-card" key={scenario.id}>
            <div><h3>{scenario.name}</h3><span className="muted">{scenario.is_active === undefined ? 'Статус неизвестен' : scenario.is_active ? 'Включён' : 'Отключён'}</span></div>
            <button className="button" disabled={busy || scenario.is_active === false} onClick={() => void execute(() => runScenario(scenario.id))}>Запустить</button>
        </article>)}</div>
        {!scenarios.length && <p>Сценариев пока нет.</p>}
    </section>;
}
