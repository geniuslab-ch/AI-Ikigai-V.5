#!/bin/bash
set -e

echo "🔧 APPLYING ALL DASHBOARD FIXES..."

# Fix 5: Add CSS to buy-analyses.html
echo "5️⃣ Adding CSS to buy-analyses.html..."
if ! grep -q "styles.css" buy-analyses.html; then
    sed -i '' '/<head>/a\
    <link rel="stylesheet" href="styles.css">
' buy-analyses.html
fi

echo "✅ All fixes applied!"
echo "📦 Committing and pushing..."

