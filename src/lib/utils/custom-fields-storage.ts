/**
 * Custom Fields Storage Layer
 *
 * Provides localStorage persistence for custom field definitions with:
 * - CRUD operations for field definitions
 * - Soft-delete (archive) support for data preservation
 * - Audit logging for all changes
 */

import type { CustomFieldDefinition, CustomFieldFormData } from '$lib/types/custom-fields';
import {
  DEFAULT_AGGREGATION_TYPE,
  DEFAULT_VALIDATION_RULES,
  generateFieldName
} from '$lib/types/custom-fields';
import { nanoid } from 'nanoid';
import { logAuditAction } from './audit';

// ===== STORAGE KEY =====

export const CUSTOM_FIELDS_STORAGE_KEY = 'sccdp_config_custom_fields';

// ===== CRUD OPERATIONS =====

/**
 * Get all custom field definitions from localStorage
 */
export function getCustomFieldDefinitions(): CustomFieldDefinition[] {
  if (typeof window === 'undefined') return [];

  try {
    const json = localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY);
    const definitions: CustomFieldDefinition[] = json ? JSON.parse(json) : [];
    // Sort by displayOrder
    return definitions.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error('Failed to load custom field definitions:', error);
    return [];
  }
}

/**
 * Get only active custom field definitions
 */
export function getActiveCustomFieldDefinitions(): CustomFieldDefinition[] {
  return getCustomFieldDefinitions().filter((def) => def.isActive);
}

/**
 * Get a single custom field definition by ID
 */
export function getCustomFieldDefinitionById(id: string): CustomFieldDefinition | null {
  const definitions = getCustomFieldDefinitions();
  return definitions.find((def) => def.id === id) ?? null;
}

/**
 * Save all custom field definitions to localStorage
 */
function saveCustomFieldDefinitions(definitions: CustomFieldDefinition[]): boolean {
  try {
    localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(definitions));
    return true;
  } catch (error) {
    console.error('Failed to save custom field definitions:', error);
    return false;
  }
}

/**
 * Create a new custom field definition
 */
export function createCustomFieldDefinition(
  formData: CustomFieldFormData,
  createdBy: string
): CustomFieldDefinition | null {
  const definitions = getCustomFieldDefinitions();

  // Generate field name from display label if not provided
  const fieldName = formData.fieldName.trim() || generateFieldName(formData.displayLabel);

  // Check for duplicate field names
  if (definitions.some((def) => def.fieldName === fieldName && def.isActive)) {
    console.error('A field with this name already exists');
    return null;
  }

  // Get next display order
  const maxOrder = definitions.reduce((max, def) => Math.max(max, def.displayOrder), 0);

  const newDefinition: CustomFieldDefinition = {
    id: nanoid(),
    fieldName,
    displayLabel: formData.displayLabel.trim(),
    dataType: formData.dataType,
    validationRules: {
      ...DEFAULT_VALIDATION_RULES[formData.dataType],
      ...formData.validationRules
    },
    aggregationType: formData.aggregationType || DEFAULT_AGGREGATION_TYPE[formData.dataType],
    displayOrder: maxOrder + 1,
    isActive: true,
    description: formData.description?.trim(),
    createdAt: new Date().toISOString(),
    createdBy
  };

  definitions.push(newDefinition);

  if (saveCustomFieldDefinitions(definitions)) {
    // Log audit action
    logAuditAction(
      'create',
      'system',
      newDefinition.id,
      `Custom Field: ${newDefinition.displayLabel}`,
      `Created custom field "${newDefinition.displayLabel}" (${newDefinition.dataType})`
    );
    return newDefinition;
  }

  return null;
}

/**
 * Update an existing custom field definition
 */
export function updateCustomFieldDefinition(
  id: string,
  formData: Partial<CustomFieldFormData>,
  updatedBy: string
): CustomFieldDefinition | null {
  const definitions = getCustomFieldDefinitions();
  const index = definitions.findIndex((def) => def.id === id);

  if (index === -1) {
    console.error('Custom field definition not found');
    return null;
  }

  const existing = definitions[index];

  // Check for duplicate field names if changing
  if (formData.fieldName && formData.fieldName !== existing.fieldName) {
    const newFieldName =
      formData.fieldName.trim() ||
      generateFieldName(formData.displayLabel || existing.displayLabel);
    if (
      definitions.some((def) => def.fieldName === newFieldName && def.id !== id && def.isActive)
    ) {
      console.error('A field with this name already exists');
      return null;
    }
  }

  const updated: CustomFieldDefinition = {
    ...existing,
    ...(formData.displayLabel && { displayLabel: formData.displayLabel.trim() }),
    ...(formData.fieldName && {
      fieldName:
        formData.fieldName.trim() ||
        generateFieldName(formData.displayLabel || existing.displayLabel)
    }),
    ...(formData.dataType && { dataType: formData.dataType }),
    ...(formData.validationRules && {
      validationRules: { ...existing.validationRules, ...formData.validationRules }
    }),
    ...(formData.aggregationType && { aggregationType: formData.aggregationType }),
    ...(formData.description !== undefined && { description: formData.description?.trim() }),
    updatedAt: new Date().toISOString(),
    updatedBy
  };

  definitions[index] = updated;

  if (saveCustomFieldDefinitions(definitions)) {
    // Log audit action
    logAuditAction(
      'update',
      'system',
      updated.id,
      `Custom Field: ${updated.displayLabel}`,
      `Updated custom field "${updated.displayLabel}"`
    );
    return updated;
  }

  return null;
}

