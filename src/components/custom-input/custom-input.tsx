import { useEffect, useId, useState } from 'react';
import './custom-input.css';

type Props = {
    label: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onApply: (value: number) => Promise<boolean>;
};

export default function CustomInput({ label, value, min, max, step = 1, disabled, onApply }: Props) {
    const id = useId();
    const [draft, setDraft] = useState(value === undefined ? '' : String(value));
    useEffect(() => { setDraft(value === undefined ? '' : String(value)); }, [value]);
    return <form className="custom-input" onSubmit={async (event) => {
        event.preventDefault();
        if (!draft.trim() || !Number.isFinite(Number(draft))) return;
        await onApply(Number(draft));
    }}>
        <label htmlFor={id}>{label}</label>
        <div className="custom-input__input">
            <input id={id} className="input" type="number" value={draft} min={min} max={max} step={step}
                required disabled={disabled} placeholder={value === undefined ? '—' : String(value)}
                onChange={(event) => setDraft(event.target.value)} />
            <button className="button" disabled={disabled || !draft.trim()} type="submit">Применить</button>
        </div>
    </form>;
}
