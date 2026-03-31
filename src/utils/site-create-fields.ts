import { DEFAULT_PHP_VERSION, DEFAULT_SITE_TYPE, PHP_SUPPORTED_VERSIONS } from '../constants';
import { Field } from '../types/form';

const sectionLabel =
  'text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5';

const textInput =
  'border border-neutral-300 focus:border-neutral-500 outline-none dark:border-neutral-600 dark:focus:border-neutral-400 dark:bg-neutral-800/50 px-3 py-2.5 w-full text-sm rounded-sm';

const pillOption =
  'flex cursor-pointer rounded-sm border border-neutral-300 dark:border-neutral-600 ' +
  'has-[:checked]:bg-neutral-900 has-[:checked]:border-neutral-900 has-[:checked]:text-white ' +
  'dark:has-[:checked]:bg-neutral-100 dark:has-[:checked]:text-neutral-900 dark:has-[:checked]:border-neutral-100 ' +
  'transition-colors duration-100';

export const fieldRelationships: Field[] = [
  {
    label: 'Domain',
    name: 'domain',
    defaultValue: '',
    labelClassName: sectionLabel,
    className: textInput + ' [&:user-invalid]:border-red-400',
    labelPosition: 'top',
    required: true,
    type: 'text',
    placeholder: 'e.g. lempify.local',
    validationMessage: 'Must match format: name.tld',
    inputAttributes: {
      autoCapitalize: 'off',
      autoCorrect: 'off',
      spellCheck: 'false',
      pattern: '[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+',
    },
  },
  {
    label: 'Name',
    name: 'site_name',
    defaultValue: '',
    labelClassName: sectionLabel,
    className: textInput,
    labelPosition: 'top',
    required: false,
    type: 'text',
    placeholder: 'e.g. My Site',
  },
  {
    label: 'Site type',
    name: 'site_type',
    defaultValue: DEFAULT_SITE_TYPE,
    required: false,
    type: 'radio',
    labelPosition: 'top',
    labelClassName: sectionLabel,
    descriptionPosition: 'top',
    description: 'What framework should be installed?',
    optionsContainerClassName: 'flex flex-col gap-1 mt-2',
    options: [
      {
        label: 'Vanilla',
        name: 'vanilla',
        defaultValue: false,
        required: false,
        wrapperClassName: 'flex items-center gap-2 py-1',
        type: 'checkbox',
      },
      {
        label: 'WordPress',
        name: 'wordpress',
        defaultValue: true,
        required: false,
        type: 'checkbox',
        dependency: ['site_type', 'wordpress'],
        wrapperClassName: 'flex flex-wrap items-center gap-2 py-1',
        fields: [
          {
            name: 'site_name',
            required: false,
            className:
              'border border-neutral-300 focus:border-neutral-500 outline-none dark:border-neutral-600 dark:bg-neutral-800/50 px-2 py-1.5 text-sm rounded-sm',
            type: 'text',
            placeholder: 'Site name...',
          },
          {
            name: 'site_description',
            required: false,
            className:
              'border border-neutral-300 focus:border-neutral-500 outline-none dark:border-neutral-600 dark:bg-neutral-800/50 px-2 py-1.5 text-sm rounded-sm',
            type: 'text',
            placeholder: 'Site description...',
          },
          {
            label: 'Multi-Site',
            name: 'multisite',
            defaultValue: false,
            required: false,
            wrapperClassName: 'flex items-center gap-2',
            type: 'checkbox',
          },
        ],
      },
    ],
  },
  {
    label: 'PHP Version',
    name: 'php_version',
    defaultValue: DEFAULT_PHP_VERSION,
    required: false,
    type: 'radio',
    labelPosition: 'top',
    labelClassName: sectionLabel,
    descriptionPosition: 'top',
    description: 'PHP version for this site.',
    optionsContainerClassName: 'flex flex-wrap gap-1.5 mt-2',
    options: PHP_SUPPORTED_VERSIONS.map(version => ({
      label: `PHP ${version}`,
      name: version,
      defaultValue: version === DEFAULT_PHP_VERSION,
      required: false,
      type: 'checkbox' as const,
      className: 'sr-only',
      labelClassName: 'block px-3 py-1.5 text-sm cursor-pointer select-none font-mono',
      wrapperClassName: pillOption,
    })),
  },
  {
    label: 'SSL',
    name: 'ssl',
    defaultValue: true,
    required: false,
    type: 'checkbox',
    wrapperClassName: 'flex items-center gap-2',
    description: 'Uncheck to disable SSL',
  },
];

export default fieldRelationships;
