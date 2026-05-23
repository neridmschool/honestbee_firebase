<?php
$pageTitle = 'Application Status | honestbee';
$activePage = 'waiting-approval';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-application-status>
            <section class="dashboard-hero compact">
                <div>
                    <h1 data-status-title>Checking your application.</h1>
                    <p data-status-message>Loading your latest application status...</p>
                </div>
                <div class="hero-actions" data-status-actions>
                    <a class="ghost-button" href="index.php"><i data-lucide="home" aria-hidden="true"></i> Start page</a>
                </div>
            </section>

            <section class="dashboard-shell single">
                <div class="dashboard-panel wide">
                    <div class="dashboard-list" data-status-details>
                        <div class="empty-state">Looking up your application record...</div>
                    </div>
                </div>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
