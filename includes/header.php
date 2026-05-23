<?php
require_once __DIR__ . '/data.php';

$pageTitle = $pageTitle ?? 'honestbee online shop and food delivery';
$activePage = $activePage ?? 'home';
$bodyClass = $bodyClass ?? '';
$faviconFile = __DIR__ . '/../assets/img/honestbee-logo.svg';
$faviconVersion = file_exists($faviconFile) ? filemtime($faviconFile) : time();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo htmlspecialchars($pageTitle); ?></title>
    <link rel="icon" type="image/svg+xml" href="assets/img/honestbee-logo.svg?v=<?php echo $faviconVersion; ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <link rel="stylesheet" href="assets/css/styles.css?v=<?php echo filemtime(__DIR__ . '/../assets/css/styles.css'); ?>">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer></script>
    <script>
        try {
            const honestbeeAccount = localStorage.getItem('honestbee_account');
            const parsedAccount = honestbeeAccount ? JSON.parse(honestbeeAccount) : null;
            const themeKey = parsedAccount && parsedAccount.USER_email
                ? `honestbee_theme_mode_${parsedAccount.USER_email}`
                : 'honestbee_theme_mode';
            const themeMode = localStorage.getItem(themeKey) || localStorage.getItem('honestbee_theme_mode') || 'light';
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (themeMode === 'dark' || (themeMode === 'system' && prefersDark)) {
                document.documentElement.classList.add('theme-dark');
            }
            if (parsedAccount && parsedAccount.USER_role && parsedAccount.USER_email) {
                document.documentElement.classList.add('has-current-account');
                document.documentElement.classList.add(`account-role-${String(parsedAccount.USER_role).toLowerCase()}`);
            }
        } catch (error) {
            localStorage.removeItem('honestbee_account');
        }
    </script>
