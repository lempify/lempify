
/**
 * External imports
 */
import { Fragment, useEffect, useState } from "react";

/**
 * Internal imports
 */
// Types
import { Field } from "../types/form";

const FormFields = (props: Field) => {
    const {
        name,
        label,
        description,
        type,
        value,
        defaultValue,
        onChange = () => { },
        className = '',
        options,
        labelPosition = 'bottom',
        placeholder,
        descriptionPosition = 'bottom',
        inputAttributes = {},
    } = props;

    const [fieldValue, setFieldValue] = useState(defaultValue);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>, fieldName: string = name) {
        const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        onChange(newValue, fieldName);
        setFieldValue(newValue);
    }

    // useEffect(() => {
    //     if (value === undefined) return;
    //     setFieldValue(value);
    //     setTouched(true);
    // }, [value]);

    return (
        <Fragment>
            {label && labelPosition === 'top' && <label htmlFor={name} className="block mb-2 cursor-pointer">{label}</label>}
            {description && descriptionPosition === 'top' && <span className="block text-xs text-neutral-500 mb-2">{description}</span>}
            {type === 'checkbox' ? (
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    className={`${className}`}
                    checked={fieldValue}
                    onChange={(e) => onChange(e.target.checked, name)}
                    {...inputAttributes}
                />
            ) : type === 'radio' && options ? (
                options.map((option) => (
                    <div className={`${option.wrapperClassName ?? ''}`} key={option.name}>
                        <input
                            type="radio"
                            id={option.name}
                            name={name}
                            className={`${option.className ?? ''}`}
                            value={option.name}
                            checked={option.name === fieldValue}
                            onChange={handleChange}
                        />
                        <label htmlFor={option.name}>{option.label}</label>
                        {fieldValue === option?.dependency?.[1] && option?.fields?.map((childField) => {
                            const _name = `${name}|${option.name}|${childField.name}`;
                            return (
                                <div className={`${childField.wrapperClassName ?? ''}`} key={childField.name}>
                                    <FormFields
                                        key={childField.name}
                                        {...childField}
                                        name={_name}
                                        className={`${childField.className ?? ''}`}
                                        onChange={(change) => handleChange(change, _name)}
                                        {...childField.inputAttributes ?? {}}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))
            ) : type === 'text' ? (
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={fieldValue}
                    placeholder={placeholder ?? ''}
                    className={`${className} placeholder:text-neutral-500 placeholder:italic`}
                    onChange={handleChange}
                    {...inputAttributes}
                />
            ) : null}
            {label && labelPosition === 'bottom' && <label htmlFor={name} className="block cursor-pointer">{label}</label>}
            {description && descriptionPosition === 'bottom' && <span className="block text-xs text-neutral-500">{description}</span>}
        </Fragment>
    );
};

export default FormFields;