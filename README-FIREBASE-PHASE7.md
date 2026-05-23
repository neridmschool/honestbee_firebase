# honestbee Firebase Phase 7 Final Notes

This version is prepared as the final Firebase web version without Firebase Storage.

## What was finalized

- Firebase Authentication remains the login/register system.
- Cloud Firestore is the app database for users, customers, merchants, riders, products, carts, orders, ratings, and refunds.
- The shared data wrapper is now `assets/js/firestore-compat.js`, and all runtime reads/writes go through Cloud Firestore.
- Firebase Storage is not imported, initialized, or used.
- Image/file upload UI is kept for future use, but uploads are intentionally disabled or saved as empty/placeholder URL fields.
- Forgot password now uses Firebase Authentication password reset email instead of the old PHP OTP endpoint.
- Static `.html` pages are the active Firebase Hosting pages.
- Old database dumps/migrations and PHP database endpoints were removed from the Firebase version.
- `firebase.json`, `.firebaserc`, `firestore.rules`, and `firestore.indexes.json` were added.

## Firebase services used

- Authentication
- Cloud Firestore
- Hosting

## Firebase services not used

- Firebase Storage

## Main Firestore collections

- `users`
- `customers`
- `merchants`
- `riders`
- `products`
- `carts/{customerUid}/items`
- `orders`
- `ratings`
- `refunds`

## Deployment

Install Firebase CLI first, then run:

```bash
firebase login
firebase use honestbee-6b314
firebase deploy --only hosting,firestore:rules
```

## Testing checklist

Before final presentation, test these manually in the browser:

1. Customer sign up and login.
2. Merchant application and pending approval.
3. Rider application and pending approval.
4. Admin login.
5. Admin customer/merchant/rider account lists.
6. Admin approve/reject merchant and rider.
7. Merchant login after approval.
8. Merchant add/edit/delete products.
9. Guest stores/products browsing.
10. Customer stores/products browsing.
11. Customer add to cart, update quantity, remove cart item.
12. Customer checkout with Cash or GCash demo.
13. Customer recent orders and order details.
14. Merchant order list and order status update.
15. Rider accept order and update delivery status.
16. Rider earnings and logs.
17. Customer rating/refund from order details.
18. Admin ratings/refunds list and remove rating.
19. Logout confirmation on each role.
20. Footer/profile shortcut scrolling.

## Known limitation

Because Firebase Storage is not enabled, real uploads are not included yet. Product images and proof/document image fields use local placeholders or empty URL fields for now.