/**
 * Archive (soft-delete) a custom field definition
 * Preserves historical data by marking as inactive instead of deleting
 */
export function archiveCustomFieldDefinition(id: string, archivedBy: string): boolean {
  const definitions = getCustomFieldDefinitions();
  const index = definitions.findIndex((def) => def.id === id);

  if (index === -1) {
    console.error('Custom field definition not found');
    return false;
  }

  const existing = definitions[index];
  definitions[index] = {
    ...existing,
    isActive: false,
    updatedAt: new Date().toISOString(),
    updatedBy: archivedBy
  };

  if (saveCustomFieldDefinitions(definitions)) {
    // Log audit action
    logAuditAction(
      'delete',
      'system',
      existing.id,
      `Custom Field: ${existing.displayLabel}`,
      `Archived custom field "${existing.displayLabel}"`
    );
    return true;
  }

  return false;
}

/**
 * Restore an archived custom field definition
 */
export function restoreCustomFieldDefinition(id: string, restoredBy: string): boolean {
  const definitions = getCustomFieldDefinitions();
  const index = definitions.findIndex((def) => def.id === id);

  if (index === -1) {
    console.error('Custom field definition not found');
    return false;
  }

  const existing = definitions[index];

  // Check for duplicate field names among active fields
  if (
    definitions.some((def) => def.fieldName === existing.fieldName && def.id !== id && def.isActive)
  ) {
    console.error('A field with this name already exists');
    return false;
  }

  definitions[index] = {
    ...existing,
    isActive: true,
    updatedAt: new Date().toISOString(),
    updatedBy: restoredBy
  };

  if (saveCustomFieldDefinitions(definitions)) {
    // Log audit action
    logAuditAction(
      'update',
      'system',
      existing.id,
      `Custom Field: ${existing.displayLabel}`,
      `Restored custom field "${existing.displayLabel}"`
    );
    return true;
  }

  return false;
}

/**
 * Permanently delete a custom field definition
 * WARNING: This should only be used for fields that have never had data collected
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function permanentlyDeleteCustomFieldDefinition(id: string, _deletedBy: string): boolean {
  const definitions = getCustomFieldDefinitions();
  const index = definitions.findIndex((def) => def.id === id);

  if (index === -1) {
    console.error('Custom field definition not found');
    return false;
  }

  const existing = definitions[index];
  definitions.splice(index, 1);

  if (saveCustomFieldDefinitions(definitions)) {
    // Log audit action
    logAuditAction(
      'delete',
      'system',
      existing.id,
      `Custom Field: ${existing.displayLabel}`,
      `Permanently deleted custom field "${existing.displayLabel}"`
    );
    return true;
  }

  return false;
}

/**
 * Reorder custom field definitions
 */
export function reorderCustomFieldDefinitions(orderedIds: string[], reorderedBy: string): boolean {
  const definitions = getCustomFieldDefinitions();

  // Update display order based on the new order
  orderedIds.forEach((id, index) => {
    const defIndex = definitions.findIndex((def) => def.id === id);
    if (defIndex !== -1) {
      definitions[defIndex] = {
        ...definitions[defIndex],
        displayOrder: index + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: reorderedBy
      };
    }
  });

  if (saveCustomFieldDefinitions(definitions)) {
    // Log audit action
    logAuditAction(
      'update',
      'system',
      undefined,
      'Custom Fields',
      'Reordered custom field definitions'
    );
    return true;
  }

  return false;
}

/**
 * Check if any custom fields exist (for hiding/showing Supplementary tab)
 */
export function hasActiveCustomFields(): boolean {
  return getActiveCustomFieldDefinitions().length > 0;
}

/**
 * Check if custom fields configuration has been modified
 */
export function hasCustomFieldsOverride(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY) !== null;
}
