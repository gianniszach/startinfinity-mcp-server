# StartInfinity MCP Server - Project Management Workflow Examples

This document demonstrates practical usage of the StartInfinity MCP server tools in real project management workflows. The MCP server is assumed to be already configured and connected.

## Table of Contents

1. [Daily Standup Workflow](#daily-standup-workflow)
2. [Sprint Planning Workflow](#sprint-planning-workflow)
3. [Task Status Tracking](#task-status-tracking)
4. [Progress Reporting](#progress-reporting)
5. [Team Communication](#team-communication)
6. [Project Setup](#project-setup)
7. [Weekly Review](#weekly-review)

---

## Daily Standup Workflow

### Scenario: Check what's in progress and what's done today

**Step 1: Get items currently in "Doing" status**

**Example Prompt:** "Show me all items with status 'Doing' in board Marketing"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Status",
    "attributeValue": "Doing"
  }
}
```

**Step 2: Get items completed today (status = "Done")**

**Example Prompt:** "What items are marked as Done in board Marketing?"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Status",
    "attributeValue": "Done"
  }
}
```

**Step 3: Get formatted summary for reporting**

**Example Prompt:** "Give me a formatted summary of all items in board LA1dW8i1TTK with statistics"

```json
{
  "tool": "fetch_items_formatted",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "includeSummary": true
  }
}
```

**Result:** You get a formatted report showing:
- Items in progress
- Items completed
- Summary statistics
- Ready for standup discussion

---

## Sprint Planning Workflow

### Scenario: Set up a new sprint with tasks

**Step 1: Create a new folder for the sprint**

**Example Prompt:** "Create a new folder called 'Sprint 15 - Q1 Features' in board LA1dW8i1TTK"

```json
{
  "tool": "create_folder",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "name": "Sprint 15 - Q1 Features"
  }
}
```

**Step 2: Get the folder ID from the response, then create tasks**

**Example Prompt:** "Create a new task 'Implement user authentication' in folder [folder_id] of board LA1dW8i1TTK with status Todo, priority High, and assign it to [member]"

```json
{
  "tool": "create_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "folderId": "folder_id_from_step_1",
    "values": {
      "54767acf-0832-4080-839c-5556bbbd9f10": "Implement user authentication",
      "status_attribute_id": "status_label_id_for_todo",
      "priority_attribute_id": "priority_label_id_for_high",
      "assignee_attribute_id": "member_id"
    }
  }
}
```

**Step 3: Create multiple tasks in batch**

**Example Prompts:**
- "Create a task 'Design new dashboard UI' in the same folder"
- "Add a task 'Write API documentation' to folder [folder_id]"
- "Create a task 'Set up CI/CD pipeline' in board LA1dW8i1TTK folder [folder_id]"

Repeat Step 2 for each task, or create them one by one:
- "Design new dashboard UI"
- "Write API documentation"
- "Set up CI/CD pipeline"

**Step 4: Verify all tasks were created**

**Example Prompt:** "Show me all items in folder [folder_id] of board LA1dW8i1TTK"

```json
{
  "tool": "fetch_items",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "folderId": "folder_id_from_step_1"
  }
}
```

---

## Task Status Tracking

### Scenario: Update task status as work progresses

**Step 1: Find tasks assigned to a specific person**

**Example Prompt:** "Show me all tasks assigned to John Doe in board LA1dW8i1TTK"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Assignee",
    "attributeValue": "John Doe"
  }
}
```

**Step 2: Move a task to "In Progress"**

**Example Prompt:** "Update the status of item [item_id] to 'Doing' in board LA1dW8i1TTK"

```json
{
  "tool": "update_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id_from_step_1",
    "values": {
      "status_attribute_id": "status_label_id_for_doing"
    }
  }
}
```

**Step 3: Update task with progress comment**

**Example Prompt:** "Add a comment to item [item_id] saying 'Started implementation. Completed API integration, working on UI components.'"

```json
{
  "tool": "post_comment",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id_from_step_1",
    "content": "Started implementation. Completed API integration, working on UI components."
  }
}
```

**Step 4: Mark task as complete**

**Example Prompt:** "Mark item [item_id] as Done in board LA1dW8i1TTK"

```json
{
  "tool": "update_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id_from_step_1",
    "values": {
      "status_attribute_id": "status_label_id_for_done"
    }
  }
}
```

---

## Progress Reporting

### Scenario: Generate a progress report for stakeholders

**Step 1: Get folder snapshot (in progress + pending items)**

**Example Prompt:** "Give me a snapshot of the 'Sprint 15 - Q1 Features' folder in board LA1dW8i1TTK showing what's in progress and what's pending"

```json
{
  "tool": "fetch_folder_snapshot",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "folderName": "Sprint 15 - Q1 Features"
  }
}
```

**Result includes:**
- Items currently in progress
- Items pending in the near future
- Summary statistics

**Step 2: Get formatted items with summary**

**Example Prompt:** "Get a formatted report with summary of all items in folder [folder_id] of board LA1dW8i1TTK"

```json
{
  "tool": "fetch_items_formatted",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "folderId": "folder_id",
    "includeSummary": true
  }
}
```

**Step 3: Get detailed breakdown by status**

**Example Prompts:**
- "Show me all items with status 'Done' in board LA1dW8i1TTK"
- "What items are in 'Todo' status?"
- "List all 'Doing' items in board LA1dW8i1TTK"
- "Find all blocked items in board LA1dW8i1TTK"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Status",
    "attributeValue": "Done"
  }
}
```

