import { Field } from '../types/form';

const settingsFields: Field[] = [
  {
    name: 'mysql_host',
    label: 'Host:',
    type: 'text',
    defaultValue: 'localhost',
    placeholder: 'e.g. localhost',
    className:
      'border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 mb-4 px-6 py-4 w-full',
    labelPosition: 'top',
  },
  {
    name: 'mysql_port',
    label: 'Port:',
    type: 'number',
    required: false,
    placeholder: 'e.g. 3306',
    defaultValue: 3306,
    className:
      'border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 mb-4 px-6 py-4 w-full',
    labelPosition: 'top',
  },
  {
    name: 'mysql_user',
    label: 'User:',
    type: 'text',
    defaultValue: 'root',
    placeholder: 'e.g. root',
    className:
      'border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 mb-4 px-6 py-4 w-full',
    labelPosition: 'top',
  },
  {
    name: 'mysql_password',
    label: 'Password:',
    type: 'password',
    defaultValue: 'root',
    placeholder: 'e.g. password',
    className:
      'border border-neutral-200 focus:border-neutral-300 outline-none dark:border-neutral-700 mb-4 px-6 py-4 w-full',
    labelPosition: 'top',
  },
];

export default settingsFields;
