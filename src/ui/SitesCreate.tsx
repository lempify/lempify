import { useState } from "react";
import { useInvoke } from "../hooks/useInvoke";
import React from "react";

const defaultPayload = {
  domain: "",
  ssl: false,
  laravel: false,
  wordpress: false,
};

const fieldRelationships = [
  {
    label: "Domain",
    name: "domain",
    default: null,
    required: true,
    field: "text",
    description: "The domain name of the site",
    placeholder: "lempify.local",
  },
  {
    label: "SSL",
    name: "ssl",
    default: true,
    required: false,
    field: "checkbox",
    description: "Whether the site should have SSL",
  },
  {
    label: "Type",
    name: "type",
    default: "php",
    required: false,
    field: "radio",
    description: "The type of site to create",
    options: [
      { label: "Vanilla PHP", name: "php" },
      {
        label: "WordPress",
        name: "wordpress",
        default: false,
        required: false,
        field: "checkbox",
        dependency: ["type", "wordpress"],
        description: "Whether the site should have WordPress installed",
        fields: [
          {
            label: "Site Name",
            name: "site_name",
            required: false,
            field: "text",
            description: "The name of the site",
            placeholder: "My WordPress Site",
          },
          {
            label: "Site Description",
            name: "site_description",
            required: false,
            field: "text",
            description: "The description of the site",
            placeholder: "A description of the site",
          },
          {
            label: "Multi-Site",
            name: "multisite",
            required: false,
            field: "checkbox",
            description: "Whether the site should be a multi-site",
          },
        ],
      },
      {
        label: "Laravel",
        name: "laravel",
        default: false,
        required: false,
        type: "boolean",
        field: "checkbox",
        dependency: ["type", "laravel"],
        description: "Whether the site should have Laravel installed",
        fields: [
          {
            label: "Laravel Version",
            name: "version",
            required: false,
            field: "text",
            type: "string",
            description: "The version of Laravel to install",
          },
        ],
      },
    ],
  },
];

const SiteCreate = ({ onRefresh }: { onRefresh: () => void }) => {
  const [payload, setPayload] = useState({ ...defaultPayload });
  const { invoke, invokeStatus } = useInvoke();
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleCreate = async () => {
    try {
      const { data, error } = await invoke<string>("create_site", { payload });
      if (error) {
        throw error;
      }
      if (data) {
        // setResult(data);
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to create site:", err);
    } finally {
      setPayload({ ...defaultPayload });
    }
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Convert to plain object
    const formJson = Object.fromEntries(formData.entries());
    console.log({ ...formJson });
  }

  function formChange(e: React.FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement;
    console.log(target.checked);
    if (target.type === 'checkbox') {
      setFormValues({ ...formValues, [target.name]: target.checked })
    } else {
      setFormValues({ ...formValues, [target.name]: target.value })
    }
  }

  return (
    <div className="mb-10 p-10 w-full border border-neutral-200 dark:border-neutral-700 rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Create New Site</h2>
      </div>
      <div className="rounded-3xl p-px bg-gradient-to-b from-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">
        <div className="bg-neutral-50 dark:bg-neutral-900 p-10 rounded-[calc(1.5rem-1px)]">
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </div>
      </div>
      <form onSubmit={handleSubmit} onChange={formChange}>
        <div className="flex flex-col gap-4">
          {fieldRelationships.map((field, index) => (
            <div key={index}>
              {field.field === "text" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor={field.name}>{field.label}</label>
                  <input className="border border-neutral-200 placeholder:text-neutral-300 placeholder:italic focus:border-neutral-300 outline-none dark:border-neutral-700 w-full mb-4 px-4 py-3" placeholder={field.description} name={field.name} id={field.name} />
                  <span className="text-xs text-neutral-500">{field.description}</span>
                </div>
              )}
              {field.field === "checkbox" && (
                <div className="flex gap-2">
                  <input name={field.name} id={field.name} type="checkbox" checked={formValues[field.name]} />
                  <label htmlFor={field.name}>{field.label}</label>
                  <span className="text-xs text-neutral-500">{field.description}</span>
                </div>
              )}
              {field.field === "radio" && field.options && (
                <div className="flex flex-col gap-2">
                  {field.options.map((option, i) => {
                    // Fields that depend on specific values in other fields
                    const { dependency = [], fields = [] } = field.options[i];
                    return (
                      <fieldset key={option.name}>
                        <label>
                          <input type="radio" name={field.name} defaultValue={option.name} />{option.label}
                        </label>
                        <div>
                          {formValues[dependency[0]] === dependency[1] && fields.map((childField) => (
                            <div key={childField.name}>
                              <label htmlFor={childField.name}>
                                {childField.label}
                              </label>
                              {childField.field === 'checkbox' ? <input
                                id={childField.name}
                                type={childField.field}
                                className="border border-neutral-200"
                                name={`${field.name}|${formValues[field.name]}|${childField.name}`}
                                defaultChecked={formValues[`${field.name}|${formValues[field.name]}|${childField.name}`]}
                              /> : <input
                                id={childField.name}
                                type={childField.field}
                                className="border border-neutral-200"
                                name={`${field.name}|${formValues[field.name]}|${childField.name}`}
                                defaultValue={formValues[`${field.name}|${formValues[field.name]}|${childField.name}`]}
                              />}
                              <span className="text-xs text-neutral-500">{childField?.description ?? ''}</span>
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="submit" className="bg-[var(--lempify-primary)] hover:bg-[var(--lempify-primary-700)] text-white px-4 py-2 rounded disabled:opacity-50 disabled:bg-neutral-400">Submit form</button>
      </form>
    </div>
  );
};

export default SiteCreate;