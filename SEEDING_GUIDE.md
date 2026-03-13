# Quick Start: Seeding Analytics Data

## ✅ Easiest Method: Browser Console (RECOMMENDED)

This is the **fastest and simplest** way to seed data - no configuration needed!

### Steps:

1. **Open your analytics dashboard**
   - Navigate to: `http://localhost:3000/admin/analytics`
   - Make sure you're signed in as admin

2. **Open Browser DevTools**
   - Press `F12` (or `Cmd+Option+I` on Mac)
   - Click the **Console** tab

3. **Copy the seeding script**
   - Open file: `scripts/seed-browser-console.js`
   - Copy the **entire file content** (`Ctrl+A`, `Ctrl+C`)

4. **Paste and run**
   - Paste into the Console (`Ctrl+V`)
   - Press `Enter`

5. **Wait for completion**
   - You'll see progress messages:
     ```
     🌱 Starting analytics data seeding...
     🧹 Cleaning existing test data...
     📦 Seeding products...
     🛒 Seeding orders...
     📊 Seeding analytics events...
     🎉 Seeding completed successfully!
     ```

6. **Refresh the page**
   - Press `Ctrl+R` (or `Cmd+R` on Mac)
   - Your dashboard should now be populated with data!

---

## What Gets Created

### 📦 Products (12 items)
- Classic White T-Shirt ($29.99)
- Denim Jacket ($89.99)
- Floral Summer Dress ($79.99) - **Low Stock (8 units)**
- Leather Crossbody Bag ($129.99)
- Running Sneakers ($119.99)
- Wool Blend Sweater ($69.99) - **Low Stock (3 units)**
- Slim Fit Jeans ($59.99)
- Silk Scarf ($39.99)
- Ankle Boots ($149.99)
- Cashmere Cardigan ($159.99) - **Out of Stock**
- Baseball Cap ($24.99)
- Graphic Hoodie ($54.99) - **Low Stock (5 units)**

### 🛒 Orders (50 orders)
- Distributed over last 30 days
- Mix of statuses: Delivered (most), Shipped, Processing, Pending, Cancelled (few)
- Total revenue: ~$4,000-$6,000
- Includes repeat customers (Emma, Olivia, Sophia)

### 📊 Analytics Events (150+ events)
- ADD_TO_CART: 150 events
- CHECKOUT_START: ~105 events (70% conversion)
- PURCHASE: ~63 events (60% of checkouts)
- Creates realistic abandonment funnel

---

## Expected Dashboard Results

After seeding, you should see:

### Top Metrics
- 💰 **Total Revenue**: ~$4,000-$6,000
- 📊 **Avg Order Value**: ~$80-$120
- 👥 **New Customers**: 12
- 📦 **Units Sold**: ~75-100

### Charts
- ✅ Sales Trends: Line chart with 30 days of data
- ✅ Category Breakdown: Revenue by category
- ✅ Visitor Engagement: Will show "Visitor Tracking Disabled" (use GA4)

### New Features
- ✅ **Order Status Breakdown**: Visual status distribution
- ✅ **Abandonment Rates**: Cart (30%) & Checkout (40%)
- ✅ **Top Customers**: Emma, Olivia, Sophia (repeat customers)
- ✅ **Repeat Customer Insights**: 3 repeat customers, ~$1,500 repeat revenue
- ✅ **Inventory Insights**:
  - Low Stock: 3 products
  - Out of Stock: 1 product
  - Slow Moving: Products with no sales
- ✅ **Best-Selling Items**: Top products by revenue

---

## Alternative Methods

### Method 2: Node.js Script (Requires Password)

If you prefer running from terminal:

1. Add your admin password to `.env.local`:
   ```
   ADMIN_PASSWORD=your_password_here
   ```

2. Run the script:
   ```bash
   npm run seed:client
   ```

### Method 3: Firebase Admin SDK (Requires Service Account)

For production-grade seeding:

1. Download Firebase service account key from Firebase Console
2. Add to `.env.local`:
   ```
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@...
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
   ```

3. Run:
   ```bash
   npm run seed:analytics
   ```

---

## Troubleshooting

### "Permission denied" errors
**Solution**: Make sure you're signed in as admin (nihalnshetty42@gmail.com)

### Data not showing after seeding
**Solution**: Hard refresh the page (`Ctrl+Shift+R` or `Cmd+Shift+R`)

### Script fails midway
**Solution**: 
1. Check browser console for errors
2. Verify you're signed in as admin
3. Try running the script again (it will clean up first)

### Want to re-run the script
**No problem!** The script automatically cleans existing data before seeding new data. Just run it again anytime.

---

## Next Steps

After seeding successfully:

1. ✅ Explore all dashboard features
2. ✅ Test timeframe filters (7D, 30D, 1Y)
3. ✅ Check inventory insights (low stock alerts)
4. ✅ Review top customers and repeat customer analytics
5. ✅ Analyze abandonment rates
6. ✅ Try creating real orders to see live updates

7. 🔜 Set up Google Analytics 4 for visitor tracking (see `docs/GA4_INTEGRATION.md`)

---

## Questions?

- Check `scripts/README.md` for detailed documentation
- All seeding scripts are in the `scripts/` directory
- Browser console method works 99% of the time!

**Enjoy your populated analytics dashboard! 🎉**
