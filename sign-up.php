<?php
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: index.php?modal=signup', true, 302);
    exit;
}

$pageTitle = 'Sign up | honestbee';
$activePage = 'sign-up';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-signup-page>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Create a customer account.</h1>
                    <p>Merchant and rider accounts use the application links in the navigation.</p>
                </div>
            </section>

            <section class="dashboard-shell single auth-shell">
                <form class="form-panel auth-panel" method="post" action="sign-up.php" data-customer-signup-form>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Sign up details</h2>
                        </div>
                    </div>
                    <div class="form-grid single-column">
                        <label>First Name<input type="text" name="firstName" autocomplete="given-name" required></label>
                        <label>Last Name<input type="text" name="lastName" autocomplete="family-name" required></label>
                        <label>Email Address<input type="email" name="email" placeholder="you@gmail.com" required></label>
                        <label>Phone Number<input type="tel" name="phone" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits" required></label>
                        <div class="address-picker-field" data-address-picker-field>
                            <label>Address<input type="text" name="address" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input required></label>
                            <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                            <input type="hidden" name="city" data-address-city>
                            <input type="hidden" name="addressParts" data-address-parts>
                        </div>
                        <label>Password<input type="password" name="password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules data-password-meter required><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small><span class="password-strength" data-password-strength aria-live="polite"><span class="password-strength-title">Password Strength</span><span class="password-strength-status" data-password-strength-status></span><span class="password-strength-track" aria-hidden="true"><span data-password-strength-fill></span></span></span></label>
                        <label>Confirm Password<input type="password" name="confirmPassword" minlength="9" maxlength="30" autocomplete="new-password" required></label>
                    </div>
                    <button class="primary-button" type="submit"><i data-lucide="user-plus" aria-hidden="true"></i> Sign up</button>
                    <div class="notice" data-customer-signup-notice></div>
                </form>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
