<?php
$footerRole = 'guest';
if (($activePage ?? '') === 'customer') {
    $footerRole = 'customer';
} elseif (($activePage ?? '') === 'seller') {
    $footerRole = 'seller';
} elseif (($activePage ?? '') === 'rider') {
    $footerRole = 'rider';
} elseif (($activePage ?? '') === 'admin') {
    $footerRole = 'admin';
}
?>
        <footer class="site-footer role-aware-footer footer-server-<?php echo htmlspecialchars($footerRole); ?>" aria-label="honestbee footer">
            <div class="footer-inner footer-layout role-footer role-footer--guest">
                <section class="footer-brand-panel" aria-label="honestbee overview">
                    <a class="brand footer-brand" href="index.php" aria-label="honestbee home">
                        <span class="bee-mark" aria-hidden="true"><span class="bee-body"></span></span>
                        <span>honestbee</span>
                    </a>
                    <p class="footer-tagline">Fresh groceries, food favorites, and daily essentials delivered by trusted Cebu partners.</p>
                    <div class="footer-cta-row" aria-label="Footer actions">
                        <a class="footer-cta footer-cta-primary" href="index.php#stores"><i data-lucide="store" aria-hidden="true"></i> Browse Stores</a>
                        <a class="footer-cta" href="index.php?modal=signup" data-account-modal-trigger="signup"><i data-lucide="user-plus" aria-hidden="true"></i> Create Account</a>
                    </div>
                </section>

                <nav class="footer-links" aria-label="Guest quick links">
                    <h3>Explore</h3>
                    <a href="index.php#stores">Stores</a>
                    <a href="index.php#deals">Deals</a>
                    <a href="index.php?modal=signin" data-account-modal-trigger="signin">Track an Order</a>
                    <a href="index.php?modal=signup" data-account-modal-trigger="signup">Create Account</a>
                </nav>

                <nav class="footer-links" aria-label="Guest partner links">
                    <h3>Partner With Us</h3>
                    <a href="index.php?modal=merchant" data-account-modal-trigger="merchant">Apply as Merchant</a>
                    <a href="index.php?modal=rider" data-account-modal-trigger="rider">Apply as Rider</a>
                    <a href="sign-in.php">Merchant Login</a>
                    <a href="sign-in.php">Rider Login</a>
                </nav>

                <section class="footer-info-card" aria-label="Guest service details">
                    <h3>Need Help?</h3>
                    <p><i data-lucide="clock" aria-hidden="true"></i> Daily service: 8:00 AM - 9:00 PM</p>
                    <p><i data-lucide="map-pin" aria-hidden="true"></i> Serving selected Cebu areas</p>
                    <p><i data-lucide="wallet" aria-hidden="true"></i> Cash and GCash supported</p>
                    <div class="footer-help-actions">
                        <a href="index.php?modal=signin" data-account-modal-trigger="signin">Sign in for help</a>
                    </div>
                </section>
            </div>

            <div class="footer-inner footer-layout role-footer role-footer--customer">
                <section class="footer-brand-panel footer-role-card" aria-label="Customer footer overview">
                    <span class="footer-role-pill"><i data-lucide="shopping-bag" aria-hidden="true"></i> Customer Account</span>
                    <a class="brand footer-brand" href="customer-dashboard.php" aria-label="customer dashboard">
                        <span class="bee-mark" aria-hidden="true"><span class="bee-body"></span></span>
                        <span>honestbee</span>
                    </a>
                    <p class="footer-tagline">Your grocery dashboard for browsing stores, checking cart items, and monitoring recent orders.</p>
                    <div class="footer-cta-row" aria-label="Customer footer actions">
                        <a class="footer-cta footer-cta-primary" href="customer-dashboard.php#stores" data-footer-view-link data-footer-role-target="customer" data-footer-view="stores"><i data-lucide="store" aria-hidden="true"></i> Shop Stores</a>
                        <a class="footer-cta" href="customer-dashboard.php#cart" data-footer-view-link data-footer-role-target="customer" data-footer-view="cart"><i data-lucide="shopping-cart" aria-hidden="true"></i> View Cart</a>
                    </div>
                </section>

                <nav class="footer-links" aria-label="Customer quick links">
                    <h3>Customer Tools</h3>
                    <a href="customer-dashboard.php#dashboard" data-footer-view-link data-footer-role-target="customer" data-footer-view="dashboard">Current Order</a>
                    <a href="customer-dashboard.php#stores" data-footer-view-link data-footer-role-target="customer" data-footer-view="stores">Stores</a>
                    <a href="customer-dashboard.php#cart" data-footer-view-link data-footer-role-target="customer" data-footer-view="cart">Cart</a>
                    <a href="customer-dashboard.php#orders" data-footer-view-link data-footer-role-target="customer" data-footer-view="orders">Recent Orders</a>
                </nav>

                <nav class="footer-links" aria-label="Customer support links">
                    <h3>Order Support</h3>
                    <a href="customer-dashboard.php#orders" data-footer-view-link data-footer-role-target="customer" data-footer-view="orders">Order Status</a>
                    <a href="customer-dashboard.php#orders" data-footer-view-link data-footer-role-target="customer" data-footer-view="orders">Ratings & Refunds</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="delivery-addresses">Delivery Addresses</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="payment-preferences">Payment Preferences</a>
                </nav>

                <section class="footer-info-card" aria-label="Customer account details">
                    <h3>For Customers</h3>
                    <p><i data-lucide="map-pin" aria-hidden="true"></i> Manage delivery addresses before checkout.</p>
                    <p><i data-lucide="receipt-text" aria-hidden="true"></i> View active and completed orders from your dashboard.</p>
                    <p><i data-lucide="star" aria-hidden="true"></i> Rate delivered orders or request help when needed.</p>
                    <div class="footer-help-actions">
                        <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="account-information">Open Profile</a>
                    </div>
                </section>
            </div>

            <div class="footer-inner footer-layout role-footer role-footer--seller">
                <section class="footer-brand-panel footer-role-card" aria-label="Merchant footer overview">
                    <span class="footer-role-pill"><i data-lucide="store" aria-hidden="true"></i> Merchant Account</span>
                    <a class="brand footer-brand" href="seller-dashboard.php" aria-label="merchant dashboard">
                        <span class="bee-mark" aria-hidden="true"><span class="bee-body"></span></span>
                        <span>honestbee</span>
                    </a>
                    <p class="footer-tagline">Manage your store status, product listings, customer orders, sales, and merchant profile details.</p>
                    <div class="footer-cta-row" aria-label="Merchant footer actions">
                        <a class="footer-cta footer-cta-primary" href="seller-dashboard.php#product-list" data-footer-view-link data-footer-role-target="seller" data-footer-view="product-list"><i data-lucide="package" aria-hidden="true"></i> Product List</a>
                        <a class="footer-cta" href="seller-dashboard.php#sales" data-footer-view-link data-footer-role-target="seller" data-footer-view="sales"><i data-lucide="chart-no-axes-combined" aria-hidden="true"></i> Sales</a>
                    </div>
                </section>

                <nav class="footer-links" aria-label="Merchant quick links">
                    <h3>Merchant Tools</h3>
                    <a href="seller-dashboard.php#dashboard" data-footer-view-link data-footer-role-target="seller" data-footer-view="dashboard">Merchant Dashboard</a>
                    <a href="seller-dashboard.php#add-product" data-footer-view-link data-footer-role-target="seller" data-footer-view="add-product">Add Product</a>
                    <a href="seller-dashboard.php#product-list" data-footer-view-link data-footer-role-target="seller" data-footer-view="product-list">Product List</a>
                    <a href="seller-dashboard.php#order-logs" data-footer-view-link data-footer-role-target="seller" data-footer-view="order-logs">Order Logs</a>
                </nav>

                <nav class="footer-links" aria-label="Merchant management links">
                    <h3>Store Management</h3>
                    <a href="seller-dashboard.php#sales" data-footer-view-link data-footer-role-target="seller" data-footer-view="sales">Full Sales Details</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="merchant-information">Merchant Profile</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="store-status">Store Status</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="available-days">Available Days</a>
                </nav>

                <section class="footer-info-card" aria-label="Merchant account details">
                    <h3>For Merchants</h3>
                    <p><i data-lucide="toggle-left" aria-hidden="true"></i> Keep your store Open or Closed based on availability.</p>
                    <p><i data-lucide="image" aria-hidden="true"></i> Upload clear product photos for customer browsing.</p>
                    <p><i data-lucide="clock" aria-hidden="true"></i> Update preparation time and available days in profile.</p>
                    <div class="footer-help-actions">
                        <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="merchant-information">Update Store Info</a>
                    </div>
                </section>
            </div>

            <div class="footer-inner footer-layout role-footer role-footer--rider">
                <section class="footer-brand-panel footer-role-card" aria-label="Rider footer overview">
                    <span class="footer-role-pill"><i data-lucide="bike" aria-hidden="true"></i> Rider Account</span>
                    <a class="brand footer-brand" href="rider-dashboard.php" aria-label="rider dashboard">
                        <span class="bee-mark" aria-hidden="true"><span class="bee-body"></span></span>
                        <span>honestbee</span>
                    </a>
                    <p class="footer-tagline">Your delivery workspace for assigned orders, earnings, order logs, and current rider location.</p>
                    <div class="footer-cta-row" aria-label="Rider footer actions">
                        <a class="footer-cta footer-cta-primary" href="rider-dashboard.php#orders" data-footer-view-link data-footer-role-target="rider" data-footer-view="orders"><i data-lucide="package-check" aria-hidden="true"></i> Orders</a>
                        <a class="footer-cta" href="rider-dashboard.php#earnings" data-footer-view-link data-footer-role-target="rider" data-footer-view="earnings"><i data-lucide="wallet" aria-hidden="true"></i> Earnings</a>
                    </div>
                </section>

                <nav class="footer-links" aria-label="Rider quick links">
                    <h3>Rider Tools</h3>
                    <a href="rider-dashboard.php#dashboard" data-footer-view-link data-footer-role-target="rider" data-footer-view="dashboard">Rider Dashboard</a>
                    <a href="rider-dashboard.php#orders" data-footer-view-link data-footer-role-target="rider" data-footer-view="orders">Assigned Orders</a>
                    <a href="rider-dashboard.php#earnings" data-footer-view-link data-footer-role-target="rider" data-footer-view="earnings">Earnings</a>
                    <a href="rider-dashboard.php#order-logs" data-footer-view-link data-footer-role-target="rider" data-footer-view="order-logs">Order Logs</a>
                </nav>

                <nav class="footer-links" aria-label="Rider profile links">
                    <h3>Rider Profile</h3>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="current-location">Current Location</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="rider-information">Profile Information</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="vehicle-details">Vehicle Details</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="rider-availability">Availability</a>
                </nav>

                <section class="footer-info-card" aria-label="Rider account details">
                    <h3>For Riders</h3>
                    <p><i data-lucide="navigation" aria-hidden="true"></i> Update current location using Choose Location.</p>
                    <p><i data-lucide="shield-check" aria-hidden="true"></i> Vehicle type stays locked from registration.</p>
                    <p><i data-lucide="receipt-text" aria-hidden="true"></i> Completed deliveries appear in Order Logs.</p>
                    <div class="footer-help-actions">
                        <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="rider-information">Update Rider Info</a>
                    </div>
                </section>
            </div>

            <div class="footer-inner footer-layout role-footer role-footer--admin">
                <section class="footer-brand-panel footer-role-card" aria-label="Admin footer overview">
                    <span class="footer-role-pill"><i data-lucide="shield-check" aria-hidden="true"></i> Admin Account</span>
                    <a class="brand footer-brand" href="admin-dashboard.php" aria-label="admin dashboard">
                        <span class="bee-mark" aria-hidden="true"><span class="bee-body"></span></span>
                        <span>honestbee</span>
                    </a>
                    <p class="footer-tagline">Admin control area for reviewing accounts, monitoring order logs, and managing ratings or refunds.</p>
                    <div class="footer-cta-row" aria-label="Admin footer actions">
                        <a class="footer-cta footer-cta-primary" href="admin-dashboard.php#customers" data-footer-view-link data-footer-role-target="admin" data-footer-view="customers"><i data-lucide="users" aria-hidden="true"></i> Customer Accounts</a>
                        <a class="footer-cta" href="admin-dashboard.php#issues" data-footer-view-link data-footer-role-target="admin" data-footer-view="issues"><i data-lucide="star" aria-hidden="true"></i> Ratings/Refunds</a>
                    </div>
                </section>

                <nav class="footer-links" aria-label="Admin account links">
                    <h3>Account Review</h3>
                    <a href="admin-dashboard.php#customers" data-footer-view-link data-footer-role-target="admin" data-footer-view="customers">Customer Accounts</a>
                    <a href="admin-dashboard.php#sellers" data-footer-view-link data-footer-role-target="admin" data-footer-view="sellers">Merchant Accounts</a>
                    <a href="admin-dashboard.php#riders" data-footer-view-link data-footer-role-target="admin" data-footer-view="riders">Rider Accounts</a>
                    <a href="admin-dashboard.php#orders" data-footer-view-link data-footer-role-target="admin" data-footer-view="orders">Order Logs</a>
                </nav>

                <nav class="footer-links" aria-label="Admin management links">
                    <h3>Admin Tools</h3>
                    <a href="admin-dashboard.php#issues" data-footer-view-link data-footer-role-target="admin" data-footer-view="issues">Ratings/Refunds</a>
                    <a href="#profile" data-account-modal-trigger="profile" data-profile-focus="admin-information">Admin Settings</a>
                    <a href="admin-dashboard.php#orders" data-footer-view-link data-footer-role-target="admin" data-footer-view="orders">Order Logs</a>
                    <a href="admin-dashboard.php#customers" data-footer-view-link data-footer-role-target="admin" data-footer-view="customers">Customer Accounts</a>
                </nav>

                <section class="footer-info-card" aria-label="Admin account details">
                    <h3>For Admin</h3>
                    <p><i data-lucide="check-circle" aria-hidden="true"></i> Approve or reject pending partner accounts.</p>
                    <p><i data-lucide="trash-2" aria-hidden="true"></i> Remove invalid ratings and order logs when needed.</p>
                    <p><i data-lucide="activity" aria-hidden="true"></i> Monitor open stores, riders, customers, and orders.</p>
                    <div class="footer-help-actions">
                        <a href="admin-dashboard.php#orders" data-footer-view-link data-footer-role-target="admin" data-footer-view="orders">Review Logs</a>
                    </div>
                </section>
            </div>

            <div class="footer-bottom">
                <div class="footer-bottom-inner">
                    <p>&copy; <?php echo date('Y'); ?> honestbee. Built as a grocery and food delivery demo.</p>
                    <div class="footer-socials" aria-label="Footer shortcuts">
                        <a href="#top" aria-label="Back to top"><i data-lucide="arrow-up" aria-hidden="true"></i></a>
                        <a class="footer-shortcut footer-shortcut--guest" href="index.php?modal=signin" data-account-modal-trigger="signin" aria-label="Open account"><i data-lucide="user" aria-hidden="true"></i></a>
                        <a class="footer-shortcut footer-shortcut--customer" href="customer-dashboard.php#cart" data-footer-view-link data-footer-role-target="customer" data-footer-view="cart" aria-label="Open cart"><i data-lucide="shopping-cart" aria-hidden="true"></i></a>
                        <a class="footer-shortcut footer-shortcut--seller" href="seller-dashboard.php#product-list" data-footer-view-link data-footer-role-target="seller" data-footer-view="product-list" aria-label="Open products"><i data-lucide="package" aria-hidden="true"></i></a>
                        <a class="footer-shortcut footer-shortcut--rider" href="rider-dashboard.php#earnings" data-footer-view-link data-footer-role-target="rider" data-footer-view="earnings" aria-label="Open earnings"><i data-lucide="wallet" aria-hidden="true"></i></a>
                        <a class="footer-shortcut footer-shortcut--admin" href="admin-dashboard.php#orders" data-footer-view-link data-footer-role-target="admin" data-footer-view="orders" aria-label="Open order logs"><i data-lucide="receipt-text" aria-hidden="true"></i></a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <script>
        window.honestbeeData = {
            storeCatalogs: <?php echo json_encode($storeCatalogs, JSON_UNESCAPED_SLASHES); ?>,
            initialShopCategories: <?php echo json_encode($initialShopCategories, JSON_UNESCAPED_SLASHES); ?>,
            collections: [
                'customer',
                'customer_order',
                'delivery',
                'merchant',
                'orders',
                'order_item',
                'payment_transaction',
                'products',
                'rating',
                'refund',
                'shopper',
                'stores',
                'substitution',
                'USER_ACCOUNT'
            ]
        };
    </script>
    <script src="assets/js/vendor/lucide.min.js"></script>
    <script type="module" src="assets/js/app.js?v=<?php echo filemtime(__DIR__ . '/../assets/js/app.js'); ?>"></script>
</body>
</html>
