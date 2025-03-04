# Git Setup and Commit Instructions for StackBlitz

## Step 1: Create a Repository

Since you only see the "Create Repository" option, you need to create a repository first:

1. Click on the "Create Repository" button in StackBlitz
2. Choose a name for your repository (e.g., "seo-rank-tracker")
3. Select whether you want it to be public or private
4. Click "Create Repository"

## Step 2: Initial Commit

After creating the repository:

1. You should now see all your project files listed as changes
2. Enter an initial commit message like "Initial commit - SEO Rank Tracker application"
3. Click the checkmark icon to commit all changes

## Step 3: Push to GitHub

1. After committing, you should see an option to push your changes
2. Click "Push" to send your code to GitHub
3. If prompted, authenticate with GitHub

## Step 4: Verify on GitHub

1. Go to your GitHub account in a web browser
2. You should see your new repository with all the code

## Step 5: Clone to Local Machine

To work with the code locally:

```bash
git clone https://github.com/yourusername/seo-rank-tracker.git
cd seo-rank-tracker
npm install
npm run dev
```

## Future Commits

For future changes:

1. Make your code changes in StackBlitz
2. Click the Git icon in the sidebar (which should now be visible)
3. Stage your changes
4. Enter a commit message
5. Commit and push

## Pulling Changes to Local Environment

After pushing changes from StackBlitz to GitHub, update your local copy:

```bash
git pull origin main
```