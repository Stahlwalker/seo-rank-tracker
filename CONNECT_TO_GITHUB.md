# Connecting StackBlitz to Your GitHub Repository

## Method 1: Using the StackBlitz UI

1. In the top-right corner of StackBlitz, look for the "Connect Repository" button
2. Click on it and authenticate with GitHub if prompted
3. Select your existing repository from the list
4. Follow the prompts to complete the connection

If you don't see the "Connect Repository" button, try these alternatives:

## Method 2: Using the Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the command palette
2. Type "git" or "github" to see available Git commands
3. Look for options like "Connect to Repository" or "Clone Repository"
4. Select the appropriate command and follow the prompts

## Method 3: Project Settings

1. Click on the "Project" button in the top-left corner
2. Select "Project Settings"
3. Look for a "GitHub" or "Git" section
4. Use the options there to connect to your repository

## Method 4: Manual Export and Push

If the above methods don't work, you can:

1. Export your project from StackBlitz (Project > Download Project)
2. Extract the ZIP file to a folder
3. Initialize a Git repository and push to GitHub:

```bash
cd your-project-folder
git init
git add .
git commit -m "Import from StackBlitz"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## Troubleshooting

If you're having trouble connecting to your repository:

1. Make sure you're logged into GitHub in StackBlitz
2. Check that you have the necessary permissions for the repository
3. Try refreshing the page
4. Clear your browser cache
5. Try using a different browser

## After Connecting

Once connected, you should be able to:

1. See the Git icon in the sidebar
2. Stage and commit changes
3. Push and pull from your GitHub repository
4. See the commit history

Remember to commit your changes regularly to keep your repository up to date.