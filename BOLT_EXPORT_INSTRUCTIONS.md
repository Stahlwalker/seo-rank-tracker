# Exporting Changes from Bolt to Your Local Project

If you're having trouble with the Git integration in Bolt, you can manually export your changes and apply them to your local project.

## Method 1: Full Project Export

### Step 1: Export the Project
1. In Bolt, click on the "Project" button in the top-left corner
2. Select "Download Project"
3. This will download a ZIP file containing the entire project

### Step 2: Extract and Compare
1. Extract the ZIP file to a temporary folder
2. Use a file comparison tool (like Beyond Compare, WinMerge, or VS Code's built-in diff) to compare:
   - The extracted Bolt project
   - Your local project directory
3. Identify all files that have been changed in Bolt

### Step 3: Copy Changed Files
1. Copy the changed files from the extracted Bolt project to your local project
2. Review each change to ensure it's what you expect

### Step 4: Commit to Your Local Git Repository
1. Stage the changed files:
   ```bash
   git add path/to/changed/files
   ```
2. Commit the changes:
   ```bash
   git commit -m "Import changes from Bolt"
   ```
3. Push to GitHub if desired:
   ```bash
   git push origin main
   ```

## Method 2: Individual File Export

For smaller changes to specific files:

### Step 1: Copy File Contents
1. In Bolt, open the file you've modified
2. Select all content (Ctrl+A or Cmd+A on Mac)
3. Copy the content (Ctrl+C or Cmd+C on Mac)

### Step 2: Update Local File
1. Open the same file in your local project
2. Replace the entire content with what you copied from Bolt
3. Save the file

### Step 3: Repeat for All Changed Files
1. Repeat steps 1-2 for each file you've modified in Bolt
2. Keep track of which files you've updated

### Step 4: Commit to Your Local Git Repository
1. Stage the changed files:
   ```bash
   git add path/to/changed/files
   ```
2. Commit the changes:
   ```bash
   git commit -m "Import changes from Bolt"
   ```
3. Push to GitHub if desired:
   ```bash
   git push origin main
   ```

## Method 3: Using Git Patch

For more advanced users:

### Step 1: Create a Patch File
1. In Bolt, if you can access the Git diff but can't push:
   - View the diff of your changes
   - Copy the entire diff output
   - Save it to a file with a `.patch` extension

### Step 2: Apply the Patch Locally
1. Save the patch file to your local project directory
2. Apply the patch:
   ```bash
   git apply your-changes.patch
   ```
3. Review the changes to ensure they were applied correctly
4. Commit the changes:
   ```bash
   git add .
   git commit -m "Apply changes from Bolt patch"
   ```

## Tracking Changes

Keep a log of files you've modified in Bolt to ensure you don't miss any when exporting:

- Recently modified files:
  - src/App.tsx
  - src/types/index.ts
  - src/utils/mockData.ts
  - src/utils/csvParser.ts
  - src/components/AddUrlForm.tsx
  - src/components/RankingTable.tsx
  - README.md
  - CONTRIBUTING.md
  - LICENSE
  - LOCAL_SETUP.md
  - SYNC_INSTRUCTIONS.md
  - GIT_COMMIT_INSTRUCTIONS.md
  - GIT_SETUP_INSTRUCTIONS.md
  - STACKBLITZ_GIT_TROUBLESHOOTING.md
  - GITHUB_DIRECT_PUSH.md
  - CONNECT_TO_GITHUB.md