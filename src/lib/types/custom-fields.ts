// ==========================================
// CUSTOM FIELD DEFINITIONS
// ==========================================
// Dynamic Form Builder types for admin-defined custom data fields
// that extend the standard Sitio Profile schema

/**
 * Supported data types for custom fields
 */
export type CustomFieldDataType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'checkbox'
  | 'radio';

/**
 * Aggregation types for numeric fields in dashboard visualizations
 */
export type CustomFieldAggregationType = 'sum' | 'average' | 'count' | 'min' | 'max';

/**
 * Validation rules for custom fields
 */
export interface CustomFieldValidationRules {
  /** Whether the field is required */
  required: boolean;
  /** Minimum value for number fields */
  min?: number;
  /** Maximum value for number fields */
  max?: number;
  /** Minimum length for text fields or array fields */
  minLength?: number;
  /** Maximum length for text fields or array fields */
  maxLength?: number;
  /** Regex pattern for text validation */
  pattern?: string;
  /** Predefined choices for checkbox and radio fields */
  choices?: string[];
}

/**
 * Custom Field Group
 * Groups related custom fields together for organized display
 */
export interface CustomFieldGroup {
  /** Unique identifier (auto-generated) */
  id: string;
  /** Display name for the group */
  name: string;
  /** Optional description for the group */
  description?: string;
  /** Lucide icon name for the group (e.g., 'Layers', 'Users') */
  icon?: string;
  /** Display order among groups (lower = first) */
  displayOrder: number;
  /** Whether the group can be collapsed in the UI */
  isCollapsible: boolean;
  /** Whether the group is active (false = archived/soft-deleted) */
  isActive: boolean;
  /** ISO timestamp when the group was created */
  createdAt: string;
  /** User ID who created the group */
  createdBy: string;
  /** ISO timestamp when the group was last modified */
  updatedAt?: string;
  /** User ID who last modified the group */
  updatedBy?: string;
}

/**
 * Custom Field Definition
 * Defines the schema for an admin-created custom data field
 */
export interface CustomFieldDefinition {
  /** Unique identifier (auto-generated) */
  id: string;
  /** Internal field name (camelCase, used as key in data storage) */
  fieldName: string;
  /** Display label shown in forms and reports */
  displayLabel: string;
  /** Data type determines input component and visualization */
  dataType: CustomFieldDataType;
  /** Validation rules for the field */
  validationRules: CustomFieldValidationRules;
  /** Aggregation type for dashboard charts (applies to number fields) */
  aggregationType: CustomFieldAggregationType;
  /** Display order in the custom fields section (lower = first) */
  displayOrder: number;
  /** Whether the field is active (false = archived/soft-deleted) */
  isActive: boolean;
  /** Optional description/help text for the field */
  description?: string;
  /** Group ID this field belongs to (null = uncategorized) */
  groupId?: string;
  /** Display order within the group (lower = first) */
  groupDisplayOrder?: number;
  /** ISO timestamp when the field was created */
  createdAt: string;
  /** User ID who created the field */
  createdBy: string;
  /** ISO timestamp when the field was last modified */
  updatedAt?: string;
  /** User ID who last modified the field */
  updatedBy?: string;
}

/**
 * Custom field data storage format
 * Stored within SitioProfile.customFields
 */
export type CustomFieldData = Record<string, unknown>;

/**
 * Form state for creating/editing a custom field
 */
export interface CustomFieldFormData {
  fieldName: string;
  displayLabel: string;
  dataType: CustomFieldDataType;
  validationRules: CustomFieldValidationRules;
  aggregationType: CustomFieldAggregationType;
  description?: string;
  groupId?: string;
}

/**
 * Form state for creating/editing a custom field group
 */
export interface CustomFieldGroupFormData {
  name: string;
  description?: string;
  icon?: string;
  isCollapsible: boolean;
}

/**
 * Default values for new groups
 */
export const DEFAULT_GROUP_VALUES: CustomFieldGroupFormData = {
  name: '',
  description: '',
  icon: 'Folder',
  isCollapsible: true
};

/**
 * Available icons for groups
 */
export const GROUP_ICON_OPTIONS = [
  'Folder',
  'Layers',
  'Users',
  'Building',
  'Home',
  'Briefcase',
  'Heart',
  'Shield',
  'Leaf',
  'Droplet',
  'Zap',
  'BookOpen',
  'Truck',
  'Map',
  'Activity',
  'PieChart',
  'Settings',
  'Star',
  'Target',
  'Award'
] as const;

export type GroupIconName = (typeof GROUP_ICON_OPTIONS)[number];

/**
 * Default validation rules by data type
 */
export const DEFAULT_VALIDATION_RULES: Record<CustomFieldDataType, CustomFieldValidationRules> = {
  text: { required: false, minLength: 0, maxLength: 500 },
  number: { required: false, min: undefined, max: undefined },
  boolean: { required: false },
  date: { required: false },
  array: { required: false, minLength: 0, maxLength: 100 },
  checkbox: { required: false, choices: [] },
  radio: { required: false, choices: [] }
};

