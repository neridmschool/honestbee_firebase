<?php
date_default_timezone_set('Asia/Manila');

function catalog_item(
    string $id,
    string $type,
    string $category,
    string $name,
    string $merchant,
    float $price,
    string $tag,
    string $rating,
    string $unit,
    string $image,
    string $alt
): array {
    return compact('id', 'type', 'category', 'name', 'merchant', 'price', 'tag', 'rating', 'unit', 'image', 'alt');
}

$storeCatalogs = [
    'metro-ayala-cebu' => [
        'name' => 'Metro Supermarket Ayala Cebu',
        'type' => 'Grocery',
        'meta' => 'Cebu grocery staples, fresh produce, meat, seafood, household goods',
        'eta' => '45-60 min',
        'theme' => '#0f7c42',
        'logo' => 'Metro',
        'logoImage' => 'assets/img/offline/metro-retail-logo.svg',
        'products' => [
            catalog_item('metro-rice', 'grocery', 'Rice & Staples', 'Ganador jasmine rice', 'Metro Supermarket Ayala Cebu', 365, 'Staple', '4.8', '5 kg', 'assets/img/offline/071-photo-1586201375761-83865001e31c.jpg', 'Bowl of white rice'),
            catalog_item('metro-mango', 'grocery', 'Fresh Produce', 'Cebu mangoes', 'Metro Supermarket Ayala Cebu', 180, 'Local', '4.9', '1 kg', 'assets/img/offline/047-photo-1553279768-865429fa0078.jpg', 'Fresh mangoes'),
            catalog_item('metro-chicken', 'grocery', 'Meat & Seafood', 'Fresh chicken thighs', 'Metro Supermarket Ayala Cebu', 220, 'Fresh', '4.6', '1 kg', 'assets/img/offline/081-photo-1604503468506-a8da13d82791.jpg', 'Raw chicken cuts'),
            catalog_item('metro-eggs', 'grocery', 'Dairy & Eggs', 'Large white eggs tray', 'Metro Supermarket Ayala Cebu', 205, 'Breakfast', '4.7', '30 pcs', 'assets/img/offline/064-photo-1582722872445-44dc5f7e3c8f.jpg', 'Tray of eggs'),
            catalog_item('metro-detergent', 'grocery', 'Household', 'Laundry detergent refill', 'Metro Supermarket Ayala Cebu', 198, 'Home', '4.5', '1 kg', 'assets/img/offline/097-photo-1626806787461-102c1bfaaea1.jpg', 'Laundry detergent'),
            catalog_item('metro-biscuits', 'grocery', 'Snacks', 'Assorted biscuit pack', 'Metro Supermarket Ayala Cebu', 145, 'Snack', '4.4', '12 pack', 'assets/img/offline/021-photo-1499636136210-6f4ee915583e.jpg', 'Chocolate cookies'),
        ],
    ],
    'sm-supermarket-cebu' => [
        'name' => 'SM Supermarket Cebu',
        'type' => 'Grocery',
        'meta' => 'Mall grocery for pantry items, fresh food, frozen goods, personal care',
        'eta' => 'Same day',
        'theme' => '#124fb3',
        'logo' => 'SM',
        'logoImage' => 'assets/img/offline/115-favicons.png',
        'products' => [
            catalog_item('sm-pasta', 'grocery', 'Pantry', 'Spaghetti pasta bundle', 'SM Supermarket Cebu', 132, 'Pantry', '4.5', '1 kg', 'assets/img/offline/046-photo-1551462147-ff29053bfc14.jpg', 'Dry pasta'),
            catalog_item('sm-lettuce', 'grocery', 'Fresh', 'Romaine lettuce', 'SM Supermarket Cebu', 155, 'Fresh', '4.6', '250 g', 'assets/img/offline/096-photo-1622206151226-18ca2c9ab4a1.jpg', 'Fresh lettuce'),
            catalog_item('sm-fries', 'grocery', 'Frozen', 'Frozen potato fries', 'SM Supermarket Cebu', 240, 'Frozen', '4.7', '1 kg', 'assets/img/offline/059-photo-1573080496219-bb080dd4f877.jpg', 'French fries'),
            catalog_item('sm-shampoo', 'grocery', 'Personal Care', 'Family shampoo bottle', 'SM Supermarket Cebu', 189, 'Care', '4.4', '650 ml', 'assets/img/offline/093-photo-1620916566398-39f1143ab7be.jpg', 'Shampoo bottle'),
            catalog_item('sm-paper', 'grocery', 'Household', 'Kitchen paper towels', 'SM Supermarket Cebu', 175, 'Home', '4.5', '6 rolls', 'assets/img/offline/069-photo-1585421514738-01798e348b17.jpg', 'Paper towels'),
            catalog_item('sm-juice', 'grocery', 'Drinks', 'Calamansi juice carton', 'SM Supermarket Cebu', 95, 'Drink', '4.3', '1 L', 'assets/img/offline/077-photo-1600271886742-f049cd451bba.jpg', 'Orange juice glass'),
        ],
    ],
    'robinsons-supermarket-cebu' => [
        'name' => 'Robinsons Supermarket Cebu',
        'type' => 'Grocery',
        'meta' => 'Wellness groceries, fresh picks, staples, dairy, and food-to-go',
        'eta' => '50-65 min',
        'theme' => '#139447',
        'logo' => 'R',
        'logoImage' => 'assets/img/offline/114-favicons.png',
        'products' => [
            catalog_item('rob-fruitbox', 'grocery', 'Fresh', 'Wellness fruit box', 'Robinsons Supermarket Cebu', 395, 'Fresh', '4.8', '1 box', 'assets/img/offline/090-photo-1610832958506-aa56368176cf.jpg', 'Fresh fruit box'),
            catalog_item('rob-oats', 'grocery', 'Wellness', 'Rolled oats pouch', 'Robinsons Supermarket Cebu', 210, 'Healthy', '4.5', '1 kg', 'assets/img/offline/092-photo-1615485290382-441e4d049cb5.jpg', 'Oats in bowl'),
            catalog_item('rob-oil', 'grocery', 'Pantry', 'Canola cooking oil', 'Robinsons Supermarket Cebu', 268, 'Staple', '4.7', '1 L', 'assets/img/offline/016-photo-1474979266404-7eaacbcd87c5.jpg', 'Cooking oil bottle'),
            catalog_item('rob-yogurt', 'grocery', 'Dairy', 'Low-fat yogurt cups', 'Robinsons Supermarket Cebu', 215, 'Chilled', '4.4', '4 pack', 'assets/img/offline/019-photo-1488477181946-6428a0291777.jpg', 'Yogurt cups'),
            catalog_item('rob-chicken-meal', 'food', 'Food To Go', 'Chicken rice meal', 'Robinsons Supermarket Cebu', 189, 'Ready', '4.6', '1 meal', 'assets/img/offline/076-photo-1598515214211-89d3c73ae83b.jpg', 'Chicken rice meal'),
            catalog_item('rob-coffee', 'grocery', 'Drinks', 'Cold brew coffee', 'Robinsons Supermarket Cebu', 125, 'Coffee', '4.5', '330 ml', 'assets/img/offline/014-photo-1461023058943-07fcbe16d735.jpg', 'Cold coffee'),
        ],
    ],
    'the-marketplace-cebu' => [
        'name' => 'The Marketplace Cebu',
        'type' => 'Grocery',
        'meta' => 'Imported pantry, deli, cheese, bakery, and premium fresh goods',
        'eta' => 'Same day',
        'theme' => '#6f3a94',
        'logo' => 'MP',
        'logoImage' => 'assets/img/offline/117-favicons.png',
        'products' => [
            catalog_item('marketplace-cheese', 'grocery', 'Cheese', 'Imported cheese wedge', 'The Marketplace Cebu', 360, 'Deli', '4.8', '250 g', 'assets/img/offline/017-photo-1486297678162-eb2a19b0a32d.jpg', 'Cheese wedge'),
            catalog_item('marketplace-ham', 'grocery', 'Deli', 'Smoked ham slices', 'The Marketplace Cebu', 295, 'Deli', '4.6', '300 g', 'assets/img/offline/033-photo-1524438418049-ab2acb7aa48f.jpg', 'Deli meat slices'),
            catalog_item('marketplace-sauce', 'grocery', 'Imported Pantry', 'Italian tomato sauce', 'The Marketplace Cebu', 235, 'Imported', '4.4', '680 g', 'assets/img/offline/015-photo-1472476443507-c7a5948772fc.jpg', 'Tomato sauce jar'),
            catalog_item('marketplace-baguette', 'grocery', 'Bakery', 'French baguette', 'The Marketplace Cebu', 150, 'Bakery', '4.5', '1 pc', 'assets/img/offline/044-photo-1549931319-a545dcf3bc73.jpg', 'Baguettes'),
            catalog_item('marketplace-apples', 'grocery', 'Fresh', 'Imported apples', 'The Marketplace Cebu', 245, 'Fresh', '4.7', '1 kg', 'assets/img/offline/052-photo-1560806887-1e4cd0b6cbd6.jpg', 'Red apples'),
            catalog_item('marketplace-sparkling', 'grocery', 'Beverages', 'Sparkling grape drink', 'The Marketplace Cebu', 320, 'Drink', '4.5', '750 ml', 'assets/img/offline/089-photo-1609951651556-5334e2706168.jpg', 'Sparkling drink'),
        ],
    ],
    'landers-cebu' => [
        'name' => 'Landers Cebu',
        'type' => 'Grocery',
        'meta' => 'Warehouse club goods, bulk grocery, frozen food, bakery, and home care',
        'eta' => 'Same day',
        'theme' => '#f6b21a',
        'logo' => 'L',
        'logoImage' => 'assets/img/offline/112-favicons.png',
        'products' => [
            catalog_item('landers-chips', 'grocery', 'Bulk Grocery', 'Party chips box', 'Landers Cebu', 495, 'Bulk', '4.6', '24 pack', 'assets/img/offline/095-photo-1621939514649-280e2ee25f60.jpg', 'Assorted snacks'),
            catalog_item('landers-muffins', 'grocery', 'Bakery', 'Blueberry muffin tray', 'Landers Cebu', 399, 'Bakery', '4.7', '12 pcs', 'assets/img/offline/087-photo-1607958996333-41aef7caefaa.jpg', 'Muffins'),
            catalog_item('landers-steak', 'grocery', 'Meat', 'Beef steak value pack', 'Landers Cebu', 1250, 'Imported', '4.8', '1 kg', 'assets/img/offline/045-photo-1551028150-64b9f398f678.jpg', 'Steak cuts'),
            catalog_item('landers-icecream', 'grocery', 'Frozen', 'Vanilla ice cream tub', 'Landers Cebu', 520, 'Frozen', '4.5', '1.5 L', 'assets/img/offline/022-photo-1501443762994-82bd5dace89a.jpg', 'Ice cream scoops'),
            catalog_item('landers-laundry', 'grocery', 'Household', 'Fabric conditioner gallon', 'Landers Cebu', 390, 'Home', '4.4', '3.8 L', 'assets/img/offline/098-photo-1626806819282-2c1dc01a5e0c.jpg', 'Laundry bottle'),
            catalog_item('landers-petfood', 'grocery', 'Pet Care', 'Bulk dry dog food', 'Landers Cebu', 1190, 'Pet', '4.6', '8 kg', 'assets/img/offline/072-photo-1589924691995-400dc9ecc119.jpg', 'Dog food bowl'),
        ],
    ],
    'carbon-public-market' => [
        'name' => 'Carbon Public Market',
        'type' => 'Grocery',
        'meta' => 'Cebu public market produce, fruits, vegetables, meat, seafood, dried goods',
        'eta' => 'Early morning',
        'theme' => '#d76b19',
        'logo' => 'Carbon',
        'logoImage' => 'assets/img/offline/110-favicons.png',
        'products' => [
            catalog_item('carbon-tomato', 'grocery', 'Vegetables', 'Kamatis tomato', 'Carbon Public Market', 84, 'Market', '4.6', '500 g', 'assets/img/offline/074-photo-1592924357228-91a4daadcfea.jpg', 'Fresh tomatoes'),
            catalog_item('carbon-banana', 'grocery', 'Fruits', 'Banana lacatan', 'Carbon Public Market', 95, 'Fruit', '4.6', '1 kg', 'assets/img/offline/080-photo-1603833665858-e61d17a86224.jpg', 'Bananas'),
            catalog_item('carbon-liempo', 'grocery', 'Meat', 'Pork liempo cut', 'Carbon Public Market', 180, 'Market cut', '4.5', '500 g', 'assets/img/offline/079-photo-1603048297172-c92544798d5a.jpg', 'Pork belly cut'),
            catalog_item('carbon-galunggong', 'grocery', 'Seafood', 'Galunggong fish', 'Carbon Public Market', 125, 'Seafood', '4.7', '500 g', 'assets/img/offline/026-photo-1510130387422-82bed34b37e9.jpg', 'Fresh fish'),
            catalog_item('carbon-rice', 'grocery', 'Rice', 'Local well-milled rice', 'Carbon Public Market', 285, 'Rice', '4.5', '5 kg', 'assets/img/offline/071-photo-1586201375761-83865001e31c.jpg', 'Rice bowl'),
            catalog_item('carbon-danggit', 'grocery', 'Dried Goods', 'Cebu dried danggit', 'Carbon Public Market', 240, 'Dried', '4.8', '250 g', 'assets/img/offline/091-photo-1615141982883-c7ad0e69fd62.jpg', 'Dried fish'),
        ],
    ],
    'pasil-seafood-market' => [
        'name' => 'Pasil Seafood Market',
        'type' => 'Grocery',
        'meta' => 'Fresh fish, shellfish, squid, crab, and seafood packs',
        'eta' => 'Morning dispatch',
        'theme' => '#0786a8',
        'logo' => 'Pasil',
        'logoImage' => 'assets/img/offline/110-favicons.png',
        'products' => [
            catalog_item('pasil-tuna', 'grocery', 'Fresh Fish', 'Tuna steak', 'Pasil Seafood Market', 300, 'Fresh', '4.7', '500 g', 'assets/img/offline/062-photo-1580476262798-bddd9f4b7369.jpg', 'Tuna steak'),
            catalog_item('pasil-shrimp', 'grocery', 'Shellfish', 'Suahe shrimp', 'Pasil Seafood Market', 330, 'Shellfish', '4.8', '500 g', 'assets/img/offline/054-photo-1565680018434-b513d5e5fd47.jpg', 'Fresh shrimp'),
            catalog_item('pasil-squid', 'grocery', 'Squid & Crab', 'Fresh squid rings', 'Pasil Seafood Market', 210, 'Squid', '4.5', '500 g', 'assets/img/offline/068-photo-1584949602334-4e99f98286a9.jpg', 'Fresh squid seafood'),
            catalog_item('pasil-crab', 'grocery', 'Squid & Crab', 'Blue crab', 'Pasil Seafood Market', 360, 'Crab', '4.6', '500 g', 'assets/img/offline/050-photo-1559737558-2f5a35f4523b.jpg', 'Crab'),
            catalog_item('pasil-mix', 'grocery', 'Seafood Packs', 'Sinigang seafood mix', 'Pasil Seafood Market', 390, 'Pack', '4.4', '1 kg', 'assets/img/offline/051-photo-1559847844-5315695dadae.jpg', 'Sinigang seafood mix'),
            catalog_item('pasil-bangus', 'grocery', 'Fresh Fish', 'Bangus belly', 'Pasil Seafood Market', 265, 'Fish', '4.6', '500 g', 'assets/img/offline/026-photo-1510130387422-82bed34b37e9.jpg', 'Fresh whole fish'),
        ],
    ],
    'taboan-market' => [
        'name' => 'Taboan Market',
        'type' => 'Grocery',
        'meta' => 'Cebu dried fish, dried squid, pasalubong, spices, and local goods',
        'eta' => 'Same day',
        'theme' => '#9a6425',
        'logo' => 'Taboan',
        'logoImage' => 'assets/img/offline/110-favicons.png',
        'products' => [
            catalog_item('taboan-danggit', 'grocery', 'Dried Fish', 'Premium danggit', 'Taboan Market', 320, 'Cebu', '4.9', '250 g', 'assets/img/offline/091-photo-1615141982883-c7ad0e69fd62.jpg', 'Dried fish'),
            catalog_item('taboan-pusit', 'grocery', 'Dried Squid', 'Dried pusit', 'Taboan Market', 350, 'Dried', '4.8', '250 g', 'assets/img/offline/068-photo-1584949602334-4e99f98286a9.jpg', 'Squid seafood'),
            catalog_item('taboan-mango', 'grocery', 'Pasalubong', 'Dried mango pack', 'Taboan Market', 185, 'Gift', '4.7', '200 g', 'assets/img/offline/047-photo-1553279768-865429fa0078.jpg', 'Mangoes'),
            catalog_item('taboan-otap', 'grocery', 'Pasalubong', 'Cebu otap box', 'Taboan Market', 155, 'Pasalubong', '4.5', '1 box', 'assets/img/offline/025-photo-1509440159596-0249088772ff.jpg', 'Pastry pieces'),
            catalog_item('taboan-spice', 'grocery', 'Spices', 'Suka and sili set', 'Taboan Market', 115, 'Spice', '4.4', '2 bottles', 'assets/img/offline/023-photo-1506368249639-73a05d6f6488.jpg', 'Chili spices'),
            catalog_item('taboan-chorizo', 'grocery', 'Local Goods', 'Cebu chorizo pack', 'Taboan Market', 260, 'Local', '4.7', '500 g', 'assets/img/offline/035-photo-1529692236671-f1f6cf9683ba.jpg', 'Sausages'),
        ],
    ],
    'abaca-baking-company' => [
        'name' => 'Abaca Baking Company',
        'type' => 'Food',
        'meta' => 'Cebu bakery cafe for all-butter croissants, pastries, cakes, coffee, and meals',
        'eta' => '35-45 min',
        'theme' => '#b56b2c',
        'logo' => 'ABC',
        'logoImage' => 'assets/img/offline/116-favicons.png',
        'products' => [
            catalog_item('abaca-croissant', 'food', 'Pastries', 'All-butter croissant', 'Abaca Baking Company', 145, 'Signature', '4.9', '1 pc', 'assets/img/offline/048-photo-1555507036-ab1f4038808a.jpg', 'Croissant'),
            catalog_item('abaca-sourdough', 'food', 'Bread', 'Sourdough loaf', 'Abaca Baking Company', 285, 'Bread', '4.8', '1 loaf', 'assets/img/offline/025-photo-1509440159596-0249088772ff.jpg', 'Sourdough bread'),
            catalog_item('abaca-cheesecake', 'food', 'Cakes', 'New York cheesecake slice', 'Abaca Baking Company', 240, 'Cake', '4.7', '1 slice', 'assets/img/offline/036-photo-1533134242443-d4fd215305ad.jpg', 'Cheesecake slice'),
            catalog_item('abaca-brownie', 'food', 'Desserts', 'Fudge brownie', 'Abaca Baking Company', 155, 'Dessert', '4.6', '1 pc', 'assets/img/offline/084-photo-1606313564200-e75d5e30476c.jpg', 'Brownies'),
            catalog_item('abaca-latte', 'food', 'Coffee', 'Iced latte', 'Abaca Baking Company', 175, 'Coffee', '4.6', '16 oz', 'assets/img/offline/014-photo-1461023058943-07fcbe16d735.jpg', 'Iced coffee'),
            catalog_item('abaca-sandwich', 'food', 'Meals', 'Chicken deli sandwich', 'Abaca Baking Company', 345, 'Lunch', '4.5', '1 sandwich', 'assets/img/offline/034-photo-1528735602780-2552fd46c7af.jpg', 'Deli sandwich'),
        ],
    ],
    'julies-bakeshop-cebu' => [
        'name' => "Julie's Bakeshop Cebu",
        'type' => 'Food',
        'meta' => 'Cebu-born neighborhood bakery for pandesal, breads, pastries, snacks, and drinks',
        'eta' => '30-40 min',
        'theme' => '#dd2f2f',
        'logo' => 'Julie',
        'logoImage' => 'assets/img/offline/111-favicons.png',
        'products' => [
            catalog_item('julies-pandesal', 'food', 'Bread', 'Hot pandesal', "Julie's Bakeshop Cebu", 72, 'Fresh', '4.8', '12 pcs', 'assets/img/offline/025-photo-1509440159596-0249088772ff.jpg', 'Fresh bread rolls'),
            catalog_item('julies-cheese-bread', 'food', 'Bread', 'Cheese bread', "Julie's Bakeshop Cebu", 90, 'Classic', '4.7', '6 pcs', 'assets/img/offline/044-photo-1549931319-a545dcf3bc73.jpg', 'Bread pieces'),
            catalog_item('julies-spanish', 'food', 'Pastries', 'Spanish bread', "Julie's Bakeshop Cebu", 88, 'Pastry', '4.6', '6 pcs', 'assets/img/offline/024-photo-1509365465985-25d11c17e812.jpg', 'Pastries'),
            catalog_item('julies-loaf', 'food', 'Cakes', 'Violet cream loaf', "Julie's Bakeshop Cebu", 165, 'Loaf', '4.5', '1 loaf', 'assets/img/offline/018-photo-1486427944299-d1955d23e34d.jpg', 'Sweet loaf cake'),
            catalog_item('julies-snack', 'food', 'Snacks', 'Ensaymada snack box', "Julie's Bakeshop Cebu", 150, 'Snack', '4.4', '4 pcs', 'assets/img/offline/030-photo-1517433670267-08bbd4be890f.jpg', 'Bakery sweets'),
            catalog_item('julies-drink', 'food', 'Drinks', 'Bottled iced tea', "Julie's Bakeshop Cebu", 55, 'Drink', '4.2', '500 ml', 'assets/img/offline/020-photo-1497534446932-c925b458314e.jpg', 'Iced tea glasses'),
        ],
    ],
    'caminade-petshop' => [
        'name' => 'Caminade Petshop',
        'type' => 'Pet Supplies',
        'meta' => 'Cebu pet shop for dog food, cat food, grooming, accessories, and health supplies',
        'eta' => 'Next day',
        'theme' => '#cf4b32',
        'logo' => 'CP',
        'logoImage' => 'assets/img/offline/109-favicons.png',
        'products' => [
            catalog_item('caminade-dogfood', 'grocery', 'Dog Food', 'Adult dog food repack', 'Caminade Petshop', 185, 'Dog', '4.7', '1 kg', 'assets/img/offline/072-photo-1589924691995-400dc9ecc119.jpg', 'Dog food bowl'),
            catalog_item('caminade-catfood', 'grocery', 'Cat Food', 'Wet cat food cans', 'Caminade Petshop', 540, 'Cat', '4.6', '12 cans', 'assets/img/offline/082-photo-1606214174585-fe31582dc6ee.jpg', 'Cat food bowl'),
            catalog_item('caminade-dogtoy', 'grocery', 'Dog Accessories', 'Rope chew toy', 'Caminade Petshop', 150, 'Toy', '4.5', '1 pc', 'assets/img/offline/057-photo-1568640347023-a616a30bc3bd.jpg', 'Dog toy'),
            catalog_item('caminade-catbed', 'grocery', 'Cat Accessories', 'Soft cat bed', 'Caminade Petshop', 620, 'Bed', '4.4', '1 bed', 'assets/img/offline/060-photo-1574144611937-0df059b5ef3e.jpg', 'Cat on bed'),
            catalog_item('caminade-shampoo', 'grocery', 'Grooming', 'Pet grooming shampoo', 'Caminade Petshop', 310, 'Grooming', '4.5', '500 ml', 'assets/img/offline/028-photo-1516734212186-a967f81ad0d7.jpg', 'Dog grooming'),
            catalog_item('caminade-vitamins', 'grocery', 'Health', 'Pet vitamins', 'Caminade Petshop', 280, 'Health', '4.4', '60 tabs', 'assets/img/offline/065-photo-1583337130417-3346a1be7dee.jpg', 'Dog with owner'),
        ],
    ],
    'meowfresh-cebu' => [
        'name' => 'Meow Fresh Cebu',
        'type' => 'Pet Supplies',
        'meta' => 'Metro Cebu pet supplies for cat litter, food, treats, grooming, and accessories',
        'eta' => 'Same day',
        'theme' => '#5c52c8',
        'logo' => 'MF',
        'logoImage' => 'assets/img/offline/113-favicons.png',
        'products' => [
            catalog_item('meowfresh-litter', 'grocery', 'Cat Litter', 'Clumping cat litter', 'Meow Fresh Cebu', 430, 'Litter', '4.8', '10 L', 'assets/img/offline/042-photo-1545249390-6bdfa286032f.jpg', 'Cat litter scoop'),
            catalog_item('meowfresh-kitten', 'grocery', 'Cat Food', 'Organic kitten food', 'Meow Fresh Cebu', 360, 'Kitten', '4.7', '1 kg', 'assets/img/offline/082-photo-1606214174585-fe31582dc6ee.jpg', 'Cat food'),
            catalog_item('meowfresh-dog', 'grocery', 'Dog Food', 'Aozi dog food pack', 'Meow Fresh Cebu', 490, 'Dog', '4.5', '2 kg', 'assets/img/offline/072-photo-1589924691995-400dc9ecc119.jpg', 'Dog food bowl'),
            catalog_item('meowfresh-treats', 'grocery', 'Treats', 'Freeze-dried pet treats', 'Meow Fresh Cebu', 260, 'Treat', '4.6', '100 g', 'assets/img/offline/057-photo-1568640347023-a616a30bc3bd.jpg', 'Pet treats'),
            catalog_item('meowfresh-brush', 'grocery', 'Grooming', 'Pet grooming brush', 'Meow Fresh Cebu', 220, 'Brush', '4.3', '1 pc', 'assets/img/offline/028-photo-1516734212186-a967f81ad0d7.jpg', 'Dog grooming'),
            catalog_item('meowfresh-carrier', 'grocery', 'Accessories', 'Pet travel carrier', 'Meow Fresh Cebu', 890, 'Carrier', '4.4', '1 carrier', 'assets/img/offline/058-photo-1570824104453-508955ab713e.jpg', 'Cat carrier'),
        ],
    ],
];