</head>
<body class="<?php echo htmlspecialchars($bodyClass); ?>" data-page="<?php echo htmlspecialchars($activePage); ?>">
    <div class="page-shell">
        <header class="topbar">
            <nav class="nav" aria-label="Primary navigation">
                <a class="brand" href="index.php" aria-label="honestbee home">
                    <span class="bee-mark" aria-hidden="true"><span class="bee-body"></span></span>
                    <span>honestbee</span>
                </a>
                <div class="nav-links">
                    <a href="index.php?modal=signin" data-nav-dashboard hidden>Dashboard</a>
                    <a href="index.php?modal=rider" data-auth-guest data-account-modal-trigger="rider">Apply as Rider</a>
                    <a href="index.php?modal=merchant" data-auth-guest data-account-modal-trigger="merchant">Apply as Merchant</a>
                </div>
                <div class="nav-actions">
                    <label class="theme-switch" title="Toggle light or dark mode">
                        <input type="checkbox" data-theme-toggle aria-label="Toggle light or dark mode">
                        <span class="theme-switch-track" aria-hidden="true">
                            <span class="theme-switch-cloud theme-switch-cloud-a"></span>
                            <span class="theme-switch-cloud theme-switch-cloud-b"></span>
                            <span class="theme-switch-star theme-switch-star-a"></span>
                            <span class="theme-switch-star theme-switch-star-b"></span>
                            <span class="theme-switch-star theme-switch-star-c"></span>
                            <span class="theme-switch-knob">
                                <span class="theme-switch-crater theme-switch-crater-a"></span>
                                <span class="theme-switch-crater theme-switch-crater-b"></span>
                                <span class="theme-switch-crater theme-switch-crater-c"></span>
                            </span>
                        </span>
                    </label>
                    <a class="ghost-button" href="index.php?modal=signin" data-auth-guest data-account-modal-trigger="signin"><i data-lucide="log-in" aria-hidden="true"></i> Sign in</a>
                    <a class="primary-button" href="index.php?modal=signup" data-auth-guest data-account-modal-trigger="signup"><i data-lucide="user-plus" aria-hidden="true"></i> Sign up</a>
                    <span class="account-chip" data-auth-user hidden></span>
                    <div class="more-menu-wrap">
                        <button class="icon-button more-button" type="button" data-more-toggle aria-expanded="false">
                            <i data-lucide="menu" aria-hidden="true"></i>
                            <span>More</span>
                        </button>
                        <div class="more-menu" data-more-menu hidden>
                            <a href="index.php?modal=signin" data-more-profile-link hidden><i data-lucide="user" aria-hidden="true"></i> Profile</a>
                            <a href="#settings" data-more-settings-link data-guest-settings-trigger><i data-lucide="languages" aria-hidden="true"></i> Language</a>
                            <button class="more-menu-item" type="button" data-more-logout data-logout hidden><i data-lucide="log-out" aria-hidden="true"></i> Logout</button>
                        </div>
                    </div>
                </div>
            </nav>
        </header>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="signin" aria-hidden="true">
            <section class="account-modal" role="dialog" aria-modal="true" aria-labelledby="signinModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="signinModalTitle">Sign In</h2>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close sign in">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <form class="form-panel auth-panel account-modal-form" method="post" action="sign-in.php" data-login-form>
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
        </div>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="forgot-password" aria-hidden="true">
            <section class="account-modal" role="dialog" aria-modal="true" aria-labelledby="forgotPasswordModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="forgotPasswordModalTitle">Forgot Password</h2>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close forgot password">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <form class="form-panel auth-panel account-modal-form password-reset-form" method="post" action="#" data-password-reset-form>
                    <div data-password-reset-step="otp">
                        <div class="form-grid single-column">
                            <label>Enter Email<input type="email" name="email" placeholder="Enter your gmail" autocomplete="email" required></label>
                            <div class="form-actions">
                                <button class="ghost-button" type="button" data-password-reset-send-otp><i data-lucide="mail" aria-hidden="true"></i> Send Reset Link</button>
                            </div>
                        </div>
                        <div class="password-reset-status" data-password-reset-otp-status hidden>
                            <span class="password-reset-status-icon"><i data-lucide="check" aria-hidden="true"></i></span>
                            <span>Password reset email sent to Gmail</span>
                        </div>
                    </div>

                    <div data-password-reset-step="password" hidden>
                        <div class="form-grid single-column">
                            <label>New Password<input type="password" name="newPassword" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules data-password-meter><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small><span class="password-strength" data-password-strength aria-live="polite"><span class="password-strength-title">Password Strength</span><span class="password-strength-status" data-password-strength-status></span><span class="password-strength-track" aria-hidden="true"><span data-password-strength-fill></span></span></span></label>
                            <label>Confirm New Password<input type="password" name="confirmPassword" minlength="9" maxlength="30" autocomplete="new-password"></label>
                        </div>
                        <div class="form-actions">
                            <button class="primary-button" type="button" data-password-reset-confirm><i data-lucide="key-round" aria-hidden="true"></i> Confirm Password</button>
                        </div>
                    </div>

                    <div class="password-reset-success" data-password-reset-step="success" hidden>
                        <span class="password-reset-success-icon"><i data-lucide="check" aria-hidden="true"></i></span>
                        <h3 data-password-reset-success-title>Password reset email sent</h3><p>Open the email from Firebase and follow the link to create a new password.</p>
                        <button class="primary-button" type="button" data-password-reset-back><i data-lucide="log-in" aria-hidden="true"></i> Back to Sign In</button>
                    </div>
                    <div class="notice" data-password-reset-notice></div>
                </form>
            </section>
        </div>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="pending-approval" aria-hidden="true">
            <section class="account-modal" role="dialog" aria-modal="true" aria-labelledby="pendingApprovalModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="pendingApprovalModalTitle">Pending for approval.</h2>
                        <p>Please wait for admin approval before signing in.</p>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close pending approval">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
            </section>
        </div>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="signup" aria-hidden="true">
            <section class="account-modal" role="dialog" aria-modal="true" aria-labelledby="signupModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="signupModalTitle">Sign Up</h2>
                        <p>Create a customer account.</p>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close sign up">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <form class="form-panel auth-panel account-modal-form" method="post" action="sign-up.php" data-customer-signup-form>
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
                    <div class="form-actions">
                        <button class="primary-button" type="submit"><i data-lucide="user-plus" aria-hidden="true"></i> Sign up</button>
                    </div>
                    <div class="notice" data-customer-signup-notice></div>
                </form>
            </section>
        </div>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="rider" aria-hidden="true">
            <section class="account-modal account-modal-wide" role="dialog" aria-modal="true" aria-labelledby="riderModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="riderModalTitle">Rider Application</h2>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close rider application">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <form class="form-panel account-modal-form" method="post" action="rider-apply.php" enctype="multipart/form-data" data-rider-application-form>
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
        </div>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="merchant" aria-hidden="true">
            <section class="account-modal account-modal-wide" role="dialog" aria-modal="true" aria-labelledby="merchantModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="merchantModalTitle">Merchant Application</h2>
                        <p>Your merchant account stays pending until honestbee validates your details.</p>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close merchant application">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <form class="form-panel account-modal-form" method="post" action="seller-register.php" enctype="multipart/form-data" data-seller-registration-form>
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
                        <!-- TODO: Upload this file with Firebase Storage in a later phase; Phase 1 saves logoUrl/documentUrl as empty strings. -->
                        <label>Business Permit / Proof of Merchant<input type="file" name="businessProof" accept="image/*" data-image-upload required><small class="field-help">Upload an image file.</small></label>
                    </div>
                    <div class="form-actions">
                        <button class="primary-button" type="submit"><i data-lucide="send" aria-hidden="true"></i> Submit Merchant Application</button>
                    </div>
                    <div class="notice" data-seller-registration-notice></div>
                </form>
            </section>
        </div>

        <div class="modal-backdrop account-modal-backdrop" data-account-modal="profile" aria-hidden="true">
            <section class="account-modal account-modal-profile" role="dialog" aria-modal="true" aria-labelledby="customerProfileModalTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="customerProfileModalTitle">Profile</h2>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close profile">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="customer-profile-modal-content">
                    <article class="settings-section account-settings customer-profile-section" data-settings-section="customer" hidden>
                        <div class="settings-section-head">
                            <h2>Profile</h2>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="account-information">
                            <h3>Account Information</h3>
                            <div class="settings-fields four">
                                <label>First Name<input type="text" data-account-field="firstName" placeholder="First name" autocomplete="given-name"></label>
                                <label>Last Name<input type="text" data-account-field="lastName" placeholder="Last name" autocomplete="family-name"></label>
                                <label>Email Address<input type="email" data-account-field="email" placeholder="Email address"></label>
                                <label>Phone Number<input type="tel" data-account-field="phone" placeholder="09171234567" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits"></label>
                            </div>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="customer"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="delivery-addresses">
                            <h3>Delivery Address</h3>
                            <div class="customer-address-manager" data-address-manager>
                                <div class="customer-address-list" data-address-list></div>
                                <button class="ghost-button" type="button" data-address-add><i data-lucide="plus" aria-hidden="true"></i> Make New Address</button>
                                <div class="address-picker-field address-editor" data-address-picker-field data-address-editor hidden>
                                    <label>Address<input type="text" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input></label>
                                    <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                                    <input type="hidden" data-address-city>
                                    <input type="hidden" data-address-parts>
                                    <small class="field-help" data-address-preview>Street, Barangay, City/Municipal, Cebu</small>
                                    <div class="address-editor-actions">
                                        <button class="primary-button" type="button" data-address-save><i data-lucide="check" aria-hidden="true"></i> Save Address</button>
                                        <button class="ghost-button" type="button" data-address-cancel><i data-lucide="x" aria-hidden="true"></i> Cancel</button>
                                    </div>
                                </div>
                                <div class="customer-address-detail" data-address-detail hidden></div>
                            </div>
                        </div>

                        <div class="settings-card" data-profile-anchor="payment-preferences">
                            <h3>Payment Preferences</h3>
                            <label class="check-row"><input type="checkbox" checked> Cash on Delivery</label>
                            <label class="check-row"><input type="checkbox"> Card</label>
                            <label class="check-row"><input type="checkbox"> GCash</label>
                        </div>

                        <div class="settings-card">
                            <h3>Order Preferences</h3>
                            <label>Allow substitutions<select><option>Yes</option><option>No</option></select></label>
                            <label>Preferred delivery time<input type="time" data-account-field="preferredDeliveryTime"></label>
                            <label>Delivery instructions<textarea placeholder="Leave notes for rider or shopper"></textarea></label>
                        </div>

                        <div class="settings-card">
                            <h3>Notifications</h3>
                            <label class="check-row"><input type="checkbox" checked> Order updates</label>
                            <label class="check-row"><input type="checkbox"> Promotions</label>
                            <label class="check-row"><input type="checkbox" checked> Delivery alerts</label>
                        </div>

                        <div class="settings-card">
                            <h3>Privacy and Security</h3>
                            <label>Current Password<input type="password" data-password-field="current" placeholder="Current password" maxlength="30" autocomplete="current-password"></label>
                            <label>New Password<input type="password" data-password-field="new" placeholder="New password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small></label>
                            <label>Confirm New Password<input type="password" data-password-field="confirm" placeholder="Confirm new password" maxlength="30" autocomplete="new-password"></label>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="customer"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>
                    </article>

                    <article class="settings-section account-settings customer-profile-section" data-settings-section="seller" hidden>
                        <div class="settings-section-head">
                            <h2>Merchant Profile</h2>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="owner-information">
                            <h3>Owner Information</h3>
                            <div class="settings-fields four">
                                <label>Owner First Name<input type="text" data-account-field="firstName" placeholder="Owner first name" autocomplete="given-name"></label>
                                <label>Owner Last Name<input type="text" data-account-field="lastName" placeholder="Owner last name" autocomplete="family-name"></label>
                                <label>Owner Email Address<input type="email" data-account-field="email" placeholder="Owner email address"></label>
                                <label>Phone Number<input type="tel" data-account-field="phone" placeholder="09171234567" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits"></label>
                            </div>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="seller"><i data-lucide="check" aria-hidden="true"></i> Apply Changes</button>
                            </div>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="merchant-information">
                            <h3>Merchant Information</h3>
                            <div class="settings-fields four">
                                <label>Merchant Name<input type="text" data-account-field="storeName" placeholder="Merchant name"></label>
                                <label>Merchant Type<select data-account-field="merchantType"><option>Grocery</option><option>Food</option></select></label>
                                <label>Preparation Time<input type="time" data-account-field="preparationTime"></label>
                                <label data-profile-anchor="store-status">Store Status<select data-account-field="storeStatus"><option>Open</option><option>Closed</option></select></label>
                            </div>
                            <div class="address-picker-field merchant-address-picker" data-address-picker-field>
                                <label>Merchant Address<input type="text" data-account-field="storeAddress" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input></label>
                                <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                                <input type="hidden" data-address-parts>
                                <small class="field-help" data-address-preview>Choose your real store address in Cebu.</small>
                            </div>
                            <div class="day-selector-field" data-profile-anchor="available-days">
                                <span>Available Days</span>
                                <div class="day-selector" data-account-field="availableDays" role="group" aria-label="Available Days">
                                    <label><input type="checkbox" value="Monday"> Mon</label>
                                    <label><input type="checkbox" value="Tuesday"> Tue</label>
                                    <label><input type="checkbox" value="Wednesday"> Wed</label>
                                    <label><input type="checkbox" value="Thursday"> Thu</label>
                                    <label><input type="checkbox" value="Friday"> Fri</label>
                                    <label><input type="checkbox" value="Saturday"> Sat</label>
                                    <label><input type="checkbox" value="Sunday"> Sun</label>
                                </div>
                            </div>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="seller"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>

                        <div class="settings-card">
                            <h3>Application Status</h3>
                            <p data-seller-settings-status>Approval Status: Pending/Approved/Rejected</p>
                        </div>

                        <div class="settings-card">
                            <h3>Account Security</h3>
                            <label>Current Password<input type="password" data-password-field="current" placeholder="Current password" maxlength="30" autocomplete="current-password"></label>
                            <label>New Password<input type="password" data-password-field="new" placeholder="New password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small></label>
                            <label>Confirm New Password<input type="password" data-password-field="confirm" placeholder="Confirm new password" maxlength="30" autocomplete="new-password"></label>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="seller"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>
                    </article>

                    <article class="settings-section account-settings customer-profile-section" data-settings-section="rider" hidden>
                        <div class="settings-section-head">
                            <h2>Rider Profile</h2>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="rider-information">
                            <h3>Rider Information</h3>
                            <div class="settings-fields four">
                                <label>First Name<input type="text" data-account-field="firstName" placeholder="First name" autocomplete="given-name"></label>
                                <label>Last Name<input type="text" data-account-field="lastName" placeholder="Last name" autocomplete="family-name"></label>
                                <label>Email Address<input type="email" data-account-field="email" placeholder="Email address"></label>
                                <label>Phone Number<input type="tel" data-account-field="phone" placeholder="09171234567" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits"></label>
                            </div>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="rider"><i data-lucide="check" aria-hidden="true"></i> Apply Changes</button>
                            </div>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="vehicle-details">
                            <h3>Delivery Information</h3>
                            <div class="settings-fields four">
                                <label data-profile-anchor="vehicle-type">Vehicle Type<select data-account-field="vehicleType" disabled aria-readonly="true" class="readonly-registered-field"><option>Motorcycle</option><option>Bicycle</option><option>Car</option></select><small class="field-help">Vehicle type is locked from your rider registration.</small></label>
                                <label>Maximum Active Orders<input type="number" min="1" value="1" data-account-field="maxActiveOrders"></label>
                            </div>
                            <div class="address-picker-field rider-location-picker" data-address-picker-field data-profile-anchor="current-location">
                                <label>Current Location<input type="text" data-account-field="currentLocation" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input></label>
                                <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                                <input type="hidden" data-address-parts>
                                <small class="field-help" data-address-preview>Choose your current rider location in Cebu.</small>
                            </div>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="rider"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>

                        <div class="settings-card" data-profile-anchor="rider-availability">
                            <h3>Availability</h3>
                            <label>Available / Unavailable<select><option>Available</option><option>Unavailable</option></select></label>
                            <label>Current delivery area<input type="text" placeholder="Current delivery area"></label>
                        </div>

                        <div class="settings-card">
                            <h3>Employment Status</h3>
                            <p data-rider-settings-status>Employment Status: Pending/Active/Inactive</p>
                        </div>

                        <div class="settings-card">
                            <h3>Account Security</h3>
                            <label>Current Password<input type="password" data-password-field="current" placeholder="Current password" maxlength="30" autocomplete="current-password"></label>
                            <label>New Password<input type="password" data-password-field="new" placeholder="New password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small></label>
                            <label>Confirm New Password<input type="password" data-password-field="confirm" placeholder="Confirm new password" maxlength="30" autocomplete="new-password"></label>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="rider"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>
                    </article>

                    <article class="settings-section account-settings customer-profile-section" data-settings-section="admin" hidden>
                        <div class="settings-section-head">
                            <h2>Admin Profile</h2>
                        </div>

                        <div class="settings-card is-wide" data-profile-anchor="admin-information">
                            <h3>Admin Information</h3>
                            <label>Admin ID<input type="text" data-account-field="adminId" placeholder="Admin ID" readonly></label>
                        </div>

                        <div class="settings-card">
                            <h3>Change Password</h3>
                            <label>Current Password<input type="password" data-password-field="current" placeholder="Current password" maxlength="30" autocomplete="current-password"></label>
                            <label>New Password<input type="password" data-password-field="new" placeholder="New password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small></label>
                            <label>Confirm New Password<input type="password" data-password-field="confirm" placeholder="Confirm new password" maxlength="30" autocomplete="new-password"></label>
                            <div class="settings-card-actions">
                                <span class="notice" data-settings-notice></span>
                                <button class="primary-button" type="button" data-apply-settings="admin"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </div>

        <div class="modal-backdrop account-modal-backdrop settings-drawer-backdrop" data-account-modal="settings" aria-hidden="true">
            <section class="account-modal settings-drawer" role="dialog" aria-modal="true" aria-labelledby="guestSettingsTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="guestSettingsTitle">Language</h2>
                    </div>
                    <button class="modal-close-x" type="button" data-account-modal-close aria-label="Close language">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="settings-drawer-content">
                    <section class="settings-card settings-drawer-card">
                        <h3>Language</h3>
                        <select data-language-setting data-language-auto aria-label="Language">
                            <option value="english">English</option>
                            <option value="filipino">Filipino</option>
                            <option value="cebuano">Cebuano/Bisaya</option>
                        </select>
                    </section>
                </div>
            </section>
        </div>

        <div class="modal-backdrop location-picker-backdrop" data-location-modal hidden aria-hidden="true">
            <section class="account-modal account-modal-wide location-picker-modal" role="dialog" aria-modal="true" aria-labelledby="locationPickerTitle" tabindex="-1">
                <div class="account-modal-head">
                    <div>
                        <h2 id="locationPickerTitle">Choose Location</h2>
                    </div>
                    <button class="modal-close-x" type="button" data-location-close aria-label="Close location picker">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="location-picker-body">
                    <div class="location-search-row">
                        <input type="text" data-location-search placeholder="Search Cebu address">
                        <button class="ghost-button" type="button" data-location-search-button><i data-lucide="search" aria-hidden="true"></i> Search</button>
                    </div>
                    <div class="location-map" data-location-map></div>
                    <div class="location-summary" data-location-summary>Choose a point in Cebu to fill the address.</div>
                    <div class="location-actions">
                        <button class="ghost-button" type="button" data-location-close><i data-lucide="x" aria-hidden="true"></i> Cancel</button>
                        <button class="primary-button" type="button" data-location-use><i data-lucide="map-pin" aria-hidden="true"></i> Use Location</button>
                    </div>
                </div>
            </section>
        </div>
