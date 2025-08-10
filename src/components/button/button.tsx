import React from 'react';
import { createCn } from 'bem-react-classname';
import './button.css'

type Props = {
    onClick: any;
    icon: any;
    alt: string
};

const cn = createCn('customButton');

const Button: React.FC<Props> = ({ onClick, icon, alt }) => {
    return (
        <button className={ cn() } onClick={ onClick }>
            <img src={ icon } alt={ alt }/>
        </button>
    );
};

export default Button;
