export type Field = {
    name: string;
    type: "text" | "checkbox" | "radio";
} & Partial<{
    label: string;
    description: string;
    descriptionPosition: "top" | "bottom";
    labelPosition: "top" | "bottom";
    placeholder: string;
    value: any;
    default: any;
    required: boolean;
    options: Field[];
    dependency: string[];
    fields: Field[];
    onChange: (value: any, fieldName: string) => void;
    className: string,
    wrapperClassName: string,
    inputAttributes: Record<string, any>;
}>;