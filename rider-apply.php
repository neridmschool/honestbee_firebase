<?php
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: index.php?modal=rider', true, 302);
    exit;
}

$pageTitle = 'Rider Application | honestbee';
$activePage = 'rider-apply';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-rider-application-page>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Apply as an honestbee rider.</h1>
                </div>
            </section>

            <section class="dashboard-shell single">
                <form class="form-panel" method="post" action="rider-apply.php" enctype="multipart/form-data" data-rider-application-form>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Personal Information</h2>
                        </div>
                    </div>
                    <div class="form-grid">
                        <label>First Name<input type="text" name="firstName" autocomplete="given-name" required></label>
                        <label>Last Name<input type="text" name="lastName" autocomplete="family-name" required></label>
                        <label>Email Address<input type="email" name="email" required></label>
                        <label>Phone Number<input type="tel" name="phone" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits" required></label>
                        <label>Password<input type="password" name="password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules data-password-meter required><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small><span class="password-strength" data-password-strength aria-live="polite"><span class="password-strength-title">Password Strength</span><span class="password-strength-status" data-password-strength-status></span><span class="password-strength-track" aria-hidden="true"><span data-password-strength-fill></span></span></span></label>
                        <label>Confirm Password<input type="password" name="confirmPassword" minlength="9" maxlength="30" autocomplete="new-password" required><small class="field-help">Re-enter the same password to confirm your rider account.</small></label>
                    </div>
                    <div class="dashboard-heading form-subheading">
                        <div>
                            <h2>Delivery Information</h2>
                        </div>
                    </div>
                    <div class="form-grid">
                        <label>Vehicle Type<select name="vehicleType" required>
                            <option value="">Select vehicle type</option>
                            <option>Motorcycle</option>
                            <option>Bicycle</option>
                            <option>Car</option>
                        </select></label>
                        <div class="address-picker-field" data-address-picker-field>
                            <label>Rider Address<input type="text" name="currentLocation" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input required></label>
                            <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                            <input type="hidden" name="addressParts" data-address-parts>
                        </div>
                        <!-- TODO: Upload this file with Firebase Storage in a later phase; Phase 1 saves validIdUrl/licenseUrl as empty strings. -->
                        <label>Valid ID / Driver's License<input type="file" name="validId" accept="image/*" data-image-upload required><small class="field-help">Upload an image file.</small></label>
                    </div>
                    <div class="form-actions">
                        <button class="primary-button" type="submit"><i data-lucide="send" aria-hidden="true"></i> Submit Rider Application</button>
                    </div>
                    <div class="notice" data-rider-application-notice></div>
                </form>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
