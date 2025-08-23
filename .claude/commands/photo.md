---
description: Interactive tool for managing film rolls and blog posts
argument-hint: "[roll|post|rollpost] [additional-args...]"
allowed-tools:
  [
    "Bash",
    "Read",
    "Glob",
    "TodoWrite",
    "mcp__sequential-thinking__sequentialthinking",
  ]
---

# Interactive Photo Management Command

You are helping the user manage their film photography portfolio. This command provides an interactive interface for:

1. **Creating a new film roll** from a folder with photos
2. **Creating a new blog post** from a folder with photos
3. **Creating a new blog post** from existing film rolls

## Available Commands and Scripts

The project has these npm scripts:

- `npm run create-post -- -p /path/to/photos -d upload-dir -t "Post Title" -m 2000`
- `npm run create-roll -- -p /path/to/photos -n ROLL-NAME -f film-stock -c "Camera Used"`
- `npm run create-roll-post -- -r "ROLL1,ROLL2" -t "Post Title"`
- `npm run r2-stats -- -p prefix --detailed` (to check existing rolls in R2 bucket)

## Available Film Types

Read the available films from `src/content/films/*.yaml` to validate film selections. Each film has:

- name: Display name
- brand: Film manufacturer
- color: One of "color-negative", "color-positive", "black-and-white-negative", "special-negative"
- iso: Film speed

## Film Roll Formats

Valid formats: "half-frame", "35mm", "6x6", "6x7", "6x8", "6x9", "4x5"

## Author Information

The author is always "paskal" (from `src/content/authors/paskal.mdx`), so don't ask about the author.

## Interactive Workflow

### Step 1: Determine the task

If no arguments provided, ask the user what they want to do:

1. Create a new film roll from photos
2. Create a blog post from photos
3. Create a blog post from existing film rolls

### Step 2: Gather required information interactively

## For film roll creation

- Photos source path (required)
- Roll name (required)
- Film type (required - validate against available films)
- Camera used (optional)
- Format (optional, default "35mm")
- Max dimension (optional, default 2000)
- Whether to rename files (optional)
- Whether to add random suffix (optional)

## For blog post from photos

- Photos source path (required)
- Upload destination directory (required)
- Post title (optional, will auto-generate)
- Max dimension (optional, default 2000)
- Whether to rename files (optional)
- Whether to add random suffix (optional)

## For blog post from existing rolls

- Use `npm run r2-stats -- --detailed` to show available rolls
- Let user select which rolls to include
- Post title (optional, will auto-generate)

### Step 3: Execute the appropriate npm script

### Step 4: Post-creation workflow

- If a roll was just created, ask if the user wants to create a blog post with it
- Provide success feedback and next steps

## Smart Defaults and Validation

- Always validate film types against the content library
- Provide helpful error messages for invalid inputs
- Use reasonable defaults where possible
- Show available options when asking for selection

## Arguments Parsing

Parse `$ARGUMENTS` to:

- `roll` or `create-roll`: Skip to roll creation workflow
- `post` or `create-post`: Skip to post creation workflow
- `rollpost` or `roll-post`: Skip to post-from-rolls workflow
- Additional arguments can pre-populate values

Start the interactive workflow now using the arguments: $ARGUMENTS
