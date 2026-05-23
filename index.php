<?php
$pageTitle = 'honestbee';
$activePage = 'home';
require __DIR__ . '/includes/header.php';

$products = $defaultProducts;
?>
        <style>
            #home.home-scroll-screen {
                background: var(--paper);
                color: var(--ink);
            }

            #home.home-scroll-screen.screen.is-active {
                display: block;
            }

            #home .home-hero-panel {
                min-height: 530px;
            }

            #stores.home-store-stack,
            #deals.home-deal-stack {
                scroll-margin-top: 98px;
            }

            #stores.home-store-stack .logo-wall {
                margin-bottom: 34px;
            }

            #stores.home-store-stack .promo-strip {
                margin-bottom: 0;
            }

            html.store-only-view #home .home-hero-panel,
            html.store-only-view #deals.home-deal-stack,
            html.store-only-view #home .home-extra-section,
            html.store-only-view #stores.home-store-stack .promo-strip {
                display: none;
            }

            html.store-only-view #stores.home-store-stack {
                min-height: calc(100vh - 98px);
                padding-top: 42px;
            }

            .home-extra-section {
                border-top: 1px solid rgba(23, 23, 23, 0.08);
                background: #fffdf8;
            }

            .home-extra-section.alt {
                background: #f7f1e6;
            }

            .home-info-grid,
            .home-category-grid,
            .home-area-grid,
            .home-faq-grid {
                display: grid;
                gap: 16px;
            }

            .home-info-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .home-category-grid {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .home-area-grid,
            .home-faq-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                align-items: start;
            }

            .home-info-card,
            .home-category-card,
            .home-area-card,
            .home-faq-grid details {
                min-width: 0;
                border: 1px solid var(--line);
                border-radius: 8px;
                background: #fff;
                box-shadow: var(--soft-shadow);
                transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
            }

            .home-info-card {
                padding: 24px;
            }

            .home-info-card span,
            .home-category-icon {
                width: 48px;
                height: 48px;
                display: grid;
                place-items: center;
                margin-bottom: 16px;
                border-radius: 8px;
                background: var(--bee-yellow);
                color: var(--charcoal);
            }

            .home-info-card svg,
            .home-category-icon svg {
                width: 24px;
                height: 24px;
            }

            .home-info-card h3,
            .home-category-card h3,
            .home-area-card h3 {
                margin-bottom: 8px;
                font-size: 1.08rem;
            }

            .home-info-card p,
            .home-category-card p,
            .home-area-card p,
            .home-faq-grid p {
                margin-bottom: 0;
                color: var(--muted);
            }

            .home-category-card {
                min-height: 172px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                color: inherit;
                text-decoration: none;
                cursor: pointer;
                transition: background 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
            }

            .home-category-card:hover {
                border-color: rgba(30, 122, 88, 0.52);
                box-shadow: var(--soft-shadow);
                background: #fffdf4;
            }

            .home-category-card:focus-visible {
                outline: 3px solid rgba(30, 122, 88, 0.28);
                outline-offset: 3px;
            }

            .home-category-card.is-active-category {
                border-color: rgba(30, 122, 88, 0.56);
                background: #f2fbf5;
                box-shadow: inset 0 0 0 2px rgba(30, 122, 88, 0.08), var(--soft-shadow);
            }

            .home-category-card.is-active-category .home-category-icon {
                background: var(--leaf);
                color: #fff;
            }

            .home-category-action {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: auto;
                padding-top: 16px;
                color: var(--leaf);
                font-weight: 900;
                font-size: 0.92rem;
            }

            .home-category-action svg {
                width: 16px;
                height: 16px;
            }

            .home-area-card {
                padding: 24px;
            }

            .home-area-list {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 16px;
            }

            .home-area-list span {
                padding: 8px 11px;
                border: 1px solid rgba(30, 122, 88, 0.22);
                border-radius: 999px;
                background: #f0fbf4;
                color: #14543c;
                font-size: 0.9rem;
                font-weight: 800;
            }

            .home-faq-grid details {
                padding: 18px 20px;
                overflow: hidden;
            }

            .home-faq-grid summary {
                cursor: pointer;
                font-weight: 900;
                color: var(--charcoal);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                list-style: none;
            }

            .home-faq-grid summary::-webkit-details-marker {
                display: none;
            }

            .home-faq-grid summary::after {
                content: "+";
                width: 26px;
                height: 26px;
                flex: 0 0 26px;
                display: grid;
                place-items: center;
                border: 1px solid rgba(23, 23, 23, 0.14);
                border-radius: 6px;
                background: #fff8dc;
                color: var(--charcoal);
                font-weight: 900;
                line-height: 1;
            }

            .home-faq-grid details[open] {
                border-color: rgba(30, 122, 88, 0.36);
                background: #fffdf4;
                box-shadow: var(--soft-shadow);
            }

            .home-faq-grid details[open] summary::after {
                content: "-";
                border-color: var(--leaf);
                background: var(--leaf);
                color: #fff;
            }

            .home-faq-grid p {
                padding-top: 10px;
            }

            .home-faq-grid details[open] p {
                animation: faq-answer-in 180ms ease both;
            }

            @keyframes faq-answer-in {
                from {
                    opacity: 0;
                    transform: translateY(4px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            html.theme-dark #home.home-scroll-screen,
            html.theme-dark .home-extra-section {
                background: var(--paper);
            }

            html.theme-dark .home-extra-section.alt {
                background: var(--cream);
            }

            html.theme-dark .home-info-card,
            html.theme-dark .home-category-card,
            html.theme-dark .home-area-card,
            html.theme-dark .home-faq-grid details {
                background: var(--white);
                border-color: var(--line);
            }

            html.theme-dark .home-category-card:hover,
            html.theme-dark .home-category-card.is-active-category,
            html.theme-dark .home-faq-grid details[open] {
                background: #344029;
                border-color: rgba(255, 211, 49, 0.34);
            }

            @media (max-width: 1060px) {
                .home-info-grid,
                .home-category-grid,
                .home-area-grid,
                .home-faq-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 720px) {
                .home-info-grid,
                .home-category-grid,
                .home-area-grid,
                .home-faq-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        <main id="top" data-storefront>
            <section class="home-scroll-screen screen is-active" id="home" data-screen="home" aria-label="honestbee web storefront">
                <div class="hero home-hero-panel" data-home-feature="hero">
                    <div class="hero-inner">
                        <div class="availability-card">
                            <h1>get groceries <em>fast</em></h1>
                            <div class="service-icons">
                                <div>
                                    <span><i data-lucide="store" aria-hidden="true"></i></span>
                                    <p>Over 15,000 products from your favourite merchants</p>
                                </div>
                                <div>
                                    <span><i data-lucide="truck" aria-hidden="true"></i></span>
                                    <p>Enjoy same day delivery in one hour</p>
                                </div>
                                <div>
                                    <span><i data-lucide="user-check" aria-hidden="true"></i></span>
                                    <p>Trained shoppers handpick products for top quality</p>
                                </div>
                            </div>
                            <div class="free-bubble">
                                <strong>FREE DELIVERY</strong>
                                for first order above PHP 500
                            </div>
                        </div>
                    </div>
                </div>

                <section class="store-showcase home-store-stack" id="stores" data-home-feature="stores" aria-label="Partner merchant showcase">
                    <div class="availability-summary" data-availability-summary data-seller-hidden hidden>
                        <strong data-availability-title>Merchants available for your area</strong>
                        <span data-availability-detail>Select a partner merchant to start shopping.</span>
                    </div>
                    <div class="logo-wall" data-seller-hidden>
                        <?php foreach ($storeCatalogs as $storeId => $store): ?>
                            <a class="logo-tile<?php echo $storeId === 'metro-ayala-cebu' ? ' is-active' : ''; ?>" href="customer-dashboard.php?store=<?php echo rawurlencode($storeId); ?>#stores" data-customer-store-link data-store-id="<?php echo htmlspecialchars($storeId); ?>">
                                <span class="store-logo-badge" style="--store-theme: <?php echo htmlspecialchars($store['theme']); ?>">
                                    <?php if (!empty($store['logoImage'])): ?>
                                        <img src="<?php echo htmlspecialchars($store['logoImage']); ?>" alt="<?php echo htmlspecialchars($store['name']); ?> logo" loading="lazy">
                                    <?php else: ?>
                                        <?php echo htmlspecialchars($store['logo'] ?? strtoupper(substr($store['name'], 0, 2))); ?>
                                    <?php endif; ?>
                                </span>
                                <span><?php echo htmlspecialchars($store['name']); ?></span>
                                <small><?php echo htmlspecialchars($store['type']); ?></small>
                            </a>
                        <?php endforeach; ?>
                    </div>
                    <div class="promo-strip" data-home-feature="promo">
                        <div class="promo-copy">
                            <h2>Shop and Save!</h2>
                            <p>New customers: PHP 300 OFF / Code BEEHSBC30<br>Existing customers: PHP 200 OFF / Code BEEHSBC20</p>
                            <a class="primary-button" href="#shop" data-screen-target="shop" data-seller-hidden>Shop now</a>
                            <small>Coupons are limited to the first 5000 redemptions.</small>
                        </div>
                        <div class="promo-image" aria-hidden="true"></div>
                    </div>
                </section>

                <section class="section home-deal-stack" id="deals" data-home-feature="promo">
                    <div class="section-inner">
                        <div class="section-heading">
                            <div>
                                <h2>Deals for today</h2>
                                <p>Promotions are grouped for grocery baskets, lunch orders, and scheduled delivery.</p>
                            </div>
                        </div>
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

                <section class="section home-extra-section" aria-label="How honestbee works">
                    <div class="section-inner">
                        <div class="section-heading">
                            <div>
                                <h2>How it works</h2>
                                <p>Order from nearby groceries, kitchens, and specialty shops in a few simple steps.</p>
                            </div>
                        </div>
                        <div class="home-info-grid">
                            <article class="home-info-card">
                                <span><i data-lucide="map-pin" aria-hidden="true"></i></span>
                                <h3>Choose your area</h3>
                                <p>Shop from partner merchants available around Cebu and nearby delivery zones.</p>
                            </article>
                            <article class="home-info-card">
                                <span><i data-lucide="shopping-bag" aria-hidden="true"></i></span>
                                <h3>Build your basket</h3>
                                <p>Add groceries, ready-to-eat meals, pet needs, and pantry essentials from one merchant.</p>
                            </article>
                            <article class="home-info-card">
                                <span><i data-lucide="bike" aria-hidden="true"></i></span>
                                <h3>Receive your order</h3>
                                <p>A shopper prepares your items and a rider delivers them during your selected window.</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section class="section home-extra-section alt" aria-label="Popular grocery and food categories" data-seller-hidden>
                    <div class="section-inner">
                        <div class="section-heading">
                            <div>
                                <h2>Popular categories</h2>
                                <p>Useful shortcuts for the usual food and grocery delivery needs.</p>
                            </div>
                        </div>
                        <div class="home-category-grid">
                            <a class="home-category-card" href="#stores" data-store-category-filter="fresh-produce" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="apple" aria-hidden="true"></i></span>
                                <h3>Fresh produce</h3>
                                <p>Fruits, vegetables, herbs, and salad ingredients.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="meat-seafood" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="beef" aria-hidden="true"></i></span>
                                <h3>Meat and seafood</h3>
                                <p>Fresh cuts, frozen packs, fish, shrimp, and chicken.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="bakery" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="croissant" aria-hidden="true"></i></span>
                                <h3>Bakery</h3>
                                <p>Bread, pastries, cakes, and breakfast favorites.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="pantry" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="cooking-pot" aria-hidden="true"></i></span>
                                <h3>Pantry staples</h3>
                                <p>Rice, noodles, canned goods, sauces, and condiments.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="drinks" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="coffee" aria-hidden="true"></i></span>
                                <h3>Drinks</h3>
                                <p>Coffee, juice, soda, water, tea, and milk.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="frozen-food" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="snowflake" aria-hidden="true"></i></span>
                                <h3>Frozen food</h3>
                                <p>Frozen meals, ice cream, dumplings, and quick-cook items.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="ready-meals" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="utensils" aria-hidden="true"></i></span>
                                <h3>Ready meals</h3>
                                <p>Lunch sets, snacks, desserts, and family trays.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                            <a class="home-category-card" href="#stores" data-store-category-filter="pet-essentials" data-screen-target="stores">
                                <span class="home-category-icon"><i data-lucide="paw-print" aria-hidden="true"></i></span>
                                <h3>Pet essentials</h3>
                                <p>Pet food, treats, grooming items, and litter supplies.</p>
                                <span class="home-category-action">Browse <i data-lucide="arrow-right" aria-hidden="true"></i></span>
                            </a>
                        </div>
                    </div>
                </section>

                <section class="section home-extra-section" aria-label="Delivery areas and payment options">
                    <div class="section-inner">
                        <div class="section-heading">
                            <div>
                                <h2>Delivery made for Cebu</h2>
                                <p>Plan your groceries around home, school, work, or family errands.</p>
                            </div>
                        </div>
                        <div class="home-area-grid">
                            <article class="home-area-card">
                                <h3>Covered areas</h3>
                                <p>Availability depends on merchant coverage, but honestbee focuses on Cebu delivery zones.</p>
                                <div class="home-area-list" aria-label="Sample delivery areas">
                                    <span>Cebu City</span>
                                    <span>Mandaue</span>
                                    <span>Lapu-Lapu</span>
                                    <span>Talisay</span>
                                    <span>Consolacion</span>
                                </div>
                            </article>
                            <article class="home-area-card">
                                <h3>Flexible checkout</h3>
                                <p>Choose a delivery time, add shopper instructions, and pay using cash on delivery, card, or GCash. If an item is out of stock, you can allow suggestions or reject substitutes.</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section class="section home-extra-section alt" aria-label="Frequently asked questions">
                    <div class="section-inner">
                        <div class="section-heading">
                            <div>
                                <h2>Common questions</h2>
                                <p>Quick answers for first-time grocery and food delivery customers.</p>
                            </div>
                        </div>
                        <div class="home-faq-grid">
                            <details>
                                <summary>How fast can I receive my order?</summary>
                                <p>Some merchants support same-day delivery, with available time windows shown during shopping and checkout.</p>
                            </details>
                            <details>
                                <summary>Can I choose substitutes?</summary>
                                <p>Yes. During product review, you can let the shopper suggest a substitute, choose one yourself, or request no substitute.</p>
                            </details>
                            <details>
                                <summary>Is delivery free?</summary>
                                <p>First orders above PHP 500 can unlock free delivery when the promotion applies.</p>
                            </details>
                            <details>
                                <summary>Can I track my order?</summary>
                                <p>After checkout, customers can open order tracking to follow the current delivery status.</p>
                            </details>
                        </div>
                    </div>
                </section>
            </section>

            <section class="section screen" id="shop" data-screen="shop" data-shopping-only data-home-feature="products">
                <div class="section-inner">
                    <div class="merchant-masthead">
                        <h2 data-merchant-title>Metro Supermarket Ayala Cebu</h2>
                        <label class="merchant-search" for="searchInput">
                            <input id="searchInput" type="search" placeholder="Search Metro Supermarket Ayala Cebu..." autocomplete="off" data-merchant-search>
                            <i data-lucide="search" aria-hidden="true"></i>
                        </label>
                    </div>
                    <div class="merchant-info">
                        <span><i data-lucide="check-circle" aria-hidden="true"></i> Same listed price</span>
                        <span><i data-lucide="clock" aria-hidden="true"></i> Earliest delivery: Today, 2pm to 3pm</span>
                    </div>
                    <div class="section-heading">
                        <div>
                            <h2>Bestsellers</h2>
                            <p>Browse groceries, food, and partner merchant products in the compact honestbee catalog style.</p>
                        </div>
                    </div>

                    <div class="toolbar">
                        <div class="segment" role="group" aria-label="Product type filter">
                            <button class="is-active" type="button" data-type-filter="all">All</button>
                            <button type="button" data-type-filter="grocery">Groceries</button>
                            <button type="button" data-type-filter="food">Food</button>
                        </div>
                    </div>

                    <div class="chip-row" aria-label="Category filter" data-category-chips>
                        <button class="chip is-active" type="button" data-category-filter="all">All</button>
                        <?php foreach ($initialShopCategories as $category): ?>
                            <button class="chip" type="button" data-category-filter="<?php echo htmlspecialchars(strtolower($category)); ?>">
                                <?php echo htmlspecialchars($category); ?>
                            </button>
                        <?php endforeach; ?>
                    </div>

                    <div class="shop-layout">
                        <aside class="catalog-sidebar" aria-label="Merchant categories" data-category-sidebar>
                            <button class="is-active" type="button" data-category-filter="all">Home</button>
                            <?php foreach ($initialShopCategories as $category): ?>
                                <button type="button" data-category-filter="<?php echo htmlspecialchars(strtolower($category)); ?>">
                                    <?php echo htmlspecialchars($category); ?>
                                </button>
                            <?php endforeach; ?>
                        </aside>
                        <div class="catalog-main">
                            <div class="product-grid" data-product-grid>
                                <?php foreach ($products as $product): ?>
                                    <article
                                        class="product-card"
                                        data-product-card
                                        data-type="<?php echo htmlspecialchars($product['type']); ?>"
                                        data-category="<?php echo htmlspecialchars(strtolower($product['category'])); ?>"
                                        data-search="<?php echo htmlspecialchars(strtolower($product['name'] . ' ' . $product['merchant'] . ' ' . $product['category'])); ?>"
                                        data-open-product
                                        data-id="<?php echo htmlspecialchars($product['id']); ?>"
                                        data-name="<?php echo htmlspecialchars($product['name']); ?>"
                                        data-price="<?php echo htmlspecialchars($product['price']); ?>"
                                        data-merchant="<?php echo htmlspecialchars($product['merchant']); ?>"
                                        data-image="<?php echo htmlspecialchars($product['image']); ?>"
                                        data-alt="<?php echo htmlspecialchars($product['alt']); ?>"
                                        data-unit="<?php echo htmlspecialchars($product['unit']); ?>"
                                    >
                                        <div class="product-media">
                                            <img src="<?php echo htmlspecialchars($product['image']); ?>" alt="<?php echo htmlspecialchars($product['alt']); ?>" loading="eager" decoding="async">
                                            <span class="pill"><?php echo htmlspecialchars($product['tag']); ?></span>
                                        </div>
                                        <div class="product-body">
                                            <div class="product-title-row">
                                                <div>
                                                    <h3><?php echo htmlspecialchars($product['name']); ?></h3>
                                                    <p class="merchant"><?php echo htmlspecialchars($product['merchant']); ?></p>
                                                </div>
                                                <span class="rating"><i data-lucide="star" aria-hidden="true"></i><?php echo htmlspecialchars($product['rating']); ?></span>
                                            </div>
                                            <div class="product-actions">
                                                <span class="price"><?php echo money($product['price']); ?></span>
                                                <button class="guest-add-cart-button" type="button" data-guest-add-cart>
                                                    <i data-lucide="shopping-cart" aria-hidden="true"></i> Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                <?php endforeach; ?>
                            </div>
                            <div class="no-results" data-no-results>No matching items found.</div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section alt screen" id="restaurants" data-screen="restaurants" data-shopping-only data-home-feature="stores">
                <div class="section-inner">
                    <div class="section-heading">
                        <div>
                            <h2>Partner merchants and kitchens</h2>
                            <p>Grocery partners and restaurant counters with clear delivery times, fresh picks, and ready-to-eat meals.</p>
                        </div>
                    </div>
                    <div class="store-grid">
                        <?php foreach ($storeCatalogs as $storeId => $store): ?>
                            <a class="store-card<?php echo $storeId === 'metro-ayala-cebu' ? ' is-active' : ''; ?>" href="customer-dashboard.php?store=<?php echo rawurlencode($storeId); ?>#stores" data-customer-store-link data-store-id="<?php echo htmlspecialchars($storeId); ?>">
                                <?php $storeIcon = $store['type'] === 'Food' ? 'utensils' : (in_array($store['type'], ['Pet Store', 'Pet Supplies'], true) ? 'paw-print' : 'shopping-basket'); ?>
                                <div>
                                    <span class="store-type">
                                        <i data-lucide="<?php echo htmlspecialchars($storeIcon); ?>" aria-hidden="true"></i>
                                        <?php echo htmlspecialchars($store['type']); ?>
                                    </span>
                                    <div class="store-card-title">
                                        <span class="store-logo-badge" style="--store-theme: <?php echo htmlspecialchars($store['theme']); ?>">
                                            <?php if (!empty($store['logoImage'])): ?>
                                                <img src="<?php echo htmlspecialchars($store['logoImage']); ?>" alt="<?php echo htmlspecialchars($store['name']); ?> logo" loading="lazy">
                                            <?php else: ?>
                                                <?php echo htmlspecialchars($store['logo'] ?? strtoupper(substr($store['name'], 0, 2))); ?>
                                            <?php endif; ?>
                                        </span>
                                        <h3><?php echo htmlspecialchars($store['name']); ?></h3>
                                    </div>
                                    <p><?php echo htmlspecialchars($store['meta']); ?></p>
                                </div>
                                <strong class="eta"><?php echo htmlspecialchars($store['eta']); ?></strong>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </section>

        </main>

        <script>
            (() => {
                const query = new URLSearchParams(window.location.search);
                let storeOnlyView = query.get('view') === 'stores';
                const homeScrollTargets = new Set(['stores', 'deals']);
                const categoryFilters = {
                    'fresh-produce': {
                        label: 'Fresh produce',
                        detail: 'fruits, vegetables, herbs, and salad ingredients',
                        keywords: ['fresh produce', 'produce', 'fruits', 'fruit', 'vegetables', 'vegetable', 'salad', 'lettuce', 'romaine', 'mango', 'mangoes', 'apple', 'apples', 'tomato', 'tomatoes', 'banana', 'okra', 'coconut'],
                        excludedKeywords: ['dried', 'pasalubong']
                    },
                    'meat-seafood': {
                        label: 'Meat and seafood',
                        detail: 'fresh cuts, frozen packs, fish, shrimp, and chicken',
                        keywords: ['meat', 'seafood', 'fish', 'shellfish', 'squid', 'crab', 'shrimp', 'tuna', 'salmon', 'chicken', 'pork', 'beef', 'steak', 'liempo', 'galunggong', 'bangus', 'mussels'],
                        excludedKeywords: ['pet', 'dog', 'cat', 'treats', 'meal', 'sandwich', 'food to go']
                    },
                    bakery: {
                        label: 'Bakery',
                        detail: 'bread, pastries, cakes, and breakfast favorites',
                        keywords: ['bakery', 'bread', 'pastries', 'pastry', 'cakes', 'cake', 'croissant', 'muffin', 'muffins', 'pandesal', 'loaf', 'sourdough', 'baguette', 'cheesecake', 'brownie', 'pie', 'mamon', 'ensaymada', 'otap']
                    },
                    pantry: {
                        label: 'Pantry staples',
                        detail: 'rice, noodles, canned goods, sauces, and condiments',
                        keywords: ['pantry', 'rice', 'staples', 'staple', 'noodles', 'canned', 'canned goods', 'sauce', 'sauces', 'condiments', 'pasta', 'cooking oil', 'sardines', 'dried goods', 'spices']
                    },
                    drinks: {
                        label: 'Drinks',
                        detail: 'coffee, juice, soda, water, tea, and milk',
                        keywords: ['drinks', 'drink', 'beverages', 'beverage', 'coffee', 'juice', 'tea', 'milk', 'water', 'latte', 'cold brew', 'sparkling', 'iced tea']
                    },
                    'frozen-food': {
                        label: 'Frozen food',
                        detail: 'frozen meals, ice cream, dumplings, and quick-cook items',
                        keywords: ['frozen', 'ice cream', 'fries', 'hotdog', 'hotdogs', 'dumplings']
                    },
                    'ready-meals': {
                        label: 'Ready meals',
                        detail: 'lunch sets, snacks, desserts, and family trays',
                        keywords: ['food to go', 'meals', 'meal', 'ready', 'lunch', 'sandwich', 'pizza', 'snacks', 'snack', 'desserts', 'dessert', 'family tray', 'kinilaw', 'chicken rice']
                    },
                    'pet-essentials': {
                        label: 'Pet essentials',
                        detail: 'pet food, treats, grooming items, and litter supplies',
                        keywords: ['pet', 'pet care', 'dog', 'cat', 'dog food', 'cat food', 'grooming', 'litter', 'leash', 'treats', 'accessories', 'vitamins', 'health']
                    }
                };
                let activeStoreCategory = query.get('category') || '';

                if (storeOnlyView) {
                    document.documentElement.classList.add('store-only-view');
                }

                function storeOnlyUrl(categoryKey = '') {
                    const params = new URLSearchParams({ view: 'stores' });

                    if (categoryKey) {
                        params.set('category', categoryKey);
                    }

                    return `${window.location.pathname}?${params.toString()}#stores`;
                }

                function syncDealsNavigation() {
                    document.querySelectorAll('.nav-links a').forEach((link) => {
                        const href = link.getAttribute('href') || '';
                        const isDealsLink = href.includes('#deals') || href.includes('deals.php');

                        if (!isDealsLink) {
                            return;
                        }

                        link.href = 'deals.php';
                        delete link.dataset.screenTarget;
                    });
                }

                syncDealsNavigation();

                function normalizedText(value) {
                    return String(value || '').toLowerCase();
                }

                function escapePattern(value) {
                    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }

                function hasKeyword(text, keyword) {
                    return new RegExp(`(^|[^a-z0-9])${escapePattern(keyword)}([^a-z0-9]|$)`, 'i').test(text);
                }

                function itemSearchText(item) {
                    return [
                        item?.name,
                        item?.type,
                        item?.meta,
                        item?.category,
                        item?.tag,
                        item?.alt
                    ].map(normalizedText).join(' ');
                }

                function storeMatchesCategory(store, filter) {
                    if (!filter) {
                        return true;
                    }

                    if (filter === categoryFilters['pet-essentials'] && ['Pet Store', 'Pet Supplies'].includes(store?.type)) {
                        return true;
                    }

                    const storeText = itemSearchText(store);
                    if (filter.keywords.some((keyword) => hasKeyword(storeText, keyword))) {
                        return true;
                    }

                    return (store?.products || []).some((product) => {
                        const productText = itemSearchText(product);
                        const isExcluded = (filter.excludedKeywords || []).some((keyword) => hasKeyword(productText, keyword));

                        return !isExcluded && filter.keywords.some((keyword) => hasKeyword(productText, keyword));
                    });
                }

                function setStoreCategoryFilter(categoryKey = '') {
                    const filter = categoryFilters[categoryKey] || null;
                    const catalogs = window.honestbeeData?.storeCatalogs || {};
                    const storeEntries = Object.entries(catalogs);
                    const matchingStoreIds = new Set(
                        filter
                            ? storeEntries
                                .filter(([, store]) => storeMatchesCategory(store, filter))
                                .map(([storeId]) => storeId)
                            : storeEntries.map(([storeId]) => storeId)
                    );
                    const storeTiles = [...document.querySelectorAll('#stores [data-store-id]')];
                    const visibleStoreNames = [];

                    activeStoreCategory = filter ? categoryKey : '';
                    document.querySelectorAll('[data-store-category-filter]').forEach((card) => {
                        card.classList.toggle('is-active-category', card.dataset.storeCategoryFilter === activeStoreCategory);
                    });

                    if (filter && storeEntries.length === 0) {
                        return;
                    }

                    storeTiles.forEach((tile) => {
                        const storeId = tile.dataset.storeId;
                        const isVisible = !filter || matchingStoreIds.has(storeId);
                        tile.hidden = !isVisible;

                        if (isVisible && catalogs[storeId]) {
                            visibleStoreNames.push(catalogs[storeId].name);
                        }
                    });

                    const summary = document.querySelector('[data-availability-summary]');
                    const title = document.querySelector('[data-availability-title]');
                    const detail = document.querySelector('[data-availability-detail]');

                    if (!summary || !title || !detail) {
                        return;
                    }

                    if (!filter) {
                        summary.hidden = true;
                        return;
                    }

                    summary.hidden = false;
                    title.textContent = `${filter.label} merchants`;
                    detail.textContent = visibleStoreNames.length > 0
                        ? `${visibleStoreNames.length} partner ${visibleStoreNames.length === 1 ? 'merchant' : 'merchants'} found for ${filter.detail}: ${visibleStoreNames.join(', ')}.`
                        : `No partner merchants currently match ${filter.detail}.`;
                }

                function activateHome(targetId) {
                    document.querySelectorAll('[data-screen]').forEach((screen) => {
                        screen.classList.toggle('is-active', screen.dataset.screen === 'home');
                    });

                    document.querySelectorAll('[data-screen-target]').forEach((link) => {
                        const linkTarget = link.dataset.screenTarget;
                        link.classList.toggle('is-active', linkTarget === targetId || (targetId === 'home' && linkTarget === 'home'));
                    });
                }

                function scrollToHomeSection(targetId, behavior = 'smooth', categoryKey = '') {
                    const target = document.getElementById(targetId);
                    const categoryFilter = categoryFilters[categoryKey] ? categoryKey : '';

                    if (!target) {
                        return;
                    }

                    if (categoryFilter) {
                        storeOnlyView = true;
                        document.documentElement.classList.add('store-only-view');
                        syncDealsNavigation();
                        setStoreCategoryFilter(categoryFilter);
                    } else if (targetId === 'stores') {
                        setStoreCategoryFilter('');
                    }

                    activateHome(targetId);
                    window.requestAnimationFrame(() => {
                        const leavingStoreOnly = storeOnlyView && targetId === 'deals';

                        if (leavingStoreOnly) {
                            document.documentElement.classList.remove('store-only-view');
                            storeOnlyView = false;
                            syncDealsNavigation();
                            setStoreCategoryFilter('');
                        }

                        target.scrollIntoView({ behavior, block: 'start' });
                        const nextUrl = categoryFilter
                            ? storeOnlyUrl(categoryFilter)
                            : storeOnlyView && targetId === 'stores'
                                ? storeOnlyUrl()
                            : leavingStoreOnly
                                ? `${window.location.pathname}#${targetId}`
                            : `#${targetId}`;

                        history.replaceState(null, '', nextUrl);
                    });
                }

                document.addEventListener('click', (event) => {
                    const categoryTrigger = event.target.closest('[data-store-category-filter]');
                    const link = event.target.closest('[data-screen-target]');
                    const targetId = categoryTrigger ? 'stores' : link ? link.dataset.screenTarget : '';

                    if (!homeScrollTargets.has(targetId)) {
                        return;
                    }

                    event.preventDefault();
                    event.stopImmediatePropagation();
                    scrollToHomeSection(targetId, 'smooth', categoryTrigger?.dataset.storeCategoryFilter || '');
                }, true);

                document.querySelectorAll('.home-faq-grid details').forEach((details) => {
                    details.addEventListener('toggle', () => {
                        if (!details.open) {
                            return;
                        }

                        document.querySelectorAll('.home-faq-grid details[open]').forEach((openDetails) => {
                            if (openDetails !== details) {
                                openDetails.open = false;
                            }
                        });
                    });
                });

                const logoWall = document.querySelector('#stores .logo-wall');
                if (logoWall && 'MutationObserver' in window) {
                    new MutationObserver(() => {
                        if (activeStoreCategory) {
                            setStoreCategoryFilter(activeStoreCategory);
                        }
                    }).observe(logoWall, { childList: true });
                }

                const initialTargetId = storeOnlyView ? 'stores' : window.location.hash.slice(1);
                const initialCategoryFilter = categoryFilters[activeStoreCategory] ? activeStoreCategory : '';

                if (storeOnlyView && initialCategoryFilter) {
                    window.addEventListener('load', () => {
                        scrollToHomeSection('stores', 'auto', initialCategoryFilter);
                    });
                } else if (homeScrollTargets.has(initialTargetId)) {
                    scrollToHomeSection(initialTargetId, 'auto');
                }
            })();
        </script>

        <div class="modal-backdrop" data-product-modal>
            <div class="product-modal" role="dialog" aria-modal="true" aria-labelledby="productModalTitle">
                <button class="modal-close-x" type="button" data-close-product-modal aria-label="Close product details">
                    <i data-lucide="x" aria-hidden="true"></i>
                </button>
                <div class="product-modal-main">
                    <div>
                        <img src="" alt="" data-modal-product-image>
                    </div>
                    <div>
                        <h2 id="productModalTitle" data-modal-product-name>Product</h2>
                        <p class="merchant" data-modal-product-unit>1 pack</p>
                        <strong class="modal-price" data-modal-product-price>PHP 0.00</strong>
                        <span class="best-price"><i data-lucide="check-circle" aria-hidden="true"></i> Today's best price</span>
                        <button class="primary-button guest-product-modal-add" type="button" data-guest-modal-add-cart>
                            <i data-lucide="shopping-cart" aria-hidden="true"></i> Add to Cart
                        </button>
                        <p class="guest-cart-hint">Create an account or sign in to add this item to your cart.</p>
                    </div>
                </div>
                <div class="product-modal-details">
                    <div class="description-block">
                        <h3>Product description</h3>
                        <p data-modal-product-description>Selected by your shopper from the merchant shelf, packed carefully, and delivered in your chosen time window.</p>
                    </div>
                </div>
            </div>
        </div>
<?php require __DIR__ . '/includes/footer.php'; ?>
