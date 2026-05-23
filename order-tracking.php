<?php
$pageTitle = 'Order Tracking | honestbee';
$activePage = 'customer';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-order-tracking>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Track your order.</h1>
                    <p>Rider updates change the same order documents customers can see here.</p>
                </div>
                <form class="inline-form" data-track-form>
                    <input id="trackingOrderId" type="text" name="order" placeholder="Order ID" aria-label="Order ID">
                    <button class="primary-button" type="submit"><i data-lucide="search" aria-hidden="true"></i> Track</button>
                    <button class="ghost-button" type="button" data-fill-last-order="trackingOrderId">Last order</button>
                </form>
            </section>

            <section class="dashboard-shell single">
                <div class="dashboard-panel wide">
                    <div class="dashboard-list" data-tracking-result>
                        <div class="empty-state">Enter an order ID to load tracking.</div>
                    </div>
                </div>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
