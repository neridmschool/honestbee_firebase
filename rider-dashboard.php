<?php
$pageTitle = 'Rider Dashboard | honestbee';
$activePage = 'rider';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-rider-dashboard>
            <div class="rider-dashboard-layout">
                <aside class="rider-dashboard-nav" aria-label="Rider dashboard navigation">
                    <nav>
                        <a class="is-active" href="#dashboard" data-rider-view-trigger="dashboard" aria-current="page">
                            <i data-lucide="layout-dashboard" aria-hidden="true"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="#orders" data-rider-view-trigger="orders">
                            <i data-lucide="package-check" aria-hidden="true"></i>
                            <span>Orders</span>
                        </a>
                        <a href="#earnings" data-rider-view-trigger="earnings">
                            <i data-lucide="wallet" aria-hidden="true"></i>
                            <span>Earnings</span>
                        </a>
                        <a href="#order-logs" data-rider-view-trigger="order-logs">
                            <i data-lucide="receipt-text" aria-hidden="true"></i>
                            <span>Order Logs</span>
                        </a>
                    </nav>
                </aside>

                <section class="rider-dashboard-content">
                    <section class="rider-view-panel is-active" data-rider-view-panel="dashboard" id="dashboard">
                        <div class="rider-dashboard-head">
                            <div>
                                <h1>Rider dashboard</h1>
                                <p data-rider-status>Loading rider status...</p>
                            </div>
                        </div>

                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Current Order by customer</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-rider-current-order>
                                <div class="empty-state">Loading current order...</div>
                            </div>
                        </div>
                    </section>

                    <section class="rider-view-panel" data-rider-view-panel="orders" id="orders" hidden>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Orders</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-rider-orders>
                                <div class="empty-state">Loading orders...</div>
                            </div>
                        </div>
                    </section>

                    <section class="rider-view-panel" data-rider-view-panel="earnings" id="earnings" hidden>
                        <div class="dashboard-panel wide">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Full Earning Details</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-rider-earnings>
                                <div class="empty-state">Loading earning details...</div>
                            </div>
                        </div>
                    </section>

                    <section class="rider-view-panel" data-rider-view-panel="order-logs" id="order-logs" hidden>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Order Logs</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-rider-order-logs>
                                <div class="empty-state">Loading order logs...</div>
                            </div>
                        </div>
                    </section>
                </section>
            </div>

            <div class="customer-order-modal-backdrop rider-order-modal-backdrop" data-rider-order-modal hidden aria-hidden="true">
                <section class="customer-order-modal rider-order-modal" role="dialog" aria-modal="true" aria-labelledby="riderOrderModalTitle" tabindex="-1">
                    <button class="modal-close-x customer-order-modal-close" type="button" data-rider-order-modal-close aria-label="Close order details">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                    <div class="customer-order-modal-content" data-rider-order-modal-content>
                        <div class="empty-state">Loading order details...</div>
                    </div>
                </section>
            </div>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
