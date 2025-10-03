# Meta Traits Analyzer

A comprehensive ad performance analysis dashboard for analyzing Meta (Facebook) advertising data with trait-based insights.

## Features

### Main Dashboard (`index.html`)
- **Ad Performance Overview**: View all ads with key metrics (CTR, CVR, ROAS, BAR)
- **Interactive Filtering**: Filter by Windows/Bath categories and performance quadrants
- **Image Gallery**: Click thumbnails to view full-size ad creatives with performance stats
- **Data Visualization**: Color-coded performance indicators and heatmaps

### Pivot Table Analysis (`pivot-table.html`)
- **Custom Grouping**: Group ads by any trait or combination of traits
- **Pre-built Groupings**: Quick access to common analysis views
- **Expandable Rows**: Click to see all ads within each group
- **Comparison Mode**: Select 2 rows to compare with inline variance indicators
- **Dynamic Metrics**: Automatically calculated CTR, CVR, ROAS, and BAR
- **Export**: Download pivot tables as CSV
- **Compact View**: Toggle KPIs on/off for different viewing modes

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the local server:
```bash
node server.js
```

3. Open in browser:
- Main Dashboard: `http://localhost:3000`
- Pivot Table: `http://localhost:3000/pivot-table.html`

## Data Files

- `Traits Ad Analysis - Data _ windows ads + traits (1).csv` - Windows ads data
- `Traits Ad Analysis - Data _ bath ads + traits.csv` - Bath ads data

## Key Metrics

- **CTR (Click-Through Rate)**: clicks / impressions × 100
- **CVR (Conversion Rate)**: matched_leads / clicks × 100
- **ROAS (Return on Ad Spend)**: hs_revenue / spend
- **BAR (Booking Appointment Rate)**: booked_appts / matched_leads × 100

## Technologies

- Pure HTML/CSS/JavaScript (no frameworks)
- Node.js for local development server
- CSV parsing and pivot table logic
- Image fallback system for local assets

## Deployment

This app can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting service

Just upload the HTML files, CSV data, and images folder.