/**
 * Default aggregation type by data type
 */
export const DEFAULT_AGGREGATION_TYPE: Record<CustomFieldDataType, CustomFieldAggregationType> = {
  text: 'count',
  number: 'sum',
  boolean: 'count',
  date: 'count',
  array: 'count',
  checkbox: 'count',
  radio: 'count'
};

/**
 * Labels for data types (for display in UI)
 */
export const DATA_TYPE_LABELS: Record<CustomFieldDataType, string> = {
  text: 'Text',
  number: 'Number',
  boolean: 'Yes/No',
  date: 'Date',
  array: 'Text List',
  checkbox: 'Checkbox (Multiple)',
  radio: 'Radio (Single)'
};

/**
 * Labels for aggregation types (for display in UI)
 */
export const AGGREGATION_TYPE_LABELS: Record<CustomFieldAggregationType, string> = {
  sum: 'Sum',
  average: 'Average',
  count: 'Count',
  min: 'Minimum',
  max: 'Maximum'
};

/**
 * Get applicable aggregation types for a data type
 */
export function getApplicableAggregationTypes(
  dataType: CustomFieldDataType
): CustomFieldAggregationType[] {
  switch (dataType) {
    case 'number':
      return ['sum', 'average', 'count', 'min', 'max'];
    case 'text':
    case 'boolean':
    case 'date':
    case 'array':
    case 'checkbox':
    case 'radio':
      return ['count'];
  }
}

/**
 * Generate a field name from display label
 * Converts "My Custom Field" to "myCustomField"
 */
export function generateFieldName(displayLabel: string): string {
  return displayLabel
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^(.)/, (_, char) => char.toLowerCase());
}

/**
 * Validate a custom field value against its definition
 */
export function validateCustomFieldValue(
  value: unknown,
  definition: CustomFieldDefinition
): { valid: boolean; error?: string } {
  const { dataType, validationRules } = definition;

  // Check required
  if (validationRules.required) {
    if (value === undefined || value === null || value === '') {
      return { valid: false, error: `${definition.displayLabel} is required` };
    }
  }

  // If not required and empty, it's valid
  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }

  switch (dataType) {
    case 'text': {
      if (typeof value !== 'string') {
        return { valid: false, error: 'Value must be text' };
      }
      if (validationRules.minLength !== undefined && value.length < validationRules.minLength) {
        return {
          valid: false,
          error: `Must be at least ${validationRules.minLength} characters`
        };
      }
      if (validationRules.maxLength !== undefined && value.length > validationRules.maxLength) {
        return { valid: false, error: `Must be at most ${validationRules.maxLength} characters` };
      }
      if (validationRules.pattern) {
        const regex = new RegExp(validationRules.pattern);
        if (!regex.test(value)) {
          return { valid: false, error: 'Value does not match required pattern' };
        }
      }
      break;
    }
    case 'number': {
      const numValue = typeof value === 'number' ? value : parseFloat(value as string);
      if (isNaN(numValue)) {
        return { valid: false, error: 'Value must be a number' };
      }
      if (validationRules.min !== undefined && numValue < validationRules.min) {
        return { valid: false, error: `Must be at least ${validationRules.min}` };
      }
      if (validationRules.max !== undefined && numValue > validationRules.max) {
        return { valid: false, error: `Must be at most ${validationRules.max}` };
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Value must be Yes or No' };
      }
      break;
    }
    case 'date': {
      if (typeof value === 'string') {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return { valid: false, error: 'Invalid date' };
        }
      } else if (!(value instanceof Date) || isNaN(value.getTime())) {
        return { valid: false, error: 'Invalid date' };
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Value must be a list' };
      }
      if (validationRules.minLength !== undefined && value.length < validationRules.minLength) {
        return {
          valid: false,
          error: `Must have at least ${validationRules.minLength} items`
        };
      }
      if (validationRules.maxLength !== undefined && value.length > validationRules.maxLength) {
        return { valid: false, error: `Must have at most ${validationRules.maxLength} items` };
      }
      // Validate each item is a string
      for (const item of value) {
        if (typeof item !== 'string') {
          return { valid: false, error: 'All items must be text' };
        }
      }
      break;
    }
    case 'checkbox': {
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Value must be an array of selections' };
      }
      // Validate each selection is in the choices
      if (validationRules.choices && validationRules.choices.length > 0) {
        for (const item of value) {
          if (!validationRules.choices.includes(item as string)) {
            return { valid: false, error: `Invalid selection: ${item}` };
          }
        }
      }
      break;
    }
    case 'radio': {
      if (typeof value !== 'string') {
        return { valid: false, error: 'Value must be a single selection' };
      }
      // Validate selection is in the choices
      if (validationRules.choices && validationRules.choices.length > 0) {
        if (!validationRules.choices.includes(value)) {
          return { valid: false, error: `Invalid selection: ${value}` };
        }
      }
      break;
    }
  }

  return { valid: true };
}
