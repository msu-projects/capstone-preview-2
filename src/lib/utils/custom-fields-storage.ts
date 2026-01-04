/**
 * Custom Fields Storage Layer
 *
 * Provides localStorage persistence for custom field definitions with:
 * - CRUD operations for field definitions
 * - CRUD operations for field groups
 * - Soft-delete (archive) support for data preservation
 * - Audit logging for all changes
 */

import type {
  CustomFieldDefinition,
  CustomFieldFormData,
  CustomFieldGroup,
  CustomFieldGroupFormData
} from '$lib/types/custom-fields';
import {
  DEFAULT_AGGREGATION_TYPE,
  DEFAULT_VALIDATION_RULES,
  generateFieldName
} from '$lib/types/custom-fields';
import { nanoid } from 'nanoid';
import { logAuditAction } from './audit';

// ===== STORAGE KEYS =====

export const CUSTOM_FIELDS_STORAGE_KEY = 'sccdp_config_custom_fields';
export const CUSTOM_FIELD_GROUPS_STORAGE_KEY = 'sccdp_config_custom_field_groups';

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

  // Get next group display order if groupId is set
  let groupDisplayOrder: number | undefined;
  if (formData.groupId) {
    const groupFields = definitions.filter((d) => d.groupId === formData.groupId);
    groupDisplayOrder =
      groupFields.reduce((max, d) => Math.max(max, d.groupDisplayOrder ?? 0), 0) + 1;
  }

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
    groupId: formData.groupId,
    groupDisplayOrder,
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

  // Handle group change - assign new groupDisplayOrder if moving to different group
  let groupDisplayOrder = existing.groupDisplayOrder;
  if (formData.groupId !== undefined && formData.groupId !== existing.groupId) {
    if (formData.groupId) {
      const targetGroupFields = definitions.filter(
        (d) => d.groupId === formData.groupId && d.id !== id
      );
      groupDisplayOrder =
        targetGroupFields.reduce((max, d) => Math.max(max, d.groupDisplayOrder ?? 0), 0) + 1;
    } else {
      groupDisplayOrder = undefined;
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
    ...(formData.groupId !== undefined && { groupId: formData.groupId || undefined }),
    groupDisplayOrder,
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

// ===== CUSTOM FIELD GROUPS CRUD =====

/**
 * Get all custom field groups from localStorage
 */
export function getCustomFieldGroups(): CustomFieldGroup[] {
  if (typeof window === 'undefined') return [];

  try {
    const json = localStorage.getItem(CUSTOM_FIELD_GROUPS_STORAGE_KEY);
    const groups: CustomFieldGroup[] = json ? JSON.parse(json) : [];
    // Sort by displayOrder
    return groups.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    console.error('Failed to load custom field groups:', error);
    return [];
  }
}

/**
 * Get only active custom field groups
 */
export function getActiveCustomFieldGroups(): CustomFieldGroup[] {
  return getCustomFieldGroups().filter((group) => group.isActive);
}

/**
 * Get a single custom field group by ID
 */
export function getCustomFieldGroupById(id: string): CustomFieldGroup | null {
  const groups = getCustomFieldGroups();
  return groups.find((group) => group.id === id) ?? null;
}

/**
 * Save all custom field groups to localStorage
 */
function saveCustomFieldGroups(groups: CustomFieldGroup[]): boolean {
  try {
    localStorage.setItem(CUSTOM_FIELD_GROUPS_STORAGE_KEY, JSON.stringify(groups));
    return true;
  } catch (error) {
    console.error('Failed to save custom field groups:', error);
    return false;
  }
}

/**
 * Create a new custom field group
 */
export function createCustomFieldGroup(
  formData: CustomFieldGroupFormData,
  createdBy: string
): CustomFieldGroup | null {
  const groups = getCustomFieldGroups();

  // Check for duplicate names
  if (groups.some((g) => g.name.toLowerCase() === formData.name.toLowerCase() && g.isActive)) {
    console.error('A group with this name already exists');
    return null;
  }

  // Get next display order
  const maxOrder = groups.reduce((max, g) => Math.max(max, g.displayOrder), 0);

  const newGroup: CustomFieldGroup = {
    id: nanoid(),
    name: formData.name.trim(),
    description: formData.description?.trim(),
    icon: formData.icon || 'Folder',
    displayOrder: maxOrder + 1,
    isCollapsible: formData.isCollapsible ?? true,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy
  };

  groups.push(newGroup);

  if (saveCustomFieldGroups(groups)) {
    logAuditAction(
      'create',
      'system',
      newGroup.id,
      `Custom Field Group: ${newGroup.name}`,
      `Created custom field group "${newGroup.name}"`
    );
    return newGroup;
  }

  return null;
}

/**
 * Update an existing custom field group
 */
export function updateCustomFieldGroup(
  id: string,
  formData: Partial<CustomFieldGroupFormData>,
  updatedBy: string
): CustomFieldGroup | null {
  const groups = getCustomFieldGroups();
  const index = groups.findIndex((g) => g.id === id);

  if (index === -1) {
    console.error('Custom field group not found');
    return null;
  }

  const existing = groups[index];

  // Check for duplicate names if changing
  if (formData.name && formData.name.toLowerCase() !== existing.name.toLowerCase()) {
    if (
      groups.some(
        (g) => g.name.toLowerCase() === formData.name!.toLowerCase() && g.id !== id && g.isActive
      )
    ) {
      console.error('A group with this name already exists');
      return null;
    }
  }

  const updated: CustomFieldGroup = {
    ...existing,
    ...(formData.name && { name: formData.name.trim() }),
    ...(formData.description !== undefined && { description: formData.description?.trim() }),
    ...(formData.icon !== undefined && { icon: formData.icon }),
    ...(formData.isCollapsible !== undefined && { isCollapsible: formData.isCollapsible }),
    updatedAt: new Date().toISOString(),
    updatedBy
  };

  groups[index] = updated;

  if (saveCustomFieldGroups(groups)) {
    logAuditAction(
      'update',
      'system',
      updated.id,
      `Custom Field Group: ${updated.name}`,
      `Updated custom field group "${updated.name}"`
    );
    return updated;
  }

  return null;
}

/**
 * Archive (soft-delete) a custom field group
 * Fields in this group will become uncategorized
 */
export function archiveCustomFieldGroup(id: string, archivedBy: string): boolean {
  const groups = getCustomFieldGroups();
  const index = groups.findIndex((g) => g.id === id);

  if (index === -1) {
    console.error('Custom field group not found');
    return false;
  }

  const existing = groups[index];
  groups[index] = {
    ...existing,
    isActive: false,
    updatedAt: new Date().toISOString(),
    updatedBy: archivedBy
  };

  // Move fields in this group to uncategorized
  const definitions = getCustomFieldDefinitions();
  const updatedDefinitions = definitions.map((def) => {
    if (def.groupId === id) {
      return {
        ...def,
        groupId: undefined,
        groupDisplayOrder: undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: archivedBy
      };
    }
    return def;
  });
  saveCustomFieldDefinitions(updatedDefinitions);

  if (saveCustomFieldGroups(groups)) {
    logAuditAction(
      'delete',
      'system',
      existing.id,
      `Custom Field Group: ${existing.name}`,
      `Archived custom field group "${existing.name}"`
    );
    return true;
  }

  return false;
}

/**
 * Restore an archived custom field group
 */
export function restoreCustomFieldGroup(id: string, restoredBy: string): boolean {
  const groups = getCustomFieldGroups();
  const index = groups.findIndex((g) => g.id === id);

  if (index === -1) {
    console.error('Custom field group not found');
    return false;
  }

  const existing = groups[index];

  // Check for duplicate names among active groups
  if (
    groups.some(
      (g) => g.name.toLowerCase() === existing.name.toLowerCase() && g.id !== id && g.isActive
    )
  ) {
    console.error('A group with this name already exists');
    return false;
  }

  groups[index] = {
    ...existing,
    isActive: true,
    updatedAt: new Date().toISOString(),
    updatedBy: restoredBy
  };

  if (saveCustomFieldGroups(groups)) {
    logAuditAction(
      'update',
      'system',
      existing.id,
      `Custom Field Group: ${existing.name}`,
      `Restored custom field group "${existing.name}"`
    );
    return true;
  }

  return false;
}

/**
 * Reorder custom field groups
 */
export function reorderCustomFieldGroups(orderedIds: string[], reorderedBy: string): boolean {
  const groups = getCustomFieldGroups();

  orderedIds.forEach((id, index) => {
    const groupIndex = groups.findIndex((g) => g.id === id);
    if (groupIndex !== -1) {
      groups[groupIndex] = {
        ...groups[groupIndex],
        displayOrder: index + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: reorderedBy
      };
    }
  });

  if (saveCustomFieldGroups(groups)) {
    logAuditAction(
      'update',
      'system',
      undefined,
      'Custom Field Groups',
      'Reordered custom field groups'
    );
    return true;
  }

  return false;
}

/**
 * Check if custom field groups exist
 */
export function hasActiveCustomFieldGroups(): boolean {
  return getActiveCustomFieldGroups().length > 0;
}

/**
 * Check if custom field groups configuration has been modified
 */
export function hasCustomFieldGroupsOverride(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CUSTOM_FIELD_GROUPS_STORAGE_KEY) !== null;
}

// ===== GROUPED FIELDS HELPERS =====

/**
 * Get fields organized by their groups
 * Returns a Map where keys are group IDs (or null for uncategorized)
 * and values are sorted arrays of field definitions
 */
export function getFieldsGroupedByGroup(): Map<string | null, CustomFieldDefinition[]> {
  const fields = getActiveCustomFieldDefinitions();
  const grouped = new Map<string | null, CustomFieldDefinition[]>();

  for (const field of fields) {
    const groupId = field.groupId ?? null;
    if (!grouped.has(groupId)) {
      grouped.set(groupId, []);
    }
    grouped.get(groupId)!.push(field);
  }

  // Sort fields within each group by groupDisplayOrder, then displayOrder
  for (const [, fieldList] of grouped) {
    fieldList.sort((a, b) => {
      const orderA = a.groupDisplayOrder ?? a.displayOrder;
      const orderB = b.groupDisplayOrder ?? b.displayOrder;
      return orderA - orderB;
    });
  }

  return grouped;
}

/**
 * Get fields for a specific group
 */
export function getFieldsByGroupId(groupId: string | null): CustomFieldDefinition[] {
  const fields = getActiveCustomFieldDefinitions();
  return fields
    .filter((f) => (f.groupId ?? null) === groupId)
    .sort((a, b) => {
      const orderA = a.groupDisplayOrder ?? a.displayOrder;
      const orderB = b.groupDisplayOrder ?? b.displayOrder;
      return orderA - orderB;
    });
}

/**
 * Reorder fields within a group
 */
export function reorderFieldsInGroup(
  groupId: string | null,
  orderedFieldIds: string[],
  reorderedBy: string
): boolean {
  const definitions = getCustomFieldDefinitions();

  orderedFieldIds.forEach((id, index) => {
    const defIndex = definitions.findIndex((def) => def.id === id);
    if (defIndex !== -1) {
      definitions[defIndex] = {
        ...definitions[defIndex],
        groupDisplayOrder: index + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: reorderedBy
      };
    }
  });

  if (saveCustomFieldDefinitions(definitions)) {
    logAuditAction(
      'update',
      'system',
      groupId ?? undefined,
      `Custom Fields in Group`,
      `Reordered fields in group`
    );
    return true;
  }

  return false;
}

/**
 * Move a field to a different group
 */
export function moveFieldToGroup(
  fieldId: string,
  targetGroupId: string | null,
  movedBy: string
): boolean {
  const definitions = getCustomFieldDefinitions();
  const index = definitions.findIndex((def) => def.id === fieldId);

  if (index === -1) {
    console.error('Field not found');
    return false;
  }

  // Get max order in target group
  const targetGroupFields = definitions.filter((d) => (d.groupId ?? null) === targetGroupId);
  const maxOrder = targetGroupFields.reduce((max, d) => Math.max(max, d.groupDisplayOrder ?? 0), 0);

  definitions[index] = {
    ...definitions[index],
    groupId: targetGroupId ?? undefined,
    groupDisplayOrder: maxOrder + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: movedBy
  };

  if (saveCustomFieldDefinitions(definitions)) {
    logAuditAction(
      'update',
      'system',
      fieldId,
      `Custom Field`,
      `Moved field to ${targetGroupId ? 'group' : 'uncategorized'}`
    );
    return true;
  }

  return false;
}
