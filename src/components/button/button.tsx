import type { ButtonHTMLAttributes } from 'react';
import './button.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; alt: string };

export default function Button({ icon, alt, ...props }: Props) {
    return <button type="button" className="customButton" aria-label={alt} title={alt} {...props}>
        <img src={icon} alt="" />
    </button>;
}
