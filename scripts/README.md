# Analytics Data Seeding Script

This directory contains scripts for populating your Firebase database with realistic test data for the analytics dashboard.

## What Gets Seeded

### 📦 Products (12 items)
- Products across 4 categories (Women's Clothing, Men's Clothing, Accessories, Footwear)
- Mix of stock levels:
  - Normal stock (most products)
  - Low stock (≤10 units) - triggers inventory alerts
  - Out of stock (0 units) - shows in out-of-stock section
- Price range: $24.99 - $159.99

### 🛒 Orders (50 orders)
- Distributed over the last 30 days
- Order values: $30 - $450 (1-3 items per order)
- Mix of order statuses:
  - Delivered (most common)
  - Processing
  - Shipped
  - Pending
  - Cancelled (few)
- Includes repeat customers (3 customers with multiple orders)
- Total expected revenue: ~$4,000 - $6,000

### 📊 Analytics Events (150+ events)
- ADD_TO_CART events
- CHECKOUT_START events (70% of add-to-carts)
- PURCHASE events (60% of checkouts)
- Creates realistic funnel with drop-offs for abandonment rate calculations

### 👥 Customers
- 12 unique customer emails
- 3 repeat customers (will have 2-4 orders each)
- Mix of one-time and repeat purchasers

## Usage

### Run the Seeding Script

```bash
npm run seed:analytics
```

### What Happens

1. **Cleanup Phase** (Optional - enabled by default)
   - Deletes existing products, orders, and analytics events
   - Ensures a clean slate for testing

2. **Seeding Phase**
   - Creates 12 products
   - Generates 50 orders over 30 days
   - Creates 150+ analytics events

3. **Completion**
   - Shows summary of data created
   - Displays next steps

### Expected Output

```
🌱 Starting analytics data seeding...

🧹 Cleaning existing test data...
  Deleted X products
  Deleted X orders
  Deleted X analytics events
✅ Cleanup complete

📦 Seeding products...
✅ Created 12 products

🛒 Seeding orders...
✅ Created 50 orders
💰 Total revenue: $4,532.50

📊 Seeding analytics events...
✅ Created 165 analytics events

🎉 Seeding completed successfully!

📊 Next steps:
  1. Refresh your analytics dashboard at /admin/analytics
  2. Try different timeframes (7D, 30D, 1Y)
  3. Check the new features:
     - Inventory Insights (low stock alerts)
     - Top Customers table
     - Repeat Customer analytics
     - Abandonment rates
     - Order status breakdown
```

## Customization

### Keep Existing Data

If you want to **add** test data without deleting existing data:

1. Edit `scripts/seed-analytics-data.ts`
2. Comment out line ~350: `await cleanExistingData();`

### Change Date Range

To seed data for a different time period:

```typescript
// Change from 30 days to 60 days
const orderDate = randomDate(60);  // Line ~177
```

### Adjust Order Count

```typescript
// Change from 50 to 100 orders
const orderCount = 100;  // Line ~156
```

### Modify Products

Edit the `SAMPLE_PRODUCTS` array (line ~31) to add/remove products:

```typescript
{ name: "Your Product", price: 99.99, category: "Your Category", stock: 50 }
```

## What You'll See in Analytics Dashboard

After seeding, your analytics dashboard will show:

### Metrics
- **Total Revenue**: ~$4,000-$6,000
- **Average Order Value**: ~$80-$120
- **New Customers**: 12
- **Units Sold**: ~75-100

### Charts & Visualizations
- **Sales Trends**: Line chart showing daily sales over 30 days
- **Category Breakdown**: Bar chart showing revenue by category
- **Conversion Funnel**: Sessions → Add to Cart → Purchase (with real %s)

### New Features Populated
- ✅ **Order Status Breakdown**: Visual breakdown of orders by status
- ✅ **Abandonment Rates**: Cart (30%) and Checkout (40%) abandonment
- ✅ **Top Customers**: List of top 10 customers by revenue
- ✅ **Repeat Customer Insights**: 
  - Repeat customers: 3
  - Repeat revenue: ~$1,500
  - Avg orders per customer: ~4
- ✅ **Inventory Insights**:
  - Low stock: 3 products
  - Out of stock: 1 product
  - Slow moving: Products with no sales
- ✅ **Best-Selling Items**: Top products by revenue

### Time Period Filtering
Test all timeframes:
- **7D**: Orders from last 7 days only
- **30D**: All orders (default)
- **1Y**: All orders (since we only seeded 30 days)

## Troubleshooting

### "Firebase Admin not initialized" Error

**Cause**: Missing Firebase Admin credentials

**Solution**: The script works with just the project ID (already configured). If you see this error:

1. Check `.env.local` has `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
2. Or add full Admin SDK credentials:
   ```env
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@...
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Data Not Showing in Dashboard

1. **Hard refresh** the analytics page: `Ctrl + Shift + R`
2. **Sign out and sign in** again
3. Check the **timeframe filter** (make sure "30D" is selected)
4. Open browser console - check for any errors

### "Permission Denied" Error

**Cause**: Not logged in as admin

**Solution**: Ensure you're signed in with the email that has an admin document in Firebase (`nihalnshetty42@gmail.com`)

### Script Runs But No Data Appears

1. Check Firebase Console → Firestore Database
2. Verify collections exist: `products`, `orders`, `analytics_events`
3. Check order documents have `paymentStatus: 'paid'`

## Running Multiple Times

You can run the script multiple times:

- **With cleanup** (default): Replaces all data with fresh seed data
- **Without cleanup**: Adds more data to existing (comment out `cleanExistingData()`)

## Next Steps

After seeding:

1. ✅ Refresh analytics dashboard
2. ✅ Test all timeframe filters (7D, 30D, 1Y)
3. ✅ Explore new features:
   - Check low stock alerts
   - View top customers
   - Analyze repeat customer metrics
   - Review abandonment rates
4. ✅ Test with real orders to see live data
5. ✅ Set up GA4 for visitor tracking (see `docs/GA4_INTEGRATION.md`)

## Clean Up Seed Data

To remove all seed data:

```bash
# Remove all products, orders, and events manually via Firebase Console
# OR modify the script to only run cleanExistingData()
```

Edit the script and keep only:
```typescript
await cleanExistingData();
```

Then run: `npm run seed:analytics`

---

**Questions or Issues?** Check the main README or open an issue.
