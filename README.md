# SEO Rank Tracker

A comprehensive tool for tracking your website's SEO keyword rankings over time.

## Features

- Track multiple URLs and keywords
- Monitor ranking positions over time
- Visualize ranking trends with interactive charts
- Filter rankings by position (Top 10, 11-20, etc.)
- Add notes and status indicators for each URL/keyword pair
- Import and export data via CSV
- Store data locally in your browser

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Build for production with `npm run build`

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Chart.js
- TanStack Table (React Table)
- Lucide React Icons

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

#### Chart View
- Select which URLs to display
- View ranking trends over time
- Compare multiple URLs on the same chart

### Exporting Data

Click the "Export" button to download your data as a CSV file.

## License

MIT