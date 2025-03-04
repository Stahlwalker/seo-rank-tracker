# Committing Changes to GitHub

Follow these steps to commit your changes from StackBlitz to GitHub:

## Step 1: Connect to GitHub (if not already connected)

1. Click on the "Connect Repository" button in the top-right corner of StackBlitz
2. Authenticate with GitHub if prompted
3. Select your repository from the list or create a new one

## Step 2: Stage and Commit Changes

1. Click on the "Git" icon in the left sidebar (or press Ctrl+Shift+G)
2. You'll see a list of changed files
3. Click the "+" icon next to each file to stage it, or use the "+" icon at the top to stage all changes
4. Enter a commit message in the text field (e.g., "Add status and notes functionality")
5. Click the checkmark icon to commit the changes

## Step 3: Push Changes to GitHub

1. Click on the "..." menu in the Source Control panel
2. Select "Push" to push your committed changes to GitHub
3. If prompted, confirm the push operation

## Step 4: Verify Changes on GitHub

1. Go to your GitHub repository in a web browser
2. Check that your changes have been pushed successfully
3. You should see your latest commit message and the updated files

## Step 5: Pull Changes to Your Local Environment

On your local machine, run:

```bash
git pull origin main
```

(Replace "main" with your branch name if different)

This will synchronize your local project with the changes you made in StackBlitz.