import React from 'react';
import applyIcon from '../../assets/icons/apply.png';
import Button from '../button/button';
import { createCn } from 'bem-react-classname';

import './custom-input.css'

type Props = {
    value: any;
    onChange: any;
    onClick: any;
};

const cn = createCn('custom-input');

const CustomInput: React.FC<Props> = ({ value, onChange, onClick }) => {
    return (
        <div className={cn()}>
            <div>
                Установить значение:
            </div>
            <div className={cn('input')}>
                <div className={cn('field')}>
                    <input
                        className={ 'input mb-2' }
                        type="number"
                        value={ value }
                        onChange={ onChange }
                    />
                </div>
                <div className={cn('icon')}>
                    <Button alt={ 'Mute' } onClick={ onClick } icon={ applyIcon }/>
                </div>
            </div>
        </div>
    );
};

export default CustomInput;