$extraStoreProducts = [
    'metro-ayala-cebu' => [
        catalog_item('metro-milk', 'grocery', 'Dairy & Eggs', 'Fresh milk carton', 'Metro Supermarket Ayala Cebu', 118, 'Chilled', '4.7', '1 L', 'assets/img/offline/053-photo-1563636619-e9143da7973b.jpg', 'Milk bottle and glass'),
        catalog_item('metro-coffee', 'grocery', 'Drinks', 'Instant coffee jar', 'Metro Supermarket Ayala Cebu', 174, 'Coffee', '4.6', '200 g', 'assets/img/offline/027-photo-1511920170033-f8396924c348.jpg', 'Coffee cup'),
        catalog_item('metro-sardines', 'grocery', 'Canned Goods', 'Tomato sardines pack', 'Metro Supermarket Ayala Cebu', 126, 'Pantry', '4.5', '6 cans', 'assets/img/offline/067-photo-1584269600464-37b1b58a9fe7.jpg', 'Canned goods on shelf'),
        catalog_item('metro-toothpaste', 'grocery', 'Personal Care', 'Family toothpaste twin pack', 'Metro Supermarket Ayala Cebu', 164, 'Care', '4.4', '2 tubes', 'assets/img/offline/066-photo-1583947215259-38e31be8751f.jpg', 'Toothbrush and toothpaste'),
    ],
    'sm-supermarket-cebu' => [
        catalog_item('sm-bread', 'grocery', 'Bakery', 'White loaf bread', 'SM Supermarket Cebu', 92, 'Bakery', '4.5', '1 loaf', 'assets/img/offline/025-photo-1509440159596-0249088772ff.jpg', 'Loaf bread'),
        catalog_item('sm-hotdog', 'grocery', 'Frozen', 'Tender juicy hotdog', 'SM Supermarket Cebu', 178, 'Frozen', '4.6', '500 g', 'assets/img/offline/035-photo-1529692236671-f1f6cf9683ba.jpg', 'Hotdogs'),
        catalog_item('sm-apples', 'grocery', 'Fresh', 'Red apple pack', 'SM Supermarket Cebu', 210, 'Fresh', '4.7', '6 pcs', 'assets/img/offline/056-photo-1567306226416-28f0efdc88ce.jpg', 'Red apples'),
        catalog_item('sm-dishwash', 'grocery', 'Household', 'Dishwashing liquid refill', 'SM Supermarket Cebu', 142, 'Home', '4.4', '800 ml', 'assets/img/offline/070-photo-1585659722983-3a675dabf23d.jpg', 'Dish soap bottle'),
    ],
    'robinsons-supermarket-cebu' => [
        catalog_item('rob-granola', 'grocery', 'Wellness', 'Honey granola cereal', 'Robinsons Supermarket Cebu', 248, 'Healthy', '4.6', '500 g', 'assets/img/offline/029-photo-1517093157656-b9eccef91cb1.jpg', 'Granola bowl'),
        catalog_item('rob-salad', 'food', 'Food To Go', 'Caesar salad bowl', 'Robinsons Supermarket Cebu', 225, 'Ready', '4.5', '1 bowl', 'assets/img/offline/037-photo-1540420773420-3366772f4999.jpg', 'Salad bowl'),
        catalog_item('rob-tuna-can', 'grocery', 'Pantry', 'Tuna flakes multipack', 'Robinsons Supermarket Cebu', 188, 'Pantry', '4.4', '4 cans', 'assets/img/offline/067-photo-1584269600464-37b1b58a9fe7.jpg', 'Canned goods'),
        catalog_item('rob-soy-milk', 'grocery', 'Drinks', 'Soy milk drink', 'Robinsons Supermarket Cebu', 138, 'Drink', '4.5', '1 L', 'assets/img/offline/061-photo-1576186726115-4d51596775d1.jpg', 'Milk drink'),
    ],
    'the-marketplace-cebu' => [
        catalog_item('marketplace-pasta', 'grocery', 'Imported Pantry', 'Truffle pasta sauce', 'The Marketplace Cebu', 410, 'Imported', '4.7', '350 g', 'assets/img/offline/015-photo-1472476443507-c7a5948772fc.jpg', 'Pasta sauce jar'),
        catalog_item('marketplace-salmon', 'grocery', 'Seafood', 'Norwegian salmon fillet', 'The Marketplace Cebu', 620, 'Premium', '4.8', '400 g', 'assets/img/offline/031-photo-1519708227418-c8fd9a32b7a2.jpg', 'Salmon fillet'),
        catalog_item('marketplace-chocolate', 'grocery', 'Imported Snacks', 'Dark chocolate bar', 'The Marketplace Cebu', 180, 'Imported', '4.6', '100 g', 'assets/img/offline/083-photo-1606312619070-d48b4c652a52.jpg', 'Chocolate bar'),
    ],
    'landers-cebu' => [
        catalog_item('landers-water', 'grocery', 'Bulk Grocery', 'Bottled water case', 'Landers Cebu', 285, 'Bulk', '4.6', '24 bottles', 'assets/img/offline/032-photo-1523362628745-0c100150b504.jpg', 'Bottled water'),
        catalog_item('landers-pizza', 'food', 'Food To Go', 'Pepperoni pizza whole', 'Landers Cebu', 699, 'Ready', '4.8', '18 inch', 'assets/img/offline/075-photo-1594007654729-407eedc4be65.jpg', 'Pepperoni pizza'),
        catalog_item('landers-cheese', 'grocery', 'Dairy', 'Cheddar cheese block', 'Landers Cebu', 450, 'Bulk', '4.7', '1 kg', 'assets/img/offline/017-photo-1486297678162-eb2a19b0a32d.jpg', 'Cheese block'),
    ],
    'carbon-public-market' => [
        catalog_item('carbon-okra', 'grocery', 'Vegetables', 'Fresh okra bundle', 'Carbon Public Market', 58, 'Market', '4.4', '250 g', 'assets/img/offline/073-photo-1590165482129-1b8b27698780.jpg', 'Green vegetables'),
        catalog_item('carbon-coconut', 'grocery', 'Fruits', 'Young coconut', 'Carbon Public Market', 75, 'Fresh', '4.7', '1 pc', 'assets/img/offline/063-photo-1580984969071-a8da5656c2fb.jpg', 'Coconut'),
        catalog_item('carbon-chorizo', 'grocery', 'Local Goods', 'Cebu chorizo links', 'Carbon Public Market', 245, 'Local', '4.6', '500 g', 'assets/img/offline/035-photo-1529692236671-f1f6cf9683ba.jpg', 'Sausage links'),
    ],
    'pasil-seafood-market' => [
        catalog_item('pasil-mussels', 'grocery', 'Shellfish', 'Fresh tahong mussels', 'Pasil Seafood Market', 160, 'Shellfish', '4.5', '1 kg', 'assets/img/offline/050-photo-1559737558-2f5a35f4523b.jpg', 'Fresh shellfish'),
        catalog_item('pasil-lapu-lapu', 'grocery', 'Fresh Fish', 'Lapu-lapu fish', 'Pasil Seafood Market', 420, 'Fresh', '4.8', '1 kg', 'assets/img/offline/026-photo-1510130387422-82bed34b37e9.jpg', 'Fresh whole fish'),
        catalog_item('pasil-kinilaw', 'food', 'Seafood Packs', 'Kinilaw tuna pack', 'Pasil Seafood Market', 280, 'Ready', '4.6', '500 g', 'assets/img/offline/051-photo-1559847844-5315695dadae.jpg', 'Seafood dish'),
    ],
    'taboan-market' => [
        catalog_item('taboan-masi', 'grocery', 'Pasalubong', 'Cebu masi pack', 'Taboan Market', 135, 'Local', '4.5', '1 box', 'assets/img/offline/024-photo-1509365465985-25d11c17e812.jpg', 'Local rice cake'),
        catalog_item('taboan-peanut', 'grocery', 'Local Goods', 'Garlic peanuts', 'Taboan Market', 120, 'Snack', '4.4', '250 g', 'assets/img/offline/085-photo-1606923829579-0cb981a83e2e.jpg', 'Peanuts'),
        catalog_item('taboan-salted-fish', 'grocery', 'Dried Fish', 'Salted fish bundle', 'Taboan Market', 275, 'Dried', '4.6', '500 g', 'assets/img/offline/091-photo-1615141982883-c7ad0e69fd62.jpg', 'Dried fish'),
    ],
    'abaca-baking-company' => [
        catalog_item('abaca-cinnamon', 'food', 'Pastries', 'Cinnamon roll', 'Abaca Baking Company', 165, 'Bakery', '4.8', '1 pc', 'assets/img/offline/024-photo-1509365465985-25d11c17e812.jpg', 'Cinnamon roll'),
        catalog_item('abaca-cookie', 'food', 'Desserts', 'Chocolate chip cookie box', 'Abaca Baking Company', 360, 'Dessert', '4.7', '6 pcs', 'assets/img/offline/021-photo-1499636136210-6f4ee915583e.jpg', 'Chocolate cookies'),
        catalog_item('abaca-cake', 'food', 'Cakes', 'Carrot cake slice', 'Abaca Baking Company', 245, 'Cake', '4.8', '1 slice', 'assets/img/offline/055-photo-1565958011703-44f9829ba187.jpg', 'Cake slice'),
    ],
    'julies-bakeshop-cebu' => [
        catalog_item('julies-ube', 'food', 'Bread', 'Ube cheese pandesal', "Julie's Bakeshop Cebu", 130, 'Fresh', '4.7', '6 pcs', 'assets/img/offline/088-photo-1608198093002-ad4e005484ec.jpg', 'Filled bread'),
        catalog_item('julies-mamon', 'food', 'Cakes', 'Classic mamon pack', "Julie's Bakeshop Cebu", 105, 'Classic', '4.6', '4 pcs', 'assets/img/offline/018-photo-1486427944299-d1955d23e34d.jpg', 'Sponge cakes'),
        catalog_item('julies-pie', 'food', 'Pies', 'Buko pie slice', "Julie's Bakeshop Cebu", 95, 'Pie', '4.4', '1 slice', 'assets/img/offline/094-photo-1621303837174-89787a7d4729.jpg', 'Pie slice'),
    ],
    'caminade-petshop' => [
        catalog_item('caminade-leash', 'grocery', 'Dog Accessories', 'Adjustable dog leash', 'Caminade Petshop', 260, 'Accessory', '4.5', '1 pc', 'assets/img/offline/078-photo-1601758125946-6ec2ef64daf8.jpg', 'Dog with leash'),
        catalog_item('caminade-cat-toy', 'grocery', 'Cat Accessories', 'Feather cat teaser', 'Caminade Petshop', 135, 'Toy', '4.4', '1 pc', 'assets/img/offline/042-photo-1545249390-6bdfa286032f.jpg', 'Cat toy'),
        catalog_item('caminade-dog-treats', 'grocery', 'Dog Food', 'Chicken dog treats', 'Caminade Petshop', 210, 'Treat', '4.6', '150 g', 'assets/img/offline/072-photo-1589924691995-400dc9ecc119.jpg', 'Dog treats'),
    ],
    'meowfresh-cebu' => [
        catalog_item('meowfresh-scratch', 'grocery', 'Accessories', 'Cat scratching board', 'Meow Fresh Cebu', 320, 'Accessory', '4.5', '1 board', 'assets/img/offline/060-photo-1574144611937-0df059b5ef3e.jpg', 'Cat scratching board'),
        catalog_item('meowfresh-salmon', 'grocery', 'Cat Food', 'Salmon wet cat food', 'Meow Fresh Cebu', 155, 'Cat', '4.7', '4 pouches', 'assets/img/offline/082-photo-1606214174585-fe31582dc6ee.jpg', 'Cat food bowl'),
        catalog_item('meowfresh-collar', 'grocery', 'Accessories', 'Reflective pet collar', 'Meow Fresh Cebu', 190, 'Accessory', '4.4', '1 pc', 'assets/img/offline/058-photo-1570824104453-508955ab713e.jpg', 'Pet collar'),
    ],
];

