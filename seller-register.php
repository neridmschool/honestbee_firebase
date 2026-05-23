<?php
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: index.php?modal=merchant', true, 302);
    exit;
}

$pageTitle = 'Merchant Application | honestbee';
$activePage = 'seller-register';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-seller-registration-page>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Apply as an honestbee merchant.</h1>
                    <p>Your merchant account stays pending until the honestbee admin validates your merchant details.</p>
                </div>
            </section>

            <section class="dashboard-shell single">
                <form class="form-panel" method="post" action="seller-register.php" enctype="multipart/form-data" data-seller-registration-form>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Personal Information</h2>
                        </div>
                    </div>
                    <div class="form-grid">
                        <label>Owner First Name<input type="text" name="ownerFirstName" autocomplete="given-name" required></label>
                        <label>Owner Last Name<input type="text" name="ownerLastName" autocomplete="family-name" required></label>
                        <label>Owner Email Address<input type="email" name="ownerEmail" required></label>
                        <label>Phone Number<input type="tel" name="phone" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits" required></label>
                        <label>Password<input type="password" name="password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules data-password-meter required><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small><span class="password-strength" data-password-strength aria-live="polite"><span class="password-strength-title">Password Strength</span><span class="password-strength-status" data-password-strength-status></span><span class="password-strength-track" aria-hidden="true"><span data-password-strength-fill></span></span></span></label>
                        <label>Confirm Password<input type="password" name="confirmPassword" minlength="9" maxlength="30" autocomplete="new-password" required><small class="field-help">Re-enter the same password to confirm your merchant account.</small></label>
                    </div>
                    <div class="dashboard-heading form-subheading">
                        <div>
                            <h2>Business Information</h2>
                        </div>
                    </div>
                    <div class="form-grid">
                        <label>Merchant Name<input type="text" name="merchantName" required></label>
                        <label>Merchant Type<select name="merchantType" required>
                            <option value="">Select merchant type</option>
                            <option>Grocery</option>
                            <option>Food</option>
                        </select></label>
                        <div class="address-picker-field" data-address-picker-field>
                            <label>Merchant Address<input type="text" name="storeAddress" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input required></label>
                            <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                            <input type="hidden" name="addressParts" data-address-parts>
                        </div>
                        <label>Opening Time<input type="time" name="businessOpenTime" value="08:00" required></label>
                        <label>Closing Time<input type="time" name="businessCloseTime" value="21:00" required></label>
                        <label>Business Permit / Proof of Merchant<input type="file" name="businessProof" accept="image/*" data-image-upload required><small class="field-help">Upload an image file.</small></label>
                    </div>
                    <div class="form-actions">
                        <button class="primary-button" type="submit"><i data-lucide="send" aria-hidden="true"></i> Submit Merchant Application</button>
                    </div>
                    <div class="notice" data-seller-registration-notice></div>
                </form>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
