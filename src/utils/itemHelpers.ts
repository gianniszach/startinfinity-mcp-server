/**
 * Utility functions for working with StartInfinity items and attributes
 */

export interface Attribute {
  id: string;
  name: string;
  type: string;
}

export interface ValueObject {
  object: 'value';
  data: any;
  attribute_id: string;
  deleted: boolean;
}

export interface ItemWithValues {
  id: string;
  values?: ValueObject[]; // Array of value objects, not a key-value object
  [key: string]: any;
}

export interface Member {
  id: number;
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface MemberMap {
  [memberId: number]: string; // Maps member ID to name
}

export interface FormattedItem {
  id: string;
  title?: string;
  attributes: Record<string, any>;
  metadata: {
    folder_id?: string;
    parent_id?: string | null;
    created_at?: string;
    sort_order?: string;
    deleted?: boolean;
  };
}

/**
 * Creates a mapping of member IDs to member names
 * @param members - Array of member objects from the API
 * @returns A map from member ID to member name
 */
export function createMemberMap(members: Member[]): MemberMap {
  const memberMap: MemberMap = {};
  
  for (const member of members) {
    if (member.id) {
      // Use name if available, otherwise fall back to email, otherwise use ID as string
      memberMap[member.id] = member.name || member.email || `Member ${member.id}`;
    }
  }
  
  return memberMap;
}

/**
 * Resolves member IDs to member names
 * @param memberIds - Array of member IDs
 * @param memberMap - Map of member ID to name
 * @returns Array of member names
 */
export function resolveMemberNames(memberIds: number[], memberMap: MemberMap): string[] {
  return memberIds.map(id => memberMap[id] || `Member ${id}`);
}

/**
 * Extracts the title from an item using the Name attribute
 * @param item - The item object with values array
 * @param nameAttributeId - The attribute ID for the Name field (default: common ID)
 * @returns The item title or undefined if not found
 */
export function extractTitle(
  item: ItemWithValues,
  nameAttributeId: string = '54767acf-0832-4080-839c-5556bbbd9f10'
): string | undefined {
  if (!item.values || !Array.isArray(item.values)) {
    return undefined;
  }
  
  const nameValue = item.values.find(v => 
    v.attribute_id === nameAttributeId && !v.deleted
  );
  
  return nameValue ? nameValue.data : undefined;
}

/**
 * Formats an item with extracted attributes for easier reporting
 * @param item - The item object
 * @param attributes - Array of attribute definitions to map IDs to names
 * @param nameAttributeId - The attribute ID for the Name field
 * @param memberMap - Optional map of member IDs to names for resolving member attributes
 * @returns A formatted item with title and mapped attributes
 */
export function formatItem(
  item: ItemWithValues,
  attributes: Attribute[] = [],
  nameAttributeId: string = '54767acf-0832-4080-839c-5556bbbd9f10',
  memberMap?: MemberMap
): FormattedItem {
  const attributeMap = new Map(attributes.map(attr => [attr.id, attr]));
  const formattedAttributes: Record<string, any> = {};
  
  // Extract all attribute values and map them to attribute names
  // values is an array of ValueObject, not a key-value object
  if (item.values && Array.isArray(item.values)) {
    for (const valueObj of item.values) {
      if (valueObj.deleted) continue; // Skip deleted values
      
      const attribute = attributeMap.get(valueObj.attribute_id);
      const attrName = attribute ? attribute.name : valueObj.attribute_id;
      
      let displayValue = valueObj.data;
      
      // If this is a members attribute and we have a member map, resolve IDs to names
      if (attribute?.type === 'members' && Array.isArray(valueObj.data) && memberMap) {
        displayValue = resolveMemberNames(valueObj.data, memberMap);
      }
      
      formattedAttributes[attrName] = {
        id: valueObj.attribute_id,
        type: attribute?.type || 'unknown',
        value: displayValue,
        rawValue: valueObj.data, // Keep original value for reference
      };
    }
  }

  return {
    id: item.id,
    title: extractTitle(item, nameAttributeId),
    attributes: formattedAttributes,
    metadata: {
      folder_id: item.folder_id,
      parent_id: item.parent_id,
      created_at: item.created_at,
      sort_order: item.sort_order,
      deleted: item.deleted,
    },
  };
}

/**
 * Formats multiple items for reporting
 * @param items - Array of item objects
 * @param attributes - Array of attribute definitions
 * @param nameAttributeId - The attribute ID for the Name field
 * @param memberMap - Optional map of member IDs to names for resolving member attributes
 * @returns Array of formatted items
 */
export function formatItems(
  items: ItemWithValues[],
  attributes: Attribute[] = [],
  nameAttributeId: string = '54767acf-0832-4080-839c-5556bbbd9f10',
  memberMap?: MemberMap
): FormattedItem[] {
  return items.map(item => formatItem(item, attributes, nameAttributeId, memberMap));
}

/**
 * Creates a summary report of items in a folder
 * @param items - Array of formatted items
 * @returns A summary object with counts and titles
 */
export function createItemSummary(items: FormattedItem[]): {
  total: number;
  itemsWithTitles: number;
  itemsWithoutTitles: number;
  titles: string[];
} {
  const titles = items
    .map(item => item.title)
    .filter((title): title is string => title !== undefined);
  
  return {
    total: items.length,
    itemsWithTitles: titles.length,
    itemsWithoutTitles: items.length - titles.length,
    titles: titles,
  };
}

/**
 * Parses a date string or returns null if invalid
 */
function parseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Checks if a date is within the next N days
 */
function isWithinDays(date: Date | null, days: number): boolean {
  if (!date) return false;
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date >= now && date <= futureDate;
}

/**
 * Checks if a date range indicates an item is currently in progress
 */
function isInProgress(startDate: Date | null, endDate: Date | null): boolean {
  const now = new Date();
  
  // If we have both dates, check if now is between them
  if (startDate && endDate) {
    return now >= startDate && now <= endDate;
  }
  
  // If only start date, check if it's in the past (started)
  if (startDate && !endDate) {
    return now >= startDate;
  }
  
  // If only end date, check if it's in the future (not finished)
  if (!startDate && endDate) {
    return now <= endDate;
  }
  
  return false;
}

/**
 * Creates a snapshot report categorizing items by their progress status
 * @param items - Array of formatted items
 * @param attributes - Array of attribute definitions to find date/status fields
 * @returns A snapshot report with in-progress and pending items
 */
export function createSnapshotReport(
  items: FormattedItem[],
  attributes: Attribute[] = []
): {
  inProgress: FormattedItem[];
  pendingNearFuture: FormattedItem[];
  summary: {
    total: number;
    inProgressCount: number;
    pendingNearFutureCount: number;
    otherCount: number;
  };
} {
  const now = new Date();
  const nearFutureDays = 30; // Consider "near future" as within 30 days
  
  // Find common attribute names for dates and status
  const dateAttributeNames = ['Start Date', 'End Date', 'Due Date', 'Start', 'End', 'Due'];
  const statusAttributeNames = ['Status', 'State', 'Progress'];
  
  // Find attribute IDs for date and status fields
  const startDateAttr = attributes.find(attr => 
    dateAttributeNames.some(name => attr.name.toLowerCase().includes(name.toLowerCase()) && 
    attr.name.toLowerCase().includes('start'))
  );
  const endDateAttr = attributes.find(attr => 
    dateAttributeNames.some(name => attr.name.toLowerCase().includes(name.toLowerCase()) && 
    (attr.name.toLowerCase().includes('end') || attr.name.toLowerCase().includes('due')))
  );
  const statusAttr = attributes.find(attr => 
    statusAttributeNames.some(name => attr.name.toLowerCase() === name.toLowerCase())
  );
  
  const inProgress: FormattedItem[] = [];
  const pendingNearFuture: FormattedItem[] = [];
  
  for (const item of items) {
    // Try to find date attributes in the item
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let status: any = null;
    
    // Look for date attributes by name
    for (const [attrName, attrData] of Object.entries(item.attributes)) {
      const lowerName = attrName.toLowerCase();
      
      // Check for start date
      if (!startDate && (lowerName.includes('start') || lowerName.includes('start date'))) {
        startDate = parseDate(attrData.value);
      }
      
      // Check for end/due date
      if (!endDate && (lowerName.includes('end') || lowerName.includes('due') || 
          lowerName.includes('end date') || lowerName.includes('due date'))) {
        endDate = parseDate(attrData.value);
      }
      
      // Check for status
      if (!status && (lowerName === 'status' || lowerName === 'state' || lowerName === 'progress')) {
        status = attrData.value;
      }
    }
    
    // Determine if item is in progress
    const isCurrentlyInProgress = isInProgress(startDate, endDate) || 
      (status && typeof status === 'string' && 
       (status.toLowerCase().includes('progress') || 
        status.toLowerCase().includes('in progress') || 
        status.toLowerCase().includes('active') ||
        status.toLowerCase().includes('working')));
    
    // Determine if item is pending in near future
    const isPendingNearFuture = !isCurrentlyInProgress && 
      ((startDate && isWithinDays(startDate, nearFutureDays)) ||
       (endDate && isWithinDays(endDate, nearFutureDays)));
    
    if (isCurrentlyInProgress) {
      inProgress.push(item);
    } else if (isPendingNearFuture) {
      pendingNearFuture.push(item);
    }
  }
  
  return {
    inProgress,
    pendingNearFuture,
    summary: {
      total: items.length,
      inProgressCount: inProgress.length,
      pendingNearFutureCount: pendingNearFuture.length,
      otherCount: items.length - inProgress.length - pendingNearFuture.length,
    },
  };
}

