# SEO Rank Tracker Stahl

A comprehensive tool for tracking your website's SEO keyword rankings over time.

## Features

- Track multiple URLs and keywords
- Monitor ranking positions over time
- Visualize ranking trends with interactive charts
- Filter rankings by position (Top 10, 11-20, etc.)
- Add notes and status indicators for each URL/keyword pair
- Import and export data via CSV
- Store data locally in your browser
- Check current Google rankings via SERP API

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Add your SERP API key to `src/services/serpApi.ts`
4. Start the development server with `npm run dev`
5. Build for production with `npm run build`

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Chart.js
- TanStack Table (React Table)
- Lucide React Icons
- Axios
- SERP API

## Usage

### Adding URLs

Click the "Add URL" button to add a new URL and keyword to track. You can optionally include:
- Monthly search volume
- Current ranking
- Status (Testing or Needs Improvement)
- Notes

### Importing Data

Import data from a CSV file with the following columns:
- url
- keyword
- monthlySearchVolume (optional)
- currentRanking (optional)
- status (optional)
- note (optional)

### Viewing Data

Toggle between Table and Chart views using the buttons in the header.

#### Table View
- Sort by any column
- Filter by ranking position
- Search for specific URLs or keywords
- Add/edit notes for each entry
- Update status for each entry
- Check current Google rankings by clicking the refresh icon

#### Chart View
- Select which URLs to display
- View ranking trends over time
- Compare multiple URLs on the same chart

### Google Rankings

Click the refresh icon in the "Current Ranking" column to check the current Google ranking for a URL/keyword pair. This will:

1. Open a modal showing real Google search results from SERP API
2. Highlight your URL in the results if found
3. Update the current ranking based on the position found
4. Show the date when the ranking was last checked

Note: You need to sign up for a SERP API key at https://serpapi.com/ and add it to the `src/services/serpApi.ts` file.

### Status and Notes

Each URL/keyword pair can have:

- **Status**: Assign a status to track the optimization progress
  - **Testing**: For URLs where you're testing SEO changes
  - **Needs Improvement**: For URLs that require optimization work
  - **None**: Default status

- **Notes**: Add detailed notes about each URL/keyword pair
  - Document optimization strategies
  - Record observations about ranking changes
  - Note competitor activities
  - Track content updates

### Exporting Data

Click the "Export" button to download your data as a CSV file. The export includes all tracking data, including status and notes.

## Data Persistence

All data is stored in your browser's localStorage. This means your data will persist between sessions but is limited to your current browser. For team collaboration, consider implementing a backend database solution.

## SERP API Integration

This application uses SERP API to get real Google search results. To use this feature:

1. Sign up for an account at https://serpapi.com/
2. Get your API key from your account dashboard
3. Add your API key to the `SERP_API_KEY` constant in `src/services/serpApi.ts`

SERP API offers various pricing plans, including a free tier with limited searches per month.

## License

MIT