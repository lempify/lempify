import { Field } from "../types/form";

export const fieldRelationships: Field[] = [
    {
      label: "Domain:",
      name: "domain",
      default: "",
      className: "border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 mb-4 px-6 py-4 w-full",
      labelPosition: "top",
      required: true,
      type: "text",
      placeholder: "e.g. lempify.local",
      inputAttributes: {
        autoCapitalize: "off",
        autoCorrect: "off",
        spellCheck: "false",
      },
    },
    {
      label: "Site type?",
      name: "type",
      default: "php",
      required: false,
      type: "radio",
      labelPosition: "top",
      descriptionPosition: "top",
      description: "What framework should be installed?",
      options: [
        {
          label: "Vanilla",
          name: "php",
          default: false,
          required: false,
          wrapperClassName: "flex items-center gap-2 h-[42px]",
          type: "checkbox",
          description: "Whether the site should have PHP installed"
        },
        {
          label: "WordPress",
          name: "wordpress",
          default: false,
          required: false,
          type: "checkbox",
          dependency: ["type", "wordpress"],
          description: "Whether the site should have WordPress installed",
          wrapperClassName: "flex items-center gap-2 h-[42px]",
          fields: [
            {
              name: "site_name",
              required: false,
              className: "border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 px-2 py-2",
              type: "text",
              placeholder: "Site name...",
            },
            {
              name: "site_description",
              required: false,
              className: "border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 px-2 py-2",
              type: "text",
              placeholder: "Site description...",
            },
            {
              label: "Multi-Site",
              name: "multisite",
              default: false,
              required: false,
              wrapperClassName: "flex items-center gap-2",
              type: "checkbox",
            },
          ],
        },
        {
          label: "Laravel",
          name: "laravel",
          default: false,
          required: false,
          type: "checkbox",
          wrapperClassName: "flex items-center gap-2 h-[42px]",
          dependency: ["type", "laravel"],
          description: "Whether the site should have Laravel installed",
          fields: [
            {
              name: "version",
              labelPosition: "top",
              required: false,
              className: "border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 px-2 py-2",
              type: "text",
              default: "10",
              placeholder: "Laravel version...",
            },
          ],
        },
      ],
    },
    {
      label: "SSL",
      name: "ssl",
      default: true,
      required: false,
      type: "checkbox",
      wrapperClassName: "flex items-center gap-2",
      description: "Uncheck to disable SSL",
    },
  ];

  export default fieldRelationships;