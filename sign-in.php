<?php
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: index.php?modal=signin', true, 302);
    exit;
}

$pageTitle = 'Sign in | honestbee';
$activePage = 'sign-in';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-signin-page>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Welcome back to honestbee.</h1>
                </div>
            </section>

            <section class="dashboard-shell single auth-shell">
                <form class="form-panel auth-panel" method="post" action="sign-in.php" data-login-form>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Sign in details</h2>
                        </div>
                    </div>
                    <div class="form-grid single-column">
                        <label>Email Address<input type="email" name="email" required></label>
                        <label>Password<input type="password" name="password" maxlength="30" required></label>
                    </div>
                    <div class="form-actions">
                        <button class="primary-button" type="submit"><i data-lucide="log-in" aria-hidden="true"></i> Sign in</button>
                        <button class="forgot-password-link" type="button" data-forgot-password-open>Forgot password?</button>
                    </div>
                    <div class="notice" data-login-notice></div>
                </form>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
