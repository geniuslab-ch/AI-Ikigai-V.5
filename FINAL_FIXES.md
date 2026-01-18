# FINAL DASHBOARD FIXES - COMPLETE LIST

## 1. Dashboard Mock Data (dashboard-coach.html)
- Stats showing 0 instead of real data
- Fix: Update coach-dashboard.js stats functions

## 2. Nouveau Client Button (dashboard-coach-clients.html)  
- Button doesn't work
- Fix: Verify modal + script loading

## 3. Analyses Mock Data (dashboard-coach-analyses.html)
- Hardcoded stats: 53, 5, 73%, +8%
- Mock clients: Marie Dupont, Thomas Martin, etc.
- Fix: Remove getMockAnalyses(), add dynamic stats

## 4. Settings Page (dashboard-coach-settings.html)
### a) Google Calendar Status
- Should be GREEN with ✓ when connected
- Fix: coach-dashboard-google.js

### b) "Changer de plan" Modal
- Button should open modal
- Fix: Wire showChangePlanModal()

### c) Newsletter Persistence
- Checkbox unchecks after save
- Fix: Load preferences on page load

### d) Résiliation Modal Button
- Add "Changer de plan" button
- Fix: Add button in modal HTML

## 5. Reserve Analyses Page CSS
- Page missing CSS styling
- Fix: Add styles.css link

---
EXECUTING NOW...
