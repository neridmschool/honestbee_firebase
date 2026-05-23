<?php
$pageTitle = 'Dashboard | honestbee';
$activePage = 'customer';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-customer-dashboard>
            <div class="customer-dashboard-layout">
                <aside class="customer-dashboard-nav" aria-label="Customer dashboard navigation">
                    <nav>
                        <a class="is-active" href="#dashboard" data-customer-view-trigger="dashboard" aria-current="page">
                            <i data-lucide="layout-dashboard" aria-hidden="true"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="#stores" data-customer-view-trigger="stores">
                            <i data-lucide="store" aria-hidden="true"></i>
                            <span>Stores</span>
                        </a>
                        <a href="#cart" data-customer-view-trigger="cart">
                            <i data-lucide="shopping-cart" aria-hidden="true"></i>
                            <span>Cart</span>
                            <strong class="customer-nav-count" data-customer-cart-badge hidden>0</strong>
                        </a>
                        <a href="#orders" data-customer-view-trigger="orders">
                            <i data-lucide="receipt-text" aria-hidden="true"></i>
                            <span>Recent Orders</span>
                        </a>
                    </nav>
                </aside>

                <section class="customer-dashboard-content">
                    <section class="customer-view-panel is-active" data-customer-view-panel="dashboard" id="dashboard">
                        <div class="dashboard-shell single">
                            <div class="dashboard-panel wide">
                                <div class="dashboard-heading">
                                    <div>
                                        <h2>Current order</h2>
                                    </div>
                                </div>
                                <div class="dashboard-list" data-customer-active-order>
                                    <div class="empty-state">Loading current order...</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="customer-view-panel" data-customer-view-panel="stores" id="stores" hidden>
                        <div class="dashboard-shell single">
                            <div class="dashboard-panel wide">
                                <div class="customer-store-list" data-customer-store-list>
                                    <div class="dashboard-heading">
                                        <div>
                                            <h2>Shop stores</h2>
                                        </div>
                                    </div>
                                    <div class="customer-store-grid">
                                        <?php foreach ($storeCatalogs as $storeId => $store): ?>
                                            <button class="customer-store-card" type="button" data-customer-store-id="<?php echo htmlspecialchars($storeId); ?>">
                                                <span class="store-logo-badge" style="--store-theme: <?php echo htmlspecialchars($store['theme']); ?>">
                                                    <?php if (!empty($store['logoImage'])): ?>
                                                        <img src="<?php echo htmlspecialchars($store['logoImage']); ?>" alt="<?php echo htmlspecialchars($store['name']); ?> logo" loading="lazy">
                                                    <?php else: ?>
                                                        <?php echo htmlspecialchars($store['logo'] ?? strtoupper(substr($store['name'], 0, 2))); ?>
                                                    <?php endif; ?>
                                                </span>
                                                <span>
                                                    <strong><?php echo htmlspecialchars($store['name']); ?></strong>
                                                    <small><?php echo htmlspecialchars($store['type']); ?> &middot; <?php echo htmlspecialchars($store['eta']); ?></small>
                                                </span>
                                            </button>
                                        <?php endforeach; ?>
                                    </div>
                                </div>

                                <div class="customer-store-menu" data-customer-store-menu hidden>
                                    <div class="customer-store-menu-head">
                                        <button class="ghost-button" type="button" data-customer-store-back>
                                            <i data-lucide="arrow-left" aria-hidden="true"></i> Back
                                        </button>
                                        <div>
                                            <h2 data-customer-store-title>Store products</h2>
                                            <p data-customer-store-meta></p>
                                        </div>
                                    </div>
                                    <div class="customer-store-menu-summary">
                                        <span data-customer-store-count>0 products</span>
                                        <span data-customer-store-eta></span>
                                    </div>
                                    <div class="customer-store-menu-layout">
                                        <aside class="customer-store-categories" aria-label="Store categories" data-customer-store-categories></aside>
                                        <div class="customer-store-products" data-customer-store-products></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="customer-view-panel" data-customer-view-panel="cart" id="cart" hidden>
                        <div class="dashboard-shell single">
                            <div class="dashboard-panel wide">
                                <div class="customer-cart-layout">
                                    <section class="customer-cart-main" aria-label="Cart items">
                                        <div class="dashboard-heading">
                                            <div>
                                                <h2>Your cart</h2>
                                            </div>
                                            <a class="ghost-button" href="#stores" data-customer-view-trigger="stores">
                                                <i data-lucide="store" aria-hidden="true"></i> Continue shopping
                                            </a>
                                        </div>
                                        <div class="customer-cart-list" data-customer-cart-list>
                                            <div class="empty-state">Your cart is empty.</div>
                                        </div>
                                    </section>

                                    <aside class="customer-cart-summary" aria-label="Cart summary">
                                        <h3>Order summary</h3>
                                        <div class="customer-summary-rows">
                                            <div><span>Subtotal</span><strong data-customer-cart-subtotal>PHP 0.00</strong></div>
                                            <div><span>Delivery</span><strong data-customer-cart-delivery>PHP 0.00</strong></div>
                                            <div><span>Service fee</span><strong data-customer-cart-service>PHP 0.00</strong></div>
                                            <div class="total"><span>Total</span><strong data-customer-cart-total>PHP 0.00</strong></div>
                                        </div>

                                        <form class="customer-checkout-form" data-customer-checkout-form>
                                            <div class="checkout-fields">
                                                <input type="text" name="name" placeholder="Customer name" autocomplete="name" required>
                                                <input type="email" name="email" placeholder="Customer email" autocomplete="email" required>
                                                <input type="tel" name="phone" placeholder="09171234567" autocomplete="tel" inputmode="numeric" maxlength="11" pattern="\d{11}" title="Enter exactly 11 digits" required>
                                                <input type="text" name="address" placeholder="Delivery address" required>
                                                <input type="datetime-local" name="time" aria-label="Delivery time" required>
                                                <select name="payment" data-customer-payment-method required>
                                                    <option value="">Select payment</option>
                                                    <option>Cash on delivery</option>
                                                    <option>Card</option>
                                                    <option>GCash</option>
                                                </select>
                                                <div class="card-details" data-customer-card-details hidden>
                                                    <div class="card-details-head">
                                                        <strong>Card details</strong>
                                                        <span>Used for this checkout only.</span>
                                                    </div>
                                                    <label>Cardholder Name<input type="text" name="cardName" autocomplete="cc-name" disabled></label>
                                                    <label>Card Number<input type="text" name="cardNumber" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="1234 5678 9012 3456" data-card-number disabled></label>
                                                    <div class="card-details-row">
                                                        <label>Expiry<input type="text" name="cardExpiry" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/YY" data-card-expiry disabled></label>
                                                        <label>CVC<input type="password" name="cardCvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="123" data-card-cvc disabled></label>
                                                    </div>
                                                </div>
                                                <div class="card-details gcash-details" data-customer-gcash-details hidden>
                                                    <div class="card-details-head">
                                                        <strong>GCash payment</strong>
                                                        <span>Used for this checkout only.</span>
                                                    </div>
                                                    <label>Enter GCash Reference Number:<input type="text" name="gcashReference" inputmode="numeric" pattern="\d*" autocomplete="off" data-gcash-reference disabled></label>
                                                    <label>Upload Proof of Payment:<input type="file" name="gcashProof" accept="image/*" data-image-upload disabled></label>
                                                </div>
                                            </div>

                                            <div class="checkout-confirm" data-customer-checkout-confirm hidden>
                                                <strong>Place this order?</strong>
                                                <span>Review the cart and delivery details before confirming.</span>
                                                <div class="confirm-actions">
                                                    <button class="primary-button" type="button" data-customer-checkout-confirm-yes>
                                                        <i data-lucide="check" aria-hidden="true"></i> Yes
                                                    </button>
                                                    <button class="ghost-button" type="button" data-customer-checkout-confirm-no>
                                                        <i data-lucide="x" aria-hidden="true"></i> No
                                                    </button>
                                                </div>
                                            </div>

                                            <button class="primary-button customer-checkout-button" type="submit" data-customer-checkout-submit>
                                                <i data-lucide="send" aria-hidden="true"></i> Checkout
                                            </button>
                                            <div class="notice" data-customer-cart-notice></div>
                                        </form>

                                        <div class="checkout-success customer-checkout-success" data-customer-checkout-success role="status" aria-live="polite" hidden>
                                            <span class="checkout-success-icon"><i data-lucide="check" aria-hidden="true"></i></span>
                                            <h3>Order checked out successfully</h3>
                                            <p><span>Your order</span> <strong data-customer-checkout-success-id></strong> <span>has been sent to the merchant.</span></p>
                                            <a class="primary-button" href="#orders" data-customer-checkout-track>
                                                <i data-lucide="receipt-text" aria-hidden="true"></i> View order details
                                            </a>
                                        </div>
                                    </aside>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="customer-view-panel" data-customer-view-panel="orders" id="orders" hidden>
                        <div class="dashboard-shell single">
                            <div class="dashboard-panel wide">
                                <div class="dashboard-heading">
                                    <div>
                                        <h2>Recent orders</h2>
                                    </div>
                                </div>
                                <div class="dashboard-list customer-order-list" data-customer-orders>
                                    <div class="empty-state">Loading orders...</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>
            </div>

            <div class="customer-order-modal-backdrop" data-customer-order-modal hidden aria-hidden="true">
                <section class="customer-order-modal" role="dialog" aria-modal="true" aria-labelledby="customerOrderModalTitle" tabindex="-1">
                    <button class="modal-close-x customer-order-modal-close" type="button" data-customer-order-modal-close aria-label="Close order details">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                    <div class="customer-order-modal-content" data-customer-order-modal-content>
                        <div class="empty-state">Loading order details...</div>
                    </div>
                </section>
            </div>

            <div class="customer-product-modal-backdrop" data-customer-product-modal hidden aria-hidden="true">
                <section class="customer-product-modal" role="dialog" aria-modal="true" aria-labelledby="customerProductModalTitle" tabindex="-1">
                    <button class="modal-close-x customer-product-modal-close" type="button" data-customer-product-modal-close aria-label="Close product details">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                    <div class="customer-product-modal-media">
                        <img src="assets/img/offline/default product logo.png" alt="" data-customer-product-modal-image>
                    </div>
                    <div class="customer-product-modal-body">
                        <div>
                            <h2 id="customerProductModalTitle" data-customer-product-modal-name>Product</h2>
                            <p data-customer-product-modal-meta></p>
                        </div>
                        <div class="customer-product-modal-price">
                            <span>Unit price</span>
                            <strong data-customer-product-modal-price>PHP 0.00</strong>
                        </div>
                        <label class="customer-product-modal-note">
                            Notes for shopper
                            <textarea data-customer-product-modal-instructions placeholder="Optional"></textarea>
                        </label>
                        <div class="customer-product-modal-footer">
                            <div class="customer-modal-qty" aria-label="Product quantity">
                                <button type="button" data-customer-product-modal-decrease aria-label="Decrease quantity">-</button>
                                <span data-customer-product-modal-quantity>1</span>
                                <button type="button" data-customer-product-modal-increase aria-label="Increase quantity">+</button>
                            </div>
                            <div class="customer-modal-total">
                                <span>Total</span>
                                <strong data-customer-product-modal-total>PHP 0.00</strong>
                            </div>
                        </div>
                        <button class="primary-button customer-product-modal-add" type="button" data-customer-product-modal-add>
                            <i data-lucide="shopping-cart" aria-hidden="true"></i> Add to Cart
                        </button>
                    </div>
                </section>
            </div>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