Repeat for each status: "Todo", "Doing", "Done", "Blocked"

**Step 4: Get item details for specific high-priority items**

**Example Prompt:** "Get all details for item [important_item_id] in board LA1dW8i1TTK as JSON"

```json
{
  "tool": "fetch_item_json",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "important_item_id"
  }
}
```

---

## Team Communication

### Scenario: Communicate updates and blockers

**Step 1: Post update on a task**

**Example Prompt:** "Add a comment to item [item_id] saying we're blocked waiting for API access credentials from the infrastructure team, expected by EOD"

```json
{
  "tool": "post_comment",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id",
    "content": "Blocked: Waiting for API access credentials from the infrastructure team. Expected by EOD."
  }
}
```

**Step 2: Update task status to "Blocked"**

**Example Prompt:** "Mark item [item_id] as Blocked in board LA1dW8i1TTK"

```json
{
  "tool": "update_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id",
    "values": {
      "status_attribute_id": "status_label_id_for_blocked"
    }
  }
}
```

**Step 3: Post resolution update**

**Example Prompt:** "Post a comment on item [item_id] that we're unblocked, received credentials and resuming work"

```json
{
  "tool": "post_comment",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id",
    "content": "Unblocked: Received credentials. Resuming work."
  }
}
```

**Step 4: Update multiple attributes at once**

**Example Prompt:** "Update item [item_id] to status 'Doing', set progress to 75%, and add note 'Final testing phase'"

```json
{
  "tool": "update_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id",
    "values": {
      "status_attribute_id": "status_label_id_for_doing",
      "progress_attribute_id": "75",
      "notes_attribute_id": "Final testing phase"
    }
  }
}
```

---

## Project Setup

### Scenario: Create a new project board and structure

**Step 1: Create a new board**

**Example Prompt:** "Create a new board called 'Q2 Product Launch' with description 'Project board for Q2 product launch initiatives'"

```json
{
  "tool": "create_board",
  "arguments": {
    "name": "Q2 Product Launch",
    "description": "Project board for Q2 product launch initiatives"
  }
}
```

**Step 2: Create project folders**

**Example Prompts:**
- "Create a folder called 'Planning' in board [new_board_id]"
- "Add a folder 'Development' to board [new_board_id]"
- "Create a 'Testing' folder under the Development folder in board [new_board_id]"

```json
{
  "tool": "create_folder",
  "arguments": {
    "boardId": "new_board_id_from_step_1",
    "name": "Planning"
  }
}
```

```json
{
  "tool": "create_folder",
  "arguments": {
    "boardId": "new_board_id_from_step_1",
    "name": "Development"
  }
}
```

```json
{
  "tool": "create_folder",
  "arguments": {
    "boardId": "new_board_id_from_step_1",
    "name": "Testing",
    "parentId": "development_folder_id"
  }
}
```

**Step 3: Get board structure**

**Example Prompt:** "Show me all folders in board [new_board_id]"

```json
{
  "tool": "fetch_folders",
  "arguments": {
    "boardId": "new_board_id_from_step_1"
  }
}
```

**Step 4: Get board attributes to understand structure**

**Example Prompt:** "What attributes are available in board [new_board_id]?"

```json
{
  "tool": "fetch_attributes",
  "arguments": {
    "boardId": "new_board_id_from_step_1"
  }
}
```

This helps you understand:
- Available status options
- Priority levels
- Custom attributes
- Attribute IDs needed for creating/updating items

---

## Weekly Review

### Scenario: Review week's progress and plan next week

**Step 1: Get all boards in workspace**

