<?php
$pageTitle = 'Merchant Order Details | honestbee';
$activePage = 'seller';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-seller-order-detail>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Order details.</h1>
                    <p data-seller-order-status>Loading order...</p>
                </div>
                <a class="ghost-button" href="seller-dashboard.php"><i data-lucide="arrow-left" aria-hidden="true"></i> Merchant Dashboard</a>
            </section>

            <section class="dashboard-shell single">
                <div class="dashboard-panel wide">
                    <div class="dashboard-list" data-seller-order-content>
                        <div class="empty-state">Loading order details...</div>
                    </div>
                </div>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
