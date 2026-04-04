export type FieldType = 'url' | 'checkbox' | 'radio';

export interface BaseField {
  default: any;
  required: boolean;
  type: string;
  description: string;
  field: FieldType;
}

export interface Option {
  label: string;
  value: string;
}

export interface SubField {
  required: boolean;
  type: string;
  description: string;
}

export interface WordPressFields {
  site_name: SubField;
  site_description: SubField;
  multi_site: SubField;
}

// @TODO: Maybe add Laravel support
// export interface LaravelFields {
//   laravel_version: SubField;
// }

export type SiteField = BaseField & {
  options?: Option[];
  dependencies?: [boolean, string, string];
  fields?: WordPressFields;
};

export interface SiteFieldRelationships {
  domain: SiteField & {
    default: null;
    field: 'url';
  };
  ssl: SiteField & {
    default: boolean;
    field: 'checkbox';
  };
  type: SiteField & {
    default: 'php';
    field: 'radio';
    options: Option[];
  };
  wordpress: SiteField & {
    default: boolean;
    field: 'checkbox';
    dependencies: [boolean, string, string];
    fields: WordPressFields;
  };
  // @TODO: Maybbe add Laravel support
  // laravel: SiteField & {
  //   default: boolean;
  //   field: 'checkbox';
  //   dependencies: [boolean, string, string];
  //   fields: LaravelFields;
  // };
}
