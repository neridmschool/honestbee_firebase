<?php
$pageTitle = 'Settings | honestbee';
$activePage = 'settings';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main settings-main" data-settings-page>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Preferences for your honestbee experience.</h1>
                    <p data-settings-account hidden></p>
                </div>
            </section>

            <section class="settings-layout">
                <article class="settings-section account-settings" data-settings-section="customer" hidden>
                    <div class="settings-section-head">
                        <h2>Profile</h2>
                    </div>

                    <div class="settings-card is-wide">
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

                    <div class="settings-card is-wide">
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

                    <div class="settings-card">
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

                <article class="settings-section account-settings" data-settings-section="seller" hidden>
                    <div class="settings-section-head">
                        <h2>Merchant account</h2>
                        <p>Merchant settings unlock only after honestbee admin approval.</p>
                    </div>

                    <div class="settings-card is-wide">
                        <h3>Account Information</h3>
                        <div class="settings-fields four">
                            <label>First Name<input type="text" data-account-field="firstName" placeholder="Owner first name" autocomplete="given-name"></label>
                            <label>Last Name<input type="text" data-account-field="lastName" placeholder="Owner last name" autocomplete="family-name"></label>
                            <label>Email Address<input type="email" data-account-field="email" placeholder="Owner email address"></label>
                            <label>Phone Number<input type="tel" data-account-field="phone" placeholder="09171234567" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits"></label>
                        </div>
                        <div class="settings-card-actions">
                            <span class="notice" data-settings-notice></span>
                            <button class="primary-button" type="button" data-apply-settings="seller"><i data-lucide="check" aria-hidden="true"></i> Apply Changes</button>
                        </div>
                    </div>

                    <div class="settings-card">
                        <h3>Merchant Profile</h3>
                        <label>Merchant Name<input type="text" data-account-field="storeName" placeholder="Merchant name"></label>
                        <label>Merchant Type<select data-account-field="merchantType"><option>Grocery</option><option>Food</option></select></label>
                        <div class="address-picker-field merchant-address-picker" data-address-picker-field>
                            <label>Merchant Address<input type="text" data-account-field="storeAddress" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input></label>
                            <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                            <input type="hidden" data-address-parts>
                            <small class="field-help" data-address-preview>Choose your real store address in Cebu.</small>
                        </div>
                        <label>Store Status<select data-account-field="storeStatus"><option>Open</option><option>Closed</option></select></label>
                    </div>

                    <div class="settings-card">
                        <h3>Business Hours</h3>
                        <label>Opening Time<input type="time"></label>
                        <label>Closing Time<input type="time"></label>
<div class="day-selector-field">
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
                    </div>

                    <div class="settings-card">
                        <h3>Product Settings</h3>
                        <label>Manage product availability<select><option>Available</option><option>Unavailable</option></select></label>
                        <label>Default product category<input type="text" placeholder="Grocery, Food, Fresh"></label>
                        <label>Low stock alert<input type="number" min="0" placeholder="Quantity"></label>
                    </div>

                    <div class="settings-card">
                        <h3>Order Settings</h3>
                        <label>Accept/Reject orders<select><option>Manual review</option><option>Auto-accept</option></select></label>
                        <label>Preparation time<input type="time" data-account-field="preparationTime"></label>
                        <label>Auto-close merchant if unavailable<select><option>Yes</option><option>No</option></select></label>
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
                    </div>
                    <div class="settings-apply-row">
                        <span class="notice" data-settings-notice></span>
                        <button class="primary-button" type="button" data-apply-settings="seller"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                    </div>
                </article>

                <article class="settings-section account-settings" data-settings-section="rider" hidden>
                    <div class="settings-section-head">
                        <h2>Rider account</h2>
                        <p>Delivery settings unlock only when employment status is active.</p>
                    </div>

                    <div class="settings-card is-wide">
                        <h3>Account Information</h3>
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

                    <div class="settings-card">
                        <h3>Rider Profile</h3>
                        <div class="address-picker-field rider-location-picker" data-address-picker-field>
                            <label>Current Location<input type="text" data-account-field="currentLocation" placeholder="Street, Barangay, City/Municipal, Cebu" autocomplete="street-address" data-address-input></label>
                            <button class="ghost-button" type="button" data-location-picker-open><i data-lucide="map-pin" aria-hidden="true"></i> Choose Location</button>
                            <input type="hidden" data-address-parts>
                            <small class="field-help" data-address-preview>Choose your current rider location in Cebu.</small>
                        </div>
                        <label>Vehicle Type<select data-account-field="vehicleType" disabled aria-readonly="true" class="readonly-registered-field"><option>Motorcycle</option><option>Bicycle</option><option>Car</option></select><small class="field-help">Vehicle type is locked from your rider registration.</small></label>
                    </div>

                    <div class="settings-card">
                        <h3>Availability</h3>
                        <label>Available / Unavailable<select><option>Available</option><option>Unavailable</option></select></label>
                        <label>Current delivery area<input type="text" placeholder="Current delivery area"></label>
                    </div>

                    <div class="settings-card">
                        <h3>Delivery Settings</h3>
                        <label>Maximum active orders<input type="number" min="1" value="1" data-account-field="maxActiveOrders"></label>
                        <label>Delivery status updates<select><option>Manual</option><option>Automatic reminders</option></select></label>
                        <label>Navigation preference<select><option>Google Maps</option><option>Waze</option><option>In-app route</option></select></label>
                    </div>

                    <div class="settings-card">
                        <h3>Application Status</h3>
                        <p data-rider-settings-status>Employment Status: Pending/Active/Inactive</p>
                    </div>

                    <div class="settings-card">
                        <h3>Account Security</h3>
                        <label>Current Password<input type="password" data-password-field="current" placeholder="Current password" maxlength="30" autocomplete="current-password"></label>
                        <label>New Password<input type="password" data-password-field="new" placeholder="New password" minlength="9" maxlength="30" autocomplete="new-password" data-password-rules><small class="password-requirements" data-password-note>Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.</small></label>
                        <label>Confirm New Password<input type="password" data-password-field="confirm" placeholder="Confirm new password" maxlength="30" autocomplete="new-password"></label>
                    </div>
                    <div class="settings-apply-row">
                        <span class="notice" data-settings-notice></span>
                        <button class="primary-button" type="button" data-apply-settings="rider"><i data-lucide="check" aria-hidden="true"></i> Apply</button>
                    </div>
                </article>

                <article class="settings-section website-settings is-current" data-settings-section="website">
                    <div class="settings-section-head">
                        <h2>Settings</h2>
                    </div>

                    <div class="settings-card">
                        <h3>Language Settings</h3>
                        <label>Language<select data-language-setting>
                            <option value="english">English</option>
                            <option value="filipino">Filipino</option>
                            <option value="cebuano">Cebuano/Bisaya</option>
                        </select></label>
                        <label class="check-row"><input type="checkbox" data-language-sticky> Stay this language until next login</label>
                        <div class="settings-language-actions">
                            <span class="notice" data-language-notice></span>
                            <button class="primary-button" type="button" data-apply-language><i data-lucide="languages" aria-hidden="true"></i> Apply Language</button>
                        </div>
                    </div>
                    <div class="settings-logout-row">
                        <button class="ghost-button" type="button" data-logout data-language-logout hidden><i data-lucide="log-out" aria-hidden="true"></i> Logout</button>
                    </div>
                </article>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
