# Google Analytics 4 Integration

This e-commerce application uses Google Analytics 4 (GA4) for visitor and traffic tracking to avoid excessive Firestore write costs from page view events.

## Current Setup

### Client-Side Tracking (✅ Implemented)

The application includes GA4 tracking via `GoogleAnalytics.tsx` component that:
- Tracks page views automatically on route changes
- Provides custom event tracking methods (viewItem, addToCart, purchase, etc.)
- Uses Next.js Script component for optimal loading

### Configuration

1. **Create a GA4 Property**
   - Go to [Google Analytics](https://analytics.google.com)
   - Create a new GA4 property
   - Get your Measurement ID (format: G-XXXXXXXXXX)

2. **Add to Environment Variables**
   ```
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Verify Setup**
   - Run your app in development
   - Open GA4 Real-time reports
   - Navigate around your site and verify events appear

## Server-Side Analytics Data (Optional Enhancement)

To display GA4 data in the admin dashboard (replacing the visitor engagement chart), you can integrate the GA4 Reporting API.

### Setup Instructions

1. **Enable GA4 Data API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable "Google Analytics Data API v1"

2. **Create Service Account**
   - Create a service account in GCP
   - Download the JSON key file
   - Add the service account email to your GA4 property with "Viewer" permissions

3. **Install Required Package**
   ```bash
   npm install @google-analytics/data
   ```

4. **Add Environment Variables**
   ```
   GA4_PROPERTY_ID=properties/123456789
   GA4_CREDENTIALS={"type":"service_account","project_id":"..."}
   ```

5. **Create API Route**
   - Create `/api/analytics/ga4` route
   - Query GA4 for traffic data using the Data API
   - Return formatted data for the dashboard

6. **Update Analytics Dashboard**
   - Replace `getEngagementData()` with API call to `/api/analytics/ga4`
   - Display real GA4 visitor data in the engagement chart

### Example Implementation

```typescript
// src/app/api/analytics/ga4/route.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET() {
  const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GA4_CREDENTIALS || '{}'),
  });

  const [response] = await analyticsDataClient.runReport({
    property: process.env.GA4_PROPERTY_ID,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
    ],
  });

  return Response.json({ data: response.rows });
}
```

## Why GA4 Instead of Firestore for Page Views?

**Cost Savings:**
- Firestore charges per write operation
- Every page view = 1 write = $0.18 per 100k writes
- GA4 is free for up to 10M events/month
- For high-traffic sites, this saves significant costs

**Better Analytics:**
- GA4 provides sophisticated traffic analysis
- Real-time reporting and insights
- Traffic source attribution
- User behavior flows
- No need to build custom analytics

## Current Analytics Architecture

| Metric | Data Source | Why |
|--------|-------------|-----|
| Page Views | GA4 | Free, unlimited, better insights |
| Add to Cart | Firestore | Business-critical event |
| Checkout Start | Firestore | Business-critical event |
| Purchase | Firestore | Business-critical event |
| Revenue | Firestore Orders | Source of truth for transactions |
| Traffic Sources | GA4 | Better attribution modeling |
| Sessions | GA4 | Free, more accurate |

## Custom Events Available

The `GA4Event` helper in `GoogleAnalytics.tsx` provides:

- `viewItem(productId, productName, price, category)` - Track product views
- `addToCart(productId, productName, price, quantity)` - Track add to cart
- `removeFromCart(productId, productName, price, quantity)` - Track cart removals
- `beginCheckout(value, items)` - Track checkout start
- `purchase(transactionId, value, items)` - Track completed purchases
- `search(searchTerm)` - Track search queries
- `filterApplied(filterType, filterValue)` - Track filter usage

## Usage Example

```typescript
import { GA4Event } from '@/components/analytics/GoogleAnalytics';

// In your product page
GA4Event.viewItem(product.id, product.name, product.price, product.category);

// In your cart actions
GA4Event.addToCart(product.id, product.name, product.price, quantity);

// After successful checkout
GA4Event.purchase(orderId, total, items);
```

## Next Steps

1. ✅ GA4 tracking code is installed
2. ⏳ Add your GA4 Measurement ID to `.env.local`
3. ⏳ Integrate GA4 events in product pages, cart, and checkout
4. ⏳ (Optional) Set up GA4 Reporting API for dashboard data
5. ⏳ Test in GA4 Real-time reports

## Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
