<?php
$pageTitle = 'Customer Deals | honestbee';
$activePage = 'deals';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main">
            <section class="dashboard-hero">
                <div>
                    <h1>Deals for today</h1>
                    <p>Promotions for grocery baskets, lunch orders, and scheduled delivery.</p>
                </div>
                <div class="hero-actions">
                    <a class="primary-button" href="index.php?view=stores#stores"><i data-lucide="shopping-basket" aria-hidden="true"></i> Shop stores</a>
                    <a class="ghost-button" href="customer-dashboard.php"><i data-lucide="layout-dashboard" aria-hidden="true"></i> Dashboard</a>
                </div>
            </section>

            <section class="section">
                <div class="section-inner">
                    <div class="deal-grid">
                        <article class="deal-card">
                            <span>Grocery bundle</span>
                            <h3>Save PHP 150 on fresh produce over PHP 1,200</h3>
                            <p>Best for weekly fruit, vegetables, dairy, and pantry restocks.</p>
                        </article>
                        <article class="deal-card food">
                            <span>Food delivery</span>
                            <h3>Free drink with selected lunch sets</h3>
                            <p>Available from Bee Kitchen and Lazy Loaf Kitchen.</p>
                        </article>
                        <article class="deal-card delivery">
                            <span>Delivery window</span>
                            <h3>Schedule later and lower the delivery fee</h3>
                            <p>Pick a time slot that works for home or office deliveries.</p>
                        </article>
                    </div>
                </div>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
