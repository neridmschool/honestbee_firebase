<?php
$pageTitle = 'honestbee Admin Dashboard';
$activePage = 'admin';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-admin-dashboard>
            <div class="admin-dashboard-layout">
                <aside class="admin-dashboard-nav" aria-label="Admin dashboard navigation">
                    <nav>
                        <a class="is-active" href="#customer-accounts" data-admin-tab="customers" aria-current="page">
                            <i data-lucide="users" aria-hidden="true"></i>
                            <span>Customer Accounts</span>
                            <strong class="customer-nav-count" data-stat-customers>0</strong>
                        </a>
                        <a href="#rider-accounts" data-admin-tab="riders">
                            <i data-lucide="bike" aria-hidden="true"></i>
                            <span>Rider Accounts</span>
                            <strong class="customer-nav-count" data-stat-riders>0</strong>
                        </a>
                        <a href="#merchant-account" data-admin-tab="sellers">
                            <i data-lucide="store" aria-hidden="true"></i>
                            <span>Merchant Account</span>
                            <strong class="customer-nav-count" data-stat-sellers>0</strong>
                        </a>
                        <a href="#ratings-refunds" data-admin-tab="issues">
                            <i data-lucide="star" aria-hidden="true"></i>
                            <span>Ratings/Refunds</span>
                            <strong class="customer-nav-count" data-stat-issues>0</strong>
                        </a>
                        <a href="#order-logs" data-admin-tab="orders">
                            <i data-lucide="receipt-text" aria-hidden="true"></i>
                            <span>Order Logs</span>
                            <strong class="customer-nav-count" data-stat-orders>0</strong>
                        </a>
                    </nav>
                </aside>

                <section class="admin-dashboard-content">
                    <section class="admin-view-panel is-active" data-admin-view-panel="records">
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2 data-admin-view-title>Customer Accounts</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-admin-view-list>
                                <div class="empty-state">Loading admin records...</div>
                            </div>
                            <div class="notice" data-admin-notice></div>
                        </div>
                    </section>
                </section>
            </div>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
