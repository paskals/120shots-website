---
description: Interactive tool for managing film rolls and photo essays
argument-hint: "[roll|essay|rollessay] [additional-args...]"
allowed-tools:
  [
    "Bash",
    "Read",
    "Edit",
    "Glob",
    "TodoWrite",
    "mcp__sequential-thinking__sequentialthinking",
  ]
---

# Interactive Photo Management Command

You are helping the user manage their film photography portfolio. This command provides an interactive interface for:

1. **Creating a new film roll** from a folder with photos
2. **Creating a new photo essay** from a folder with photos
3. **Creating a new photo essay** from existing film rolls

## Available Commands and Scripts

The project has these npm scripts:

- `yarn create-essay -p /path/to/photos -d upload-dir -t "Essay Title" -m 2000`
- `yarn create-roll -p /path/to/photos -n ROLL-NAME -f film-stock -c "Camera Used"`
- `yarn create-roll-essay -r "ROLL1,ROLL2" -t "Essay Title"`
- `yarn r2-stats -p prefix --detailed` (to check existing rolls in R2 bucket)

Note: `create-roll` uses Google Vision API by default to generate image descriptions. Use `--skipVision` to disable.

## Available Film Types

Read the available films from `src/content/films/*.yaml` to validate film selections. Each film has:

- name: Display name
- brand: Film manufacturer
- color: One of "color-negative", "color-positive", "black-and-white-negative", "special-negative"
- iso: Film speed

## Film Roll Formats

Valid formats: "half-frame", "35mm", "6x6", "6x7", "6x8", "6x9", "4x5"

## Available Cameras

The user owns these cameras only:
- **Nikon F3** - 35mm SLR
- **Nikon FM3a** - 35mm SLR
- **Bronica SQ-Ai** - Medium format 6x6
- **Bronica GS1** - Medium format 6x7

Only suggest these cameras when asking for roll creation. Match the format to the camera (35mm for Nikon, 6x6 for SQ-Ai, 6x7 for GS1).

## Photo Essay Structure

Essays are composed of **spreads** (pages), each with a layout and photos:

- Layout types: `single`, `duo`, `trio`, `trio-l`, `trio-r`
- Each spread can have an optional `caption` field
- Essays have a `description` field for the overall essay description
- Essays have a `tags` array for categorization

**Important**: The Vision API generates detailed image descriptions during roll creation. These descriptions are available in the photo alt text and can be used to create meaningful captions for spreads.

## Author Information

The author is always "paskal" (from `src/content/authors/paskal.mdx`), so don't ask about the author.

## Interactive Workflow

### Step 1: Determine the task

If no arguments provided, ask the user what they want to do:

1. Create a new film roll from photos
2. Create a photo essay from photos
3. Create a photo essay from existing film rolls

### Step 2: Gather required information interactively

## For film roll creation

- Photos source path (required)
- Roll name (required)
- Film type (required - validate against available films)
- Camera used (optional - only suggest: Nikon F3, Nikon FM3a, Bronica SQ-Ai, Bronica GS1)
- Format (optional, default "35mm" - should match camera: 35mm for Nikons, 6x6 for SQ-Ai, 6x7 for GS1)
- Max dimension (optional, default 2000)
- Whether to rename files (optional)
- Whether to add random suffix (optional)
- Whether to skip Vision API descriptions (optional, default: use Vision API)

## For photo essay from photos

- Photos source path (required)
- Upload destination directory (required)
- Essay title (optional, will auto-generate)
- Max dimension (optional, default 2000)
- Whether to rename files (optional)
- Whether to add random suffix (optional)

## For photo essay from existing rolls

- Use `yarn r2-stats --detailed` to show available rolls
- Let user select which rolls to include
- Essay title (optional, will auto-generate)

### Step 3: Execute the appropriate yarn script

### Step 4: Post-creation workflow

**After creating a film roll:**
- Ask if the user wants to create a photo essay with the newly created roll
- Provide success feedback with the path to the created YAML file

