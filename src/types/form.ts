export type Field = {
    name: string;
    type: "text" | "checkbox" | "radio";
    // Optional
    label?: string;
    description?: string;
    descriptionPosition?: "top" | "bottom";
    labelPosition?: "top" | "bottom";
    placeholder?: string;
    value?: any;
    default?: any;
    required: boolean;
    options?: Field[];
    dependency?: string[];
    fields?: Field[];
    onChange?: (value: any, fieldName?: string) => void;
    className?: string,
    wrapperClassName?: string,
    inputAttributes?: Record<string, any>;
};

/* type InputProps = {
    label: string,
    name: string,
    type: 'text' | 'checkbox' | 'radio',
    description: string,
    value?: any,
    default?: any,
    onChange?: (value: any, fieldName?: string) => void,
    options?: Array<Omit<InputProps, 'onChange'> & {
        onChange?: (value: any) => void,
        fields?: InputProps[]
    }>,
    fields?: InputProps[],
    labelPosition?: 'top' | 'bottom',
} */