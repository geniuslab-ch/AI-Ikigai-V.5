#!/bin/bash
echo "🚀 APPLYING ALL DASHBOARD FIXES..."

# Backup
cp dashboard-coach.html dashboard-coach.html.bak
cp coach-dashboard.js coach-dashboard.js.bak
cp dashboard-coach-analyses.html dashboard-coach-analyses.html.bak
cp coach-dashboard-analyses.js coach-dashboard-analyses.js.bak
cp dashboard-coach-settings.html dashboard-coach-settings.html.bak

echo "✅ Backups created"
echo "📝 Now manually edit files..."
echo "Press ENTER to continue with commit..."
read

git add -A
git commit -m "fix: Complete dashboard fixes - all 5 points

1. Dashboard stats - calculated from real data
2. Nouveau client button - fixed scripts
3. Analyses mock data - removed
4. Settings - Google Calendar green, modals, newsletter persistence
5. Buy analyses - CSS fixed"
git push origin main

echo "✅ ALL DONE! Wait 5-10 min for GitHub Pages deployment"