**After creating a photo essay:**
- Offer to enhance the essay by:
  1. Adding a descriptive essay description based on the photo content
  2. Adding relevant tags for categorization (e.g., location, subject matter, photography style)
  3. Adding captions to spreads based on the Vision API image descriptions
- If the user accepts, read the essay file and the roll file(s) to get the Vision API descriptions
- Create thoughtful captions that group related photos and tell a cohesive visual story
- Add tags that reflect the essay's content (places, subjects, themes, photography styles)
- Write a compelling essay description that captures the essence of the photo story

## Smart Defaults and Validation

- Always validate film types against the content library
- Provide helpful error messages for invalid inputs
- Use reasonable defaults where possible
- Show available options when asking for selection

## Notion Photography Logbook Integration

The user maintains a **Photography Logbook** database in Notion with detailed information about all their film rolls. You can use the Notion MCP server to pull roll information automatically.

### Database Structure

The Photography Logbook database (ID: `0c9f81d6736640c08cc2d3d19f0e995e`, data source: `collection://b259141a-222c-4ac1-85f0-5a2046c7bf2a`) contains:

**Key Fields:**
- **Roll Name** (title) - The roll identifier (e.g., "EHV-03", "TPE-04")
- **Film Stock** (relation) - Links to Film Stock database with film details
- **Format** (select) - Either "135" (35mm) or "120" (medium format)
- **Camera** - Found in page content (e.g., "Nikon F3", "Bronica SQ-Ai")
- **Dates** (date range) - When the roll was shot
- **Locations** (multi-select) - Where photos were taken
- **Status** (status) - Planning, Shooting, Pending Developing, Developing, Editing, Done

### Workflow: Creating Rolls from Notion

When the user wants to create rolls from folders and asks to pull info from Notion:

1. **Search for the roll** in Notion:
   ```
   Use mcp__plugin_Notion_notion__notion-search with:
   - query: Roll name (e.g., "EHV-03")
   - query_type: "internal"
   - data_source_url: "collection://b259141a-222c-4ac1-85f0-5a2046c7bf2a"
   ```

2. **Fetch roll details**:
   ```
   Use mcp__plugin_Notion_notion__notion-fetch with the page ID
   ```

3. **Extract information**:
   - **Format**: Map "135" → "35mm", "120" → "6x6" (for Bronica SQ-Ai) or "6x7" (for Bronica GS1)
   - **Camera**: Extract from content (look for "Nikon F3", "Bronica SQ-Ai", etc.)
   - **Film Stock**: Extract film name from content and map to local film stock ID:
     - "Kodak Gold 200" → `gold-200`
     - "Fujifilm Superia Xtra 400" → `superia-xtra-400`
     - "Kodak Portra 400" → `portra-400`
     - "Lomography 800" → `lomo-800`
     - "Kodak Ektar 100" → `ektar-100`
     - "Kodak Ektachrome 100" → `ektachrome-100`
     - "CineStill 800T" → `cinestill-800t`
     - "Fujifilm Eterna 500T" → `eterna-500t`
     - "Fujifilm C200" → `c200`
     - "Fujifilm NPC 160" → `npc-160`

4. **Create missing film stocks**: If a film mentioned in Notion doesn't exist locally, create the YAML file first in `src/content/films/`

5. **Create the roll**: Use `yarn create-roll` with the extracted information

### Batch Processing from Notion

When processing multiple folders and the user wants to pull from Notion:
- Search for each roll by name in the database
- Fetch details for all found rolls
- Create any missing film stocks
- Create all rolls sequentially (to avoid rate limits)

## Arguments Parsing

Parse `$ARGUMENTS` to:

- `roll` or `create-roll`: Skip to roll creation workflow
- `essay` or `create-essay`: Skip to essay creation workflow
- `rollessay` or `roll-essay`: Skip to essay-from-rolls workflow
- `from-notion`: Pull roll information from Notion Photography Logbook
- Additional arguments can pre-populate values

Start the interactive workflow now using the arguments: $ARGUMENTS
