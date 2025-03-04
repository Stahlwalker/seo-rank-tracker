# GitHub Sync Workflow for SEO Rank Tracker

This document outlines the workflow for keeping your local project in sync with changes made in Bolt.

## Setup

### 1. Connect Bolt to Your GitHub Repository

To connect Bolt to your existing GitHub repository:

1. In Bolt, use the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac)
2. Type "git clone" and select the command
3. Enter your GitHub repository URL
4. Authenticate with GitHub if prompted

### 2. Verify Connection

To verify that Bolt is properly connected to your GitHub repository:

1. Make a small change to a file
2. Open the Source Control panel (Git icon in the sidebar or Ctrl+Shift+G)
3. Stage and commit the change
4. Push to GitHub
5. Check your GitHub repository to confirm the change was pushed

## Daily Workflow

### When Working in Bolt

1. **Pull Latest Changes**: Before starting work in Bolt, pull the latest changes from GitHub:
   - Open the Source Control panel
   - Click on the "..." menu
   - Select "Pull"

2. **Make Your Changes**: Edit files as needed in Bolt

3. **Commit and Push**: When you're ready to save your changes:
   - Stage your changes
   - Write a descriptive commit message
   - Commit the changes
   - Push to GitHub

### When Working Locally

1. **Pull Latest Changes**: Before starting work locally, pull the latest changes from GitHub:
   ```bash
   git pull origin main
   ```

2. **Make Your Changes**: Edit files as needed in your local environment

3. **Commit and Push**: When you're ready to save your changes:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   git push origin main
   ```

## Handling Conflicts

If you encounter merge conflicts:

1. Identify the conflicting files
2. Open each file and resolve the conflicts (look for markers like `<<<<<<<`, `=======`, and `>>>>>>>`)
3. Save the resolved files
4. Stage the resolved files
5. Commit the changes
6. Push to GitHub

## Best Practices

1. **Pull Before You Start**: Always pull the latest changes before starting work
2. **Commit Frequently**: Make small, focused commits rather than large, sweeping changes
3. **Write Clear Commit Messages**: Describe what you changed and why
4. **Push Regularly**: Don't let local changes accumulate without pushing to GitHub
5. **Communicate**: If multiple people are working on the project, communicate about who is working on what

## Troubleshooting

If you encounter issues with the Git integration in Bolt:

1. Try refreshing the page
2. Check the browser console for errors
3. Use the Command Palette to run Git commands directly
4. As a last resort, manually export your changes and commit them locally

Remember: The goal is to maintain a single source of truth in your GitHub repository, which both your local environment and Bolt can sync with.