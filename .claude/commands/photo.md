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

## Arguments Parsing

Parse `$ARGUMENTS` to:

- `roll` or `create-roll`: Skip to roll creation workflow
- `essay` or `create-essay`: Skip to essay creation workflow
- `rollessay` or `roll-essay`: Skip to essay-from-rolls workflow
- Additional arguments can pre-populate values

Start the interactive workflow now using the arguments: $ARGUMENTS
