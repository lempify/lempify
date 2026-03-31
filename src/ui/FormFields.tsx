/**
 * External imports
 */
import { Fragment, useEffect } from 'react';

/**
 * Internal imports
 */
// Types
import { Field } from '../types/form';

// @TODO: Look into using `useActionState` & `useFormStatus` - https://www.callstack.com/blog/the-complete-developer-guide-to-react-19-part-1-async-handling

const FormFields = (props: Field) => {
  const {
    name,
    label,
    description,
    type,
    value,
    inputRef,
    onChange = () => {},
    className = '',
    options,
    labelPosition = 'bottom',
    placeholder,
    descriptionPosition = 'bottom',
    inputAttributes = {},
    required = false,
    fieldPrefix = '',
    labelClassName = '',
    optionsContainerClassName = '',
    validationMessage = '',
  } = props;

  const fieldId = fieldPrefix ? `${fieldPrefix}-${name}` : name;

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string = name
  ) {
    const newValue =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(newValue, fieldName);
  }

  const radioOptions =
    type === 'radio' && options
      ? options.map(option => {
          const optionId = fieldPrefix
            ? `${fieldPrefix}-${option.name}`
            : option.name;
          return (
            <div className={`${option.wrapperClassName ?? ''}`} key={option.name}>
              <input
                type='radio'
                id={optionId}
                name={name}
                className={`${option.className ?? ''}`}
                value={option.name}
                checked={option.name === value}
                onChange={handleChange}
              />
              <label htmlFor={optionId} className={option.labelClassName ?? ''}>
                {option.label}
              </label>
              {value === option?.dependency?.[1] &&
                option?.fields?.map(childField => {
                  const _name = `${name}|${option.name}|${childField.name}`;
                  return (
                    <div
                      className={`${childField.wrapperClassName ?? ''}`}
                      key={childField.name}
                    >
                      <FormFields
                        key={childField.name}
                        {...childField}
                        name={_name}
                        fieldPrefix={fieldPrefix}
                        className={`${childField.className ?? ''}`}
                        onChange={change => onChange(change, _name)}
                        {...(childField.inputAttributes ?? {})}
                      />
                    </div>
                  );
                })}
            </div>
          );
        })
      : null;

  return (
    <Fragment>
      {label && labelPosition === 'top' && (
        <label
          htmlFor={fieldId}
          className={
            labelClassName ||
            'text-xl text-neutral-700 dark:text-neutral-300 block mb-2 cursor-pointer'
          }
        >
          {label}
          {required && <span className='text-red-500'> *</span>}
        </label>
      )}
      {description && descriptionPosition === 'top' && (
        <span className='block text-xs text-neutral-500 mb-2'>
          {description}
        </span>
      )}
      {type === 'checkbox' ? (
        <input
          type='checkbox'
          id={fieldId}
          name={name}
          className={`${className}`}
          checked={value}
          onChange={e => onChange(e.target.checked, name)}
          {...inputAttributes}
        />
      ) : radioOptions ? (
        optionsContainerClassName ? (
          <div className={optionsContainerClassName}>{radioOptions}</div>
        ) : (
          <>{radioOptions}</>
        )
      ) : ['text', 'password', 'number'].includes(type) ? (
        <>
          <input
            type={type}
            id={fieldId}
            name={name}
            value={value}
            placeholder={placeholder ?? ''}
            className={`${validationMessage ? 'peer ' : ''}${className} placeholder:text-neutral-500 placeholder:italic`}
            onChange={handleChange}
            ref={inputRef}
            {...inputAttributes}
          />
          {validationMessage && (
            <span className='hidden peer-[:user-invalid]:block text-xs text-red-500 mt-1'>
              {validationMessage}
            </span>
          )}
        </>
      ) : null}
      {label && labelPosition === 'bottom' && (
        <label htmlFor={fieldId} className='block cursor-pointer'>
          {label}
        </label>
      )}
      {description && descriptionPosition === 'bottom' && (
        <span className='block text-xs text-neutral-500'>{description}</span>
      )}
    </Fragment>
  );
};

export default FormFields;
