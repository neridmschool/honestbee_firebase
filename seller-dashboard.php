<?php
$pageTitle = 'Merchant Dashboard | honestbee';
$activePage = 'seller';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-seller-dashboard>
            <div class="seller-dashboard-layout">
                <aside class="seller-dashboard-nav" aria-label="Merchant dashboard navigation">
                    <nav>
                        <a class="is-active" href="#dashboard" data-seller-view-trigger="dashboard" aria-current="page">
                            <i data-lucide="layout-dashboard" aria-hidden="true"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="#add-product" data-seller-view-trigger="add-product">
                            <i data-lucide="plus-square" aria-hidden="true"></i>
                            <span>Add Product</span>
                        </a>
                        <a href="#product-list" data-seller-view-trigger="product-list">
                            <i data-lucide="list" aria-hidden="true"></i>
                            <span>Product List</span>
                        </a>
                        <a href="#sales" data-seller-view-trigger="sales">
                            <i data-lucide="bar-chart-3" aria-hidden="true"></i>
                            <span>Sales</span>
                        </a>
                        <a href="#order-logs" data-seller-view-trigger="order-logs">
                            <i data-lucide="receipt-text" aria-hidden="true"></i>
                            <span>Order Logs</span>
                        </a>
                    </nav>
                </aside>

                <section class="seller-dashboard-content">
                    <section class="seller-view-panel is-active" data-seller-view-panel="dashboard" id="dashboard">
                        <div class="seller-dashboard-head">
                            <div>
                                <h1>Merchant dashboard</h1>
                                <p data-seller-status>Loading merchant status...</p>
                            </div>
                        </div>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Pending Payment Order by customer</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-seller-pending-payments>
                                <div class="empty-state">Loading pending payment orders...</div>
                            </div>
                        </div>
                    </section>

                    <section class="seller-view-panel" data-seller-view-panel="add-product" id="add-product" hidden>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Add product</h2>
                                </div>
                            </div>
                            <form class="compact-form" data-seller-product-form>
                                <input type="text" name="name" placeholder="Product name" required>
                                <input type="text" name="category" placeholder="Category" required>
                                <input type="text" name="unit" placeholder="Unit, e.g. 1 kg" required>
                                <input type="number" min="1" step="0.01" name="price" placeholder="Price" required>
                                <label>Product Image (optional)<input type="file" name="productImage" accept="image/*" data-image-upload><small class="field-help">JPG, PNG, GIF, or WebP up to 5 MB.</small></label>
                                <textarea name="description" placeholder="About the product (optional)"></textarea>
                                <button class="primary-button" type="submit"><i data-lucide="plus" aria-hidden="true"></i> Save product</button>
                                <div class="notice" data-seller-product-notice></div>
                            </form>
                        </div>
                    </section>

                    <section class="seller-view-panel" data-seller-view-panel="product-list" id="product-list" hidden>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Product List</h2>
                                    <p>Click a product to edit it here without leaving the merchant dashboard.</p>
                                </div>
                            </div>
                            <div class="dashboard-list" data-seller-products>
                                <div class="empty-state">Loading merchant products...</div>
                            </div>
                        </div>
                    </section>

                    <section class="seller-view-panel" data-seller-view-panel="edit-product" id="edit-product" hidden>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Edit Product</h2>
                                    <p data-seller-product-editor-status>Select a product from Product List.</p>
                                </div>
                                <button class="ghost-button" type="button" data-seller-product-editor-back>
                                    <i data-lucide="arrow-left" aria-hidden="true"></i> Back to Product List
                                </button>
                            </div>
                            <div class="seller-product-edit-summary" data-seller-product-edit-summary hidden>
                                <div class="seller-product-edit-summary-image">
                                    <img src="assets/img/honestbee-logo.svg" alt="Current product photo" data-seller-product-preview-image>
                                </div>
                                <div>
                                    <span class="eyebrow">Currently editing</span>
                                    <h3 data-seller-product-preview-name>Select a product</h3>
                                    <p data-seller-product-preview-meta>Choose a product from the Product List to edit its details.</p>
                                </div>
                            </div>
                            <form class="compact-form seller-inline-product-editor" data-seller-inline-product-editor hidden>
                                <label>Product Name
                                    <input type="text" data-product-field="name" placeholder="Product name" required>
                                </label>
                                <label>Category
                                    <input type="text" data-product-field="category" placeholder="Category" required>
                                </label>
                                <label>Unit / Size
                                    <input type="text" data-product-field="unit" placeholder="Unit, e.g. 1 kg" required>
                                </label>
                                <label>Price
                                    <input type="number" min="1" step="0.01" data-product-field="price" placeholder="Price" required>
                                </label>
                                <label>Product Photo
                                    <input type="file" name="productImage" accept="image/*" data-product-field="image" data-seller-inline-product-image-upload data-image-upload>
                                    <small class="field-help" data-seller-product-image-help>Leave blank to keep the current product photo. JPG, PNG, GIF, or WebP up to 5 MB.</small>
                                </label>
                                <label>Image Description
                                    <input type="text" data-product-field="alt" placeholder="Image description">
                                </label>
                                <label>Product Description
                                    <textarea data-product-field="description" placeholder="About the product"></textarea>
                                </label>
                                <div class="form-actions">
                                    <button class="primary-button" type="submit"><i data-lucide="save" aria-hidden="true"></i> Save changes</button>
                                    <button class="ghost-button" type="button" data-seller-product-editor-back><i data-lucide="arrow-left" aria-hidden="true"></i> Back</button>
                                </div>
                                <div class="notice" data-seller-inline-product-notice></div>
                            </form>
                        </div>
                    </section>

                    <section class="seller-view-panel" data-seller-view-panel="sales" id="sales" hidden>
                        <div class="dashboard-panel wide">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Full Sales Details</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-seller-sales>
                                <div class="empty-state">Loading sales details...</div>
                            </div>
                        </div>
                    </section>

                    <section class="seller-view-panel" data-seller-view-panel="order-logs" id="order-logs" hidden>
                        <div class="dashboard-panel">
                            <div class="dashboard-heading">
                                <div>
                                    <h2>Order Logs</h2>
                                </div>
                            </div>
                            <div class="dashboard-list" data-seller-orders>
                                <div class="empty-state">Loading merchant orders...</div>
                            </div>
                        </div>
                    </section>
                </section>
            </div>

            <div class="customer-order-modal-backdrop seller-order-modal-backdrop" data-seller-order-modal hidden aria-hidden="true">
                <section class="customer-order-modal seller-order-modal" role="dialog" aria-modal="true" aria-labelledby="sellerOrderModalTitle" tabindex="-1">
                    <button class="modal-close-x customer-order-modal-close" type="button" data-seller-order-modal-close aria-label="Close preparation details">
                        <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                    <div class="customer-order-modal-content" data-seller-order-modal-content>
                        <div class="empty-state">Loading preparation details...</div>
                    </div>
                </section>
            </div>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