**Example Prompt:** "List all boards in the workspace"

```json
{
  "tool": "fetch_boards",
  "arguments": {}
}
```

**Step 2: For each active board, get items completed this week**

**Example Prompt:** "Show me all completed items in board [board_id]"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "board_id",
    "attributeName": "Status",
    "attributeValue": "Done"
  }
}
```

**Step 2: Get formatted summary for each board**

**Example Prompt:** "Give me a formatted summary with statistics for board [board_id]"

```json
{
  "tool": "fetch_items_formatted",
  "arguments": {
    "boardId": "board_id",
    "includeSummary": true
  }
}
```

**Step 3: Get folder snapshots for active projects**

**Example Prompt:** "Get a snapshot of the 'Current Sprint' folder in board [board_id]"

```json
{
  "tool": "fetch_folder_snapshot",
  "arguments": {
    "boardId": "board_id",
    "folderName": "Current Sprint"
  }
}
```

**Step 4: Identify blocked items**

**Example Prompt:** "Find all blocked items in board [board_id]"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "board_id",
    "attributeName": "Status",
    "attributeValue": "Blocked"
  }
}
```

**Step 5: Review comments on critical items**

**Example Prompt:** "Show me all details for item [critical_item_id] in board [board_id]"

For each critical item:
```json
{
  "tool": "fetch_item_details",
  "arguments": {
    "boardId": "board_id",
    "itemId": "critical_item_id"
  }
}
```

---

## Advanced Workflows

### Finding Items by Multiple Criteria

**Scenario: Find high-priority items assigned to a specific person**

**Example Prompt:** "Show me all tasks assigned to John Doe in board LA1dW8i1TTK"

```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Assignee",
    "attributeValue": "John Doe"
  }
}
```

Then filter the results for high priority items, or use `fetch_items` and filter client-side.

### Bulk Operations

**Scenario: Update multiple items to a new status**

**Example Prompt:** "Find all items in 'Review' status in board LA1dW8i1TTK"

1. Fetch items with current status:
```json
{
  "tool": "fetch_items_by_attribute",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "attributeName": "Status",
    "attributeValue": "Review"
  }
}
```

**Example Prompt:** "Mark all these items as Done"

2. For each item, update to "Done":
```json
{
  "tool": "update_item",
  "arguments": {
    "boardId": "LA1dW8i1TTK",
    "itemId": "item_id",
    "values": {
      "status_attribute_id": "status_label_id_for_done"
    }
  }
}
```

### Getting Attribute Information

**Before creating or updating items, get attribute structure:**

**Example Prompt:** "What attributes are available in board LA1dW8i1TTK? Show me the structure and available options"

```json
{
  "tool": "fetch_attributes",
  "arguments": {
    "boardId": "LA1dW8i1TTK"
  }
}
```

This returns:
- All attribute IDs and names
- Attribute types
- Available options for label/select attributes
- Required for mapping attribute names to IDs

### Member Management

**Get team members to map IDs to names:**

**Example Prompt:** "List all members in the workspace"

```json
{
  "tool": "fetch_members",
  "arguments": {}
}
```

Use this to:
- Find member IDs for assigning tasks
- Display member names in reports
- Filter items by assignee

---

## Tips for Effective Workflow

1. **Always fetch attributes first** when working with a new board to understand the structure
2. **Use formatted items** for reporting - they include resolved names for members and labels
3. **Use folder snapshots** for quick overviews of project status
4. **Post comments** to maintain context and history on items
5. **Update status regularly** to keep boards accurate and useful
6. **Use attribute filtering** to quickly find relevant items
7. **Combine tools** - fetch items, then get details for specific ones that need attention

---

## Common Patterns

### Pattern 1: Daily Check-in
1. `fetch_items_by_attribute` (Status: "Doing")
2. `fetch_items_by_attribute` (Status: "Blocked")
3. Review and update as needed

### Pattern 2: Sprint Planning
1. `create_folder` (new sprint)
2. `fetch_attributes` (understand structure)
3. `create_item` (multiple tasks)
4. `fetch_items` (verify creation)

### Pattern 3: Status Update
1. `fetch_item_details` (get current state)
2. `post_comment` (add update)
3. `update_item` (change status/attributes)

### Pattern 4: Reporting
1. `fetch_folder_snapshot` (overview)
2. `fetch_items_formatted` (detailed with summary)
3. `fetch_items_by_attribute` (by status for breakdown)

---

These examples demonstrate how to combine the StartInfinity MCP server tools to support real project management workflows. Adapt these patterns to your specific needs and board structures.