foreach ($extraStoreProducts as $storeId => $products) {
    if (isset($storeCatalogs[$storeId])) {
        $storeCatalogs[$storeId]['products'] = array_merge($storeCatalogs[$storeId]['products'], $products);
    }
}

$productImageOverrides = [
    'metro-eggs' => [
        'image' => 'assets/img/offline/013-and9gctli3-hwtfrnhngwjb0c9mcu3obksrbmrpkew.jpg',
        'alt' => 'Large white eggs tray',
    ],
    'metro-detergent' => [
        'image' => 'assets/img/offline/101-arielliquidw-downyfloralpassionrefill715g.jpg',
        'alt' => 'Ariel laundry detergent refill pack',
    ],
    'metro-biscuits' => [
        'image' => 'assets/img/offline/099-combo-9.jpg',
        'alt' => 'Assorted biscuit pack',
    ],
    'metro-sardines' => [
        'image' => 'assets/img/offline/100-mega-sardines-in-tomato-sauce-pouch.jpg',
        'alt' => 'Mega sardines in tomato sauce pouch',
    ],
    'metro-toothpaste' => [
        'image' => 'assets/img/offline/012-and9gcrbnhwijkondmz08rwu0t4d5pdtnivlyj8ixw.jpg',
        'alt' => 'Family toothpaste twin pack',
    ],
    'sm-juice' => [
        'image' => 'assets/img/offline/077-photo-1600271886742-f049cd451bba.jpg',
        'alt' => 'Calamansi juice drink',
    ],
    'carbon-okra' => [
        'image' => 'assets/img/offline/001-bucket-of-raw-okra-pods.jpg',
        'alt' => 'Fresh okra pods',
    ],
    'carbon-danggit' => [
        'image' => 'assets/img/offline/091-photo-1615141982883-c7ad0e69fd62.jpg',
        'alt' => 'Dried fish at a Philippine market',
    ],
    'carbon-chorizo' => [
        'image' => 'assets/img/offline/035-photo-1529692236671-f1f6cf9683ba.jpg',
        'alt' => 'Cebu chorizo links',
    ],
    'pasil-mussels' => [
        'image' => 'assets/img/offline/050-photo-1559737558-2f5a35f4523b.jpg',
        'alt' => 'Fresh mussels at a market',
    ],
    'pasil-lapu-lapu' => [
        'image' => 'assets/img/offline/026-photo-1510130387422-82bed34b37e9.jpg',
        'alt' => 'Fresh lapu-lapu grouper fish',
    ],
    'pasil-kinilaw' => [
        'image' => 'assets/img/offline/051-photo-1559847844-5315695dadae.jpg',
        'alt' => 'Kinilaw tuna dish',
    ],
    'taboan-danggit' => [
        'image' => 'assets/img/offline/091-photo-1615141982883-c7ad0e69fd62.jpg',
        'alt' => 'Premium dried danggit fish',
    ],
    'taboan-pusit' => [
        'image' => 'assets/img/offline/068-photo-1584949602334-4e99f98286a9.jpg',
        'alt' => 'Dried pusit squid',
    ],
    'taboan-mango' => [
        'image' => 'assets/img/offline/047-photo-1553279768-865429fa0078.jpg',
        'alt' => 'Pack of Cebu dried mango',
    ],
    'taboan-otap' => [
        'image' => 'assets/img/offline/025-photo-1509440159596-0249088772ff.jpg',
        'alt' => 'Cebu otap pastry',
    ],
    'taboan-chorizo' => [
        'image' => 'assets/img/offline/035-photo-1529692236671-f1f6cf9683ba.jpg',
        'alt' => 'Cebu chorizo pack',
    ],
    'taboan-salted-fish' => [
        'image' => 'assets/img/offline/091-photo-1615141982883-c7ad0e69fd62.jpg',
        'alt' => 'Salted dried fish bundle',
    ],
    'julies-pandesal' => [
        'image' => 'assets/img/offline/121-pandesal.png',
        'alt' => 'Julies hot pandesal bread rolls',
    ],
    'julies-cheese-bread' => [
        'image' => 'assets/img/offline/118-cheese-bread-1.png',
        'alt' => 'Julies cheese bread',
    ],
    'julies-spanish' => [
        'image' => 'assets/img/offline/122-spanish-bread-1.png',
        'alt' => 'Julies Spanish bread',
    ],
    'julies-loaf' => [
        'image' => 'assets/img/offline/124-violet-cream-loaf-1.png',
        'alt' => 'Julies violet cream loaf',
    ],
    'julies-snack' => [
        'image' => 'assets/img/offline/120-ensaymada.png',
        'alt' => 'Julies ensaymada',
    ],
    'julies-drink' => [
        'image' => 'assets/img/offline/020-photo-1497534446932-c925b458314e.jpg',
        'alt' => 'Iced tea drink',
    ],
    'julies-ube' => [
        'image' => 'assets/img/offline/123-ube-cheese-de-sal-1.png',
        'alt' => 'Julies ube cheese de sal',
    ],
    'julies-mamon' => [
        'image' => 'assets/img/offline/119-cheesy-mamon-1.png',
        'alt' => 'Julies cheesy mamon',
    ],
    'julies-pie' => [
        'image' => 'assets/img/offline/094-photo-1621303837174-89787a7d4729.jpg',
        'alt' => 'Buko pie slice',
    ],
];

foreach ($storeCatalogs as &$store) {
    foreach ($store['products'] as &$product) {
        if (!isset($productImageOverrides[$product['id']])) {
            continue;
        }

        $product['image'] = $productImageOverrides[$product['id']]['image'];
        $product['alt'] = $productImageOverrides[$product['id']]['alt'];
    }
    unset($product);
}
unset($store);

$defaultStores = array_map(function ($store) {
    return [
        'name' => $store['name'],
        'type' => $store['type'],
        'meta' => $store['meta'],
        'eta' => $store['eta'],
        'logo' => $store['logo'] ?? '',
        'logoImage' => $store['logoImage'] ?? '',
    ];
}, $storeCatalogs);

$defaultProducts = $storeCatalogs['metro-ayala-cebu']['products'];

function getCatalogCategories(array $products): array
{
    $categories = [];

    foreach ($products as $product) {
        $category = $product['category'] ?? '';
        if ($category !== '' && !in_array($category, $categories, true)) {
            $categories[] = $category;
        }
    }

    return $categories;
}

$initialShopCategories = getCatalogCategories($defaultProducts);

function money($amount)
{
    return 'PHP ' . number_format((float) $amount, 2);
}

function pagePath(string $path): string
{
    return $path;
}
