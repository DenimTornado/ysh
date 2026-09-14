import './navbar.css';

export type DashboardTab = 'devices' | 'readings' | 'scenarios';

export function Navbar({ onLogout, onRefresh, loading, busy, deviceCount, readingCount, scenarioCount, activeTab, onTab }: {
    onLogout: () => void;
    onRefresh: () => void;
    loading: boolean;
    busy: boolean;
    deviceCount: number;
    readingCount: number;
    scenarioCount: number;
    activeTab: DashboardTab;
    onTab: (tab: DashboardTab) => void;
}) {
    return <header className="home-header">
        <div className="home-tabs" role="tablist" aria-label="Разделы умного дома">
            {([
                ['devices', 'Устройства', deviceCount],
                ['readings', 'Датчики', readingCount],
                ['scenarios', 'Сценарии', scenarioCount],
            ] as const).map(([tab, label, count]) => <button type="button" role="tab" key={tab}
                aria-selected={activeTab === tab} aria-controls={`${tab}-panel`} className="home-tab"
                onClick={() => onTab(tab)}><span>{label}</span><strong>{count}</strong></button>)}
        </div>
        <div className="buttons">
            <button className="button" disabled={loading || busy} onClick={onRefresh}>
                {loading ? 'Обновление…' : 'Обновить'}
            </button>
            <button className="button" onClick={onLogout}>Выйти</button>
        </div>
    </header>;
}
