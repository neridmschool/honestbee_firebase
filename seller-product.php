<?php
$pageTitle = 'Product Dashboard | honestbee';
$activePage = 'seller';
$bodyClass = 'dashboard-page';
require __DIR__ . '/includes/header.php';
?>
        <main class="dashboard-main" data-seller-product-dashboard>
            <section class="dashboard-hero compact">
                <div>
                    <h1>Edit product.</h1>
                    <p data-product-editor-status>Loading product...</p>
                </div>
                <a class="ghost-button" href="seller-dashboard.php"><i data-lucide="arrow-left" aria-hidden="true"></i> Merchant Dashboard</a>
            </section>

            <section class="dashboard-shell single">
                <form class="form-panel" data-seller-product-editor>
                    <div class="dashboard-heading">
                        <div>
                            <h2>Product details</h2>
                        </div>
                    </div>
                    <div class="form-grid">
                        <label>Product Name<input type="text" data-product-field="name" required></label>
                        <label>Category<input type="text" data-product-field="category" required></label>
                        <label>Unit<input type="text" data-product-field="unit" required></label>
                        <label>Price<input type="number" min="1" step="0.01" data-product-field="price" required></label>
                        <label>Product Photo Path<input type="text" data-product-field="image" placeholder="assets/img/offline/product.jpg"></label>
                        <label>Image Description<input type="text" data-product-field="alt" placeholder="Product photo description"></label>
                    </div>
                    <div class="form-grid single-column">
                        <label>About Product<textarea data-product-field="description" placeholder="Short product description customers will see."></textarea></label>
                    </div>
                    <div class="form-actions">
                        <button class="primary-button" type="submit"><i data-lucide="save" aria-hidden="true"></i> Save changes</button>
                        <a class="ghost-button" href="seller-dashboard.php"><i data-lucide="arrow-left" aria-hidden="true"></i> Back</a>
                    </div>
                    <div class="notice" data-product-editor-notice></div>
                </form>
            </section>
        </main>
<?php require __DIR__ . '/includes/footer.php'; ?>
