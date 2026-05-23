<?php
$pageTitle = 'Rating and Refund | honestbee';
$activePage = 'customer';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main">
            <section class="dashboard-hero compact">
                <div>
                    <h1>Rate service or request a refund.</h1>
                    <p>Send feedback or request help after an order is delivered.</p>
                </div>
                <a class="ghost-button" href="customer-dashboard.php"><i data-lucide="layout-dashboard" aria-hidden="true"></i> Customer dashboard</a>
            </section>

            <section class="dashboard-shell">
                <form class="form-panel" data-rating-form>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Submit rating</h2>
                        </div>
                    </div>
                    <div class="form-grid single-column">
                        <input type="text" name="order" placeholder="Order ID" required>
                        <select name="serviceScore" required>
                            <option value="5">Service score: 5</option>
                            <option value="4">Service score: 4</option>
                            <option value="3">Service score: 3</option>
                            <option value="2">Service score: 2</option>
                            <option value="1">Service score: 1</option>
                        </select>
                        <select name="shopperScore" required>
                            <option value="5">Rider score: 5</option>
                            <option value="4">Rider score: 4</option>
                            <option value="3">Rider score: 3</option>
                            <option value="2">Rider score: 2</option>
                            <option value="1">Rider score: 1</option>
                        </select>
                        <textarea name="comment" placeholder="Feedback comment"></textarea>
                    </div>
                    <button class="primary-button" type="submit"><i data-lucide="star" aria-hidden="true"></i> Save rating</button>
                    <div class="notice" data-rating-notice></div>
                </form>

                <form class="form-panel" data-refund-form>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Request refund</h2>
                        </div>
                    </div>
                    <div class="form-grid single-column">
                        <input type="text" name="order" placeholder="Order ID" required>
                        <input type="number" min="1" step="0.01" name="amount" placeholder="Refund amount" required>
                        <textarea name="reason" placeholder="Reason for refund" required></textarea>
                    </div>
                    <button class="primary-button" type="submit"><i data-lucide="receipt" aria-hidden="true"></i> Submit refund</button>
                    <div class="notice" data-refund-notice></div>
                </form>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
