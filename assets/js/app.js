import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    nextId,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from './firestore-compat.js';
import { db, collections } from './firestore-compat.js';
import {
    createUserWithEmailAndPassword,
    firebaseAuth,
    firebaseCollection,
    firebaseDeleteDoc,
    firebaseDoc,
    firebaseGetDoc,
    firebaseGetDocs,
    firebaseLimit,
    firebaseOnSnapshot,
    firebaseQuery,
    firebaseServerTimestamp,
    firebaseSetDoc,
    firebaseWhere,
    firestoreDb,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from './firebase-config.js';

const DATA = window.honestbeeData || {};
// Phase 6: Customer cart, orders, rider delivery, admin account approvals, ratings, and refunds now use Firestore.
// TODO: Add Firebase Storage for image/file uploads later; imageUrl/fileUrl fields stay plain strings for now.
const DEFAULT_PRODUCT_IMAGE = 'assets/img/offline/default product logo.png';
const storeCatalogs = DATA.storeCatalogs || {};
const builtInStoreIds = new Set(Object.keys(storeCatalogs));
const builtInStoreNameKeys = new Set(Object.values(storeCatalogs).map((store) => slugify(store.name)));
const onlinePaymentMethods = new Set(['card', 'gcash']);
const amountFormatter = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const storageKeys = {
    deliveryArea: 'honestbee_cebu_delivery_area',
    customerId: 'honestbee_customer_id',
    customerEmail: 'honestbee_customer_email',
    shopperId: 'honestbee_shopper_id',
    merchantId: 'honestbee_merchant_id',
    lastOrderId: 'honestbee_last_order_id',
    account: 'honestbee_account',
    themeMode: 'honestbee_theme_mode',
    language: 'honestbee_language',
    languageSticky: 'honestbee_language_sticky',
    homepagePrefix: 'honestbee_home_',
    sellerApplication: 'honestbee_application_seller',
    riderApplication: 'honestbee_application_rider',
    cart: 'honestbee_cart',
    customerAddresses: 'honestbee_customer_addresses',
    adminPassword: 'honestbee_admin_password'
};

const firebaseStorageVersion = 'firebase-v2';

function clearLegacyClientDataForFirebase() {
    try {
        if (localStorage.getItem('honestbee_storage_schema_version') === firebaseStorageVersion) {
            return;
        }

        [
            storageKeys.account,
            storageKeys.customerId,
            storageKeys.customerEmail,
            storageKeys.shopperId,
            storageKeys.merchantId,
            storageKeys.lastOrderId,
            storageKeys.sellerApplication,
            storageKeys.riderApplication,
            storageKeys.cart
        ].forEach((key) => localStorage.removeItem(key));

        Object.keys(localStorage)
            .filter((key) => key.startsWith(`${storageKeys.cart}_`))
            .forEach((key) => localStorage.removeItem(key));

        document.documentElement.classList.remove(
            'has-current-account',
            'account-role-customer',
            'account-role-seller',
            'account-role-rider',
            'account-role-admin'
        );
        localStorage.setItem('honestbee_storage_schema_version', firebaseStorageVersion);
    } catch (error) {
        // Browsers can disable local storage.
    }
}

clearLegacyClientDataForFirebase();

const adminAccount = {
    USER_id: 'admin-honestbee-dm',
    USER_email: 'admindm@honestbee.com',
    USER_password: 'admin123',
    USER_role: 'Admin',
    USER_linkedId: 'admin-honestbee-dm',
    USER_status: 'Active'
};

function currentAdminPassword() {
    return readLocal(storageKeys.adminPassword) || adminAccount.USER_password;
}

function setAdminPassword(password) {
    if (password) {
        saveLocal(storageKeys.adminPassword, password);
    }
}

const serviceCities = ['Cebu City', 'Lapu-Lapu', 'Mandaue', 'Consolacion', 'Talisay'];
const currentAddressLabel = 'Current Address';
const legacyDefaultAddressLabel = 'Default Address';
const serviceCityAliases = new Map([
    ['cebu', 'Cebu City'],
    ['cebu city', 'Cebu City'],
    ['lapu lapu', 'Lapu-Lapu'],
    ['lapu-lapu', 'Lapu-Lapu'],
    ['lapu lapu city', 'Lapu-Lapu'],
    ['lapu-lapu city', 'Lapu-Lapu'],
    ['mandaue', 'Mandaue'],
    ['mandaue city', 'Mandaue'],
    ['consolacion', 'Consolacion'],
    ['consolacion cebu', 'Consolacion'],
    ['talisay', 'Talisay'],
    ['talisay city', 'Talisay'],
    ['talisay cebu', 'Talisay']
]);

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let accountModalFocusReturn = null;

function normalizeAccountModalName(value) {
    const key = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    const aliases = {
        login: 'signin',
        signin: 'signin',
        forgot: 'forgot-password',
        forgotpassword: 'forgot-password',
        resetpassword: 'forgot-password',
        pending: 'pending-approval',
        pendingapproval: 'pending-approval',
        signup: 'signup',
        register: 'signup',
        rider: 'rider',
        riderapply: 'rider',
        merchant: 'merchant',
        seller: 'merchant',
        sellerregister: 'merchant',
        profile: 'profile',
        customerprofile: 'profile',
        settings: 'settings'
    };

    return aliases[key] || key;
}

function closeAccountModals({ restoreFocus = true } = {}) {
    let closedAny = false;
    $$('[data-account-modal].is-open').forEach((modal) => {
        closedAny = true;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    });

    if (closedAny) {
        document.body?.classList.remove('has-open-account-modal');
        if (restoreFocus && accountModalFocusReturn?.focus) {
            accountModalFocusReturn.focus({ preventScroll: true });
        }
    }

    accountModalFocusReturn = null;
}

function focusProfileModalAnchor(focusKey) {
    const key = String(focusKey || '').trim();
    if (!key) {
        return;
    }

    window.setTimeout(() => {
        const modal = $('[data-account-modal="profile"].is-open');
        const activeSection = modal ? $('.customer-profile-section.is-current', modal) : null;
        const target = activeSection ? $(`[data-profile-anchor="${key}"]`, activeSection) : null;
        if (!target) {
            return;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('profile-focus-highlight');
        window.setTimeout(() => target.classList.remove('profile-focus-highlight'), 1800);
    }, 120);
}

function openAccountModal(name, options = {}) {
    const modalName = normalizeAccountModalName(name);
    const modal = $$('[data-account-modal]').find((item) => item.dataset.accountModal === modalName);
    if (!modal) {
        return false;
    }

    const activeElement = document.activeElement;
    const focusReturn = activeElement?.closest?.('[data-account-modal]') ? null : activeElement;
    closeAccountModals({ restoreFocus: false });
    accountModalFocusReturn = focusReturn;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body?.classList.add('has-open-account-modal');
    if (modalName === 'profile') {
        syncCustomerProfileModal(modal);
        focusProfileModalAnchor(options.profileFocus);
    }
    if (modalName === 'settings') {
        syncWebsiteSettingsControls(modal);
    }

    window.setTimeout(() => {
        const dialog = $('[role="dialog"]', modal) || modal;
        const focusTarget = $('input:not([type="hidden"]), select, textarea', dialog)
            || $('button, a[href]', dialog)
            || dialog;
        focusTarget.focus?.({ preventScroll: true });
    }, 0);

    refreshIcons();
    return true;
}

function formatMoney(amount) {
    return `PHP ${amountFormatter.format(Number(amount) || 0)}`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));
}

function slugify(value) {
    return String(value ?? 'record')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'record';
}

function offlineImagePath(value, fallback = '') {
    const imagePath = String(value || '').trim();
    return /^(https?:)?\/\//i.test(imagePath) ? fallback : (imagePath || fallback);
}

function productImagePath(value) {
    return offlineImagePath(value, DEFAULT_PRODUCT_IMAGE);
}

function customerDocId(email) {
    return `customer-${slugify(email)}`;
}

function merchantDocId(name) {
    return `merchant-${slugify(name)}`;
}

function userAccountDocId(email) {
    return `user-${slugify(email)}`;
}

function collectionRef(name) {
    return collection(db, name);
}

function docRef(name, id) {
    return doc(db, name, id);
}

function saveLocal(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // Browsers can disable local storage.
    }
}

function readLocal(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function removeLocal(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        // Browsers can disable local storage.
    }
}

function getCurrentAccount() {
    const raw = readLocal(storageKeys.account);
    if (!raw) {
        return null;
    }

    try {
        const account = JSON.parse(raw);
        if (!account?.USER_role || !account?.USER_email) {
            clearCurrentAccount();
            return null;
        }

        return account;
    } catch (error) {
        clearCurrentAccount();
        return null;
    }
}

function syncAccountRoleClass(account) {
    ['customer', 'seller', 'rider', 'admin'].forEach((role) => {
        document.documentElement.classList.toggle(`account-role-${role}`, accountRole(account) === role);
    });
}

function setCurrentAccount(account) {
    saveLocal(storageKeys.account, JSON.stringify(account));
    document.documentElement.classList.add('has-current-account');
    syncAccountRoleClass(account);
    applyThemeMode();
    syncThemeToggles();
    applyStickyLanguageForAccount(account);
}

function clearCurrentAccount() {
    const account = getCurrentAccount();
    try {
        if (account) {
            const stickyKey = accountPreferenceKey(storageKeys.languageSticky, account);
            const shouldKeepLanguage = readLocal(stickyKey) === 'on';
            if (!shouldKeepLanguage) {
                removeLocal(accountPreferenceKey(storageKeys.language, account));
                removeLocal(stickyKey);
            }
        }
        removeLocal(storageKeys.language);
        removeLocal(storageKeys.account);
        removeLocal(storageKeys.customerId);
        removeLocal(storageKeys.customerEmail);
        removeLocal(storageKeys.shopperId);
        removeLocal(storageKeys.merchantId);
        removeLocal(storageKeys.sellerApplication);
        removeLocal(storageKeys.riderApplication);
    } catch (error) {
        // Browsers can disable local storage.
    }
    document.documentElement.classList.remove('has-current-account');
    syncAccountRoleClass(null);
    applyThemeMode();
    syncThemeToggles();
    translatePage('english');
}

function roleLower(value) {
    return String(value || '').toLowerCase();
}

const deletedAccountMessage = 'Your account has been deleted.';
const pendingApprovalMessage = 'Pending for approval.';
const partnerApplicationSubmittedMessage = 'Application submitted. Sign in after admin approval.';

function normalizedAccountRole(value) {
    const role = roleLower(value);
    return role === 'merchant' ? 'seller' : role;
}

function accountRole(account) {
    return normalizedAccountRole(account?.USER_role || account?.role);
}

function titleStatus(value, fallback = 'Pending') {
    const normalized = roleLower(value || fallback);
    if (normalized === 'active') {
        return 'Active';
    }
    if (normalized === 'approved') {
        return 'Approved';
    }
    if (normalized === 'inactive') {
        return 'Inactive';
    }
    if (normalized === 'rejected') {
        return 'Rejected';
    }
    if (normalized === 'deleted') {
        return 'Deleted';
    }
    return fallback;
}

function normalizeApprovalStatus(value, approved = 'Approved', rejected = 'Rejected', pending = 'Pending') {
    const status = roleLower(value);
    if (['approved', 'active', 'accepted', 'enabled'].includes(status)) {
        return approved;
    }
    if (['rejected', 'inactive', 'declined', 'denied', 'disabled'].includes(status)) {
        return rejected;
    }
    return pending;
}

function recordApprovalStatus(primary, fallback, approved = 'Approved', rejected = 'Rejected', pending = 'Pending') {
    return roleLower(primary)
        ? normalizeApprovalStatus(primary, approved, rejected, pending)
        : normalizeApprovalStatus(fallback, approved, rejected, pending);
}

function firebaseUserDoc(uid) {
    return firebaseDoc(firestoreDb, 'users', uid);
}

function firebaseRoleDoc(role, uid) {
    if (role === 'seller') {
        return firebaseDoc(firestoreDb, 'merchants', uid);
    }
    if (role === 'rider') {
        return firebaseDoc(firestoreDb, 'riders', uid);
    }
    return firebaseDoc(firestoreDb, 'customers', uid);
}

function firebaseMerchantRecord(uid, merchant = {}, user = {}, account = getCurrentAccount()) {
    const ownerName = user.username || storedAccountName(account) || '';
    const ownerParts = splitFullName(ownerName);
    const approvalStatus = recordApprovalStatus(merchant.approvalStatus, user.status, 'Approved', 'Rejected', 'Pending');
    const storeStatus = merchant.storeStatus || (approvalStatus === 'Approved' ? 'Open' : 'Closed');

    return {
        id: uid,
        MERCH_id: uid,
        MERCH_ownerFirstName: account?.MERCH_ownerFirstName || ownerParts.firstName || '',
        MERCH_ownerLastName: account?.MERCH_ownerLastName || ownerParts.lastName || '',
        MERCH_ownerEmail: user.email || accountEmail(account),
        MERCH_phone: account?.MERCH_phone || '',
        MERCH_name: merchant.storeName || account?.MERCH_name || 'Merchant',
        MERCH_type: merchant.merchantType || account?.MERCH_type || 'Grocery',
        MERCH_address: merchant.address || account?.MERCH_address || '',
        MERCH_availableDays: merchant.availableDays || account?.MERCH_availableDays || 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
        MERCH_storeStatus: normalizeMerchantStoreStatus(storeStatus),
        MERCH_approvalStatus: approvalStatus,
        logoUrl: merchant.logoUrl || '',
        documentUrl: merchant.documentUrl || '',
        role: 'seller'
    };
}

function firebaseRiderRecord(uid, rider = {}, user = {}, account = getCurrentAccount()) {
    const fullName = rider.fullName || user.username || storedAccountName(account) || 'Rider';
    const parts = splitFullName(fullName);
    const employmentStatus = recordApprovalStatus(rider.approvalStatus, user.status, 'Active', 'Inactive', 'Pending');

    return {
        id: uid,
        SHOP_id: uid,
        RIDER_id: uid,
        SHOP_firstName: account?.SHOP_firstName || parts.firstName || '',
        SHOP_lastName: account?.SHOP_lastName || parts.lastName || '',
        SHOP_email: user.email || accountEmail(account),
        SHOP_phone: account?.SHOP_phone || '',
        SHOP_currentLocation: rider.currentLocation || account?.SHOP_currentLocation || '',
        SHOP_vehicleType: rider.vehicleType || account?.SHOP_vehicleType || '',
        SHOP_maxActiveOrders: account?.SHOP_maxActiveOrders || 1,
        SHOP_availabilityStatus: employmentStatus === 'Active' ? 'Available' : 'Unavailable',
        SHOP_employmentStatus: employmentStatus,
        SHOP_approvalStatus: rider.approvalStatus || user.status || 'pending',
        profileImageUrl: rider.profileImageUrl || '',
        validIdUrl: rider.validIdUrl || '',
        licenseUrl: rider.licenseUrl || '',
        role: 'rider'
    };
}


function adminUserRecordRole(user = {}) {
    return normalizedAccountRole(user.USER_role || user.role || '');
}

function firestoreAdminTimestamp(record = {}) {
    return record.updatedAt || record.createdAt || record.created_at || null;
}

function adminSortByDateThenName(records = [], nameSelector = (record) => record.id) {
    return [...records].sort((first, second) => {
        const firstTime = timestampMillis(firestoreAdminTimestamp(first));
        const secondTime = timestampMillis(firestoreAdminTimestamp(second));
        if (secondTime !== firstTime) {
            return secondTime - firstTime;
        }
        return String(nameSelector(first) || '').localeCompare(String(nameSelector(second) || ''));
    });
}

function normalizeFirestoreAdminCustomer(uid, customer = {}, user = {}) {
    const email = user.email || user.USER_email || customer.email || customer.CUST_email || customer.USER_email || '';
    const displayName = user.username
        || user.USER_displayName
        || fullNameFromParts(customer.firstName || customer.CUST_firstName, customer.lastName || customer.CUST_lastName)
        || titleCaseName(String(email || '').split('@')[0]);
    const parts = splitFullName(displayName);
    const address = cleanAddressPart(customer.address || customer.CUST_address || '');

    return {
        id: uid,
        USER_id: uid,
        USER_linkedId: uid,
        USER_role: 'customer',
        role: 'customer',
        USER_email: email,
        USER_displayName: displayName || 'Customer',
        USER_firstName: customer.firstName || customer.CUST_firstName || parts.firstName || '',
        USER_lastName: customer.lastName || customer.CUST_lastName || parts.lastName || '',
        USER_phone: customer.phone || customer.CUST_phone || '',
        USER_address: address,
        USER_city: normalizeServiceCity(customer.city || customer.CUST_city) || deriveServiceCityFromAddress(address) || '',
        USER_preferredDeliveryTime: customer.preferredDeliveryTime || customer.CUST_preferredDeliveryTime || '',
        USER_status: titleStatus(user.status || user.USER_status || customer.status || customer.USER_status, 'Active'),
        profileImageUrl: customer.profileImageUrl || '',
        createdAt: customer.createdAt || user.createdAt || null,
        updatedAt: customer.updatedAt || user.updatedAt || null
    };
}

function adminCustomerProfileRepairPayload(uid, user = {}, customer = {}) {
    const email = String(user.email || user.USER_email || customer.email || customer.CUST_email || '').trim().toLowerCase();
    const displayName = user.username
        || user.USER_displayName
        || fullNameFromParts(customer.firstName || customer.CUST_firstName, customer.lastName || customer.CUST_lastName)
        || titleCaseName(email.split('@')[0]);
    const parts = splitFullName(displayName);
    const firstName = customer.firstName || customer.CUST_firstName || parts.firstName || '';
    const lastName = customer.lastName || customer.CUST_lastName || parts.lastName || '';
    const phone = customer.phone || customer.CUST_phone || user.phone || user.USER_phone || '';
    const address = cleanAddressPart(customer.address || customer.CUST_address || user.address || user.USER_address || '');
    const city = normalizeServiceCity(customer.city || customer.CUST_city || user.city || user.USER_city) || deriveServiceCityFromAddress(address) || '';

    return {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        role: 'customer',
        status: 'active',
        username: displayName,
        CUST_id: uid,
        CUST_firstName: firstName,
        CUST_lastName: lastName,
        CUST_email: email,
        CUST_phone: phone,
        CUST_address: address,
        CUST_city: city,
        USER_role: 'customer',
        USER_email: email,
        USER_status: 'Active',
        updatedAt: firebaseServerTimestamp()
    };
}

function customerProfileNeedsAdminRepair(customer = {}, user = {}) {
    if (!user?.id || adminUserRecordRole(user) !== 'customer') {
        return false;
    }

    return !customer
        || !customer.email
        || !customer.role
        || !customer.status
        || !customer.CUST_email
        || !customer.USER_role;
}

function normalizeFirestoreAdminMerchant(uid, merchant = {}, user = {}) {
    const normalizedMerchant = firebaseMerchantRecord(uid, merchant, user, {
        MERCH_ownerFirstName: merchant.ownerFirstName || '',
        MERCH_ownerLastName: merchant.ownerLastName || '',
        MERCH_ownerEmail: user.email || merchant.ownerEmail || '',
        MERCH_phone: merchant.phone || '',
        MERCH_name: merchant.storeName || merchant.MERCH_name || '',
        MERCH_type: merchant.merchantType || merchant.MERCH_type || '',
        MERCH_address: merchant.address || merchant.MERCH_address || '',
        MERCH_availableDays: merchant.availableDays || merchant.MERCH_availableDays || '',
        MERCH_storeStatus: merchant.storeStatus || merchant.MERCH_storeStatus || '',
        MERCH_approvalStatus: merchant.approvalStatus || merchant.MERCH_approvalStatus || user.status || 'pending',
        MERCH_businessHours: merchant.businessHours || merchant.MERCH_businessHours || ''
    });

    return {
        ...normalizedMerchant,
        id: uid,
        role: 'seller',
        MERCH_id: uid,
        MERCH_ownerEmail: user.email || merchant.ownerEmail || normalizedMerchant.MERCH_ownerEmail || '',
        MERCH_phone: merchant.phone || merchant.MERCH_phone || normalizedMerchant.MERCH_phone || '',
        MERCH_businessProof: merchant.documentUrl || merchant.businessProof || merchant.MERCH_businessProof || '',
        MERCH_businessPermit: merchant.documentUrl || merchant.businessPermit || merchant.MERCH_businessPermit || '',
        MERCH_businessHours: merchant.businessHours || merchant.MERCH_businessHours || normalizedMerchant.MERCH_businessHours || '',
        documentUrl: merchant.documentUrl || '',
        logoUrl: merchant.logoUrl || '',
        USER_status: titleStatus(user.status, normalizedMerchant.MERCH_approvalStatus),
        createdAt: merchant.createdAt || user.createdAt || null,
        updatedAt: merchant.updatedAt || user.updatedAt || null
    };
}

function normalizeFirestoreAdminRider(uid, rider = {}, user = {}) {
    const normalizedRider = firebaseRiderRecord(uid, rider, user, {
        SHOP_firstName: rider.firstName || rider.SHOP_firstName || rider.RIDER_firstName || '',
        SHOP_lastName: rider.lastName || rider.SHOP_lastName || rider.RIDER_lastName || '',
        SHOP_phone: rider.phone || '',
        SHOP_currentLocation: rider.currentLocation || '',
        SHOP_vehicleType: rider.vehicleType || '',
        SHOP_employmentStatus: rider.approvalStatus || user.status || 'pending'
    });

    return {
        ...normalizedRider,
        id: uid,
        role: 'rider',
        SHOP_id: uid,
        RIDER_id: uid,
        SHOP_firstName: rider.firstName || rider.SHOP_firstName || rider.RIDER_firstName || normalizedRider.SHOP_firstName || '',
        SHOP_lastName: rider.lastName || rider.SHOP_lastName || rider.RIDER_lastName || normalizedRider.SHOP_lastName || '',
        SHOP_email: user.email || rider.email || normalizedRider.SHOP_email || '',
        SHOP_phone: rider.phone || rider.SHOP_phone || normalizedRider.SHOP_phone || '',
        SHOP_validId: rider.validIdUrl || rider.validId || rider.SHOP_validId || '',
        RIDER_validId: rider.validIdUrl || rider.validId || rider.RIDER_validId || '',
        SHOP_license: rider.licenseUrl || rider.license || rider.SHOP_license || '',
        RIDER_license: rider.licenseUrl || rider.license || rider.RIDER_license || '',
        validIdUrl: rider.validIdUrl || '',
        licenseUrl: rider.licenseUrl || '',
        USER_status: titleStatus(user.status, normalizedRider.SHOP_employmentStatus),
        createdAt: rider.createdAt || user.createdAt || null,
        updatedAt: rider.updatedAt || user.updatedAt || null
    };
}

function combineFirestoreAdminAccounts(users = [], customers = [], merchants = [], riders = []) {
    const usersById = new Map(users.map((user) => [user.id, user]));
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));
    const merchantsById = new Map(merchants.map((merchant) => [merchant.id, merchant]));
    const ridersById = new Map(riders.map((rider) => [rider.id, rider]));

    const customerIds = new Set([
        ...customersById.keys(),
        ...users.filter((user) => adminUserRecordRole(user) === 'customer').map((user) => user.id)
    ]);
    const merchantIds = new Set([
        ...merchantsById.keys(),
        ...users.filter((user) => adminUserRecordRole(user) === 'seller').map((user) => user.id)
    ]);
    const riderIds = new Set([
        ...ridersById.keys(),
        ...users.filter((user) => adminUserRecordRole(user) === 'rider').map((user) => user.id)
    ]);

    return {
        customers: adminSortByDateThenName([...customerIds]
            .map((uid) => normalizeFirestoreAdminCustomer(uid, customersById.get(uid) || {}, usersById.get(uid) || {}))
            .filter((record) => !isDeletedAccountRecord(record)), userFullName),
        sellers: adminSortByDateThenName([...merchantIds]
            .map((uid) => normalizeFirestoreAdminMerchant(uid, merchantsById.get(uid) || {}, usersById.get(uid) || {}))
            .filter((record) => !isDeletedAccountRecord(record)), (record) => record.MERCH_name),
        riders: adminSortByDateThenName([...riderIds]
            .map((uid) => normalizeFirestoreAdminRider(uid, ridersById.get(uid) || {}, usersById.get(uid) || {}))
            .filter((record) => !isDeletedAccountRecord(record)), riderFullName)
    };
}

function listenFirestoreCollectionRecords(name, render) {
    return firebaseOnSnapshot(
        firestoreCollectionRef(name),
        (snapshot) => render(firestoreSnapshotRecords(snapshot)),
        (error) => {
            console.error(`Firestore listener failed for ${name}`, error);
            render([], error);
        }
    );
}

function buildAccountFromFirebaseRecords(uid, email, user = {}, roleData = {}) {
    const role = normalizedAccountRole(user.role);
    const userEmail = email || user.email || '';
    const username = user.username || titleCaseName(userEmail.split('@')[0]);

    if (role === 'admin') {
        return {
            USER_id: uid,
            USER_role: 'admin',
            USER_email: userEmail,
            USER_linkedId: uid,
            USER_displayName: username || 'Admin',
            USER_status: titleStatus(user.status, 'Active')
        };
    }

    if (role === 'seller') {
        const merchant = firebaseMerchantRecord(uid, roleData, user);
        return {
            USER_id: uid,
            USER_role: 'seller',
            USER_email: userEmail,
            USER_linkedId: uid,
            USER_displayName: username || merchant.MERCH_name,
            USER_status: titleStatus(user.status, merchant.MERCH_approvalStatus),
            ...merchant
        };
    }

    if (role === 'rider') {
        const rider = firebaseRiderRecord(uid, roleData, user);
        return {
            USER_id: uid,
            USER_role: 'rider',
            USER_email: userEmail,
            USER_linkedId: uid,
            USER_displayName: username || riderFullName(rider),
            USER_status: titleStatus(user.status, rider.SHOP_employmentStatus),
            ...rider
        };
    }

    const firstName = roleData.firstName || '';
    const lastName = roleData.lastName || '';
    const address = cleanAddressPart(roleData.address || '');
    return {
        USER_id: uid,
        USER_role: 'customer',
        USER_email: userEmail,
        USER_linkedId: uid,
        USER_displayName: fullNameFromParts(firstName, lastName) || username || 'Customer',
        USER_firstName: firstName,
        USER_lastName: lastName,
        USER_phone: roleData.phone || '',
        USER_city: deriveServiceCityFromAddress(address) || '',
        USER_address: address,
        USER_status: titleStatus(user.status, 'Active'),
        profileImageUrl: roleData.profileImageUrl || ''
    };
}

async function accountFromFirebaseUser(firebaseUser, options = {}) {
    if (!firebaseUser?.uid) {
        return null;
    }

    let userSnapshot = await firebaseGetDoc(firebaseUserDoc(firebaseUser.uid));
    let user = userSnapshot.exists() ? userSnapshot.data() : null;

    if (!user && firebaseUser.email === adminAccount.USER_email && options.allowAdminBootstrap) {
        user = {
            email: firebaseUser.email,
            username: 'Admin',
            role: 'admin',
            status: 'active',
            createdAt: firebaseServerTimestamp()
        };
        await firebaseSetDoc(firebaseUserDoc(firebaseUser.uid), user);
        userSnapshot = await firebaseGetDoc(firebaseUserDoc(firebaseUser.uid));
        user = userSnapshot.exists() ? userSnapshot.data() : user;
    }

    if (!user) {
        return null;
    }

    const role = normalizedAccountRole(user.role);
    let roleData = {};
    if (['customer', 'seller', 'rider'].includes(role)) {
        const roleSnapshot = await firebaseGetDoc(firebaseRoleDoc(role, firebaseUser.uid));
        roleData = roleSnapshot.exists() ? roleSnapshot.data() : {};
    }

    return buildAccountFromFirebaseRecords(firebaseUser.uid, firebaseUser.email || user.email || '', user, roleData);
}

function saveRoleStorageForAccount(account) {
    if (!account) {
        return;
    }

    const linkedId = accountLinkedId(account);
    const role = accountRole(account);
    if (role === 'customer') {
        saveLocal(storageKeys.customerId, linkedId);
        saveLocal(storageKeys.customerEmail, accountEmail(account));
    }
    if (role === 'seller') {
        saveLocal(storageKeys.merchantId, linkedId);
        saveLocal(storageKeys.sellerApplication, linkedId);
    }
    if (role === 'rider') {
        saveLocal(storageKeys.shopperId, linkedId);
        saveLocal(storageKeys.riderApplication, linkedId);
    }
}

async function syncCurrentAccountFromFirebase(firebaseUser, options = {}) {
    const account = await accountFromFirebaseUser(firebaseUser, options);
    if (account) {
        setCurrentAccount(account);
        saveRoleStorageForAccount(account);
    }
    return account;
}

let firebaseAuthReadyPromise = null;

function startFirebaseAuthStateSync() {
    if (firebaseAuthReadyPromise) {
        return firebaseAuthReadyPromise;
    }

    firebaseAuthReadyPromise = new Promise((resolve) => {
        let resolved = false;
        onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const account = await accountFromFirebaseUser(firebaseUser, {
                        allowAdminBootstrap: firebaseUser.email === adminAccount.USER_email
                    });
                    if (account && (isDeletedAccountRecord(account) || accountApprovalMessage(account))) {
                        await signOut(firebaseAuth).catch(() => {});
                        clearCurrentAccount();
                    } else if (account) {
                        setCurrentAccount(account);
                        saveRoleStorageForAccount(account);
                    }
                } else if (getCurrentAccount()) {
                    clearCurrentAccount();
                }
            } catch (error) {
                console.error('Firebase auth state sync failed', error);
            } finally {
                renderAuthChrome(getCurrentAccount());
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            }
        });
    });

    return firebaseAuthReadyPromise;
}

function firebaseAuthMessage(error) {
    const code = String(error?.code || '');
    if (code === 'auth/email-already-in-use') {
        return 'This email already has an honestbee account.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return 'Account was not found or password is incorrect.';
    }
    if (code === 'auth/too-many-requests') {
        return 'Too many sign in attempts. Try again later.';
    }
    if (code === 'auth/network-request-failed') {
        return 'Network connection failed. Check your connection and try again.';
    }
    return error?.message || 'Firebase Authentication request failed.';
}

function accountApprovalMessage(account) {
    const role = accountRole(account);
    if (role === 'seller') {
        if (account.MERCH_approvalStatus === 'Pending') {
            return pendingApprovalMessage;
        }
        if (account.MERCH_approvalStatus === 'Rejected') {
            return 'Your merchant application has been rejected.';
        }
    }
    if (role === 'rider') {
        if (account.SHOP_employmentStatus === 'Pending') {
            return pendingApprovalMessage;
        }
        if (account.SHOP_employmentStatus === 'Inactive') {
            return 'Your rider application has been rejected.';
        }
    }
    return '';
}

function isDeletedAccountRecord(record) {
    return roleLower(record?.USER_status || record?.status) === 'deleted';
}

function accountEmail(account) {
    return account?.USER_email || '';
}

function accountLinkedId(account) {
    return account?.USER_linkedId || '';
}

function isCustomerAccount(account = getCurrentAccount()) {
    return accountRole(account) === 'customer';
}

function isSellerApproved(account = getCurrentAccount()) {
    return accountRole(account) === 'seller' && account?.MERCH_approvalStatus === 'Approved';
}

function isRiderActive(account = getCurrentAccount()) {
    return accountRole(account) === 'rider' && account?.SHOP_employmentStatus === 'Active';
}

function accountPreferenceKey(key, account = getCurrentAccount()) {
    const email = accountEmail(account);
    return email ? `${key}_${email}` : key;
}

function readPreference(key, fallback = '', account = getCurrentAccount()) {
    return readLocal(accountPreferenceKey(key, account)) || readLocal(key) || fallback;
}

function savePreference(key, value, account = getCurrentAccount()) {
    saveLocal(accountPreferenceKey(key, account), value);
    if (!accountEmail(account)) {
        saveLocal(key, value);
    }
}

function applyStickyLanguageForAccount(account = getCurrentAccount()) {
    if (!accountEmail(account)) {
        return;
    }

    const sticky = readLocal(accountPreferenceKey(storageKeys.languageSticky, account)) === 'on';
    const language = readLocal(accountPreferenceKey(storageKeys.language, account));
    if (sticky && language) {
        saveLocal(storageKeys.language, language);
        translatePage(language);
    }
}

function signInNoticeMessage(value) {
    const key = String(value || '').toLowerCase().replace(/[^a-z-]/g, '');
    if (key === 'application-submitted') {
        return partnerApplicationSubmittedMessage;
    }
    if (key === 'pending-approval') {
        return pendingApprovalMessage;
    }
    return '';
}

function signInModalUrl(noticeKey = '') {
    const target = /\.php$/i.test(location.pathname) ? 'index.php' : 'index.html';
    const params = new URLSearchParams({ modal: 'signin' });
    if (noticeKey) {
        params.set('notice', noticeKey);
    }
    return `${target}?${params.toString()}`;
}

function setSignInNotice(message, isError = false) {
    const notice = $('[data-account-modal="signin"] [data-login-notice]') || $('[data-login-notice]');
    setNotice(notice, message, isError);
}

function openSignInModalWithNotice(message, isError = false) {
    const opened = openAccountModal('signin');
    if (!opened) {
        return false;
    }
    setSignInNotice(message, isError);
    return true;
}

function redirectToPendingSignIn() {
    signOut(firebaseAuth).catch(() => {}).finally(() => {
        clearCurrentAccount();
        renderAuthChrome(null);
        location.href = signInModalUrl('pending-approval');
    });
}

function dashboardForAccount(account) {
    const role = accountRole(account);

    if (role === 'admin') {
        return 'admin-dashboard.html';
    }

    if (role === 'seller') {
        return account?.MERCH_approvalStatus === 'Approved'
            ? 'seller-dashboard.html'
            : signInModalUrl('pending-approval');
    }

    if (role === 'rider') {
        return account?.SHOP_employmentStatus === 'Active'
            ? 'rider-dashboard.html'
            : signInModalUrl('pending-approval');
    }

    if (role === 'customer') {
        return 'customer-dashboard.html';
    }

    return 'index.html?modal=signin';
}

function requireSignedRole(allowedRoles) {
    const account = getCurrentAccount();
    const role = accountRole(account);

    if (!account || !allowedRoles.includes(role)) {
        location.href = account ? dashboardForAccount(account) : 'index.html?modal=signin';
        return null;
    }

    return account;
}

function isCurrentAdminAccount(account) {
    return accountRole(account) === 'admin'
        && account?.USER_status === 'Active'
        && accountEmail(account) === adminAccount.USER_email;
}

function currentProtectedPageRequirement() {
    const page = document.body?.dataset.page || '';

    if (page === 'admin' && $('[data-admin-dashboard]')) {
        return {
            page,
            allowed: (account) => isCurrentAdminAccount(account),
            redirectTarget: (account) => (
                account && accountRole(account) !== 'admin'
                    ? dashboardForAccount(account)
                    : 'index.html?modal=signin'
            )
        };
    }

    if (page === 'customer' && $('[data-customer-dashboard]')) {
        return {
            page,
            allowed: (account) => accountRole(account) === 'customer',
            redirectTarget: (account) => (account ? dashboardForAccount(account) : 'index.html?modal=signin')
        };
    }

    if (page === 'seller' && $('[data-seller-dashboard]')) {
        return {
            page,
            allowed: (account) => accountRole(account) === 'seller',
            redirectTarget: (account) => (account ? dashboardForAccount(account) : 'index.html?modal=signin')
        };
    }

    if (page === 'rider' && $('[data-rider-dashboard]')) {
        return {
            page,
            allowed: (account) => accountRole(account) === 'rider',
            redirectTarget: (account) => (account ? dashboardForAccount(account) : 'index.html?modal=signin')
        };
    }

    return null;
}

function enforceProtectedPageAccess({ replace = false } = {}) {
    const requirement = currentProtectedPageRequirement();
    if (!requirement) {
        return true;
    }

    const account = getCurrentAccount();
    if (requirement.allowed(account)) {
        return true;
    }

    const target = requirement.redirectTarget(account);
    if (replace) {
        location.replace(target);
    } else {
        location.href = target;
    }
    return false;
}

function setNotice(node, message, isError = false) {
    if (!node) {
        return;
    }

    node.textContent = translateValue(message, readPreference(storageKeys.language, 'english'));
    node.classList.add('is-visible');
    node.classList.toggle('is-error', isError);
}

function clearNotice(node) {
    if (!node) {
        return;
    }

    node.textContent = '';
    node.classList.remove('is-visible', 'is-error');
}

function clearFieldError(input) {
    if (!input) {
        return;
    }

    input.classList.remove('is-invalid', 'is-password-mismatch');
    input.removeAttribute('aria-invalid');
    const errorContainer = input.closest('.password-input-wrap')?.parentElement || input.parentElement;
    errorContainer?.querySelector('.field-error-message')?.remove();
}

function showFieldError(input, message, options = {}) {
    if (!input) {
        return;
    }

    const shouldFocus = options.focus !== false;
    const errorContainer = input.closest('.password-input-wrap')?.parentElement || input.parentElement;
    clearFieldError(input);
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    const errorNode = document.createElement('span');
    errorNode.className = 'field-error-message';
    errorNode.textContent = translateValue(message, readPreference(storageKeys.language, 'english'));
    errorContainer?.append(errorNode);
    if (shouldFocus) {
        input.focus();
    }
}

function fullNameFromParts(firstName, lastName) {
    return [firstName, lastName]
        .map((value) => String(value || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(' ');
}

function splitFullName(value) {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return { firstName: '', lastName: '' };
    }

    const [firstName, ...lastNameParts] = normalized.split(' ');
    return {
        firstName,
        lastName: lastNameParts.join(' ')
    };
}

function normalizeServiceCity(value) {
    const normalized = String(value || '')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    return serviceCityAliases.get(normalized) || '';
}

function assertServiceCity(input, label = 'City') {
    const value = normalizeServiceCity(input?.value ?? input);
    if (!value || !serviceCities.includes(value)) {
        const message = `${label} must be Cebu City, Lapu-Lapu, Mandaue, Consolacion, or Talisay.`;
        if (input?.tagName) {
            showFieldError(input, message);
        }
        throw new Error(message);
    }

    if (input?.tagName) {
        input.value = value;
        clearFieldError(input);
    }

    return value;
}

function deriveServiceCityFromAddress(value) {
    const normalized = String(value || '')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    if (!normalized) {
        return '';
    }

    const directCity = normalizeServiceCity(normalized);
    if (directCity) {
        return directCity;
    }

    const aliases = [...serviceCityAliases.entries()].sort((first, second) => second[0].length - first[0].length);
    const matchedAlias = aliases.find(([alias]) => {
        const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z])${escapedAlias}([^a-z]|$)`, 'i').test(normalized);
    });

    return matchedAlias?.[1] || '';
}

function cleanAddressPart(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .replace(/\s+,/g, ',')
        .trim();
}

function normalizeAddressParts(parts = {}) {
    const cityMunicipal = cleanAddressPart(
        parts.cityMunicipal
        || parts.city
        || parts.town
        || parts.municipality
        || ''
    );
    const street = cleanAddressPart(parts.street || parts.road || parts.name || '');
    const barangay = cleanAddressPart(parts.barangay || parts.suburb || parts.neighbourhood || parts.village || '');
    const combined = [street, barangay, cityMunicipal, parts.address].filter(Boolean).join(', ');
    const city = normalizeServiceCity(parts.city || cityMunicipal) || deriveServiceCityFromAddress(combined);

    return {
        street,
        barangay,
        cityMunicipal,
        province: 'Cebu',
        city
    };
}

function formatCebuAddress(parts = {}, fallback = '') {
    const normalized = normalizeAddressParts(parts);
    const localPieces = [
        normalized.street,
        normalized.barangay,
        normalized.cityMunicipal || normalized.city
    ].filter(Boolean);

    return localPieces.length
        ? [...localPieces, 'Cebu'].join(', ')
        : cleanAddressPart(fallback);
}

function parseCebuAddress(value) {
    const fallback = cleanAddressPart(value);
    const rawParts = fallback.split(',').map(cleanAddressPart).filter(Boolean);
    const filteredParts = rawParts.filter((part, index) => {
        const isLast = index === rawParts.length - 1;
        return !(isLast && part.toLowerCase() === 'cebu');
    });
    const [street = '', barangay = '', cityMunicipal = ''] = filteredParts;
    const parts = normalizeAddressParts({
        street,
        barangay,
        cityMunicipal: cityMunicipal || deriveServiceCityFromAddress(fallback),
        address: fallback
    });
    const address = formatCebuAddress(parts, fallback);

    return {
        ...parts,
        address
    };
}

function addressRecordFromParts(parts = {}, options = {}) {
    const parsed = parseCebuAddress(parts.address || formatCebuAddress(parts));
    const normalized = normalizeAddressParts({
        ...parsed,
        ...parts
    });
    const address = formatCebuAddress(normalized, parsed.address || parts.address);

    return {
        id: options.id || parts.id || `address-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label: normalizeCustomerAddressLabel(options.label || parts.label || currentAddressLabel),
        address,
        street: normalized.street,
        barangay: normalized.barangay,
        cityMunicipal: normalized.cityMunicipal,
        province: 'Cebu',
        city: normalized.city || deriveServiceCityFromAddress(address),
        lat: Number.isFinite(Number(parts.lat)) ? Number(parts.lat) : null,
        lng: Number.isFinite(Number(parts.lng)) ? Number(parts.lng) : null,
        isDefault: Boolean(options.isDefault ?? parts.isDefault)
    };
}

function normalizeCustomerAddressLabel(label) {
    return label === legacyDefaultAddressLabel ? currentAddressLabel : (label || currentAddressLabel);
}

function customerAddressRowLabel(address = {}) {
    return address.isDefault ? legacyDefaultAddressLabel : normalizeCustomerAddressLabel(address.label);
}

function customerAddressDetailLabel(address = {}) {
    return address.isDefault ? currentAddressLabel : normalizeCustomerAddressLabel(address.label);
}

function readAddressPickerField(container, options = {}) {
    const field = container?.closest?.('[data-address-picker-field]') || container;
    const input = $('[data-address-input]', field);
    const partsInput = $('[data-address-parts]', field);
    let parts = {};

    try {
        parts = JSON.parse(partsInput?.value || '{}');
    } catch (error) {
        parts = {};
    }

    const record = addressRecordFromParts({
        ...parts,
        address: input?.value || parts.address || ''
    }, options);

    if (!record.address) {
        showFieldError(input, 'Enter the delivery address.');
        throw new Error('Enter the delivery address.');
    }
    if (!record.city || !serviceCities.includes(record.city)) {
        const message = 'Choose a delivery address in Cebu City, Lapu-Lapu, Mandaue, Consolacion, or Talisay.';
        showFieldError(input, message);
        throw new Error(message);
    }

    fillAddressPickerField(field, record);
    return record;
}

function fillAddressPickerField(container, record = {}) {
    const field = container?.closest?.('[data-address-picker-field]') || container;
    if (!field) {
        return;
    }

    const normalized = addressRecordFromParts(record, {
        id: record.id,
        label: record.label,
        isDefault: record.isDefault
    });
    const input = $('[data-address-input]', field);
    const cityInput = $('[data-address-city]', field);
    const partsInput = $('[data-address-parts]', field);
    const preview = $('[data-address-preview]', field);

    if (input) {
        input.value = normalized.address;
        clearFieldError(input);
    }
    if (cityInput) {
        cityInput.value = normalized.city;
    }
    if (partsInput) {
        partsInput.value = JSON.stringify(normalized);
    }
    if (preview) {
        preview.textContent = normalized.address || 'Street, Barangay, City/Municipal, Cebu';
    }
}

function customerAddressStorageKey(account = getCurrentAccount()) {
    const email = typeof account === 'string' ? account : accountEmail(account);
    return email ? `${storageKeys.customerAddresses}_${slugify(email)}` : storageKeys.customerAddresses;
}

function normalizeCustomerAddressRecord(record = {}, index = 0) {
    const normalized = addressRecordFromParts(record, {
        id: record.id || `address-${index + 1}`,
        label: normalizeCustomerAddressLabel(record.label || (record.isDefault ? currentAddressLabel : 'Home')),
        isDefault: Boolean(record.isDefault)
    });

    return {
        ...normalized,
        label: normalizeCustomerAddressLabel(record.label || normalized.label)
    };
}

function accountAddressRecord(account = getCurrentAccount()) {
    const address = cleanAddressPart(account?.USER_address || account?.CUST_address || account?.address || '');
    if (!address) {
        return null;
    }

    return addressRecordFromParts({
        address,
        city: normalizeServiceCity(account?.USER_city || account?.CUST_city || account?.city) || deriveServiceCityFromAddress(address)
    }, {
        id: 'registered-address',
        label: currentAddressLabel,
        isDefault: true
    });
}

function readCustomerAddresses(account = getCurrentAccount()) {
    const key = customerAddressStorageKey(account);
    let addresses = [];

    try {
        addresses = JSON.parse(readLocal(key) || '[]');
    } catch (error) {
        addresses = [];
    }

    addresses = addresses
        .filter((address) => address?.address)
        .map(normalizeCustomerAddressRecord);

    const registeredAddress = accountAddressRecord(account);
    if (!addresses.length && registeredAddress) {
        addresses = [registeredAddress];
        saveLocal(key, JSON.stringify(addresses));
    }

    if (addresses.length && !addresses.some((address) => address.isDefault)) {
        addresses[0].isDefault = true;
        addresses[0].label = normalizeCustomerAddressLabel(addresses[0].label || currentAddressLabel);
    }

    return addresses;
}

function saveCustomerAddresses(account = getCurrentAccount(), addresses = []) {
    const normalized = addresses
        .filter((address) => address?.address)
        .map(normalizeCustomerAddressRecord);
    const defaultIndex = normalized.findIndex((address) => address.isDefault);

    if (normalized.length && defaultIndex === -1) {
        normalized[0].isDefault = true;
    }

    saveLocal(customerAddressStorageKey(account), JSON.stringify(normalized));
    return normalized;
}

function defaultCustomerAddress(account = getCurrentAccount()) {
    const addresses = readCustomerAddresses(account);
    return addresses.find((address) => address.isDefault) || addresses[0] || accountAddressRecord(account);
}

function userFullName(record) {
    return fullNameFromParts(record?.USER_firstName, record?.USER_lastName)
        || String(record?.USER_fullName || record?.USER_displayName || '').trim();
}

function merchantOwnerName(record) {
    return fullNameFromParts(record?.MERCH_ownerFirstName, record?.MERCH_ownerLastName)
        || String(record?.MERCH_ownerName || '').trim();
}

function riderFullName(record) {
    return fullNameFromParts(record?.SHOP_firstName || record?.RIDER_firstName, record?.SHOP_lastName || record?.RIDER_lastName)
        || String(record?.SHOP_fullName || record?.RIDER_fullName || '').trim();
}

const allowedEmailDomains = ['gmail.com'];

function emailValidationMessage(value, validity = null) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
        return 'Enter a valid email address.';
    }

    if (!normalized.includes('@')) {
        return 'Email address should include @.';
    }

    if (validity?.typeMismatch) {
        return 'Enter a valid email address.';
    }

    if (normalized === adminAccount.USER_email) {
        return '';
    }

    const parts = normalized.split('@');
    const domain = parts[1] || '';
    if (parts.length !== 2 || !parts[0] || !domain) {
        return 'Enter a valid email address.';
    }

    if (!allowedEmailDomains.includes(domain)) {
        return 'Use gmail.com after @.';
    }

    return '';
}

function assertEmailAddress(input) {
    const value = String(input?.value ?? input ?? '').trim().toLowerCase();
    const message = emailValidationMessage(value, input?.validity);

    if (message) {
        if (input?.tagName) {
            input.setCustomValidity(message);
            showFieldError(input, message);
        }
        throw new Error(message);
    }

    if (input?.tagName) {
        input.setCustomValidity('');
        clearFieldError(input);
        input.value = value;
    }

    return value;
}

function phoneDigits(value, limitLength = false) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return limitLength ? digits.slice(0, 11) : digits;
}

function normalizePhoneInput(input) {
    if (!input) {
        return '';
    }

    const digits = phoneDigits(input.value, true);
    if (input.value !== digits) {
        input.value = digits;
    }

    return digits;
}

function assertPhoneNumber(input) {
    if (!input) {
        return '';
    }

    const value = phoneDigits(input.value);
    if (value.length !== 11) {
        const message = 'Phone number should be exactly 11 numbers.';
        showFieldError(input, message);
        throw new Error(message);
    }

    input.value = value;
    clearFieldError(input);
    return value;
}

function passwordRequirementState(value) {
    const password = String(value || '');
    return {
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[^A-Za-z0-9]/.test(password),
        hasValidLength: password.length > 8 && password.length <= 30
    };
}

function passwordRequirementsMet(value) {
    const state = passwordRequirementState(value);
    return Object.values(state).every(Boolean);
}

function passwordRequirementNote(input) {
    return input?.closest('label')?.querySelector('[data-password-note]') || null;
}

function passwordStrengthState(value) {
    const length = String(value || '').length;
    if (length === 0) {
        return {
            level: '',
            message: '',
            width: 0
        };
    }

    if (length < 8) {
        return {
            level: 'short',
            message: '',
            width: Math.max(8, Math.min(64, (length / 11) * 100))
        };
    }

    if (length <= 10) {
        return {
            level: 'weak',
            message: 'Weak password',
            width: Math.min(92, (length / 11) * 100)
        };
    }

    return {
        level: 'strong',
        message: 'Strong password',
        width: 100
    };
}

function updatePasswordStrengthMeter(input) {
    const meter = input?.closest('label')?.querySelector('[data-password-strength]');
    if (!meter) {
        return;
    }

    const state = passwordStrengthState(input.value);
    const fill = $('[data-password-strength-fill]', meter);
    const status = $('[data-password-strength-status]', meter);
    meter.dataset.strength = state.level;
    if (fill) {
        fill.style.width = `${state.width}%`;
    }
    if (status) {
        const language = readPreference(storageKeys.language, 'english');
        status.textContent = state.message ? translateValue(state.message, language) : '';
    }
}

function updatePasswordRequirementNote(input, forceWarning = false) {
    updatePasswordStrengthMeter(input);

    const note = passwordRequirementNote(input);
    if (!note) {
        return;
    }

    const value = String(input?.value || '');
    const isValid = passwordRequirementsMet(value);
    const shouldWarn = forceWarning || (value.length > 0 && !isValid);
    note.classList.toggle('is-warning', shouldWarn && !isValid);
    note.classList.toggle('is-valid', isValid);
}

function assertStrongPassword(input) {
    const value = String(input?.value ?? input ?? '');
    const message = 'Password must be more than 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.';

    if (!passwordRequirementsMet(value)) {
        if (input?.tagName) {
            input.classList.add('is-invalid');
            input.setAttribute('aria-invalid', 'true');
            updatePasswordRequirementNote(input, true);
            input.focus();
        }
        throw new Error(message);
    }

    if (input?.tagName) {
        clearFieldError(input);
        updatePasswordRequirementNote(input);
    }

    return value;
}

const passwordMismatchMessage = 'Passwords do not match.';

function updateCustomerSignupPasswordMatch(form, { force = false } = {}) {
    const passwordInput = form?.elements?.password;
    const confirmInput = form?.elements?.confirmPassword;
    if (!passwordInput || !confirmInput) {
        return true;
    }

    const password = String(passwordInput.value || '');
    const confirmation = String(confirmInput.value || '');
    const isMismatch = Boolean(confirmation || force) && password !== confirmation;

    if (isMismatch) {
        showFieldError(confirmInput, passwordMismatchMessage, { focus: false });
        confirmInput.classList.add('is-password-mismatch');
        return false;
    }

    clearFieldError(confirmInput);
    return true;
}

function updateAccountSettingsPasswordMatch(section, { force = false } = {}) {
    const passwordInput = $('[data-password-field="new"]', section);
    const confirmInput = $('[data-password-field="confirm"]', section);
    if (!passwordInput || !confirmInput) {
        return true;
    }

    const password = String(passwordInput.value || '');
    const confirmation = String(confirmInput.value || '');
    const isMismatch = Boolean(confirmation || force) && password !== confirmation;

    if (isMismatch) {
        showFieldError(confirmInput, passwordMismatchMessage, { focus: false });
        confirmInput.classList.add('is-password-mismatch');
        return false;
    }

    clearFieldError(confirmInput);
    return true;
}

function assertMatchingPassword(password, input) {
    const confirmation = String(input?.value ?? input ?? '');

    if (password !== confirmation) {
        if (input?.tagName) {
            showFieldError(input, passwordMismatchMessage);
            input.classList.add('is-password-mismatch');
        }
        throw new Error(passwordMismatchMessage);
    }

    if (input?.tagName) {
        clearFieldError(input);
    }

    return confirmation;
}

function cardDigits(value, maxLength = 19) {
    return String(value ?? '').replace(/\D/g, '').slice(0, maxLength);
}

function normalizeCardNumberInput(input) {
    if (!input) {
        return '';
    }

    const digits = cardDigits(input.value);
    input.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return digits;
}

function normalizeCardExpiryInput(input) {
    if (!input) {
        return '';
    }

    const digits = cardDigits(input.value, 4);
    input.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    return input.value;
}

function normalizeCardCvcInput(input) {
    if (!input) {
        return '';
    }

    input.value = cardDigits(input.value, 4);
    return input.value;
}

function imageFileFromInput(input, label = 'Image') {
    const file = input?.files?.[0] || null;
    if (!file) {
        const message = `${label} is required.`;
        showFieldError(input, message);
        throw new Error(message);
    }

    if (!String(file.type || '').startsWith('image/')) {
        const message = `${label} must be an image file.`;
        showFieldError(input, message);
        throw new Error(message);
    }

    clearFieldError(input);
    return file;
}

function validateImageInput(input, label = 'Image') {
    if (!input?.files?.length) {
        clearFieldError(input);
        return null;
    }

    return imageFileFromInput(input, label);
}

function imageUploadLabel(input) {
    if (input?.name === 'businessProof') {
        return 'Business Permit / Proof of Merchant';
    }
    if (input?.name === 'validId') {
        return 'Valid ID / Driver\'s License';
    }
    if (input?.name === 'productImage') {
        return 'Product Image';
    }
    if (input?.name === 'gcashProof') {
        return 'Proof of Payment';
    }

    return 'Image';
}

async function uploadImageInput(input, category, label = 'Image') {
    imageFileFromInput(input, label);
    const message = `${label} upload is disabled in this Firebase Firestore-only version. Firebase Storage can be added later.`;
    showFieldError(input, message);
    throw new Error(message);
}

async function uploadOptionalImageInput(input, category, label = 'Image', fallback = '') {
    if (!input?.files?.length) {
        clearFieldError(input);
        return fallback;
    }

    return uploadImageInput(input, category, label);
}

function isValidCardExpiry(value) {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})$/);
    if (!match) {
        return false;
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) {
        return false;
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cardExpiry = new Date(year, month, 1);
    return cardExpiry > currentMonthStart;
}

function assertCardPaymentDetails(form) {
    const nameInput = form?.elements.cardName;
    const numberInput = form?.elements.cardNumber;
    const expiryInput = form?.elements.cardExpiry;
    const cvcInput = form?.elements.cardCvc;
    const cardholderName = String(nameInput?.value || '').trim();
    const cardNumber = normalizeCardNumberInput(numberInput);
    const expiry = normalizeCardExpiryInput(expiryInput);
    const cvc = normalizeCardCvcInput(cvcInput);

    if (!cardholderName) {
        const message = 'Enter the cardholder name.';
        showFieldError(nameInput, message);
        throw new Error(message);
    }

    clearFieldError(nameInput);

    if (cardNumber.length < 13 || cardNumber.length > 19) {
        const message = 'Card number should contain 13 to 19 digits.';
        showFieldError(numberInput, message);
        throw new Error(message);
    }

    clearFieldError(numberInput);

    if (!isValidCardExpiry(expiry)) {
        const message = 'Card expiry should use MM/YY.';
        showFieldError(expiryInput, message);
        throw new Error(message);
    }

    clearFieldError(expiryInput);

    if (!/^\d{3,4}$/.test(cvc)) {
        const message = 'Card CVC should contain 3 or 4 digits.';
        showFieldError(cvcInput, message);
        throw new Error(message);
    }

    clearFieldError(cvcInput);

    return {
        cardholderName,
        expiry,
        last4: cardNumber.slice(-4)
    };
}

function normalizeGcashReferenceInput(input) {
    if (!input) {
        return '';
    }

    const digits = String(input.value || '').replace(/\D/g, '');
    if (input.value !== digits) {
        input.value = digits;
    }

    return digits;
}

function readGcashPaymentDetails(form) {
    const referenceInput = form?.elements.gcashReference;
    const proofInput = form?.elements.gcashProof;
    const reference = normalizeGcashReferenceInput(referenceInput);

    if (!reference) {
        const message = 'Enter GCash Reference Number.';
        showFieldError(referenceInput, message);
        throw new Error(message);
    }

    clearFieldError(referenceInput);

    // TODO: Add Firebase Storage later for GCash proof uploads.
    // Phase 3 does not upload the optional proof file, because this project uses Firestore only.
    if (proofInput?.files?.length) {
        validateImageInput(proofInput, 'Proof of Payment');
    } else {
        clearFieldError(proofInput);
    }

    return {
        reference,
        proofPath: '',
        proofImageUrl: ''
    };
}

async function uploadGcashPaymentProof(details) {
    // TODO: Enable this only when Firebase Storage is available.
    return details || null;
}

function preferredThemeMode() {
    return readPreference(storageKeys.themeMode, 'light');
}

function currentThemeIsDark(mode = preferredThemeMode()) {
    return mode === 'dark'
        || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function applyThemeMode(mode = preferredThemeMode()) {
    document.documentElement.classList.toggle('theme-dark', currentThemeIsDark(mode));
    syncThemeToggles();
}

function homeFeatureKey(feature) {
    return `${storageKeys.homepagePrefix}${feature}`;
}

function isHomeFeatureVisible(feature) {
    return readPreference(homeFeatureKey(feature), 'on') !== 'off';
}

function applyHomepagePreferences() {
    $$('[data-home-feature]').forEach((node) => {
        const feature = node.dataset.homeFeature;
        node.hidden = !isHomeFeatureVisible(feature);
    });
}

const languageMap = {
    filipino: {
        'honestbee': 'honestbee',
        'get groceries': 'bumili ng grocery',
        'fast': 'nang mabilis',
        'Over 15,000 products from your favourite merchants': 'Mahigit 15,000 produkto mula sa paborito mong merchants',
        'Enjoy same day delivery in one hour': 'Mag-enjoy ng same-day delivery sa loob ng isang oras',
        'Trained shoppers handpick products for top quality': 'Sanay na shoppers ang pumipili ng de-kalidad na produkto',
        'FREE DELIVERY': 'LIBRENG DELIVERY',
        'for first order above PHP 500': 'para sa unang order na higit PHP 500',
        'Sign in': 'Mag-sign in',
        'Sign up': 'Mag-sign up',
        'Sign In': 'Mag-sign in',
        'Sign Up': 'Mag-sign up',
        'Welcome back to honestbee.': 'Welcome back sa honestbee.',
        'Account': 'Account',
        'Sign in details': 'Sign in details',
        'Create a customer account.': 'Gumawa ng customer account.',
        'Merchant and rider accounts use the application links in the navigation.': 'Ginagamit ng merchant at rider accounts ang application links sa navigation.',
        'Customer Account': 'Customer Account',
        'Sign up details': 'Sign up details',
        'Email': 'Email',
        'Password': 'Password',
        'Confirm Password': 'Kumpirmahin ang Password',
        'Merchant Application': 'Merchant Application',
        'Apply as an honestbee merchant.': 'Mag-apply bilang honestbee merchant.',
        'Your merchant account stays pending until the honestbee admin validates your merchant details.': 'Mananatiling pending ang merchant account hanggang ma-validate ng honestbee admin ang merchant details mo.',
        'Business profile': 'Business profile',
        'Personal Information': 'Personal Information',
        'Business Information': 'Business Information',
        'Owner Full Name': 'Buong Pangalan ng Owner',
        'Owner First Name': 'Pangalan ng Owner',
        'Owner Last Name': 'Apelyido ng Owner',
        'Owner Email Address': 'Email Address ng Owner',
        'City': 'Lungsod',
        'Select city': 'Pumili ng lungsod',
        'Merchant Name': 'Pangalan ng Merchant',
        'Select merchant type': 'Pumili ng merchant type',
        'Business Permit / Proof of Merchant': 'Business Permit / Proof of Merchant',
        'Permit number, document name, or proof link': 'Permit number, document name, o proof link',
        'Submit Merchant Application': 'Ipasa ang Merchant Application',
        'Rider Application': 'Rider Application',
        'Apply as an honestbee rider.': 'Mag-apply bilang honestbee rider.',
        'Application details': 'Application details',
        'Delivery Information': 'Delivery Information',
        'Select vehicle type': 'Pumili ng vehicle type',
        'Valid ID / Driver\'s License': 'Valid ID / Driver\'s License',
        'ID number, document name, or proof link': 'ID number, document name, o proof link',
        'Submit Rider Application': 'Ipasa ang Rider Application',
        'Browse merchants': 'Tingnan ang merchants',
        'Shop and Save!': 'Mamili at Makatipid!',
        'New customers: PHP 300 OFF / Code BEEHSBC30': 'Bagong customers: PHP 300 OFF / Code BEEHSBC30',
        'Existing customers: PHP 200 OFF / Code BEEHSBC20': 'Dating customers: PHP 200 OFF / Code BEEHSBC20',
        'Coupons are limited to the first 5000 redemptions.': 'Limitado ang coupons sa unang 5000 redemptions.',
        'Shop now': 'Mamili ngayon',
        'Merchants available for your area': 'Mga merchant na available sa iyong lugar',
        'Select a partner merchant to start shopping.': 'Pumili ng partner merchant para magsimulang mamili.',
        'Same listed price': 'Parehong listed price',
        'Earliest delivery: Today, 2pm to 3pm': 'Pinakamaagang delivery: Ngayon, 2pm hanggang 3pm',
        'Bestsellers': 'Pinakamabenta',
        'Browse groceries, food, and partner merchant products in the compact honestbee catalog style.': 'Tingnan ang groceries, pagkain, at produkto ng partner merchants sa compact honestbee catalog style.',
        'All': 'Lahat',
        'Groceries': 'Groceries',
        'Food': 'Pagkain',
        'Home': 'Home',
        'No matching items found.': 'Walang tumugmang produkto.',
        'Your cart': 'Iyong cart',
        'Your cart is empty.': 'Walang laman ang iyong cart.',
        'Subtotal': 'Subtotal',
        'Delivery': 'Delivery',
        'Service fee': 'Service fee',
        'Total': 'Kabuuan',
        'Checkout': 'Checkout',
        'Add': 'Idagdag',
        'Partner merchants and kitchens': 'Partner merchants at kitchens',
        'Grocery partners and restaurant counters with clear delivery times, fresh picks, and ready-to-eat meals.': 'Grocery partners at restaurant counters na may malinaw na delivery time, fresh picks, at ready-to-eat meals.',
        'Deals for today': 'Deals ngayong araw',
        'Promotions are grouped for grocery baskets, lunch orders, and scheduled delivery.': 'Nakaayos ang promos para sa grocery baskets, lunch orders, at scheduled delivery.',
        'Grocery bundle': 'Grocery bundle',
        'Save PHP 150 on fresh produce over PHP 1,200': 'Makatipid ng PHP 150 sa fresh produce na higit PHP 1,200',
        'Best for weekly fruit, vegetables, dairy, and pantry restocks.': 'Bagay para sa lingguhang fruit, gulay, dairy, at pantry restocks.',
        'Food delivery': 'Food delivery',
        'Free drink with selected lunch sets': 'Libreng inumin sa piling lunch sets',
        'Available from Bee Kitchen and Lazy Loaf Kitchen.': 'Available mula sa Bee Kitchen at Lazy Loaf Kitchen.',
        'Delivery window': 'Delivery window',
        'Schedule later and lower the delivery fee': 'Mag-schedule mamaya para bumaba ang delivery fee',
        'Pick a time slot that works for home or office deliveries.': 'Pumili ng oras na bagay sa home o office deliveries.',
        'Product description': 'Deskripsyon ng produkto',
        'Selected by your shopper from the merchant shelf, packed carefully, and delivered in your chosen time window.': 'Pinipili ng shopper mula sa merchant shelf, maingat na naka-pack, at dinadala sa napili mong oras.',
        'Instructions for your shopper': 'Instructions para sa iyong shopper',
        'Want your item a specific way? Let us know.': 'May gusto kang detalye para sa item? Sabihin mo sa amin.',
        'If it\'s out of stock': 'Kung out of stock',
        'Shopper bee can suggest': 'Maaaring mag-suggest ang shopper bee',
        'I\'ll choose a substitute now': 'Pipili ako ng kapalit ngayon',
        'I don\'t want a substitute': 'Ayaw ko ng kapalit',
        'Add to cart': 'Idagdag sa cart',
        'Store is currently closed': 'Sarado ang store sa ngayon',
        'Review your delivery details and place your order.': 'I-review ang delivery details at ilagay ang order.',
        'Customer name': 'Pangalan ng customer',
        'Customer email': 'Email ng customer',
        'Delivery address': 'Delivery address',
        'Select delivery time': 'Pumili ng oras ng delivery',
        'Select payment': 'Pumili ng payment',
        'Cash on delivery': 'Cash on delivery',
        'GCash': 'GCash',
        'GCash payment': 'GCash payment',
        'Enter GCash Reference Number:': 'Ilagay ang GCash Reference Number:',
        'Upload Proof of Payment:': 'Mag-upload ng Proof of Payment:',
        'Open proof of payment': 'Buksan ang proof of payment',
        'Proof of Payment': 'Proof of Payment',
        'Enter GCash Reference Number.': 'Ilagay ang GCash Reference Number.',
        'Upload Proof of Payment.': 'Mag-upload ng Proof of Payment.',
        'Uploading proof of payment...': 'Ina-upload ang proof of payment...',
        'Card details': 'Detalye ng card',
        'Used for this checkout only.': 'Gagamitin lang para sa checkout na ito.',
        'Cardholder Name': 'Pangalan sa card',
        'Card Number': 'Numero ng card',
        'Expiry': 'Expiry',
        'CVC': 'CVC',
        'Cancel': 'Kanselahin',
        'Place order': 'I-place ang order',
        'Confirm checkout': 'Kumpirmahin ang checkout',
        'Are you sure you want to place this order?': 'Sigurado ka bang gusto mong ilagay ang order na ito?',
        'Choose Yes to confirm, or No to review your checkout details.': 'Piliin ang Yes para kumpirmahin, o No para balikan ang checkout details.',
        'Order checked out successfully': 'Matagumpay na na-checkout ang order',
        'Your order': 'Ang iyong order',
        'has been sent to the merchant.': 'ay naipadala na sa merchant.',
        'Keep shopping': 'Magpatuloy mamili',
        'Cancel order': 'Kanselahin ang order',
        'Order saved.': 'Na-save ang order.',
        'Preferences for your honestbee experience.': 'Mga preference para sa iyong honestbee experience.',
        'Customer account': 'Account ng Customer',
        'Merchant account': 'Account ng Merchant',
        'Rider account': 'Account ng Rider',
        'Merchant settings unlock only after honestbee admin approval.': 'Mabubuksan lang ang merchant settings matapos ma-approve ng honestbee admin.',
        'Delivery settings unlock only when employment status is active.': 'Mabubuksan lang ang delivery settings kapag active ang employment status.',
        'Account Information': 'Impormasyon ng Account',
        'Full Name': 'Buong Pangalan',
        'Full name': 'Buong pangalan',
        'First Name': 'Pangalan',
        'First name': 'Pangalan',
        'Last Name': 'Apelyido',
        'Last name': 'Apelyido',
        'Email Address': 'Email Address',
        'Email address': 'Email address',
        'Phone Number': 'Numero ng Telepono',
        'Phone number': 'Numero ng telepono',
        'Delivery Address': 'Delivery Address',
        'Default Address': 'Default Address',
        'Current Address': 'Current Address',
        'Default delivery address': 'Default delivery address',
        'Add New Address': 'Magdagdag ng Address',
        'New address': 'Bagong address',
        'Edit address': 'I-edit ang address',
        'Delete address': 'Burahin ang address',
        'Payment Preferences': 'Payment Preferences',
        'Cash on Delivery': 'Cash on Delivery',
        'Card': 'Card',
        'Order Preferences': 'Order Preferences',
        'Allow substitutions': 'Payagan ang pamalit',
        'Yes': 'Oo',
        'No': 'Hindi',
        'Preferred delivery time': 'Gustong oras ng delivery',
        'Delivery instructions': 'Delivery instructions',
        'Leave notes for rider or shopper': 'Mag-iwan ng notes para sa rider o shopper',
        'Notifications': 'Notifications',
        'Order updates': 'Order updates',
        'Promotions': 'Promosyon',
        'Delivery alerts': 'Delivery alerts',
        'Privacy and Security': 'Privacy at Security',
        'Account Security': 'Account Security',
        'Current Password': 'Kasalukuyang Password',
        'New Password': 'Bagong Password',
        'Confirm New Password': 'Kumpirmahin ang Bagong Password',
        'Current password': 'Kasalukuyang password',
        'New password': 'Bagong password',
        'Confirm new password': 'Kumpirmahin ang bagong password',
        'Password needs 1 uppercase, 1 lowercase, 1 symbol, and 1 number. Max 30 characters.': 'Kailangan ng password ng 1 malaking titik, 1 maliit na titik, 1 simbolo, at 1 numero. Hanggang 30 characters.',
        'Password needs more than 8 characters, 1 uppercase, 1 lowercase, 1 symbol, and 1 number.': 'Kailangan ng password ng higit sa 8 characters, 1 malaking titik, 1 maliit na titik, 1 simbolo, at 1 numero.',
        'Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.': 'Kailangan ng password ng higit sa 8 characters at dapat may 1 malaking titik, 1 maliit na titik, 1 simbolo, at 1 numero.',
        'Password must include 1 uppercase letter, 1 lowercase letter, 1 number, 1 symbol, and be 30 characters or fewer.': 'Dapat may 1 malaking titik, 1 maliit na titik, 1 numero, 1 simbolo, at hanggang 30 characters lang ang password.',
        'Password must be more than 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.': 'Dapat higit sa 8 characters ang password at may 1 malaking titik, 1 maliit na titik, 1 numero, at 1 simbolo.',
        'Password do not match': 'Hindi magkapareho ang password.',
        'Passwords do not match.': 'Hindi magkapareho ang mga password.',
        'Password Strength': 'Password Strength',
        'Weak password': 'Mahinang password',
        'Strong password': 'Malakas na password',
        'Email address should include @.': 'Dapat may @ ang email address.',
        'Enter a valid email address.': 'Maglagay ng valid na email address.',
        'Use gmail.com after @.': 'Gamitin ang gmail.com pagkatapos ng @.',
        'Card number should contain 13 to 19 digits.': 'Dapat may 13 hanggang 19 na numero ang card number.',
        'Card expiry should use MM/YY.': 'Dapat MM/YY ang card expiry.',
        'Card CVC should contain 3 or 4 digits.': 'Dapat 3 o 4 na numero ang Card CVC.',
        'Enter the cardholder name.': 'Ilagay ang pangalan sa card.',
        'Logout': 'Mag-logout',
        'Apply': 'I-apply',
        'Merchant Profile': 'Merchant Profile',
        'Merchant Name': 'Pangalan ng Merchant',
        'Merchant Type': 'Uri ng Merchant',
        'Merchant name': 'Pangalan ng merchant',
        'Owner full name': 'Buong pangalan ng owner',
        'Owner first name': 'Pangalan ng owner',
        'Owner last name': 'Apelyido ng owner',
        'Owner email address': 'Email address ng owner',
        'Merchant Address': 'Address ng Merchant',
        'Merchant address': 'Address ng merchant',
        'Business Hours': 'Business Hours',
        'Opening Time': 'Oras ng pagbukas',
        'Closing Time': 'Oras ng pagsara',
        'Available Days': 'Available Days',
        'Monday to Saturday': 'Lunes hanggang Sabado',
        'Product Settings': 'Product Settings',
        'Manage product availability': 'Ayusin ang product availability',
        'Available': 'Available',
        'Unavailable': 'Unavailable',
        'Default product category': 'Default product category',
        'Low stock alert': 'Low stock alert',
        'Quantity': 'Quantity',
        'Order Settings': 'Order Settings',
        'Accept/Reject orders': 'Tanggapin/Tanggihan ang orders',
        'Manual review': 'Manual review',
        'Auto-accept': 'Auto-accept',
        'Preparation time': 'Preparation time',
        'Auto-close merchant if unavailable': 'Auto-close merchant kung unavailable',
        'Application Status': 'Application Status',
        'Approval Status: Pending/Approved/Rejected': 'Approval Status: Pending/Approved/Rejected',
        'Rider Profile': 'Rider Profile',
        'Current Location': 'Kasalukuyang Lokasyon',
        'Current location': 'Kasalukuyang lokasyon',
        'Vehicle Type': 'Uri ng Sasakyan',
        'Motorcycle': 'Motorsiklo',
        'Bicycle': 'Bisikleta',
        'Car': 'Kotse',
        'Availability': 'Availability',
        'Available / Unavailable': 'Available / Unavailable',
        'Current delivery area': 'Kasalukuyang delivery area',
        'Delivery Settings': 'Delivery Settings',
        'Maximum active orders': 'Maximum active orders',
        'Delivery status updates': 'Delivery status updates',
        'Manual': 'Manual',
        'Automatic reminders': 'Automatic reminders',
        'Navigation preference': 'Navigation preference',
        'In-app route': 'In-app route',
        'Employment Status: Pending/Active/Inactive': 'Employment Status: Pending/Active/Inactive',
        'Light Mode': 'Light Mode',
        'Dark Mode': 'Dark Mode',
        'System Default': 'System Default',
        'Language Settings': 'Language Settings',
        'Language': 'Wika',
        'English': 'English',
        'Filipino': 'Filipino',
        'Cebuano/Bisaya': 'Cebuano/Bisaya',
        'Stay this language until next login': 'Panatilihin ang wikang ito hanggang sa susunod na login',
        'Apply Language': 'I-apply ang Wika',
        'Language applied.': 'Na-apply ang wika.',
        'Dashboard': 'Dashboard',
        'Stores': 'Mga Tindahan',
        'Orders': 'Orders',
        'Recent Orders': 'Recent Orders',
        'Merchants': 'Mga Merchant',
        'Deals': 'Mga Deal',
        'More': 'More',
        'Settings': 'Mga Setting',
        'Apply as Merchant': 'Mag-apply bilang Merchant',
        'Apply as Rider': 'Mag-apply bilang Rider',
        'Orders, delivery tracking, ratings, and refunds.': 'Orders, delivery tracking, ratings, at refunds.',
        'Loading customer profile...': 'Nilo-load ang customer profile...',
        'Shop merchants': 'Mamili sa merchants',
        'Track order': 'I-track ang order',
        'Order history': 'Order history',
        'Recent orders': 'Recent orders',
        'Rate or refund': 'Rate o refund',
        'Loading orders...': 'Nilo-load ang orders...',
        'Quick links': 'Quick links',
        'Ratings and refunds': 'Ratings at refunds',
        'Track': 'Track',
        'Rate/refund': 'Rate/refund',
        'Merchant Dashboard': 'Merchant Dashboard',
        'Rider Dashboard': 'Rider Dashboard',
        'Admin Dashboard': 'Admin Dashboard',
        'Products and merchant orders.': 'Products at merchant orders.',
        'Catalog': 'Catalog',
        'Add product': 'Magdagdag ng produkto',
        'Product name': 'Pangalan ng produkto',
        'Category': 'Category',
        'Unit, e.g. 1 kg': 'Unit, hal. 1 kg',
        'Price': 'Presyo',
        'Save product': 'I-save ang produkto',
        'Incoming orders': 'Papasok na orders',
        'Merchant orders': 'Merchant orders',
        'Accept deliveries.': 'Tumanggap ng deliveries.',
        'Available deliveries': 'Available deliveries',
        'Open orders': 'Open orders',
        'Assigned route': 'Assigned route',
        'My deliveries': 'Aking deliveries',
        'Accept': 'Tanggapin',
        'Reject': 'Tanggihan',
        'Next status': 'Next status',
        'No open deliveries are ready for pickup yet.': 'Walang open deliveries na ready for pickup.',
        'No deliveries assigned to you yet.': 'Wala pang delivery na naka-assign sa iyo.',
        'No merchant orders yet. New customer orders for your approved merchant will appear here.': 'Wala pang merchant orders. Lalabas dito ang bagong customer orders para sa approved merchant mo.',
        'No merchant products yet.': 'Wala pang merchant products.',
        'Settings updated.': 'Na-update ang settings.',
        'Phone number should be exactly 11 numbers.': 'Dapat eksaktong 11 numero ang phone number.'
    },
    cebuano: {
        'honestbee': 'honestbee',
        'get groceries': 'palit ug grocery',
        'fast': 'nga paspas',
        'Over 15,000 products from your favourite merchants': 'Kapin sa 15,000 ka produkto gikan sa imong paboritong merchants',
        'Enjoy same day delivery in one hour': 'Pag-enjoy ug same-day delivery sulod sa usa ka oras',
        'Trained shoppers handpick products for top quality': 'Bansay nga shoppers ang mopili sa de-kalidad nga produkto',
        'FREE DELIVERY': 'LIBRE NGA DELIVERY',
        'for first order above PHP 500': 'para sa unang order nga labaw PHP 500',
        'Sign in': 'Sign in',
        'Sign up': 'Sign up',
        'Sign In': 'Sign In',
        'Sign Up': 'Sign Up',
        'Welcome back to honestbee.': 'Welcome back sa honestbee.',
        'Account': 'Account',
        'Sign in details': 'Sign in details',
        'Create a customer account.': 'Himo ug customer account.',
        'Merchant and rider accounts use the application links in the navigation.': 'Ang merchant ug rider accounts mogamit sa application links sa navigation.',
        'Customer Account': 'Customer Account',
        'Sign up details': 'Sign up details',
        'Email': 'Email',
        'Password': 'Password',
        'Confirm Password': 'Kumpirmaha ang Password',
        'Merchant Application': 'Merchant Application',
        'Apply as an honestbee merchant.': 'Pag-apply isip honestbee merchant.',
        'Your merchant account stays pending until the honestbee admin validates your merchant details.': 'Magpabilin nga pending ang merchant account hangtod ma-validate sa honestbee admin ang merchant details nimo.',
        'Business profile': 'Business profile',
        'Personal Information': 'Personal Information',
        'Business Information': 'Business Information',
        'Owner Full Name': 'Tibuok Ngalan sa Owner',
        'Owner First Name': 'Pangalan sa Owner',
        'Owner Last Name': 'Apelyido sa Owner',
        'Owner Email Address': 'Email Address sa Owner',
        'City': 'Siyudad',
        'Select city': 'Pili ug siyudad',
        'Merchant Name': 'Ngalan sa Merchant',
        'Select merchant type': 'Pili ug merchant type',
        'Business Permit / Proof of Merchant': 'Business Permit / Proof of Merchant',
        'Permit number, document name, or proof link': 'Permit number, document name, o proof link',
        'Submit Merchant Application': 'Ipasa ang Merchant Application',
        'Rider Application': 'Rider Application',
        'Apply as an honestbee rider.': 'Pag-apply isip honestbee rider.',
        'Application details': 'Application details',
        'Delivery Information': 'Delivery Information',
        'Select vehicle type': 'Pili ug vehicle type',
        'Valid ID / Driver\'s License': 'Valid ID / Driver\'s License',
        'ID number, document name, or proof link': 'ID number, document name, o proof link',
        'Submit Rider Application': 'Ipasa ang Rider Application',
        'Browse merchants': 'Tan-awa ang merchants',
        'Shop and Save!': 'Pamalit ug Makadaginot!',
        'New customers: PHP 300 OFF / Code BEEHSBC30': 'Bag-ong customers: PHP 300 OFF / Code BEEHSBC30',
        'Existing customers: PHP 200 OFF / Code BEEHSBC20': 'Daan nga customers: PHP 200 OFF / Code BEEHSBC20',
        'Coupons are limited to the first 5000 redemptions.': 'Limitado ang coupons sa unang 5000 redemptions.',
        'Shop now': 'Palit karon',
        'Merchants available for your area': 'Mga merchant nga available sa imong lugar',
        'Select a partner merchant to start shopping.': 'Pili ug partner merchant para magsugod ug palit.',
        'Same listed price': 'Parehas nga listed price',
        'Earliest delivery: Today, 2pm to 3pm': 'Pinakauna nga delivery: Karon, 2pm hangtod 3pm',
        'Bestsellers': 'Pinakabaligya',
        'Browse groceries, food, and partner merchant products in the compact honestbee catalog style.': 'Tan-awa ang groceries, pagkaon, ug produkto sa partner merchants sa compact honestbee catalog style.',
        'All': 'Tanan',
        'Groceries': 'Groceries',
        'Food': 'Pagkaon',
        'Home': 'Home',
        'No matching items found.': 'Walay nitakdo nga produkto.',
        'Your cart': 'Imong cart',
        'Your cart is empty.': 'Walay sulod ang imong cart.',
        'Subtotal': 'Subtotal',
        'Delivery': 'Delivery',
        'Service fee': 'Service fee',
        'Total': 'Total',
        'Checkout': 'Checkout',
        'Add': 'Idugang',
        'Partner merchants and kitchens': 'Partner merchants ug kitchens',
        'Grocery partners and restaurant counters with clear delivery times, fresh picks, and ready-to-eat meals.': 'Grocery partners ug restaurant counters nga klaro ang delivery time, fresh picks, ug ready-to-eat meals.',
        'Deals for today': 'Deals karong adlawa',
        'Promotions are grouped for grocery baskets, lunch orders, and scheduled delivery.': 'Gi-grupo ang promos para sa grocery baskets, lunch orders, ug scheduled delivery.',
        'Grocery bundle': 'Grocery bundle',
        'Save PHP 150 on fresh produce over PHP 1,200': 'Makadaginot ug PHP 150 sa fresh produce nga labaw PHP 1,200',
        'Best for weekly fruit, vegetables, dairy, and pantry restocks.': 'Maayo para sa sinemanang fruit, utanon, dairy, ug pantry restocks.',
        'Food delivery': 'Food delivery',
        'Free drink with selected lunch sets': 'Libre nga ilimnon sa piniling lunch sets',
        'Available from Bee Kitchen and Lazy Loaf Kitchen.': 'Available gikan sa Bee Kitchen ug Lazy Loaf Kitchen.',
        'Delivery window': 'Delivery window',
        'Schedule later and lower the delivery fee': 'Pag-schedule unya para moubos ang delivery fee',
        'Pick a time slot that works for home or office deliveries.': 'Pili ug oras nga mohaom sa balay o office deliveries.',
        'Product description': 'Deskripsyon sa produkto',
        'Selected by your shopper from the merchant shelf, packed carefully, and delivered in your chosen time window.': 'Pilian sa shopper gikan sa merchant shelf, tarong nga i-pack, ug ihatod sa oras nga imong gipili.',
        'Instructions for your shopper': 'Instructions para sa imong shopper',
        'Want your item a specific way? Let us know.': 'Naay gusto nga detalye para sa item? Sultihi mi.',
        'If it\'s out of stock': 'Kung out of stock',
        'Shopper bee can suggest': 'Pwede mosuggest ang shopper bee',
        'I\'ll choose a substitute now': 'Mopili ko ug kapuli karon',
        'I don\'t want a substitute': 'Dili ko gusto ug kapuli',
        'Add to cart': 'Idugang sa cart',
        'Store is currently closed': 'Sirado ang store karon',
        'Review your delivery details and place your order.': 'I-review ang delivery details ug i-place ang order.',
        'Customer name': 'Ngalan sa customer',
        'Customer email': 'Email sa customer',
        'Delivery address': 'Delivery address',
        'Select delivery time': 'Pili ug oras sa delivery',
        'Select payment': 'Pili ug payment',
        'Cash on delivery': 'Cash on delivery',
        'GCash': 'GCash',
        'GCash payment': 'GCash payment',
        'Enter GCash Reference Number:': 'Ibutang ang GCash Reference Number:',
        'Upload Proof of Payment:': 'Pag-upload ug Proof of Payment:',
        'Open proof of payment': 'Ablihi ang proof of payment',
        'Proof of Payment': 'Proof of Payment',
        'Enter GCash Reference Number.': 'Ibutang ang GCash Reference Number.',
        'Upload Proof of Payment.': 'Pag-upload ug Proof of Payment.',
        'Uploading proof of payment...': 'Gi-upload ang proof of payment...',
        'Card details': 'Detalye sa card',
        'Used for this checkout only.': 'Gamiton lang para ani nga checkout.',
        'Cardholder Name': 'Ngalan sa card',
        'Card Number': 'Numero sa card',
        'Expiry': 'Expiry',
        'CVC': 'CVC',
        'Cancel': 'Kanselahon',
        'Place order': 'I-place ang order',
        'Confirm checkout': 'Kumpirmaha ang checkout',
        'Are you sure you want to place this order?': 'Sigurado ka nga i-place kini nga order?',
        'Choose Yes to confirm, or No to review your checkout details.': 'Pilia ang Yes para mokumpirma, o No para balikon ang checkout details.',
        'Order checked out successfully': 'Malampuson nga na-checkout ang order',
        'Your order': 'Ang imong order',
        'has been sent to the merchant.': 'napadala na sa merchant.',
        'Keep shopping': 'Padayon pamalit',
        'Cancel order': 'Kanselahon ang order',
        'Order saved.': 'Na-save ang order.',
        'Preferences for your honestbee experience.': 'Mga pagpili para sa imong honestbee experience.',
        'Customer account': 'Account sa Customer',
        'Merchant account': 'Account sa Merchant',
        'Rider account': 'Account sa Rider',
        'Merchant settings unlock only after honestbee admin approval.': 'Mabuksan lang ang merchant settings human ma-approve sa honestbee admin.',
        'Delivery settings unlock only when employment status is active.': 'Mabuksan lang ang delivery settings kung active ang employment status.',
        'Account Information': 'Impormasyon sa Account',
        'Full Name': 'Tibuok Ngalan',
        'Full name': 'Tibuok ngalan',
        'First Name': 'Pangalan',
        'First name': 'Pangalan',
        'Last Name': 'Apelyido',
        'Last name': 'Apelyido',
        'Email Address': 'Email Address',
        'Email address': 'Email address',
        'Phone Number': 'Numero sa Telepono',
        'Phone number': 'Numero sa telepono',
        'Delivery Address': 'Delivery Address',
        'Default Address': 'Default Address',
        'Current Address': 'Current Address',
        'Default delivery address': 'Default delivery address',
        'Add New Address': 'Dugang Address',
        'New address': 'Bag-ong address',
        'Edit address': 'Usba ang address',
        'Delete address': 'Tangtanga ang address',
        'Payment Preferences': 'Payment Preferences',
        'Cash on Delivery': 'Cash on Delivery',
        'Card': 'Card',
        'Order Preferences': 'Order Preferences',
        'Allow substitutions': 'Tugoti ang kapuli',
        'Yes': 'Oo',
        'No': 'Dili',
        'Preferred delivery time': 'Gustong oras sa delivery',
        'Delivery instructions': 'Delivery instructions',
        'Leave notes for rider or shopper': 'Pagbilin ug notes para sa rider o shopper',
        'Notifications': 'Notifications',
        'Order updates': 'Order updates',
        'Promotions': 'Promosyon',
        'Delivery alerts': 'Delivery alerts',
        'Privacy and Security': 'Privacy ug Security',
        'Account Security': 'Account Security',
        'Current Password': 'Karon nga Password',
        'New Password': 'Bag-ong Password',
        'Confirm New Password': 'Kumpirmaha ang Bag-ong Password',
        'Current password': 'Karon nga password',
        'New password': 'Bag-ong password',
        'Confirm new password': 'Kumpirmaha ang bag-ong password',
        'Password needs 1 uppercase, 1 lowercase, 1 symbol, and 1 number. Max 30 characters.': 'Kinahanglan sa password ang 1 uppercase, 1 lowercase, 1 symbol, ug 1 number. Hangtod 30 characters.',
        'Password needs more than 8 characters, 1 uppercase, 1 lowercase, 1 symbol, and 1 number.': 'Kinahanglan sa password labaw sa 8 characters, 1 uppercase, 1 lowercase, 1 symbol, ug 1 number.',
        'Password needs more than 8 characters and must have 1 uppercase, 1 lowercase, 1 symbol, and 1 number.': 'Kinahanglan sa password labaw sa 8 characters ug naay 1 uppercase, 1 lowercase, 1 symbol, ug 1 number.',
        'Password must include 1 uppercase letter, 1 lowercase letter, 1 number, 1 symbol, and be 30 characters or fewer.': 'Kinahanglan naay 1 uppercase letter, 1 lowercase letter, 1 number, 1 symbol, ug hangtod 30 characters ra ang password.',
        'Password must be more than 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.': 'Kinahanglan labaw sa 8 characters ang password ug naay 1 uppercase letter, 1 lowercase letter, 1 number, ug 1 symbol.',
        'Password do not match': 'Dili pareho ang password.',
        'Passwords do not match.': 'Dili pareho ang mga password.',
        'Password Strength': 'Password Strength',
        'Weak password': 'Huyang nga password',
        'Strong password': 'Lig-on nga password',
        'Email address should include @.': 'Kinahanglan naay @ ang email address.',
        'Enter a valid email address.': 'Ibutang ang valid nga email address.',
        'Use gmail.com after @.': 'Gamita ang gmail.com pagkahuman sa @.',
        'Card number should contain 13 to 19 digits.': 'Kinahanglan naay 13 hangtod 19 ka numero ang card number.',
        'Card expiry should use MM/YY.': 'Kinahanglan MM/YY ang card expiry.',
        'Card CVC should contain 3 or 4 digits.': 'Kinahanglan 3 o 4 ka numero ang Card CVC.',
        'Enter the cardholder name.': 'Ibutang ang ngalan sa card.',
        'Logout': 'Logout',
        'Apply': 'I-apply',
        'Merchant Profile': 'Merchant Profile',
        'Merchant Name': 'Ngalan sa Merchant',
        'Merchant Type': 'Klase sa Merchant',
        'Merchant name': 'Ngalan sa merchant',
        'Owner full name': 'Tibuok ngalan sa owner',
        'Owner first name': 'Pangalan sa owner',
        'Owner last name': 'Apelyido sa owner',
        'Owner email address': 'Email address sa owner',
        'Merchant Address': 'Address sa Merchant',
        'Merchant address': 'Address sa merchant',
        'Business Hours': 'Business Hours',
        'Opening Time': 'Oras sa pag-abli',
        'Closing Time': 'Oras sa pagsira',
        'Available Days': 'Available Days',
        'Monday to Saturday': 'Lunes hangtod Sabado',
        'Product Settings': 'Product Settings',
        'Manage product availability': 'Ayusa ang product availability',
        'Available': 'Available',
        'Unavailable': 'Unavailable',
        'Default product category': 'Default product category',
        'Low stock alert': 'Low stock alert',
        'Quantity': 'Quantity',
        'Order Settings': 'Order Settings',
        'Accept/Reject orders': 'Dawata/Balibari ang orders',
        'Manual review': 'Manual review',
        'Auto-accept': 'Auto-accept',
        'Preparation time': 'Preparation time',
        'Auto-close merchant if unavailable': 'Auto-close merchant kung unavailable',
        'Application Status': 'Application Status',
        'Approval Status: Pending/Approved/Rejected': 'Approval Status: Pending/Approved/Rejected',
        'Rider Profile': 'Rider Profile',
        'Current Location': 'Karon nga Lokasyon',
        'Current location': 'Karon nga lokasyon',
        'Vehicle Type': 'Klase sa Sakyanan',
        'Motorcycle': 'Motorsiklo',
        'Bicycle': 'Bisikleta',
        'Car': 'Kotse',
        'Availability': 'Availability',
        'Available / Unavailable': 'Available / Unavailable',
        'Current delivery area': 'Karon nga delivery area',
        'Delivery Settings': 'Delivery Settings',
        'Maximum active orders': 'Maximum active orders',
        'Delivery status updates': 'Delivery status updates',
        'Manual': 'Manual',
        'Automatic reminders': 'Automatic reminders',
        'Navigation preference': 'Navigation preference',
        'In-app route': 'In-app route',
        'Employment Status: Pending/Active/Inactive': 'Employment Status: Pending/Active/Inactive',
        'Light Mode': 'Light Mode',
        'Dark Mode': 'Dark Mode',
        'System Default': 'System Default',
        'Language Settings': 'Language Settings',
        'Language': 'Pinulongan',
        'English': 'English',
        'Filipino': 'Filipino',
        'Cebuano/Bisaya': 'Cebuano/Bisaya',
        'Stay this language until next login': 'Pabilina kini nga pinulongan hangtod sa sunod nga login',
        'Apply Language': 'I-apply ang Pinulongan',
        'Language applied.': 'Na-apply ang pinulongan.',
        'Dashboard': 'Dashboard',
        'Stores': 'Mga Tindahan',
        'Orders': 'Orders',
        'Recent Orders': 'Recent Orders',
        'Merchants': 'Mga Merchant',
        'Deals': 'Mga Deal',
        'More': 'More',
        'Settings': 'Mga Setting',
        'Apply as Merchant': 'Pag-apply isip Merchant',
        'Apply as Rider': 'Pag-apply isip Rider',
        'Orders, delivery tracking, ratings, and refunds.': 'Orders, delivery tracking, ratings, ug refunds.',
        'Loading customer profile...': 'Gi-load ang customer profile...',
        'Shop merchants': 'Palit sa merchants',
        'Track order': 'I-track ang order',
        'Order history': 'Order history',
        'Recent orders': 'Recent orders',
        'Rate or refund': 'Rate o refund',
        'Loading orders...': 'Gi-load ang orders...',
        'Quick links': 'Quick links',
        'Ratings and refunds': 'Ratings ug refunds',
        'Track': 'Track',
        'Rate/refund': 'Rate/refund',
        'Merchant Dashboard': 'Merchant Dashboard',
        'Rider Dashboard': 'Rider Dashboard',
        'Admin Dashboard': 'Admin Dashboard',
        'Products and merchant orders.': 'Products ug merchant orders.',
        'Catalog': 'Catalog',
        'Add product': 'Dugang produkto',
        'Product name': 'Ngalan sa produkto',
        'Category': 'Category',
        'Unit, e.g. 1 kg': 'Unit, pananglitan 1 kg',
        'Price': 'Presyo',
        'Save product': 'I-save ang produkto',
        'Incoming orders': 'Mosulod nga orders',
        'Merchant orders': 'Merchant orders',
        'Accept deliveries.': 'Dawata ang deliveries.',
        'Available deliveries': 'Available deliveries',
        'Open orders': 'Open orders',
        'Assigned route': 'Assigned route',
        'My deliveries': 'Akong deliveries',
        'Accept': 'Dawata',
        'Reject': 'Balibari',
        'Next status': 'Next status',
        'No open deliveries are ready for pickup yet.': 'Walay open deliveries nga ready for pickup.',
        'No deliveries assigned to you yet.': 'Wala pay delivery nga naka-assign nimo.',
        'No merchant orders yet. New customer orders for your approved merchant will appear here.': 'Wala pay merchant orders. Mogawas diri ang bag-ong customer orders para sa imong approved merchant.',
        'No merchant products yet.': 'Wala pay merchant products.',
        'Settings updated.': 'Na-update ang settings.',
        'Phone number should be exactly 11 numbers.': 'Kinahanglan eksaktong 11 ka numero ang phone number.'
    }
};

function canonicalLanguageText(value) {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
        return trimmed;
    }

    if (trimmed.startsWith('Kamusta, ')) {
        return `Hello, ${trimmed.replace('Kamusta, ', '')}`;
    }

    if (trimmed.startsWith('Kumusta, ')) {
        return `Hello, ${trimmed.replace('Kumusta, ', '')}`;
    }

    const partnerMatch = trimmed.match(/^(\d+) (partner merchants ang nahanap|ka partner merchants ang nakit-an): (.*)\.$/);
    if (partnerMatch) {
        return `${partnerMatch[1]} partner merchants found: ${partnerMatch[3]}.`;
    }

    const storesMatch = trimmed.match(/^Mga (merchant na available para sa|merchant nga available para sa) (.*)$/);
    if (storesMatch) {
        return `Merchants available for ${storesMatch[2]}`;
    }

    const deliveryMatch = trimmed.match(/^(Available ang delivery sa|Available ang delivery sa) (.*)\.$/);
    if (deliveryMatch) {
        return `Delivery is available in ${deliveryMatch[2]}.`;
    }

    for (const map of Object.values(languageMap)) {
        const found = Object.entries(map).find(([, translated]) => translated === trimmed);
        if (found) {
            return found[0];
        }
    }

    return trimmed;
}

function translateDynamicValue(value, language) {
    const text = canonicalLanguageText(value);

    if (text.startsWith('Hello, ')) {
        const name = text.replace('Hello, ', '');
        return language === 'cebuano' ? `Kumusta, ${name}` : `Kamusta, ${name}`;
    }

    if (text.startsWith('Merchants available for ')) {
        const area = text.replace('Merchants available for ', '');
        return language === 'cebuano'
            ? `Mga merchant nga available para sa ${area}`
            : `Mga merchant na available para sa ${area}`;
    }

    const partnerMatch = text.match(/^(\d+) partner merchants found: (.*)\.$/);
    if (partnerMatch) {
        return language === 'cebuano'
            ? `${partnerMatch[1]} ka partner merchants ang nakit-an: ${partnerMatch[2]}.`
            : `${partnerMatch[1]} partner merchants ang nahanap: ${partnerMatch[2]}.`;
    }

    if (text.startsWith('Delivery is available in ')) {
        const area = text.replace('Delivery is available in ', '').replace(/\.$/, '');
        return language === 'cebuano'
            ? `Available ang delivery sa ${area}.`
            : `Available ang delivery sa ${area}.`;
    }

    return null;
}

function translateValue(value, language) {
    const canonical = canonicalLanguageText(value);
    if (language === 'english') {
        return canonical;
    }

    const map = languageMap[language] || {};
    return translateDynamicValue(canonical, language) || map[canonical] || canonical;
}

function translatePage(language = readPreference(storageKeys.language, 'english')) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION'].includes(parent.tagName)) {
                return NodeFilter.FILTER_REJECT;
            }
            return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });

    let node = walker.nextNode();
    while (node) {
        const rawOriginal = String(node.__honestbeeOriginalText || node.nodeValue);
        const leading = rawOriginal.match(/^\s*/)[0];
        const trailing = rawOriginal.match(/\s*$/)[0];
        const original = canonicalLanguageText(rawOriginal);
        node.__honestbeeOriginalText = `${leading}${original}${trailing}`;
        node.nodeValue = `${leading}${translateValue(original, language)}${trailing}`;
        node = walker.nextNode();
    }

    $$('[placeholder]').forEach((input) => {
        input.dataset.originalPlaceholder = canonicalLanguageText(input.dataset.originalPlaceholder || input.placeholder);
        input.placeholder = translateValue(input.dataset.originalPlaceholder, language);
    });

    $$('option').forEach((option) => {
        option.dataset.originalText = canonicalLanguageText(option.dataset.originalText || option.textContent);
        if (!option.hasAttribute('value')) {
            option.value = option.dataset.originalText;
        }
        option.textContent = translateValue(option.dataset.originalText, language);
    });
}

function applyCurrentLanguage() {
    const language = readPreference(storageKeys.language, 'english');
    if (language !== 'english') {
        translatePage(language);
    }
}

function dateLabel(value) {
    if (!value) {
        return 'Just now';
    }

    if (typeof value.toDate === 'function') {
        return value.toDate().toLocaleString('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    if (typeof value === 'string') {
        return value;
    }

    return 'Just now';
}

function timestampLabel(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function timestampMillis(value) {
    if (!value) {
        return 0;
    }

    if (typeof value.toDate === 'function') {
        const date = value.toDate();
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }

    if (typeof value === 'object' && typeof value.seconds === 'number') {
        return value.seconds * 1000;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getStoreByMerchantName(name) {
    return Object.entries(storeCatalogs).find(([, store]) => store.name === name)?.[1] || null;
}

function isOnlinePaymentMethod(method) {
    return onlinePaymentMethods.has(paymentMethodLabel(method).toLowerCase());
}

function isBuiltInStoreReference(merchantId, merchantName) {
    return builtInStoreIds.has(merchantId) || builtInStoreNameKeys.has(slugify(merchantName));
}

function isRegisteredSellerOrder(order) {
    return order?.store_source === 'registered-seller'
        || order?.requires_seller_payment_verification === true
        || (!isBuiltInStoreReference(order?.MERCH_id || order?.merch_id || '', order?.merchant_name || ''));
}

function sellerPaymentVerificationPending(order) {
    return Boolean(order?.requires_seller_payment_verification) && isOnlinePaymentMethod(orderPaymentMethod(order));
}

function sellerCanVerifyPayment(order) {
    return Boolean(
        isRegisteredSellerOrder(order)
        && sellerPaymentVerificationPending(order)
        && !orderAssignedShopperId(order)
        && !isTerminalOrderStatus(orderStatus(order))
    );
}

function orderStoreAcceptanceStatus(order) {
    return order?.store_acceptance_status || order?.STORE_acceptanceStatus || order?.ORDER_storeStatus || '';
}

function orderStoreAcceptanceDisplay(order) {
    const status = orderStoreAcceptanceStatus(order);
    if (!status) {
        return '';
    }

    if (status === 'Accepted' && order?.store_source === 'built-in' && isOnlinePaymentMethod(orderPaymentMethod(order))) {
        return 'Accepted automatically';
    }

    if (status === 'Accepted' && order?.seller_payment_verified) {
        return 'Accepted by merchant';
    }

    return status;
}

function orderReadyForRider(order) {
    const storeStatus = orderStoreAcceptanceStatus(order);
    if (isOnlinePaymentMethod(orderPaymentMethod(order))) {
        return storeStatus === 'Accepted' && !sellerPaymentVerificationPending(order);
    }

    return !sellerPaymentVerificationPending(order) && storeStatus !== 'Payment not verified';
}

function needsRiderPaymentCollection(order) {
    return !isOnlinePaymentMethod(orderPaymentMethod(order)) && orderPaymentStatus(order) !== 'Paid';
}

async function readCollection(name, max = 100) {
    const snapshot = await getDocs(query(collectionRef(name), limit(max)));
    return snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
    }));
}

function listenCollection(name, render, max = 100) {
    return onSnapshot(
        query(collectionRef(name), limit(max)),
        (snapshot) => {
            render(snapshot.docs.map((documentSnapshot) => ({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            })));
        },
        (error) => {
            console.error(`Firestore compatibility listener failed for ${name}`, error);
            render([], error);
        }
    );
}

function firestoreCollectionRef(name) {
    return firebaseCollection(firestoreDb, name);
}

function firestoreProductDoc(productId) {
    return firebaseDoc(firestoreDb, 'products', productId);
}

function firestoreSnapshotRecords(snapshot) {
    return snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
    }));
}

function normalizeFirestoreProductRecord(record = {}) {
    const productId = record.productId || record.id || record.PROD_id || '';
    const productName = record.productName || record.name || record.PROD_name || 'Merchant product';
    const merchantId = record.merchantId || record.MERCH_id || record.PROD_merchantId || '';
    const imageUrl = record.imageUrl || record.image || record.PROD_image || '';
    const status = record.status || record.approvalStatus || record.PROD_approvalStatus || 'Active';

    return {
        ...record,
        id: productId || record.id,
        productId: productId || record.id,
        merchantId,
        productName,
        category: record.category || record.PROD_category || 'Merchant Items',
        unit: record.unit || record.PROD_unit || '1 item',
        price: Number(record.price ?? record.PROD_price ?? 0),
        description: record.description || record.PROD_description || '',
        imageUrl,
        status,
        PROD_id: productId || record.id,
        PROD_name: productName,
        PROD_category: record.category || record.PROD_category || 'Merchant Items',
        PROD_unit: record.unit || record.PROD_unit || '1 item',
        PROD_price: Number(record.price ?? record.PROD_price ?? 0),
        PROD_description: record.description || record.PROD_description || '',
        PROD_image: imageUrl,
        MERCH_id: merchantId,
        name: productName,
        image: imageUrl,
        approvalStatus: status,
        source: 'seller-dashboard'
    };
}

function normalizeFirestoreMerchantRecord(record = {}) {
    return firebaseMerchantRecord(record.id || record.MERCH_id || '', record, {
        email: record.email || record.MERCH_ownerEmail || '',
        username: record.username || ''
    });
}

function productRecordId(product) {
    return String(product?.productId || product?.id || product?.PROD_id || '').trim();
}

function productRecordMerchantId(product) {
    return String(product?.merchantId || product?.MERCH_id || product?.PROD_merchantId || '').trim();
}

function productRecordName(product) {
    return product?.productName || product?.name || product?.PROD_name || 'Product';
}

function productRecordImageUrl(product, fallback = DEFAULT_PRODUCT_IMAGE) {
    return product?.imageUrl || product?.image || product?.PROD_image || fallback;
}

function productRecordStatus(product) {
    return String(product?.status || product?.approvalStatus || product?.PROD_approvalStatus || 'Active').trim();
}

function productIsActive(product) {
    const status = roleLower(productRecordStatus(product));
    return !status || ['active', 'available', 'approved'].includes(status);
}

function listenFirestoreMerchants(render) {
    return firebaseOnSnapshot(
        firestoreCollectionRef('merchants'),
        (snapshot) => render(firestoreSnapshotRecords(snapshot).map(normalizeFirestoreMerchantRecord)),
        (error) => {
            console.error('Firestore merchants listener failed', error);
            render([], error);
        }
    );
}

function listenFirestoreProducts(render) {
    return firebaseOnSnapshot(
        firestoreCollectionRef('products'),
        (snapshot) => render(firestoreSnapshotRecords(snapshot).map(normalizeFirestoreProductRecord)),
        (error) => {
            console.error('Firestore products listener failed', error);
            render([], error);
        }
    );
}

function listenFirestoreProductsForMerchant(merchantId, render) {
    return firebaseOnSnapshot(
        firebaseQuery(firestoreCollectionRef('products'), firebaseWhere('merchantId', '==', merchantId)),
        (snapshot) => render(firestoreSnapshotRecords(snapshot).map(normalizeFirestoreProductRecord)),
        (error) => {
            console.error('Firestore merchant products listener failed', error);
            render([], error);
        }
    );
}

async function readFirestoreProducts(max = 1000) {
    const snapshot = await firebaseGetDocs(firebaseQuery(firestoreCollectionRef('products'), firebaseLimit(max)));
    return firestoreSnapshotRecords(snapshot).map(normalizeFirestoreProductRecord);
}

function firestoreOrderDoc(orderId) {
    return firebaseDoc(firestoreDb, 'orders', orderId);
}

function firestoreCartDoc(customerUid) {
    return firebaseDoc(firestoreDb, 'carts', customerUid);
}

function firestoreCartItemsCollection(customerUid) {
    return firebaseCollection(firestoreDb, 'carts', customerUid, 'items');
}

function firestoreCartItemDoc(customerUid, productId) {
    return firebaseDoc(firestoreDb, 'carts', customerUid, 'items', productId);
}

function firestoreAutoDoc(collectionName) {
    return firebaseDoc(firestoreCollectionRef(collectionName));
}

function normalizeFirestoreCartItem(record = {}) {
    const productId = record.productId || record.id || record.PROD_id || '';
    const quantity = Math.max(1, Number(record.quantity || record.ITEM_quantity || 1));
    const price = Number(record.price ?? record.unitPrice ?? record.ITEM_unitPrice ?? 0) || 0;
    const imageUrl = record.imageUrl || record.image || record.PROD_image || DEFAULT_PRODUCT_IMAGE;

    return {
        ...record,
        id: productId,
        productId,
        merchantId: record.merchantId || record.MERCH_id || record.PROD_merchantId || '',
        name: record.productName || record.name || record.PROD_name || 'Product',
        productName: record.productName || record.name || record.PROD_name || 'Product',
        merchant: record.merchantName || record.merchant || record.MERCH_name || 'honestbee Partner',
        merchantName: record.merchantName || record.merchant || record.MERCH_name || 'honestbee Partner',
        category: record.category || record.PROD_category || 'Products',
        unit: record.unit || record.PROD_unit || '1 item',
        price,
        quantity,
        image: imageUrl,
        imageUrl,
        subtotal: Number(record.subtotal) || price * quantity,
        instructions: record.instructions || '',
        substitutePolicy: record.substitutePolicy || 'suggest',
        substituteName: record.substituteName || ''
    };
}

function normalizeFirestoreOrderItem(item = {}, fallbackMerchantId = '') {
    const productId = item.productId || item.id || item.PROD_id || item.product_id || '';
    const quantity = Math.max(1, Number(item.quantity || item.ITEM_quantity || 1));
    const price = Number(item.price ?? item.unitPrice ?? item.ITEM_unitPrice ?? 0) || 0;
    const imageUrl = item.imageUrl || item.image || item.ITEM_image || DEFAULT_PRODUCT_IMAGE;

    return {
        ...item,
        id: productId,
        productId,
        product_id: productId,
        merchantId: item.merchantId || item.MERCH_id || fallbackMerchantId || '',
        name: item.productName || item.name || item.ITEM_name || 'Product',
        productName: item.productName || item.name || item.ITEM_name || 'Product',
        ITEM_name: item.productName || item.name || item.ITEM_name || 'Product',
        quantity,
        ITEM_quantity: quantity,
        price,
        unitPrice: price,
        ITEM_unitPrice: price,
        unit: item.unit || item.PROD_unit || '1 item',
        image: imageUrl,
        imageUrl,
        ITEM_image: imageUrl,
        subtotal: Number(item.subtotal) || price * quantity,
        instructions: item.instructions || '',
        substitutePolicy: item.substitutePolicy || 'suggest',
        substituteName: item.substituteName || ''
    };
}

function orderItemsFromFirestoreOrder(order = {}) {
    const rawItems = Array.isArray(order.items)
        ? order.items
        : order.items && typeof order.items === 'object'
            ? Object.values(order.items)
            : [];

    return rawItems.map((item) => normalizeFirestoreOrderItem(item, order.merchantId || order.MERCH_id || order.merch_id || ''));
}

function normalizeFirestoreOrderRecord(record = {}) {
    const orderId = record.orderId || record.order_id || record.ORDER_id || record.id || '';
    const items = orderItemsFromFirestoreOrder(record);
    const summary = record.summary || {};
    const totalAmount = Number(record.totalAmount ?? record.ORDER_totalAmount ?? summary.total ?? 0) || 0;
    const subtotal = Number(summary.subtotal ?? items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0)) || 0;
    const delivery = Number(summary.delivery ?? record.deliveryFee ?? record.DELIVERY_fee ?? 0) || 0;
    const serviceFee = Number(summary.serviceFee ?? record.serviceFee ?? 0) || 0;
    const merchantId = record.merchantId || record.MERCH_id || record.merch_id || '';
    const customerId = record.customerId || record.CUST_id || record.customer_id || '';
    const riderId = record.riderId || record.SHOP_id || record.shopper_id || '';
    const orderStatusValue = record.orderStatus || record.order_status || record.ORDER_status || 'Pending';
    const paymentStatusValue = record.paymentStatus || record.payment_status || record.PAY_status || record.ORDER_paymentStatus || 'Unpaid';
    const paymentMethodValue = record.paymentMethod || record.payment_method || record.PAY_method || record.ORDER_paymentMethod || '';
    const proofImageUrl = record.proofImageUrl || record.payment_proof || record.gcash_proof || '';

    return {
        ...record,
        id: orderId,
        orderId,
        order_id: orderId,
        ORDER_id: orderId,
        customerId,
        customer_id: customerId,
        CUST_id: customerId,
        merchantId,
        merch_id: merchantId,
        MERCH_id: merchantId,
        riderId,
        shopper_id: riderId,
        SHOP_id: riderId,
        items,
        totalAmount,
        ORDER_totalAmount: totalAmount,
        orderStatus: orderStatusValue,
        order_status: orderStatusValue,
        ORDER_status: orderStatusValue,
        paymentMethod: paymentMethodValue,
        payment_method: paymentMethodValue,
        PAY_method: paymentMethodValue,
        paymentStatus: paymentStatusValue,
        payment_status: paymentStatusValue,
        PAY_status: paymentStatusValue,
        gcashReference: record.gcashReference || record.gcash_reference || record.payment_reference || '',
        gcash_reference: record.gcashReference || record.gcash_reference || record.payment_reference || '',
        proofImageUrl,
        payment_proof: proofImageUrl,
        gcash_proof: proofImageUrl,
        customer_name: record.customerName || record.customer_name || '',
        customer_email: record.customerEmail || record.customer_email || '',
        customer_phone: record.customerPhone || record.customer_phone || '',
        customer_address: record.deliveryAddress || record.customer_address || '',
        merchant_name: record.merchantName || record.merchant_name || 'honestbee Partner',
        scheduled_time: record.deliveryTime || record.scheduled_time || record.ORDER_scheduledTime || 'ASAP',
        store_acceptance_status: record.storeAcceptanceStatus || record.store_acceptance_status || record.STORE_acceptanceStatus || '',
        STORE_acceptanceStatus: record.storeAcceptanceStatus || record.store_acceptance_status || record.STORE_acceptanceStatus || '',
        requires_seller_payment_verification: Boolean(record.requiresSellerPaymentVerification ?? record.requires_seller_payment_verification),
        seller_payment_verified: Boolean(record.sellerPaymentVerified ?? record.seller_payment_verified),
        summary: {
            subtotal,
            delivery,
            serviceFee,
            total: totalAmount || subtotal + delivery + serviceFee
        },
        item_count: Number(record.itemCount || record.item_count || items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)) || 0
    };
}

function firestoreSnapshotOrderRecords(snapshot) {
    return sortDashboardOrders(firestoreSnapshotRecords(snapshot).map(normalizeFirestoreOrderRecord));
}

function listenFirestoreOrdersForCustomer(customerUid, customerEmail, render) {
    if (!customerUid) {
        render([]);
        return () => {};
    }

    return firebaseOnSnapshot(
        firebaseQuery(firestoreCollectionRef('orders'), firebaseWhere('customerId', '==', customerUid)),
        (snapshot) => render(firestoreSnapshotOrderRecords(snapshot)),
        (error) => {
            console.error('Firestore customer orders listener failed', error);
            render([], error);
        }
    );
}

function listenFirestoreOrdersForMerchant(merchantId, render) {
    if (!merchantId) {
        render([]);
        return () => {};
    }

    return firebaseOnSnapshot(
        firebaseQuery(firestoreCollectionRef('orders'), firebaseWhere('merchantId', '==', merchantId)),
        (snapshot) => render(firestoreSnapshotOrderRecords(snapshot)),
        (error) => {
            console.error('Firestore merchant orders listener failed', error);
            render([], error);
        }
    );
}

function listenFirestoreOrders(render) {
    return firebaseOnSnapshot(
        firestoreCollectionRef('orders'),
        (snapshot) => render(firestoreSnapshotOrderRecords(snapshot)),
        (error) => {
            console.error('Firestore orders listener failed', error);
            render([], error);
        }
    );
}

async function readFirestoreOrder(orderId) {
    if (!orderId) {
        return null;
    }

    const snapshot = await firebaseGetDoc(firestoreOrderDoc(orderId));
    return snapshot.exists()
        ? normalizeFirestoreOrderRecord({ id: snapshot.id, ...snapshot.data() })
        : null;
}

async function readFirestoreOrderItems(orderId) {
    const order = await readFirestoreOrder(orderId);
    return order ? orderItemsFromFirestoreOrder(order) : [];
}

async function deleteFirestoreOrder(orderId) {
    if (!orderId) {
        return;
    }

    await firebaseDeleteDoc(firestoreOrderDoc(orderId));
}

function firestoreRatingDoc(ratingId) {
    return firebaseDoc(firestoreDb, 'ratings', ratingId);
}

function firestoreRefundDoc(refundId) {
    return firebaseDoc(firestoreDb, 'refunds', refundId);
}

function normalizeFirestoreRatingRecord(record = {}) {
    const ratingId = record.ratingId || record.RATE_id || record.id || '';
    const orderId = record.orderId || record.order_id || record.ORDER_id || '';
    const customerId = record.customerId || record.customer_id || record.CUST_id || '';
    const riderId = record.riderId || record.shopper_id || record.SHOP_id || '';
    const serviceScore = Number(record.serviceScore ?? record.RATE_serviceScore ?? 5) || 5;
    const shopperScore = Number(record.shopperScore ?? record.RATE_shopperScore ?? 5) || 5;
    const comment = record.comment || record.RATE_feedbackComment || '';

    return {
        ...record,
        id: ratingId,
        ratingId,
        RATE_id: ratingId,
        orderId,
        order_id: orderId,
        ORDER_id: orderId,
        customerId,
        customer_id: customerId,
        CUST_id: customerId,
        riderId,
        shopper_id: riderId,
        SHOP_id: riderId,
        serviceScore,
        shopperScore,
        RATE_serviceScore: serviceScore,
        RATE_shopperScore: shopperScore,
        comment,
        RATE_feedbackComment: comment,
        RATE_date: record.RATE_date || record.createdAt || record.updatedAt || null
    };
}

function normalizeFirestoreRefundRecord(record = {}) {
    const refundId = record.refundId || record.REFUND_id || record.id || '';
    const orderId = record.orderId || record.order_id || record.ORDER_id || '';
    const customerId = record.customerId || record.customer_id || record.CUST_id || '';
    const amount = Number(record.amount ?? record.REFUND_amount ?? 0) || 0;
    const reason = record.reason || record.REFUND_reason || '';
    const status = record.status || record.REFUND_status || 'Pending';

    return {
        ...record,
        id: refundId,
        refundId,
        REFUND_id: refundId,
        orderId,
        order_id: orderId,
        ORDER_id: orderId,
        customerId,
        customer_id: customerId,
        CUST_id: customerId,
        amount,
        REFUND_amount: amount,
        reason,
        REFUND_reason: reason,
        status,
        REFUND_status: status,
        REFUND_date: record.REFUND_date || record.createdAt || record.updatedAt || null
    };
}

function listenFirestoreRatings(render) {
    return firebaseOnSnapshot(
        firestoreCollectionRef('ratings'),
        (snapshot) => render(firestoreSnapshotRecords(snapshot).map(normalizeFirestoreRatingRecord)),
        (error) => {
            console.error('Firestore ratings listener failed', error);
            render([], error);
        }
    );
}

function listenFirestoreRefunds(render) {
    return firebaseOnSnapshot(
        firestoreCollectionRef('refunds'),
        (snapshot) => render(firestoreSnapshotRecords(snapshot).map(normalizeFirestoreRefundRecord)),
        (error) => {
            console.error('Firestore refunds listener failed', error);
            render([], error);
        }
    );
}

async function readCustomerRatingForOrder(orderId, customerId) {
    if (!orderId || !customerId) {
        return null;
    }

    const snapshot = await firebaseGetDocs(firebaseQuery(
        firestoreCollectionRef('ratings'),
        firebaseWhere('orderId', '==', orderId),
        firebaseWhere('customerId', '==', customerId),
        firebaseLimit(1)
    ));

    if (!snapshot.empty) {
        const first = snapshot.docs[0];
        return normalizeFirestoreRatingRecord({ id: first.id, ...first.data() });
    }

    const legacySnapshot = await firebaseGetDocs(firebaseQuery(
        firestoreCollectionRef('ratings'),
        firebaseWhere('ORDER_id', '==', orderId),
        firebaseWhere('CUST_id', '==', customerId),
        firebaseLimit(1)
    )).catch(() => null);

    if (legacySnapshot && !legacySnapshot.empty) {
        const first = legacySnapshot.docs[0];
        return normalizeFirestoreRatingRecord({ id: first.id, ...first.data() });
    }

    return null;
}

async function readCustomerRefundsForOrder(orderId, customerId) {
    if (!orderId || !customerId) {
        return [];
    }

    const snapshot = await firebaseGetDocs(firebaseQuery(
        firestoreCollectionRef('refunds'),
        firebaseWhere('orderId', '==', orderId),
        firebaseWhere('customerId', '==', customerId),
        firebaseLimit(25)
    ));

    let records = firestoreSnapshotRecords(snapshot).map(normalizeFirestoreRefundRecord);
    if (records.length > 0) {
        return records;
    }

    const legacySnapshot = await firebaseGetDocs(firebaseQuery(
        firestoreCollectionRef('refunds'),
        firebaseWhere('ORDER_id', '==', orderId),
        firebaseWhere('CUST_id', '==', customerId),
        firebaseLimit(25)
    )).catch(() => null);

    records = legacySnapshot ? firestoreSnapshotRecords(legacySnapshot).map(normalizeFirestoreRefundRecord) : [];
    return records;
}

async function deleteFirestoreRating(ratingId) {
    if (!ratingId) {
        return;
    }

    await firebaseDeleteDoc(firestoreRatingDoc(ratingId));
}

function productImageUrlForSave(_input, fallback = DEFAULT_PRODUCT_IMAGE) {
    // TODO: Upload selected product images with Firebase Storage later; Phase 2 stores a string path only.
    return fallback || '';
}

async function deleteFirestoreProduct(productId) {
    if (!productId) {
        return;
    }

    await firebaseDeleteDoc(firestoreProductDoc(productId));
}

async function saveCustomerOrder(payload) {
    const items = Array.isArray(payload.items) ? payload.items : [];
    const normalizedItems = items.map((item) => normalizeFirestoreOrderItem(item, item?.merchantId || item?.MERCH_id || ''));
    const closedOrderStore = normalizedItems
        .map((item) => {
            const merchantId = String(item?.merchantId || item?.MERCH_id || '').trim();
            return (merchantId && storeCatalogs[merchantId])
                || getStoreByMerchantName(item?.merchant || item?.merchantName || item?.MERCH_name || '')
                || null;
        })
        .find((store) => store && !merchantStoreIsOpen(store));

    if (closedOrderStore) {
        throw new Error(storeCurrentlyClosedMessage);
    }

    if (normalizedItems.length === 0) {
        throw new Error('Your cart is empty.');
    }

    const activeAccount = getCurrentAccount();
    const customerUid = accountLinkedId(activeAccount) || activeAccount?.USER_id || '';
    if (!customerUid) {
        throw new Error('Please sign in before checking out.');
    }

    const firstItem = normalizedItems[0] || {};
    const merchantName = firstItem.merchantName || firstItem.merchant || 'honestbee Partner';
    const sourceMerchantId = firstItem.merchantId || firstItem.MERCH_id || '';
    const merchantId = sourceMerchantId || await merchantIdForStore(merchantName, sourceMerchantId || merchantDocId(merchantName));
    const store = getStoreByMerchantName(merchantName);

    if (store && !merchantStoreIsOpen(store)) {
        throw new Error(storeCurrentlyClosedMessage);
    }

    const subtotal = Number(payload.summary?.subtotal || normalizedItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0));
    const deliveryFee = Number(payload.summary?.delivery || 0);
    const serviceFee = Number(payload.summary?.serviceFee || 0);
    const total = Number(payload.summary?.total || subtotal + deliveryFee + serviceFee);
    const isBuiltInStore = isBuiltInStoreReference(sourceMerchantId || merchantId, merchantName);
    const isOnlinePayment = isOnlinePaymentMethod(payload.payment_method);
    const isGcash = isGcashPaymentMethod(payload.payment_method);
    const requiresSellerPaymentVerification = isOnlinePayment && !isBuiltInStore;
    const paymentStatus = isGcash
        ? 'Pending Verification'
        : isOnlinePayment
            ? requiresSellerPaymentVerification ? 'Pending merchant verification' : 'Paid'
            : 'Unpaid';
    const storeAcceptanceStatus = requiresSellerPaymentVerification ? 'Payment verification pending' : 'Accepted';
    const paymentVerificationStatus = requiresSellerPaymentVerification
        ? 'Pending'
        : isOnlinePayment ? 'Auto accepted' : 'Not required';
    const gcashDetails = payload.gcash_details || null;
    const paymentReference = gcashDetails?.reference || '';
    const proofImageUrl = '';
    // TODO: Add Firebase Storage later for GCash proof uploads. Phase 3 keeps proofImageUrl empty.
    const cardDetails = payload.card_details || null;
    const customerNameParts = splitFullName(payload.customer_name);

    await firebaseSetDoc(firebaseUserDoc(customerUid), {
        email: String(payload.email || '').toLowerCase(),
        username: payload.customer_name,
        role: 'customer',
        status: 'active',
        updatedAt: firebaseServerTimestamp()
    }, { merge: true });

    await firebaseSetDoc(firebaseRoleDoc('customer', customerUid), {
        firstName: customerNameParts.firstName,
        lastName: customerNameParts.lastName,
        email: String(payload.email || '').toLowerCase(),
        phone: payload.phone,
        address: payload.address,
        city: normalizeServiceCity(payload.city) || null,
        role: 'customer',
        status: 'active',
        username: payload.customer_name,
        CUST_id: customerUid,
        CUST_firstName: customerNameParts.firstName,
        CUST_lastName: customerNameParts.lastName,
        CUST_email: String(payload.email || '').toLowerCase(),
        CUST_phone: payload.phone,
        CUST_address: payload.address,
        CUST_city: normalizeServiceCity(payload.city) || null,
        USER_role: 'customer',
        USER_email: String(payload.email || '').toLowerCase(),
        USER_status: 'Active',
        profileImageUrl: '',
        updatedAt: firebaseServerTimestamp()
    }, { merge: true });

    const orderRef = firestoreAutoDoc('orders');
    const orderId = orderRef.id;
    const createdAt = firebaseServerTimestamp();
    const orderPayload = {
        orderId,
        customerId: customerUid,
        merchantId,
        riderId: '',
        items: normalizedItems.map((item) => ({
            productId: item.productId || item.id,
            merchantId: item.merchantId || merchantId,
            productName: item.productName || item.name,
            name: item.name || item.productName,
            category: item.category || 'Products',
            unit: item.unit || '1 item',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            imageUrl: item.imageUrl || item.image || DEFAULT_PRODUCT_IMAGE,
            image: item.image || item.imageUrl || DEFAULT_PRODUCT_IMAGE,
            subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 1),
            instructions: item.instructions || '',
            substitutePolicy: item.substitutePolicy || 'suggest',
            substituteName: item.substituteName || ''
        })),
        totalAmount: total,
        paymentMethod: payload.payment_method,
        paymentStatus,
        orderStatus: 'Pending',
        deliveryAddress: payload.address,
        deliveryCity: payload.city || '',
        deliveryTime: payload.delivery_time,
        customerName: payload.customer_name,
        customerEmail: String(payload.email || '').toLowerCase(),
        customerPhone: payload.phone,
        merchantName,
        gcashReference: paymentReference,
        proofImageUrl,
        cardDetails,
        storeSource: isBuiltInStore ? 'built-in' : 'registered-seller',
        storeAcceptanceStatus,
        requiresSellerPaymentVerification,
        sellerPaymentVerified: isOnlinePayment && !requiresSellerPaymentVerification,
        paymentVerificationStatus,
        paymentVerifiedBy: requiresSellerPaymentVerification ? '' : isOnlinePayment ? 'honestbee-auto' : '',
        summary: {
            subtotal,
            delivery: deliveryFee,
            serviceFee,
            total
        },
        itemCount: normalizedItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
        // Legacy-compatible fields used by the existing honestbee UI.
        CUST_id: customerUid,
        SHOP_id: '',
        MERCH_id: merchantId,
        ORDER_id: orderId,
        order_id: orderId,
        customer_id: customerUid,
        customer_email: String(payload.email || '').toLowerCase(),
        customer_name: payload.customer_name,
        customer_phone: payload.phone,
        customer_address: payload.address,
        shopper_id: '',
        merch_id: merchantId,
        merchant_name: merchantName,
        order_status: 'Pending',
        ORDER_status: 'Pending',
        ORDER_totalAmount: total,
        ORDER_scheduledTime: payload.delivery_time,
        payment_method: payload.payment_method,
        payment_status: paymentStatus,
        payment_reference: paymentReference,
        payment_proof: proofImageUrl,
        gcash_reference: paymentReference,
        gcash_proof: proofImageUrl,
        payment_card: cardDetails,
        payment_card_last4: cardDetails?.last4 || '',
        payment_cardholder: cardDetails?.cardholderName || '',
        store_source: isBuiltInStore ? 'built-in' : 'registered-seller',
        store_acceptance_status: storeAcceptanceStatus,
        STORE_acceptanceStatus: storeAcceptanceStatus,
        requires_seller_payment_verification: requiresSellerPaymentVerification,
        seller_payment_verified: isOnlinePayment && !requiresSellerPaymentVerification,
        payment_verification_status: paymentVerificationStatus,
        payment_verified_by: requiresSellerPaymentVerification ? '' : isOnlinePayment ? 'honestbee-auto' : '',
        scheduled_time: payload.delivery_time,
        item_count: normalizedItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
        ORDER_date: createdAt,
        createdAt,
        updatedAt: createdAt
    };

    await firebaseSetDoc(orderRef, orderPayload);

    saveLocal(storageKeys.customerId, customerUid);
    saveLocal(storageKeys.customerEmail, String(payload.email || '').toLowerCase());
    saveLocal(storageKeys.lastOrderId, orderId);

    return {
        id: orderId,
        customerId: customerUid
    };
}

async function findFirstByField(collectionName, fieldName, value) {
    const snapshot = await getDocs(query(collectionRef(collectionName), where(fieldName, '==', value), limit(1)));
    if (snapshot.empty) {
        return null;
    }

    const documentSnapshot = snapshot.docs[0];
    return {
        id: documentSnapshot.id,
        ...documentSnapshot.data()
    };
}

function isCodeId(value, prefix) {
    return new RegExp(`^${prefix}\\d+$`, 'i').test(String(value || '').trim());
}

function isCustomerRecordId(value) {
    return isCodeId(value, 'C');
}

function isMerchantRecordId(value) {
    return isCodeId(value, 'M');
}

async function ensureCustomerProfileForUser(user) {
    const email = String(user?.USER_email || '').trim().toLowerCase();
    if (!email) {
        return '';
    }

    let customer = null;
    const linkedId = String(user?.USER_linkedId || '').trim();
    if (isCustomerRecordId(linkedId)) {
        const snapshot = await getDoc(docRef(collections.customer, linkedId));
        customer = snapshot.exists()
            ? { id: snapshot.id, ...snapshot.data() }
            : null;
    }

    if (!customer) {
        customer = await findFirstByField(collections.customer, 'CUST_email', email);
    }

    const customerId = customer?.CUST_id || customer?.id || await nextId(collections.customer);
    if (!customer) {
        await setDoc(docRef(collections.customer, customerId), {
            CUST_id: customerId,
            CUST_firstName: user.USER_firstName || '',
            CUST_lastName: user.USER_lastName || '',
            CUST_email: email,
            CUST_phone: user.USER_phone || '',
            CUST_city: normalizeServiceCity(user.USER_city) || null,
            firstName: user.USER_firstName || '',
            lastName: user.USER_lastName || '',
            email,
            phone: user.USER_phone || '',
            city: normalizeServiceCity(user.USER_city) || null,
            role: 'customer',
            status: 'active',
            USER_role: 'customer',
            USER_email: email,
            USER_status: 'Active',
            CUST_createdAt: serverTimestamp()
        });
    }

    const userId = user.USER_id || user.id || userAccountDocId(email);
    if (userId && user.USER_linkedId !== customerId) {
        await setDoc(docRef(collections.userAccount, userId), {
            USER_linkedId: customerId,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    return customerId;
}

async function customerProfileForUser(user, fallbackId = '') {
    const email = String(user?.USER_email || accountEmail(user) || '').trim().toLowerCase();
    const linkedId = String(fallbackId || user?.USER_linkedId || '').trim();

    if (isCustomerRecordId(linkedId)) {
        const snapshot = await getDoc(docRef(collections.customer, linkedId));
        if (snapshot.exists()) {
            return {
                id: snapshot.id,
                ...snapshot.data()
            };
        }
    }

    return email ? findFirstByField(collections.customer, 'CUST_email', email) : null;
}

async function customerIdForEmail(email, account = getCurrentAccount()) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        return nextId(collections.customer);
    }

    const linkedId = accountLinkedId(account);
    if (accountEmail(account).toLowerCase() === normalizedEmail && isCustomerRecordId(linkedId)) {
        return linkedId;
    }

    const customer = await findFirstByField(collections.customer, 'CUST_email', normalizedEmail);
    if (customer) {
        return customer.CUST_id || customer.id;
    }

    const user = await findFirstByField(collections.userAccount, 'USER_email', normalizedEmail);
    if (user) {
        return ensureCustomerProfileForUser(user);
    }

    return nextId(collections.customer);
}

async function merchantIdForStore(merchantName, fallbackId = '') {
    const fallback = String(fallbackId || '').trim();
    if (isMerchantRecordId(fallback) || (fallback && !builtInStoreIds.has(fallback))) {
        return fallback;
    }

    const firestoreMerchants = await firebaseGetDocs(firestoreCollectionRef('merchants')).catch(() => null);
    const firestoreMerchant = firestoreMerchants
        ? firestoreSnapshotRecords(firestoreMerchants).find((record) => record.storeName === merchantName || record.MERCH_name === merchantName)
        : null;
    if (firestoreMerchant?.id) {
        return firestoreMerchant.id;
    }

    const merchant = await findFirstByField(collections.merchant, 'MERCH_name', merchantName);
    if (merchant) {
        return merchant.MERCH_id || merchant.id;
    }

    return nextId(collections.merchant);
}

async function findAccountRoleByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        return '';
    }

    if (normalizedEmail === adminAccount.USER_email) {
        return 'admin';
    }

    const [merchant, shopper, user] = await Promise.all([
        findFirstByField(collections.merchant, 'MERCH_ownerEmail', normalizedEmail),
        findFirstByField(collections.shopper, 'SHOP_email', normalizedEmail),
        findFirstByField(collections.userAccount, 'USER_email', normalizedEmail)
    ]);

    if (isSellerRecord(merchant)) {
        return 'seller';
    }

    if (isRiderRecord(shopper)) {
        return 'rider';
    }

    if (user?.USER_role) {
        return roleLower(user.USER_role);
    }

    return '';
}

function accountAlreadyExistsMessage(role) {
    const label = role === 'rider' ? 'rider' : role === 'seller' ? 'seller' : role === 'admin' ? 'admin' : 'customer';
    return `This email already belongs to a ${label} account. Use a different email for a separate account.`;
}

function isSellerRecord(record) {
    const role = normalizedAccountRole(record?.role || record?.USER_role || '');
    return Boolean(record && (
        role === 'seller'
        || record.MERCH_ownerEmail
        || record.ownerEmail
        || record.storeName
        || record.MERCH_password
    ));
}

function isSellerAccountRecord(record) {
    const role = normalizedAccountRole(record?.role || record?.USER_role || '');
    return Boolean(record && (
        role === 'seller'
        || record.MERCH_ownerEmail
        || record.ownerEmail
        || record.storeName
        || record.MERCH_password
        || record.MERCH_ownerFirstName
        || record.MERCH_ownerLastName
        || record.MERCH_ownerName
    ));
}

function isRiderRecord(record) {
    return Boolean(record && (
        roleLower(record.role || record.USER_role) === 'rider'
        || record.SHOP_email
        || record.RIDER_email
        || record.email
        || record.fullName
        || record.vehicleType
    ));
}

function titleCaseName(value) {
    return String(value || '')
        .replace(/[._-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function storedAccountName(account) {
    const splitName = fullNameFromParts(
        account?.USER_firstName || account?.MERCH_ownerFirstName || account?.SHOP_firstName,
        account?.USER_lastName || account?.MERCH_ownerLastName || account?.SHOP_lastName
    );
    if (splitName) {
        return splitName;
    }

    return String(
        account?.USER_displayName
        || account?.USER_fullName
        || account?.MERCH_ownerName
        || account?.SHOP_fullName
        || ''
    ).trim();
}

function accountDisplayName(account) {
    const storedName = storedAccountName(account);
    if (storedName) {
        return storedName;
    }

    if (accountRole(account) === 'admin') {
        return 'Admin';
    }

    const emailName = accountEmail(account).split('@')[0];
    return titleCaseName(emailName) || 'Customer';
}

function accountLabel(account) {
    if (!account) {
        return '';
    }

    return `Hello, ${accountDisplayName(account)}`;
}

function accountNameParts(account) {
    const firstName = String(account?.USER_firstName || account?.MERCH_ownerFirstName || account?.SHOP_firstName || '').trim();
    const lastName = String(account?.USER_lastName || account?.MERCH_ownerLastName || account?.SHOP_lastName || '').trim();
    if (firstName || lastName) {
        return { firstName, lastName };
    }

    return splitFullName(accountDisplayName(account));
}

async function hydrateCurrentAccount(account) {
    if (!account) {
        return account;
    }

    const role = accountRole(account);
    const shouldHydrateCustomerProfile = role === 'customer' && (!storedAccountName(account) || !account.USER_phone || !account.USER_address);
    const shouldHydrateSellerProfile = role === 'seller' && (!account.MERCH_name || !account.MERCH_phone || !account.MERCH_approvalStatus);
    const shouldHydrateRiderProfile = role === 'rider' && (!account.SHOP_phone || !account.SHOP_employmentStatus);
    if (storedAccountName(account) && !shouldHydrateCustomerProfile && !shouldHydrateSellerProfile && !shouldHydrateRiderProfile) {
        return account;
    }

    const linkedId = accountLinkedId(account);
    let hydratedAccount = { ...account };

    if (role === 'admin') {
        hydratedAccount.USER_displayName = 'Admin';
    } else if (role === 'seller' && linkedId) {
        const snapshot = await getDoc(docRef(collections.merchant, linkedId));
        const merchantRecord = snapshot.exists()
            ? { id: snapshot.id, ...snapshot.data() }
            : await findFirstByField(collections.merchant, 'MERCH_ownerEmail', accountEmail(account));
        if (merchantRecord) {
            const merchant = merchantRecord;
            const ownerName = merchantOwnerName(merchant);
            hydratedAccount = {
                ...hydratedAccount,
                USER_linkedId: merchant.MERCH_id || merchant.id || linkedId,
                USER_displayName: ownerName || merchant.MERCH_name || '',
                MERCH_ownerFirstName: merchant.MERCH_ownerFirstName || '',
                MERCH_ownerLastName: merchant.MERCH_ownerLastName || '',
                MERCH_phone: merchant.MERCH_phone || '',
                MERCH_name: merchant.MERCH_name || '',
                MERCH_type: merchant.MERCH_type || '',
                MERCH_address: merchant.MERCH_address || '',
                MERCH_availableDays: merchant.MERCH_availableDays || '',
                MERCH_preparationTime: merchant.MERCH_preparationTime || '',
                MERCH_storeStatus: merchantStoreStatusLabel(merchant),
                MERCH_approvalStatus: merchant.MERCH_approvalStatus
            };
        }
    } else if (role === 'rider' && linkedId) {
        const snapshot = await getDoc(docRef(collections.shopper, linkedId));
        const shopperRecord = snapshot.exists()
            ? { id: snapshot.id, ...snapshot.data() }
            : await findFirstByField(collections.shopper, 'SHOP_email', accountEmail(account));
        if (shopperRecord) {
            const shopper = shopperRecord;
            const shopperName = riderFullName(shopper);
            hydratedAccount = {
                ...hydratedAccount,
                USER_linkedId: shopper.SHOP_id || shopper.RIDER_id || shopper.id || linkedId,
                USER_displayName: shopperName,
                SHOP_firstName: shopper.SHOP_firstName || '',
                SHOP_lastName: shopper.SHOP_lastName || '',
                SHOP_phone: shopper.SHOP_phone || '',
                SHOP_currentLocation: shopper.SHOP_currentLocation || '',
                SHOP_vehicleType: shopper.SHOP_vehicleType || '',
                SHOP_maxActiveOrders: shopper.SHOP_maxActiveOrders || 1,
                SHOP_employmentStatus: shopper.SHOP_employmentStatus
            };
        }
    } else if (role === 'customer') {
        const user = await findFirstByField(collections.userAccount, 'USER_email', accountEmail(account));
        const customerId = user ? await ensureCustomerProfileForUser(user) : linkedId;
        const customer = user ? await customerProfileForUser(user, customerId) : await customerProfileForUser(account, customerId);
        const customerAddress = cleanAddressPart(customer?.CUST_address || customer?.address || account.USER_address || '');
        hydratedAccount.USER_displayName = userFullName(user) || '';
        hydratedAccount.USER_linkedId = customerId || linkedId;
        hydratedAccount.USER_firstName = user?.USER_firstName || '';
        hydratedAccount.USER_lastName = user?.USER_lastName || '';
        hydratedAccount.USER_phone = user?.USER_phone || '';
        hydratedAccount.USER_city = normalizeServiceCity(user?.USER_city || customer?.CUST_city || customer?.city) || deriveServiceCityFromAddress(customerAddress) || '';
        hydratedAccount.USER_address = customerAddress;
        hydratedAccount.USER_preferredDeliveryTime = user?.USER_preferredDeliveryTime || '';
    }

    if (storedAccountName(hydratedAccount)) {
        setCurrentAccount(hydratedAccount);
    }

    return hydratedAccount;
}

async function handleAutoLogin(email, password, notice) {
    let credential = null;

    try {
        credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
        const canBootstrapAdmin = email === adminAccount.USER_email
            && ['auth/user-not-found', 'auth/invalid-credential'].includes(error?.code)
            && password === currentAdminPassword();
        if (canBootstrapAdmin) {
            try {
                credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            } catch (createError) {
                throw new Error(firebaseAuthMessage(createError));
            }
        } else {
            throw new Error(firebaseAuthMessage(error));
        }
    }

    const account = await syncCurrentAccountFromFirebase(credential.user, {
        allowAdminBootstrap: email === adminAccount.USER_email && password === currentAdminPassword()
    });

    if (!account) {
        await signOut(firebaseAuth).catch(() => {});
        clearCurrentAccount();
        setNotice(notice, 'Account profile was not found in Firestore.', true);
        return;
    }

    if (isDeletedAccountRecord(account)) {
        await signOut(firebaseAuth).catch(() => {});
        clearCurrentAccount();
        setNotice(notice, deletedAccountMessage, true);
        return;
    }

    const approvalMessage = accountApprovalMessage(account);
    if (approvalMessage) {
        await signOut(firebaseAuth).catch(() => {});
        clearCurrentAccount();
        renderAuthChrome(null);
        setNotice(notice, approvalMessage, true);
        return;
    }

    location.href = dashboardForAccount(account);
}

async function handleAdminLogin(email, password, notice) {
    await handleAutoLogin(email, password, notice);
}

async function createCustomerFirebaseAccount(details) {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, details.email, details.password);
    const uid = credential.user.uid;
    const username = fullNameFromParts(details.firstName, details.lastName) || titleCaseName(details.email.split('@')[0]);

    await firebaseSetDoc(firebaseUserDoc(uid), {
        email: details.email,
        username,
        role: 'customer',
        status: 'active',
        createdAt: firebaseServerTimestamp()
    });

    await firebaseSetDoc(firebaseRoleDoc('customer', uid), {
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: details.phone,
        address: details.address,
        city: details.city || deriveServiceCityFromAddress(details.address) || '',
        role: 'customer',
        status: 'active',
        username,
        CUST_id: uid,
        CUST_firstName: details.firstName,
        CUST_lastName: details.lastName,
        CUST_email: details.email,
        CUST_phone: details.phone,
        CUST_address: details.address,
        CUST_city: details.city || deriveServiceCityFromAddress(details.address) || '',
        USER_role: 'customer',
        USER_email: details.email,
        USER_status: 'Active',
        profileImageUrl: '',
        createdAt: firebaseServerTimestamp()
    });

    return syncCurrentAccountFromFirebase(credential.user);
}

async function createMerchantFirebaseAccount(details) {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, details.email, details.password);
    const uid = credential.user.uid;
    const username = fullNameFromParts(details.ownerFirstName, details.ownerLastName) || details.storeName;
    const userRecord = {
        email: details.email,
        username,
        role: 'merchant',
        status: 'pending',
        createdAt: firebaseServerTimestamp()
    };
    const merchantRecord = {
        ownerFirstName: details.ownerFirstName,
        ownerLastName: details.ownerLastName,
        ownerEmail: details.email,
        phone: details.phone,
        storeName: details.storeName,
        merchantType: details.merchantType,
        address: details.address,
        businessHours: details.businessHours,
        approvalStatus: 'pending',
        storeStatus: 'closed',
        availableDays: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
        logoUrl: '',
        documentUrl: '',
        role: 'merchant',
        createdAt: firebaseServerTimestamp()
    };

    await firebaseSetDoc(firebaseUserDoc(uid), userRecord);

    // TODO: Upload merchant logos/documents with Firebase Storage in a later phase.
    await firebaseSetDoc(firebaseRoleDoc('seller', uid), merchantRecord);

    return buildAccountFromFirebaseRecords(uid, details.email, userRecord, merchantRecord);
}

async function createRiderFirebaseAccount(details) {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, details.email, details.password);
    const uid = credential.user.uid;
    const fullName = fullNameFromParts(details.firstName, details.lastName);
    const userRecord = {
        email: details.email,
        username: fullName,
        role: 'rider',
        status: 'pending',
        createdAt: firebaseServerTimestamp()
    };
    const riderRecord = {
        firstName: details.firstName,
        lastName: details.lastName,
        fullName,
        email: details.email,
        phone: details.phone,
        vehicleType: details.vehicleType,
        currentLocation: details.currentLocation,
        approvalStatus: 'pending',
        availabilityStatus: 'Unavailable',
        profileImageUrl: '',
        validIdUrl: '',
        licenseUrl: '',
        role: 'rider',
        createdAt: firebaseServerTimestamp()
    };

    await firebaseSetDoc(firebaseUserDoc(uid), userRecord);

    // TODO: Upload rider profile, valid ID, and license files with Firebase Storage in a later phase.
    await firebaseSetDoc(firebaseRoleDoc('rider', uid), riderRecord);

    return buildAccountFromFirebaseRecords(uid, details.email, userRecord, riderRecord);
}

async function finishPartnerApplicationSubmission(form, notice) {
    await signOut(firebaseAuth).catch(() => {});
    clearCurrentAccount();
    renderAuthChrome(null);
    form?.reset();
    setNotice(notice, partnerApplicationSubmittedMessage);
    if (!openSignInModalWithNotice(partnerApplicationSubmittedMessage)) {
        location.href = signInModalUrl('application-submitted');
    }
}

async function requestPasswordReset(action, payload = {}) {
    const email = String(payload.email || '').trim().toLowerCase();
    if (!email) {
        throw new Error('Enter your registered email first.');
    }

    if (action === 'send_otp' || action === 'send_reset_link') {
        await sendPasswordResetEmail(firebaseAuth, email);
        return {
            ok: true,
            message: 'Password reset email sent. Please check your Gmail inbox.'
        };
    }

    throw new Error('Password reset is handled through the Firebase reset email link.');
}

function passwordResetNotice(form) {
    return $('[data-password-reset-notice]', form);
}

function passwordResetStep(form) {
    return $$('[data-password-reset-step]', form)
        .find((step) => !step.hidden)
        ?.dataset.passwordResetStep || 'otp';
}

function setPasswordResetOtpStatus(status, message) {
    if (!status) {
        return;
    }

    const text = status.querySelector('span:last-child');
    if (text) {
        text.textContent = message || 'Password reset email sent to Gmail';
    }
    status.hidden = false;
}

function showPasswordResetStep(form, stepName) {
    $$('[data-password-reset-step]', form).forEach((step) => {
        step.hidden = step.dataset.passwordResetStep !== stepName;
    });
    clearNotice(passwordResetNotice(form));
    refreshIcons();
}

function resetPasswordResetForm(form) {
    if (!form) {
        return;
    }

    form.reset();
    form.dataset.passwordResetEmail = '';
    form.dataset.passwordResetVerified = 'false';
    form.dataset.passwordResetVerifying = 'false';

    $$('input', form).forEach((input) => {
        input.disabled = false;
        clearFieldError(input);
        if (input.dataset.passwordToggleBound === 'true') {
            input.type = 'password';
            const toggle = input.closest('.password-input-wrap')?.querySelector('.password-toggle');
            if (toggle) {
                toggle.setAttribute('aria-label', 'Show password');
                toggle.setAttribute('aria-pressed', 'false');
                toggle.title = 'Show password';
                toggle.innerHTML = '<i data-lucide="eye" aria-hidden="true"></i>';
            }
        }
        if (input.matches('[data-password-meter]')) {
            updatePasswordRequirementNote(input);
        }
    });
    $$('button', form).forEach((button) => {
        button.disabled = false;
    });

    const otpStatus = $('[data-password-reset-otp-status]', form);
    if (otpStatus) {
        otpStatus.hidden = true;
    }

    showPasswordResetStep(form, 'otp');
}

async function verifyPasswordResetOtp(form) {
    if (!form || form.dataset.passwordResetVerifying === 'true') {
        return;
    }

    const emailInput = form.elements.email;
    const otpInput = form.elements.otp;
    const notice = passwordResetNotice(form);
    const otp = String(otpInput?.value || '').replace(/\D/g, '').slice(0, 6);

    if (otpInput) {
        otpInput.value = otp;
    }

    if (otp.length !== 6) {
        return;
    }

    try {
        const email = assertEmailAddress(emailInput);
        form.dataset.passwordResetVerifying = 'true';
        setNotice(notice, 'Checking OTP...');
        await requestPasswordReset('verify_otp', { email, otp });
        form.dataset.passwordResetEmail = email;
        form.dataset.passwordResetVerified = 'true';
        clearFieldError(otpInput);
        showPasswordResetStep(form, 'password');
        form.elements.newPassword?.focus?.({ preventScroll: true });
    } catch (error) {
        setNotice(notice, error.message || 'OTP could not be verified.', true);
    } finally {
        form.dataset.passwordResetVerifying = 'false';
    }
}

function initPasswordReset() {
    if (!$('[data-password-reset-form]')) {
        return;
    }

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-forgot-password-open]');
        if (!trigger) {
            return;
        }

        event.preventDefault();
        resetPasswordResetForm($('[data-password-reset-form]'));
        if (openAccountModal('forgot-password')) {
            closeMoreMenu();
        }
    });

    $$('[data-password-reset-form]').forEach((form) => {
        if (form.dataset.passwordResetBound === 'true') {
            return;
        }

        form.dataset.passwordResetBound = 'true';
        resetPasswordResetForm(form);

        const emailInput = form.elements.email;
        const otpInput = form.elements.otp;
        const sendOtpButton = $('[data-password-reset-send-otp]', form);
        const confirmButton = $('[data-password-reset-confirm]', form);
        const backButton = $('[data-password-reset-back]', form);
        const otpStatus = $('[data-password-reset-otp-status]', form);

        emailInput?.addEventListener('input', () => {
            if (passwordResetStep(form) !== 'otp') {
                return;
            }
            form.dataset.passwordResetVerified = 'false';
            form.dataset.passwordResetEmail = '';
            if (otpStatus) {
                otpStatus.hidden = true;
            }
            clearNotice(passwordResetNotice(form));
        });

        otpInput?.addEventListener('input', () => {
            const digits = String(otpInput.value || '').replace(/\D/g, '').slice(0, 6);
            if (otpInput.value !== digits) {
                otpInput.value = digits;
            }
            verifyPasswordResetOtp(form);
        });

        sendOtpButton?.addEventListener('click', async () => {
            const notice = passwordResetNotice(form);
            try {
                const email = assertEmailAddress(emailInput);
                sendOtpButton.disabled = true;
                if (otpStatus) {
                    otpStatus.hidden = true;
                }
                if (otpInput) {
                    otpInput.value = '';
                    clearFieldError(otpInput);
                }
                form.dataset.passwordResetEmail = email;
                form.dataset.passwordResetVerified = 'false';
                setNotice(notice, 'Sending password reset email...');
                const result = await requestPasswordReset('send_reset_link', { email });
                clearNotice(notice);
                setPasswordResetOtpStatus(
                    otpStatus,
                    result.message || 'Password reset email sent to Gmail'
                );
                const successTitle = $('[data-password-reset-success-title]', form);
                if (successTitle) {
                    successTitle.textContent = 'Password reset email sent';
                }
                showPasswordResetStep(form, 'success');
                refreshIcons();
            } catch (error) {
                setNotice(notice, error.message || 'Password reset email could not be sent.', true);
            } finally {
                sendOtpButton.disabled = false;
            }
        });

        confirmButton?.addEventListener('click', async () => {
            const notice = passwordResetNotice(form);
            const newPasswordInput = form.elements.newPassword;
            const confirmInput = form.elements.confirmPassword;

            try {
                const email = form.dataset.passwordResetEmail || assertEmailAddress(emailInput);
                if (form.dataset.passwordResetVerified !== 'true') {
                    throw new Error('Verify the OTP before changing the password.');
                }

                const password = assertStrongPassword(newPasswordInput);
                const confirmation = String(confirmInput?.value || '');
                if (password !== confirmation) {
                    showFieldError(confirmInput, 'Passwords do not match.');
                    throw new Error('Passwords do not match.');
                }

                clearFieldError(confirmInput);
                confirmButton.disabled = true;
                setNotice(notice, 'Changing password...');
                await requestPasswordReset('reset_password', {
                    email,
                    password,
                    confirmPassword: confirmation
                });
                form.reset();
                showPasswordResetStep(form, 'success');
            } catch (error) {
                setNotice(notice, error.message || 'Password could not be changed.', true);
            } finally {
                confirmButton.disabled = false;
            }
        });

        backButton?.addEventListener('click', () => {
            resetPasswordResetForm(form);
            openAccountModal('signin');
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const activeStep = passwordResetStep(form);
            if (activeStep === 'otp') {
                if (String(otpInput?.value || '').replace(/\D/g, '').length === 6) {
                    verifyPasswordResetOtp(form);
                    return;
                }
                sendOtpButton?.click();
                return;
            }
            if (activeStep === 'password') {
                confirmButton?.click();
            }
        });
    });
}

function initLoginPage() {
    const signInRoot = $('[data-signin-page]');
    const signUpRoot = $('[data-signup-page]');
    const currentAccount = getCurrentAccount();

    if ((signInRoot || signUpRoot) && currentAccount) {
        location.href = dashboardForAccount(currentAccount);
        return;
    }

    $$('[data-login-form]').forEach((loginForm) => {
        if (loginForm.dataset.formBound === 'true') {
            return;
        }

        loginForm.dataset.formBound = 'true';
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const password = String(formData.get('password') || '');
            const notice = $('[data-login-notice]', form);

            try {
                const email = assertEmailAddress(form.elements.email);
                await handleAutoLogin(email, password, notice);
            } catch (error) {
                setNotice(notice, error.message || 'Sign in failed.', true);
            }
        });
    });

    $$('[data-customer-signup-form]').forEach((signupForm) => {
        if (signupForm.dataset.formBound === 'true') {
            return;
        }

        signupForm.dataset.formBound = 'true';
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const notice = $('[data-customer-signup-notice]', form);

            try {
                const firstName = String(formData.get('firstName') || '').trim();
                const lastName = String(formData.get('lastName') || '').trim();
                const email = assertEmailAddress(form.elements.email);
                const phone = assertPhoneNumber(form.elements.phone);
                const registeredAddress = readAddressPickerField(form, {
                    label: currentAddressLabel,
                    isDefault: true
                });
                const city = registeredAddress.city;
                const address = registeredAddress.address;
                const password = assertStrongPassword(form.elements.password);
                assertMatchingPassword(password, form.elements.confirmPassword);
                const account = await createCustomerFirebaseAccount({
                    firstName,
                    lastName,
                    email,
                    phone,
                    city,
                    address,
                    password
                });

                saveCustomerAddresses(email, [{
                    ...registeredAddress,
                    id: `${accountLinkedId(account)}-default`,
                    isDefault: true,
                    label: currentAddressLabel
                }]);
                removeLocal(storageKeys.lastOrderId);
                setNotice(notice, 'Customer account created. Opening dashboard...');
                setTimeout(() => {
                    location.href = dashboardForAccount(account);
                }, 700);
            } catch (error) {
                setNotice(notice, firebaseAuthMessage(error) || 'Customer sign up failed.', true);
            }
        });
    });
}

function initStorefront() {
    const root = $('[data-storefront]');
    if (!root) {
        return;
    }

    const allStoreIds = Object.keys(storeCatalogs);
    const cebuLocations = [
        ['Alcantara', '6033', ['alcantara cebu']],
        ['Alcoy', '6023', ['alcoy cebu']],
        ['Alegria', '6030', ['alegria cebu']],
        ['Aloguinsan', '6040', ['aloguinsan cebu']],
        ['Argao', '6021', ['argao cebu']],
        ['Asturias', '6042', ['asturias cebu']],
        ['Badian', '6031', ['badian cebu']],
        ['Balamban', '6041', ['balamban cebu']],
        ['Bantayan', '6052', ['bantayan cebu']],
        ['Barili', '6036', ['barili cebu', 'barile cebu']],
        ['Bogo City', '6010', ['bogo', 'bogo cebu']],
        ['Boljoon', '6024', ['boljoon cebu']],
        ['Borbon', '6008', ['borbon cebu']],
        ['Carcar City', '6019', ['carcar', 'carcar cebu']],
        ['Carmen', '6005', ['carmen cebu']],
        ['Catmon', '6006', ['catmon cebu']],
        ['Cebu City', '6000', ['cebu', 'cebu city']],
        ['Compostela', '6003', ['compostela cebu']],
        ['Consolacion', '6001', ['consolacion cebu']],
        ['Cordova', '6017', ['cordova cebu']],
        ['Daanbantayan', '6013', ['daanbantayan cebu', 'daan bantayan', 'daang bantayan']],
        ['Dalaguete', '6022', ['dalaguete cebu']],
        ['Danao City', '6004', ['danao', 'danao cebu']],
        ['Dumanjug', '6035', ['dumanjug cebu']],
        ['Ginatilan', '6026', ['ginatilan cebu']],
        ['Lapu-Lapu City', '6015', ['lapu lapu', 'lapu-lapu', 'lapu lapu cebu', 'lapu-lapu cebu']],
        ['Lilo-an', '6002', ['liloan', 'lilo an', 'lilo-an cebu', 'liloan cebu']],
        ['Mactan Airport', '6016', ['mactan', 'mactan airport', 'mactan cebu']],
        ['Madridejos', '6053', ['madridejos cebu']],
        ['Malabuyoc', '6029', ['malabuyoc cebu']],
        ['Mandaue City', '6014', ['mandaue', 'mandaue cebu']],
        ['Medellin', '6012', ['medellin cebu']],
        ['Minglanilla', '6046', ['minglanilla cebu']],
        ['Moalboal', '6032', ['moalboal cebu']],
        ['Naga City', '6037', ['naga', 'naga cebu']],
        ['Oslob', '6025', ['oslob cebu']],
        ['Pilar', '6048', ['pilar cebu']],
        ['Pinamungajan', '6039', ['pinamungajan cebu', 'pinamungahan']],
        ['Poro', '6049', ['poro cebu']],
        ['Ronda', '6034', ['ronda cebu']],
        ['Samboan', '6027', ['samboan cebu']],
        ['San Fernando', '6018', ['san fernando cebu']],
        ['San Francisco', '6050', ['san francisco cebu']],
        ['San Remigio', '6011', ['san remigio cebu', 'san remegio', 'san remegio cebu']],
        ['Santa Fe', '6047', ['santa fe cebu', 'santafe']],
        ['Santander', '6026', ['santander cebu']],
        ['Sibonga', '6020', ['sibonga cebu']],
        ['Sogod', '6007', ['sogod cebu']],
        ['Tabogon', '6009', ['tabogon cebu']],
        ['Tabuelan', '6044', ['tabuelan cebu']],
        ['Talisay City', '6045', ['talisay', 'talisay cebu']],
        ['Toledo City', '6038', ['toledo', 'toledo cebu']],
        ['Tuburan', '6043', ['tuburan cebu']],
        ['Tudela', '6051', ['tudela cebu']]
    ];
    const deliveryAreas = cebuLocations.map(([name, postalCode, aliases]) => ({
        name,
        label: `${name}, Cebu, PH`,
        region: 'Cebu',
        postalCodes: [postalCode],
        aliases: [name, `${name} Cebu`, ...aliases],
        storeIds: allStoreIds
    }));

    const noResults = $('[data-no-results]');
    const searchInput = $('#searchInput');
    const merchantTitle = $('[data-merchant-title]');
    const merchantSearch = $('[data-merchant-search]');
    const merchantMasthead = $('.merchant-masthead');
    const merchantInfo = $('.merchant-info');
    const typeButtons = $$('[data-type-filter]');
    const categoryChipRow = $('[data-category-chips]');
    const categorySidebar = $('[data-category-sidebar]');
    const currentLocationLabels = $$('[data-current-location]');
    const regionPills = $$('[data-region-pill]');
    const availabilityMessages = $$('[data-availability-message]');
    const availabilitySummary = $('[data-availability-summary]');
    const availabilityTitle = $('[data-availability-title]');
    const availabilityDetail = $('[data-availability-detail]');
    const logoWall = $('.logo-wall');
    const storeGrid = $('.store-grid');
    const productModal = $('[data-product-modal]');
    const screens = $$('[data-screen]');
    const productModalImage = $('[data-modal-product-image]');
    const productModalName = $('[data-modal-product-name]');
    const productModalUnit = $('[data-modal-product-unit]');
    const productModalPrice = $('[data-modal-product-price]');
    const productModalDescription = $('[data-modal-product-description]');
    const productModalAddButton = $('[data-guest-modal-add-cart]');

    let productCards = $$('[data-product-card]');
    let categoryButtons = $$('[data-category-filter]');
    let activeType = 'all';
    let activeCategory = 'all';
    let activeStoreId = 'metro-ayala-cebu';
    let availableStoreIds = Object.keys(storeCatalogs);
    let selectedDeliveryArea = getStoredDeliveryArea() || deliveryAreas.find((area) => area.postalCodes.includes('6002')) || deliveryAreas[0];
    let sellerMerchants = [];
    let sellerProducts = [];
    const sellerStoreIds = new Set();

    function canBrowseShoppingScreens() {
        const account = getCurrentAccount();
        return !account || isCustomerAccount(account);
    }

    function redirectToRoleHome() {
        const account = getCurrentAccount();
        if (account) {
            location.href = dashboardForAccount(account);
            return;
        }

        if (!openAccountModal('signin')) {
            location.href = 'index.html?modal=signin';
        }
    }

    function showHomeSection(sectionId, url = `#${sectionId}`) {
        const homeScreen = screens.find((screen) => screen.dataset.screen === 'home');
        const target = document.getElementById(sectionId);

        if (!homeScreen || !target) {
            return false;
        }

        screens.forEach((screen) => {
            screen.classList.toggle('is-active', screen === homeScreen);
        });

        $$('[data-screen-target]').forEach((link) => {
            link.classList.toggle('is-active', link.dataset.screenTarget === sectionId);
        });

        if (sectionId === 'stores') {
            document.documentElement.classList.add('store-only-view');
            updateStoreAvailability(selectedDeliveryArea);
        }

        window.requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
        history.replaceState(null, '', url);
        return true;
    }

    function showScreen(screenName) {
        if (['stores', 'shop', 'restaurants', 'deals'].includes(screenName) && !canBrowseShoppingScreens()) {
            redirectToRoleHome();
            return;
        }

        if (screenName === 'stores') {
            showHomeSection('stores', 'index.html?view=stores#stores');
            return;
        }

        const nextScreen = screens.find((screen) => screen.dataset.screen === screenName);
        if (!nextScreen) {
            if (screenName !== 'home') {
                showScreen('home');
            }
            return;
        }

        screens.forEach((screen) => {
            screen.classList.toggle('is-active', screen === nextScreen);
        });

        $$('[data-screen-target]').forEach((link) => {
            link.classList.toggle('is-active', link.dataset.screenTarget === screenName);
        });

        window.scrollTo(0, 0);
        history.replaceState(null, '', `#${screenName}`);
    }

    function normalizeAddress(value) {
        return String(value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getPostalCodes(value) {
        return String(value ?? '').match(/\b\d{4}\b/g) || [];
    }

    function hasAddressPhrase(normalizedAddress, phrase) {
        const normalizedPhrase = normalizeAddress(phrase);
        return normalizedPhrase !== '' && ` ${normalizedAddress} `.includes(` ${normalizedPhrase} `);
    }

    function resolveDeliveryArea(value) {
        const normalized = normalizeAddress(value);
        const postalCodes = getPostalCodes(value);
        const hasLetters = /[a-z]/.test(normalized);

        if (!normalized) {
            return null;
        }

        const aliasMatch = deliveryAreas.find((area) => {
            return area.aliases.some((alias) => hasAddressPhrase(normalized, alias));
        });

        if (hasLetters && aliasMatch) {
            return aliasMatch;
        }

        return deliveryAreas.find((area) => {
            return area.postalCodes.some((postalCode) => postalCodes.includes(postalCode));
        }) || aliasMatch || null;
    }

    function getDeliveryAreaByPostalCode(postalCode) {
        return deliveryAreas.find((area) => area.postalCodes.includes(postalCode)) || null;
    }

    function getStoredDeliveryArea() {
        const storedPostalCode = readLocal(storageKeys.deliveryArea);
        return storedPostalCode ? getDeliveryAreaByPostalCode(storedPostalCode) : null;
    }

    function rememberDeliveryArea(area) {
        saveLocal(storageKeys.deliveryArea, area.postalCodes[0]);
    }

    function setAvailabilityMessage(message, isError = false) {
        availabilityMessages.forEach((node) => {
            node.textContent = message;
            node.classList.toggle('is-error', isError);
        });
        applyCurrentLanguage();
    }

    function getFirstAvailableStoreId() {
        return availableStoreIds.find((storeId) => Boolean(storeCatalogs[storeId])) || Object.keys(storeCatalogs)[0];
    }

    function updateStoreAvailability(area) {
        const dynamicStoreIds = Object.keys(storeCatalogs).filter((storeId) => !area.storeIds.includes(storeId));
        availableStoreIds = [...area.storeIds, ...dynamicStoreIds].filter((storeId) => Boolean(storeCatalogs[storeId]));
        const availableStoreSet = new Set(availableStoreIds);

        $$('[data-store-id]').forEach((node) => {
            node.hidden = !availableStoreSet.has(node.dataset.storeId);
        });

        if (availabilitySummary) {
            const storeNames = availableStoreIds.map((storeId) => storeCatalogs[storeId].name);
            availabilitySummary.hidden = false;
            availabilityTitle.textContent = `Merchants available for ${area.label}`;
            availabilityDetail.textContent = `${storeNames.length} partner ${storeNames.length === 1 ? 'merchant' : 'merchants'} found: ${storeNames.join(', ')}.`;
        }
        applyCurrentLanguage();
    }

    function setDeliveryArea(area, options = {}) {
        const settings = {
            saveSelection: true,
            showMessage: true,
            ...options
        };

        selectedDeliveryArea = area;
        currentLocationLabels.forEach((node) => {
            node.textContent = area.label;
        });
        regionPills.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.regionPill === area.region);
        });
        $$('input[name="address"]').forEach((input) => {
            if (input.value.trim() === '') {
                input.value = area.label;
            }
        });
        updateStoreAvailability(area);
        if (settings.saveSelection) {
            rememberDeliveryArea(area);
        }
        setAvailabilityMessage(settings.showMessage ? `Delivery is available in ${area.label}.` : '');
    }

    function handleAddressSubmit(form) {
        const addressInput = form.elements.address;
        const submittedAddress = addressInput.value.trim();
        const area = resolveDeliveryArea(submittedAddress);

        if (submittedAddress === '') {
            setAvailabilityMessage('Enter a Cebu postal code, city, or municipality.', true);
            addressInput.focus();
            return;
        }

        if (!area) {
            setAvailabilityMessage('That delivery area is not in Cebu or the ZIP code is not supported.', true);
            addressInput.focus();
            return;
        }

        setDeliveryArea(area);
        showScreen('stores');
    }

    function productFromElement(element) {
        return {
            id: element.dataset.id,
            name: element.dataset.name,
            price: Number(element.dataset.price),
            merchant: element.dataset.merchant || 'Metro Supermarket Ayala Cebu',
            merchantId: element.dataset.merchantId || '',
            type: element.dataset.type || 'grocery',
            image: productImagePath(element.dataset.image),
            unit: element.dataset.unit || '1 pack',
            description: element.dataset.description || ''
        };
    }

    function productCardTemplate(product) {
        const search = `${product.name} ${product.merchant} ${product.category}`.toLowerCase();
        const productImage = productImagePath(product.image);
        const productAlt = product.alt || product.name || 'Product image';
        const activeStore = storeCatalogs[activeStoreId] || {};
        const isStoreOpen = merchantStoreIsOpen(activeStore);

        return `
            <article
                class="product-card"
                data-product-card
                data-open-product
                data-id="${escapeHtml(product.id)}"
                data-name="${escapeHtml(product.name)}"
                data-price="${escapeHtml(product.price)}"
                data-merchant="${escapeHtml(product.merchant)}"
                data-merchant-id="${escapeHtml(product.merchantId || product.MERCH_id || '')}"
                data-type="${escapeHtml(product.type)}"
                data-category="${escapeHtml(product.category.toLowerCase())}"
                data-search="${escapeHtml(search)}"
                data-image="${escapeHtml(productImage)}"
                data-alt="${escapeHtml(productAlt)}"
                data-unit="${escapeHtml(product.unit || '1 pack')}"
                data-description="${escapeHtml(product.description || '')}"
            >
                <div class="product-media">
                    <img src="${escapeHtml(productImage)}" alt="${escapeHtml(productAlt)}" loading="eager" decoding="async">
                    <span class="pill">${escapeHtml(product.tag)}</span>
                </div>
                <div class="product-body">
                    <div class="product-title-row">
                        <div>
                            <h3>${escapeHtml(product.name)}</h3>
                            <p class="merchant">${escapeHtml(product.merchant)} ${storeStatusBadge(merchantStoreStatusLabel(activeStore))}</p>
                        </div>
                        <span class="rating"><i data-lucide="star" aria-hidden="true"></i>${escapeHtml(product.rating)}</span>
                    </div>
                    <div class="product-actions">
                        <span class="price">${formatMoney(Number(product.price))}</span>
                        <button class="guest-add-cart-button" type="button" data-guest-add-cart ${isStoreOpen ? '' : 'disabled'}>
                            <i data-lucide="shopping-cart" aria-hidden="true"></i>
                            ${isStoreOpen ? 'Add to Cart' : storeCurrentlyClosedMessage}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    function categoryKey(category) {
        return String(category ?? '').toLowerCase();
    }

    function getStoreCategories(store) {
        const seen = new Set();

        return (store.products || [])
            .map((product) => product.category)
            .filter((category) => {
                const key = categoryKey(category);
                if (!key || seen.has(key)) {
                    return false;
                }

                seen.add(key);
                return true;
            });
    }

    function renderCategoryControls(store) {
        const categories = getStoreCategories(store);
        categoryChipRow.innerHTML = `
            <button class="chip is-active" type="button" data-category-filter="all">All</button>
            ${categories.map((category) => `
                <button class="chip" type="button" data-category-filter="${escapeHtml(categoryKey(category))}">
                    ${escapeHtml(category)}
                </button>
            `).join('')}
        `;
        categorySidebar.innerHTML = `
            <button class="is-active" type="button" data-category-filter="all">Home</button>
            ${categories.map((category) => `
                <button type="button" data-category-filter="${escapeHtml(categoryKey(category))}">
                    ${escapeHtml(category)}
                </button>
            `).join('')}
        `;
        categoryButtons = $$('[data-category-filter]');
    }

    function renderProductGrid(products) {
        $('[data-product-grid]').innerHTML = products.map(productCardTemplate).join('');
        productCards = $$('[data-product-card]');
        refreshIcons();
        applyFilters();
        applyCurrentLanguage();
    }

    function refreshActiveStoreDisplay() {
        const store = storeCatalogs[activeStoreId];
        if (!store) {
            return;
        }

        const categories = getStoreCategories(store).map(categoryKey);
        if (activeCategory !== 'all' && !categories.includes(activeCategory)) {
            activeCategory = 'all';
        }

        merchantTitle.textContent = store.name;
        merchantSearch.placeholder = `Search ${store.name}...`;
        merchantMasthead.style.background = store.theme;
        merchantInfo.style.background = store.theme;
        renderCategoryControls(store);
        categoryButtons.forEach((node) => {
            node.classList.toggle('is-active', node.dataset.categoryFilter === activeCategory);
        });
        $$('[data-store-id]').forEach((node) => {
            node.classList.toggle('is-active', node.dataset.storeId === activeStoreId);
        });
        renderProductGrid(store.products || []);
    }

    function storeInitials(store) {
        return String(store.logo || store.name || 'HB')
            .split(/\s+/)
            .map((word) => word[0])
            .join('')
            .slice(0, 3)
            .toUpperCase();
    }

    function storeLogoMarkup(store) {
        const theme = escapeHtml(store.theme || '#1e7a58');
        if (store.logoImage) {
            return `
                <span class="store-logo-badge" style="--store-theme: ${theme}">
                    <img src="${escapeHtml(store.logoImage)}" alt="${escapeHtml(store.name)} logo" loading="lazy">
                </span>
            `;
        }

        return `<span class="store-logo-badge" style="--store-theme: ${theme}">${escapeHtml(storeInitials(store))}</span>`;
    }

    function storeIcon(store) {
        if (store.type === 'Food') {
            return 'utensils';
        }

        if (['Pet Store', 'Pet Supplies'].includes(store.type)) {
            return 'paw-print';
        }

        return 'shopping-basket';
    }

    function customerStoreUrl(storeId) {
        return `customer-dashboard.html?store=${encodeURIComponent(storeId)}#stores`;
    }

    function renderStoreDirectories() {
        if (logoWall) {
            logoWall.innerHTML = Object.entries(storeCatalogs).map(([storeId, store]) => `
                <a class="logo-tile${storeId === activeStoreId ? ' is-active' : ''}" href="${customerStoreUrl(storeId)}" data-customer-store-link data-store-id="${escapeHtml(storeId)}">
                    ${storeLogoMarkup(store)}
                    <span>${escapeHtml(store.name)}</span>
                    <small>${escapeHtml(store.type)} · ${escapeHtml(merchantStoreStatusLabel(store))}</small>
                </a>
            `).join('');
        }

        if (storeGrid) {
            storeGrid.innerHTML = Object.entries(storeCatalogs).map(([storeId, store]) => `
                <a class="store-card${storeId === activeStoreId ? ' is-active' : ''}" href="${customerStoreUrl(storeId)}" data-customer-store-link data-store-id="${escapeHtml(storeId)}">
                    <div>
                        <span class="store-type">
                            <i data-lucide="${escapeHtml(storeIcon(store))}" aria-hidden="true"></i>
                            ${escapeHtml(store.type)}
                        </span>
                        <div class="store-card-title">
                            ${storeLogoMarkup(store)}
                            <h3>${escapeHtml(store.name)}</h3>
                        </div>
                        <p>${escapeHtml(store.meta || 'Cebu partner merchant')}</p>
                        <small class="store-days">${escapeHtml(store.availableDays || 'Monday to Saturday')}</small>
                    </div>
                    <div class="store-card-meta-stack">
                        ${storeStatusBadge(merchantStoreStatusLabel(store))}
                        <strong class="eta">${escapeHtml(store.eta || 'Merchant managed')}</strong>
                    </div>
                </a>
            `).join('');
        }

        refreshIcons();
        applyCurrentLanguage();
    }

    function normalizeSellerProduct(product, merchant) {
        const merchantType = merchant.MERCH_type === 'Food' ? 'food' : 'grocery';
        const productName = productRecordName(product);
        const category = product.category || product.PROD_category || (merchant.MERCH_type === 'Food' ? 'Meals' : 'Merchant Items');

        return {
            id: productRecordId(product) || `${merchant.MERCH_id}-${slugify(productName)}`,
            type: product.type || merchantType,
            category,
            name: productName,
            merchant: merchant.MERCH_name || product.merchant || 'Approved merchant',
            merchantId: merchant.MERCH_id || merchant.id,
            price: Number(product.price || product.PROD_price || 0),
            tag: product.tag || 'Merchant',
            rating: product.rating || '4.6',
            unit: product.unit || product.PROD_unit || '1 item',
            image: productImagePath(productRecordImageUrl(product)),
            alt: product.alt || productName,
            description: product.description || product.PROD_description || ''
        };
    }

    function rebuildSellerStores() {
        sellerStoreIds.forEach((storeId) => delete storeCatalogs[storeId]);
        sellerStoreIds.clear();

        sellerMerchants
            .filter((merchant) => merchant.MERCH_approvalStatus === 'Approved' && merchant.MERCH_name)
            .forEach((merchant) => {
                const merchantId = merchant.MERCH_id || merchant.id;
                const merchantNameKey = slugify(merchant.MERCH_name);
                if (builtInStoreIds.has(merchantId) || builtInStoreNameKeys.has(merchantNameKey)) {
                    return;
                }

                const products = sellerProducts
                    .filter((product) => {
                        return productRecordMerchantId(product) === merchantId && productIsActive(product);
                    })
                    .map((product) => normalizeSellerProduct(product, merchant));

                if (products.length === 0) {
                    return;
                }

                sellerStoreIds.add(merchantId);
                storeCatalogs[merchantId] = {
                    name: merchant.MERCH_name,
                    type: merchant.MERCH_type || 'Grocery',
                    meta: merchant.MERCH_address || 'Approved honestbee merchant in Cebu',
                    eta: merchant.MERCH_businessHours || 'Merchant managed hours',
                    status: merchantStoreStatusLabel(merchant),
                    availableDays: normalizeMerchantAvailableDays(merchant.MERCH_availableDays || ''),
                    theme: merchant.MERCH_type === 'Food' ? '#d86b2d' : '#1e7a58',
                    logo: merchant.MERCH_name,
                    logoImage: '',
                    products
                };
            });

        renderStoreDirectories();
        updateStoreAvailability(selectedDeliveryArea);

        const activeStoreMissing = !storeCatalogs[activeStoreId];
        if (activeStoreMissing) {
            activeStoreId = getFirstAvailableStoreId();
        }

        const shopScreen = screens.find((screen) => screen.dataset.screen === 'shop');
        if (shopScreen?.classList.contains('is-active') && storeCatalogs[activeStoreId]) {
            if (activeStoreMissing) {
                selectStore(activeStoreId, false);
            } else {
                refreshActiveStoreDisplay();
            }
        }
    }

    function listenSellerCatalogs() {
        listenFirestoreMerchants((records) => {
            sellerMerchants = records;
            rebuildSellerStores();
        });

        listenFirestoreProducts((records) => {
            sellerProducts = records;
            rebuildSellerStores();
        });
    }

    function selectStore(storeId, updateHash = true) {
        const store = storeCatalogs[storeId];
        if (!store) {
            return;
        }

        activeStoreId = storeId;
        activeType = 'all';
        activeCategory = 'all';
        searchInput.value = '';
        merchantTitle.textContent = store.name;
        merchantSearch.placeholder = `Search ${store.name}...`;
        merchantMasthead.style.background = store.theme;
        merchantInfo.style.background = store.theme;

        typeButtons.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.typeFilter === 'all');
        });
        renderCategoryControls(store);
        $$('[data-store-id]').forEach((node) => {
            node.classList.toggle('is-active', node.dataset.storeId === storeId);
        });

        renderProductGrid(store.products || []);
        showScreen('shop');
        if (updateHash) {
            history.replaceState(null, '', '#shop');
        }
    }

    function openProductModal(product) {
        productModalImage.src = product.image;
        productModalImage.alt = product.name;
        productModalName.textContent = product.name;
        productModalUnit.textContent = product.unit || '1 pack';
        productModalPrice.textContent = formatMoney(product.price);
        if (productModalDescription) {
            productModalDescription.textContent = product.description || 'Selected by your shopper from the merchant shelf, packed carefully, and delivered in your chosen time window.';
        }
        if (productModalAddButton) {
            const isStoreOpen = merchantStoreIsOpen(storeCatalogs[activeStoreId] || {});
            productModalAddButton.disabled = !isStoreOpen;
            productModalAddButton.innerHTML = isStoreOpen
                ? '<i data-lucide="shopping-cart" aria-hidden="true"></i> Add to Cart'
                : `<i data-lucide="shopping-cart" aria-hidden="true"></i> ${storeCurrentlyClosedMessage}`;
        }
        productModal.classList.add('is-open');
        refreshIcons();
    }

    function closeProductModal() {
        productModal.classList.remove('is-open');
    }

    function promptGuestSignupForCart() {
        const account = getCurrentAccount();

        if (account && isCustomerAccount(account)) {
            location.href = customerStoreUrl(activeStoreId);
            return;
        }

        if (account) {
            redirectToRoleHome();
            return;
        }

        const opened = openAccountModal('signup');
        const signupNotice = $('[data-customer-signup-notice]');
        setNotice(signupNotice, 'Please create an account or sign in to add items to your cart.');

        if (!opened) {
            location.href = 'index.html?modal=signup';
        }
    }

    function applyFilters() {
        const queryValue = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        productCards.forEach((card) => {
            const matchesType = activeType === 'all' || card.dataset.type === activeType;
            const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
            const matchesSearch = !queryValue || card.dataset.search.includes(queryValue);
            const isVisible = matchesType && matchesCategory && matchesSearch;

            card.style.display = isVisible ? '' : 'none';
            if (isVisible) {
                visibleCount += 1;
            }
        });

        noResults.classList.toggle('is-visible', visibleCount === 0);
    }

    document.addEventListener('click', async (event) => {
        const screenLink = event.target.closest('[data-screen-target]');
        const guestAddCartButton = event.target.closest('[data-guest-add-cart], [data-guest-modal-add-cart]');
        const productCard = event.target.closest('[data-open-product]');
        const storeTrigger = event.target.closest('[data-store-id]');
        const categoryButton = event.target.closest('[data-category-filter]');

        if (guestAddCartButton && root.contains(guestAddCartButton)) {
            event.preventDefault();
            event.stopPropagation();
            if (!merchantStoreIsOpen(storeCatalogs[activeStoreId] || {})) {
                return;
            }
            promptGuestSignupForCart();
            return;
        }

        if (screenLink) {
            event.preventDefault();
            if (['stores', 'shop', 'restaurants', 'deals'].includes(screenLink.dataset.screenTarget) && !canBrowseShoppingScreens()) {
                redirectToRoleHome();
                return;
            }
            if (!storeTrigger && screenLink.dataset.screenTarget === 'shop' && !availableStoreIds.includes(activeStoreId)) {
                selectStore(getFirstAvailableStoreId());
                return;
            }
            showScreen(screenLink.dataset.screenTarget);
        }

        if (categoryButton) {
            event.preventDefault();
            activeCategory = categoryButton.dataset.categoryFilter;
            categoryButtons.forEach((node) => node.classList.toggle('is-active', node.dataset.categoryFilter === activeCategory));
            applyFilters();
        }

        if (storeTrigger?.matches('[data-customer-store-link]')) {
            const account = getCurrentAccount();
            const storeId = storeTrigger.dataset.storeId;

            if (!account && storeCatalogs[storeId]) {
                event.preventDefault();
                selectStore(storeId);
                return;
            }

            if (account && !isCustomerAccount(account)) {
                event.preventDefault();
                redirectToRoleHome();
                return;
            }

            return;
        }

        if (storeTrigger && storeCatalogs[storeTrigger.dataset.storeId]) {
            event.preventDefault();
            selectStore(storeTrigger.dataset.storeId);
        }

        if (productCard) {
            openProductModal(productFromElement(productCard));
        }

        if (event.target.closest('[data-close-product-modal]') || event.target === productModal) {
            closeProductModal();
        }
    });

    typeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeType = button.dataset.typeFilter;
            typeButtons.forEach((node) => node.classList.toggle('is-active', node === button));
            applyFilters();
        });
    });

    searchInput.addEventListener('input', applyFilters);

    $$('[data-address-form]').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            handleAddressSubmit(form);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeProductModal();
        }
    });

    renderStoreDirectories();
    listenSellerCatalogs();
    const storedDeliveryArea = getStoredDeliveryArea();
    if (storedDeliveryArea) {
        setDeliveryArea(storedDeliveryArea, {
            saveSelection: false,
            showMessage: false
        });
    }

    const initialHash = location.hash.replace('#', '') || 'home';
    if (initialHash.startsWith('store-') && storeCatalogs[initialHash.replace('store-', '')]) {
        location.replace(customerStoreUrl(initialHash.replace('store-', '')));
        return;
    } else {
        renderCategoryControls(storeCatalogs[activeStoreId]);
        renderProductGrid(storeCatalogs[activeStoreId].products || []);
        showScreen(initialHash);
    }
}

function customerOrderNumber(order) {
    return order?.order_id || order?.ORDER_id || order?.id || '';
}

function customerOrderStoreName(order) {
    return order?.merchant_name || order?.MERCH_name || order?.store_name || 'honestbee Partner';
}

function customerOrderDate(order) {
    return dateLabel(order?.createdAt || order?.ORDER_date || order?.order_date || order?.created_at);
}

function orderItemName(item) {
    return item?.ITEM_name || item?.name || item?.product_name || 'Order item';
}

function orderItemQuantity(item) {
    return Math.max(1, Number(item?.ITEM_quantity || item?.quantity || 1) || 1);
}

function orderItemUnitPrice(item) {
    return Number(item?.ITEM_unitPrice || item?.price || item?.unit_price || 0) || 0;
}

function catalogProductForOrderItem(item) {
    const productId = String(item?.product_id || item?.ITEM_productId || item?.PROD_id || item?.id || '').trim();
    const itemNameKey = slugify(orderItemName(item));
    const merchantNameKey = slugify(item?.merchant_name || item?.merchant || item?.MERCH_name || '');

    for (const store of Object.values(storeCatalogs)) {
        const products = Array.isArray(store?.products) ? store.products : [];
        const product = products.find((candidate) => {
            if (productId && candidate.id === productId) {
                return true;
            }

            if (slugify(candidate.name) !== itemNameKey) {
                return false;
            }

            return !merchantNameKey || slugify(candidate.merchant || store.name) === merchantNameKey;
        });

        if (product) {
            return product;
        }
    }

    return null;
}

function orderItemImage(item) {
    const catalogProduct = catalogProductForOrderItem(item);
    return productImagePath(catalogProduct?.image || item?.image || item?.ITEM_image || item?.PROD_image || item?.product_image || '');
}

function customerOrderSummaryCard(order) {
    const status = orderStatus(order);
    const orderId = customerOrderNumber(order);
    const modalOrderId = order.id || orderId;
    return `
        <article class="customer-order-card">
            <div class="customer-order-card-main">
                <div>
                    <strong>Order ${escapeHtml(orderId)}</strong>
                    <span>${escapeHtml(customerOrderStoreName(order))}</span>
                </div>
                <span class="customer-order-status">${escapeHtml(status)}</span>
            </div>
            <div class="customer-order-card-meta">
                <div>
                    <small>Order ID</small>
                    <strong>${escapeHtml(orderId)}</strong>
                </div>
                <div>
                    <small>Store Name</small>
                    <strong>${escapeHtml(customerOrderStoreName(order))}</strong>
                </div>
                <div>
                    <small>Order Date</small>
                    <strong>${escapeHtml(customerOrderDate(order))}</strong>
                </div>
                <div>
                    <small>Total Amount</small>
                    <strong>${formatMoney(orderTotal(order))}</strong>
                </div>
                <div>
                    <small>Order Status</small>
                    <strong>${escapeHtml(status)}</strong>
                </div>
            </div>
            <div class="customer-order-card-actions">
                <button class="ghost-button" type="button" data-customer-order-open="${escapeHtml(modalOrderId)}" aria-label="View details for order ${escapeHtml(orderId)}">
                    <i data-lucide="receipt-text" aria-hidden="true"></i> View Details
                </button>
            </div>
        </article>
    `;
}

function customerOrderItemsHtml(items = []) {
    if (items.length === 0) {
        return '<div class="empty-state">No item documents found for this order yet.</div>';
    }

    return items.map((item) => {
        const quantity = orderItemQuantity(item);
        const unitPrice = orderItemUnitPrice(item);
        const itemTotal = quantity * unitPrice;
        return `
            <article class="customer-order-item">
                <img src="${escapeHtml(orderItemImage(item))}" alt="${escapeHtml(orderItemName(item))}" loading="lazy">
                <div class="customer-order-item-main">
                    <strong>${escapeHtml(orderItemName(item))}</strong>
                    <span>${escapeHtml(item.unit || item.ITEM_unit || '1 item')}</span>
                </div>
                <div class="customer-order-item-numbers">
                    <span>Qty ${escapeHtml(quantity)}</span>
                    <span>${formatMoney(unitPrice)} each</span>
                    <strong>${formatMoney(itemTotal)}</strong>
                </div>
            </article>
        `;
    }).join('');
}

function customerOrderModalTemplate(order, items = []) {
    const status = orderStatus(order);
    const orderId = customerOrderNumber(order);
    const customerName = order.customer_name || order.CUST_fullName || 'Customer';
    const customerEmail = order.customer_email || order.CUST_email || 'No email on file';
    const customerPhone = order.customer_phone || order.CUST_phone || 'No phone on file';
    const deliveryAddress = order.customer_address || order.DELIVERY_address || order.address || 'No delivery address';
    const paymentMethod = paymentMethodLabel(orderPaymentMethod(order)) || orderPaymentMethod(order) || 'Payment not set';

    return `
        <div class="customer-order-modal-head">
            <div>
                <span class="customer-order-status">${escapeHtml(status)}</span>
                <h2 id="customerOrderModalTitle">Order ${escapeHtml(orderId)}</h2>
            </div>
            <strong>${formatMoney(orderTotal(order))}</strong>
        </div>

        <div class="customer-order-detail-grid">
            <div>
                <span>Order ID</span>
                <strong>${escapeHtml(orderId)}</strong>
            </div>
            <div>
                <span>Store Name</span>
                <strong>${escapeHtml(customerOrderStoreName(order))}</strong>
            </div>
            <div>
                <span>Store Status</span>
                <strong>${escapeHtml(orderStoreStatus(order))}</strong>
            </div>
            <div>
                <span>Order Date</span>
                <strong>${escapeHtml(customerOrderDate(order))}</strong>
            </div>
            <div>
                <span>Payment Method</span>
                <strong>${escapeHtml(paymentMethod)}</strong>
            </div>
            <div>
                <span>Order Status</span>
                <strong>${escapeHtml(status)}</strong>
            </div>
            <div>
                <span>Delivery Address</span>
                <strong>${escapeHtml(deliveryAddress)}</strong>
            </div>
        </div>

        <section class="customer-order-modal-section">
            <h3>Customer information</h3>
            <div class="customer-order-customer-grid">
                <div>
                    <span>Name</span>
                    <strong>${escapeHtml(customerName)}</strong>
                </div>
                <div>
                    <span>Email</span>
                    <strong>${escapeHtml(customerEmail)}</strong>
                </div>
                <div>
                    <span>Phone</span>
                    <strong>${escapeHtml(customerPhone)}</strong>
                </div>
            </div>
        </section>

        <section class="customer-order-modal-section">
            <div class="customer-order-section-head">
                <h3>Ordered products</h3>
                <strong>${escapeHtml(items.length)} ${items.length === 1 ? 'item' : 'items'}</strong>
            </div>
            <div class="customer-order-items">
                ${customerOrderItemsHtml(items)}
            </div>
            <div class="customer-order-modal-total">
                <span>Total price</span>
                <strong>${formatMoney(orderTotal(order))}</strong>
            </div>
        </section>

        ${gcashPaymentDetailsHtml(order)}

        <div class="customer-order-modal-actions">
            <button class="ghost-button" type="button" data-customer-order-modal-action="rate">
                <i data-lucide="star" aria-hidden="true"></i> Rate Order
            </button>
            <button class="ghost-button" type="button" data-customer-order-modal-action="refund">
                <i data-lucide="receipt" aria-hidden="true"></i> Request Refund
            </button>
        </div>
        <div class="customer-order-modal-workspace" data-customer-order-modal-workspace></div>
    `;
}

const customerRatingStarPath = 'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z';

function customerRatingScaleHtml(name, selectedScore = 0) {
    const normalizedSelectedScore = Number(selectedScore) || 0;

    return `
        <div class="customer-rating-scale" data-star-rating>
            ${[1, 2, 3, 4, 5].map((score) => {
                const starLabel = `${score} ${score === 1 ? 'star' : 'stars'}`;
                return `
                    <label class="customer-star-rating-option" title="${starLabel}" data-star-rating-option data-rating-value="${score}">
                        <input type="radio" name="${name}" value="${score}" ${score === normalizedSelectedScore ? 'checked' : ''} required aria-label="${starLabel}">
                        <span class="customer-star-rating-icon" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" focusable="false">
                                <path d="${customerRatingStarPath}"></path>
                            </svg>
                        </span>
                    </label>
                `;
            }).join('')}
        </div>
    `;
}

function selectedCustomerStarRatingValue(rating) {
    const checked = $('input[type="radio"]:checked', rating);
    return Number(checked?.value) || 0;
}

function paintCustomerStarRating(rating, value, className) {
    $$('[data-star-rating-option]', rating).forEach((option) => {
        option.classList.toggle(className, Number(option.dataset.ratingValue) <= value);
    });
}

function clearCustomerStarRatingPreview(rating) {
    rating.classList.remove('is-previewing');
    $$('[data-star-rating-option]', rating).forEach((option) => {
        option.classList.remove('is-previewed');
    });
}

function updateCustomerStarRating(rating) {
    paintCustomerStarRating(rating, selectedCustomerStarRatingValue(rating), 'is-selected');
}

function setCustomerRatingFormLocked(form, locked) {
    form.classList.toggle('is-rating-locked', locked);
    $$('input[type="radio"]', form).forEach((input) => {
        input.disabled = locked;
    });
    $$('[data-star-rating]', form).forEach((rating) => {
        clearCustomerStarRatingPreview(rating);
        updateCustomerStarRating(rating);
    });

    const comment = $('textarea[name="comment"]', form);
    if (comment) {
        comment.readOnly = locked;
    }

    const submitButton = $('button[type="submit"]', form);
    if (submitButton) {
        submitButton.disabled = locked;
    }

    const editButton = $('[data-customer-order-edit-rating]', form);
    if (editButton) {
        editButton.hidden = !locked;
    }
}

function initCustomerStarRatings(root = document) {
    $$('[data-star-rating]', root).forEach((rating) => {
        updateCustomerStarRating(rating);
        if (rating.dataset.starRatingReady === 'true') {
            return;
        }

        rating.dataset.starRatingReady = 'true';
        rating.addEventListener('change', (event) => {
            if (event.target.matches('input[type="radio"]')) {
                updateCustomerStarRating(rating);
            }
        });
        rating.addEventListener('mouseover', (event) => {
            if (rating.closest('[data-customer-order-rating-form]')?.classList.contains('is-rating-locked')) {
                return;
            }

            const option = event.target.closest('[data-star-rating-option]');
            if (!option || !rating.contains(option)) {
                return;
            }

            rating.classList.add('is-previewing');
            paintCustomerStarRating(rating, Number(option.dataset.ratingValue) || 0, 'is-previewed');
        });
        rating.addEventListener('focusin', (event) => {
            if (rating.closest('[data-customer-order-rating-form]')?.classList.contains('is-rating-locked')) {
                return;
            }

            const option = event.target.closest('[data-star-rating-option]');
            if (!option || !rating.contains(option)) {
                return;
            }

            rating.classList.add('is-previewing');
            paintCustomerStarRating(rating, Number(option.dataset.ratingValue) || 0, 'is-previewed');
        });
        rating.addEventListener('mouseleave', () => {
            clearCustomerStarRatingPreview(rating);
        });
        rating.addEventListener('focusout', (event) => {
            if (!rating.contains(event.relatedTarget)) {
                clearCustomerStarRatingPreview(rating);
            }
        });
    });
}

function customerOrderRatingFormHtml(order, existingRating = null) {
    const orderId = customerOrderNumber(order);
    const ratingId = existingRating?.id || existingRating?.ratingId || '';
    const serviceScore = Number(existingRating?.serviceScore ?? existingRating?.RATE_serviceScore ?? 0) || 0;
    const shopperScore = Number(existingRating?.shopperScore ?? existingRating?.RATE_shopperScore ?? 0) || 0;
    const comment = existingRating?.comment || existingRating?.RATE_feedbackComment || '';
    const savedNote = ratingId ? '<p class="customer-feedback-saved-note"><i data-lucide="check-circle" aria-hidden="true"></i> You already rated this order. Click Edit Rating to update it.</p>' : '';
    return `
        <form class="customer-order-action-panel customer-order-modal-form" data-customer-order-rating-form data-customer-order-rating-id="${escapeHtml(ratingId)}">
            <div class="customer-order-form-head">
                <div>
                    <h3>Rate Order</h3>
                    <span>Order ${escapeHtml(orderId)}</span>
                </div>
                <strong>${escapeHtml(orderStatus(order))}</strong>
            </div>
            <input type="hidden" name="order" value="${escapeHtml(orderId)}">
            ${savedNote}
            <div class="customer-rating-fields">
                <fieldset class="customer-rating-field">
                    <legend>Service quality</legend>
                    ${customerRatingScaleHtml('serviceScore', serviceScore)}
                </fieldset>
                <fieldset class="customer-rating-field">
                    <legend>Rider experience</legend>
                    ${customerRatingScaleHtml('shopperScore', shopperScore)}
                </fieldset>
                <label class="customer-order-textarea">
                    Feedback comment
                    <textarea name="comment" placeholder="Optional">${escapeHtml(comment)}</textarea>
                </label>
            </div>
            <div class="customer-order-form-actions">
                <button class="primary-button" type="submit"><i data-lucide="star" aria-hidden="true"></i> Save rating</button>
                <button class="ghost-button" type="button" data-customer-order-edit-rating hidden><i data-lucide="pencil" aria-hidden="true"></i> Edit Rating</button>
                <div class="notice" data-customer-order-rating-notice></div>
            </div>
        </form>
    `;
}

function customerOrderRefundFormHtml(order, existingRefunds = []) {
    const orderId = customerOrderNumber(order);
    const total = Number(orderTotal(order) || 0);
    const refundList = existingRefunds.length > 0
        ? `<div class="customer-existing-feedback-list">
            <strong>Previous refund requests</strong>
            ${existingRefunds.map((refund) => `
                <div class="customer-existing-feedback-item">
                    <span>${escapeHtml(refund.status || refund.REFUND_status || 'Pending')}</span>
                    <p>${escapeHtml(refund.reason || refund.REFUND_reason || 'No reason provided.')}</p>
                    <small>${formatMoney(refund.amount || refund.REFUND_amount || 0)}</small>
                </div>
            `).join('')}
        </div>`
        : '';
    return `
        <form class="customer-order-action-panel customer-order-modal-form" data-customer-order-refund-form>
            <div class="customer-order-form-head">
                <div>
                    <h3>Request Refund</h3>
                    <span>Order ${escapeHtml(orderId)}</span>
                </div>
                <strong>${formatMoney(total)}</strong>
            </div>
            <input type="hidden" name="order" value="${escapeHtml(orderId)}">
            ${refundList}
            <div class="customer-refund-fields">
                <label class="customer-order-input">
                    Refund amount
                    <input type="number" min="1" step="0.01" name="amount" value="${escapeHtml(total.toFixed(2))}" required>
                </label>
                <div class="customer-refund-reference">
                    <span>Order status</span>
                    <strong>${escapeHtml(orderStatus(order))}</strong>
                </div>
                <label class="customer-order-textarea">
                    Reason for refund
                    <textarea name="reason" placeholder="Describe the issue" required></textarea>
                </label>
            </div>
            <div class="customer-order-form-actions">
                <button class="primary-button" type="submit"><i data-lucide="receipt" aria-hidden="true"></i> Submit refund</button>
                <div class="notice" data-customer-order-refund-notice></div>
            </div>
        </form>
    `;
}

function orderCard(order, actions = '') {
    const status = orderStatus(order);
    const payment = orderPaymentDisplay(order);
    const storeAcceptance = orderStoreAcceptanceDisplay(order);
    const gcashDetails = isGcashPaymentMethod(orderPaymentMethod(order)) ? orderGcashDetails(order) : null;
    return `
        <article class="dashboard-card" data-order-card="${escapeHtml(order.id || order.order_id || '')}">
            <div class="dashboard-card-head">
                <div>
                    <span class="status-pill">${escapeHtml(status)}</span>
                    <h3>Order ${escapeHtml(order.order_id || order.id)}</h3>
                </div>
                <strong>${formatMoney(order.summary?.total || order.ORDER_totalAmount || 0)}</strong>
            </div>
            <p>${escapeHtml(order.merchant_name || 'honestbee Partner')} to ${escapeHtml(order.customer_address || order.DELIVERY_address || 'No delivery address')}</p>
            <p><strong>Payment:</strong> ${escapeHtml(payment)}</p>
            ${gcashDetails?.reference ? `<p><strong>GCash Ref:</strong> ${escapeHtml(gcashDetails.reference)}</p>` : ''}
            ${storeAcceptance ? `<p><strong>Merchant:</strong> ${escapeHtml(storeAcceptance)}</p>` : ''}
            <small>${escapeHtml(order.scheduled_time || order.ORDER_scheduledTime || 'ASAP')} - ${dateLabel(order.createdAt || order.ORDER_date)}</small>
            ${actions}
        </article>
    `;
}

function sellerOrderCard(order) {
    const status = orderStatus(order);
    const payment = orderPaymentDisplay(order);
    const storeAcceptance = orderStoreAcceptanceDisplay(order);
    const orderId = customerOrderNumber(order);
    const modalOrderId = order.id || orderId;
    const gcashDetails = isGcashPaymentMethod(orderPaymentMethod(order)) ? orderGcashDetails(order) : null;
    return `
        <article class="dashboard-card" data-order-card="${escapeHtml(modalOrderId)}">
            <div class="dashboard-card-head">
                <div>
                    <span class="status-pill">${escapeHtml(status)}</span>
                    <h3>Order ${escapeHtml(orderId)}</h3>
                </div>
                <strong>${formatMoney(orderTotal(order))}</strong>
            </div>
            <p>${escapeHtml(order.customer_name || 'Customer')} - ${escapeHtml(order.customer_address || order.DELIVERY_address || 'No delivery address')}</p>
            <p><strong>Payment:</strong> ${escapeHtml(payment)}</p>
            ${gcashDetails?.reference ? `<p><strong>GCash Ref:</strong> ${escapeHtml(gcashDetails.reference)}</p>` : ''}
            ${storeAcceptance ? `<p><strong>Merchant:</strong> ${escapeHtml(storeAcceptance)}</p>` : ''}
            <small>${escapeHtml(order.scheduled_time || order.ORDER_scheduledTime || 'ASAP')}</small>
            <div class="card-actions">
                <button class="ghost-button" type="button" data-seller-order-open="${escapeHtml(modalOrderId)}">
                    <i data-lucide="receipt-text" aria-hidden="true"></i> View preparation details
                </button>
            </div>
        </article>
    `;
}

function sellerOrderItemsHtml(items = []) {
    if (items.length === 0) {
        return '<div class="empty-state">No item documents found for this order yet.</div>';
    }

    return items.map((item) => {
        const quantity = orderItemQuantity(item);
        const unitPrice = orderItemUnitPrice(item);
        const itemImage = orderItemImage(item);
        return `
            <article class="seller-order-item-row order-item-row">
                <img class="seller-order-item-image" src="${escapeHtml(itemImage)}" alt="${escapeHtml(orderItemName(item))}" loading="lazy">
                <div class="seller-order-item-info">
                    <strong>${escapeHtml(orderItemName(item))}</strong>
                    <small>${escapeHtml(item.unit || item.ITEM_unit || '1 item')}</small>
                    ${item.instructions ? `<p>${escapeHtml(item.instructions)}</p>` : ''}
                </div>
                <span class="seller-order-item-price">${escapeHtml(quantity)} x ${formatMoney(unitPrice)}</span>
            </article>
        `;
    }).join('');
}

function sellerOrderCardDetails(order) {
    const card = order?.payment_card || {};
    const cardholder = card.cardholderName
        || order?.payment_cardholder
        || order?.ORDER_cardholderName
        || order?.PAY_cardholderName
        || order?.cardholder_name
        || '';
    const last4 = card.last4
        || order?.payment_card_last4
        || order?.ORDER_cardLast4
        || order?.PAY_cardLast4
        || order?.card_last4
        || '';
    const expiry = card.expiry
        || order?.payment_card_expiry
        || order?.ORDER_cardExpiry
        || order?.PAY_cardExpiry
        || '';

    return {
        cardholder,
        last4,
        expiry,
        hasDetails: Boolean(cardholder || last4 || expiry)
    };
}

function sellerCardDetailsPanelHtml(order) {
    const details = sellerOrderCardDetails(order);
    const method = paymentMethodLabel(orderPaymentMethod(order)) || 'Card';

    if (!details.hasDetails) {
        return `
            <div class="customer-order-action-panel">
                <h3>Card Details</h3>
                <div class="empty-state">No saved card details are available for this order.</div>
            </div>
        `;
    }

    return `
        <div class="customer-order-action-panel">
            <div class="customer-order-form-head">
                <div>
                    <h3>Card Details</h3>
                    <span>Payment: ${escapeHtml(method)}</span>
                </div>
                <strong>${escapeHtml(orderPaymentStatus(order))}</strong>
            </div>
            <div class="customer-order-detail-grid">
                <div>
                    <span>Cardholder</span>
                    <strong>${escapeHtml(details.cardholder || 'Not provided')}</strong>
                </div>
                <div>
                    <span>Card Number</span>
                    <strong>${details.last4 ? `**** ${escapeHtml(details.last4)}` : 'Not provided'}</strong>
                </div>
                <div>
                    <span>Expiry</span>
                    <strong>${escapeHtml(details.expiry || 'Not provided')}</strong>
                </div>
            </div>
        </div>
    `;
}

function sellerOrderModalTemplate(order, items = [], options = {}) {
    const status = orderStatus(order);
    const orderId = customerOrderNumber(order);
    const storeAcceptance = orderStoreAcceptanceDisplay(order);
    const assignedShopper = orderAssignedShopperId(order) || 'Not assigned';
    const paymentMethod = paymentMethodLabel(orderPaymentMethod(order));
    const showCardButton = paymentMethod === 'Card' || sellerOrderCardDetails(order).hasDetails;

    return `
        <div class="customer-order-modal-head">
            <div>
                <span class="customer-order-status">${escapeHtml(status)}</span>
                <h2 id="sellerOrderModalTitle">Order ${escapeHtml(orderId)}</h2>
            </div>
            <strong>${formatMoney(orderTotal(order))}</strong>
        </div>

        <div class="customer-order-detail-grid">
            <div>
                <span>Customer</span>
                <strong>${escapeHtml(order.customer_name || 'Customer')}</strong>
            </div>
            <div>
                <span>Phone</span>
                <strong>${escapeHtml(order.customer_phone || 'No phone on file')}</strong>
            </div>
            <div>
                <span>Delivery Time</span>
                <strong>${escapeHtml(order.scheduled_time || order.ORDER_scheduledTime || 'ASAP')}</strong>
            </div>
            <div>
                <span>Delivery Address</span>
                <strong>${escapeHtml(order.customer_address || order.DELIVERY_address || 'No delivery address')}</strong>
            </div>
            <div>
                <span>Payment</span>
                <strong>${escapeHtml(orderPaymentDisplay(order))}</strong>
            </div>
            <div>
                <span>Merchant Status</span>
                <strong>${escapeHtml(storeAcceptance || 'Waiting')}</strong>
            </div>
            <div>
                <span>Rider</span>
                <strong>${escapeHtml(assignedShopper)}</strong>
            </div>
        </div>

        ${gcashPaymentDetailsHtml(order)}

        <section class="customer-order-modal-section">
            <div class="customer-order-section-head">
                <h3>Items to prepare</h3>
                <strong>${escapeHtml(items.length)} ${items.length === 1 ? 'item' : 'items'}</strong>
            </div>
            <div class="dashboard-list">
                ${sellerOrderItemsHtml(items)}
            </div>
        </section>

        <div class="customer-order-modal-actions">
            ${showCardButton ? `
                <button class="ghost-button" type="button" data-seller-card-details>
                    <i data-lucide="credit-card" aria-hidden="true"></i> View Card Details
                </button>
            ` : ''}
            ${options.canVerifyPayment ? `
                <button class="primary-button" type="button" data-seller-verify-paid="${escapeHtml(order.id || orderId)}">
                    <i data-lucide="check-circle" aria-hidden="true"></i> Mark paid
                </button>
                <button class="ghost-button" type="button" data-seller-verify-unpaid="${escapeHtml(order.id || orderId)}">
                    <i data-lucide="x-circle" aria-hidden="true"></i> Mark unpaid
                </button>
            ` : ''}
        </div>
        <div class="customer-order-modal-workspace" data-seller-order-modal-workspace></div>
    `;
}

function orderStatus(order) {
    return order?.orderStatus || order?.order_status || order?.ORDER_status || 'Placed';
}

function orderTotal(order) {
    return order?.summary?.total || order?.ORDER_totalAmount || 0;
}

function orderPaymentStatus(order) {
    return order?.payment_status || order?.PAY_status || order?.paymentStatus || order?.ORDER_paymentStatus || 'Unpaid';
}

function orderPaymentMethod(order) {
    return order?.payment_method || order?.PAY_method || order?.paymentMethod || order?.ORDER_paymentMethod || '';
}

function paymentMethodLabel(method) {
    const value = String(method || '').trim();
    const normalized = value.toLowerCase();

    if (normalized.includes('gcash') || normalized.includes('g-cash') || normalized.includes('wallet')) {
        return 'GCash';
    }

    if (normalized.includes('cash')) {
        return 'Cash';
    }

    if (normalized.includes('card')) {
        return 'Card';
    }

    return value;
}

function isGcashPaymentMethod(method) {
    return paymentMethodLabel(method) === 'GCash';
}

function orderPaymentReference(order) {
    return order?.payment_reference
        || order?.ORDER_paymentReference
        || order?.gcash_reference
        || order?.PAY_reference
        || order?.reference
        || '';
}

function orderPaymentProof(order) {
    return order?.payment_proof
        || order?.ORDER_paymentProof
        || order?.gcash_proof
        || order?.PAY_proof
        || order?.proof_path
        || '';
}

function orderGcashDetails(order) {
    const reference = orderPaymentReference(order);
    const proof = orderPaymentProof(order);

    return {
        reference,
        proof,
        hasDetails: Boolean(reference || proof)
    };
}

function gcashPaymentDetailsHtml(order) {
    if (!isGcashPaymentMethod(orderPaymentMethod(order))) {
        return '';
    }

    const details = orderGcashDetails(order);
    const proofHtml = details.proof
        ? `
            <a class="payment-proof-link" href="${escapeHtml(details.proof)}" target="_blank" rel="noopener">
                <img class="payment-proof-image" src="${escapeHtml(details.proof)}" alt="GCash proof of payment" loading="lazy">
                <span>Open proof of payment</span>
            </a>
        `
        : '<div class="empty-state">No proof of payment was uploaded for this order.</div>';

    return `
        <section class="customer-order-modal-section payment-proof-section">
            <div class="customer-order-section-head">
                <h3>GCash payment</h3>
                <strong>${escapeHtml(orderPaymentStatus(order))}</strong>
            </div>
            <div class="customer-order-detail-grid">
                <div>
                    <span>GCash Reference Number</span>
                    <strong>${escapeHtml(details.reference || 'Not provided')}</strong>
                </div>
            </div>
            ${proofHtml}
        </section>
    `;
}

function orderPaymentDisplay(order, statusOverride = '') {
    const status = statusOverride || orderPaymentStatus(order);
    const method = paymentMethodLabel(orderPaymentMethod(order));
    const verification = sellerPaymentVerificationPending(order)
        ? ' (merchant verification pending)'
        : order?.seller_payment_verified && isRegisteredSellerOrder(order)
            ? ' (merchant verified)'
            : '';
    return method ? `${status} - ${method}${verification}` : `${status}${verification}`;
}

function isTerminalOrderStatus(status) {
    return ['Delivered', 'Cancelled', 'Rejected'].includes(status);
}

const riderDeliveryWindowMinutes = 60;

function orderScheduledLabel(order) {
    return String(order?.scheduled_time || order?.ORDER_scheduledTime || order?.DELIVERY_time || order?.scheduledTime || '').trim() || 'ASAP';
}

function isAsapOrder(order) {
    return orderScheduledLabel(order).toLowerCase() === 'asap';
}

function parseOrderScheduleDate(order) {
    if (isAsapOrder(order)) {
        return null;
    }

    const value = orderScheduledLabel(order);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function orderScheduleWindow(order) {
    const label = orderScheduledLabel(order);

    if (isAsapOrder(order)) {
        return {
            asap: true,
            label
        };
    }

    const startDate = parseOrderScheduleDate(order);
    if (!startDate) {
        return {
            asap: false,
            label,
            normalizedLabel: label.toLowerCase()
        };
    }

    const start = startDate.getTime();
    return {
        asap: false,
        label,
        start,
        end: start + riderDeliveryWindowMinutes * 60 * 1000
    };
}

function orderScheduleWindowsConflict(firstOrder, secondOrder) {
    const firstWindow = orderScheduleWindow(firstOrder);
    const secondWindow = orderScheduleWindow(secondOrder);

    if (firstWindow.asap || secondWindow.asap) {
        return firstWindow.asap && secondWindow.asap;
    }

    if (Number.isFinite(firstWindow.start) && Number.isFinite(secondWindow.start)) {
        return firstWindow.start < secondWindow.end && secondWindow.start < firstWindow.end;
    }

    return firstWindow.normalizedLabel && firstWindow.normalizedLabel === secondWindow.normalizedLabel;
}

function riderActiveOrders(orders, shopperId) {
    return orders.filter((order) => {
        const assignedShopper = orderAssignedShopperId(order);
        return shopperId && assignedShopper === shopperId && !isTerminalOrderStatus(orderStatus(order));
    });
}

function riderAcceptConflictReason(order, activeOrders) {
    const conflict = activeOrders.find((activeOrder) => {
        return activeOrder.id !== order.id && orderScheduleWindowsConflict(order, activeOrder);
    });

    if (!conflict) {
        return '';
    }

    const conflictOrder = conflict.order_id || conflict.id;
    if (isAsapOrder(order)) {
        return `You already have active ASAP Order ${conflictOrder}. Finish it before accepting another ASAP delivery.`;
    }

    return `Delivery time conflicts with Order ${conflictOrder} scheduled for ${orderScheduledLabel(conflict)}. Finish that delivery before accepting this time slot.`;
}

function removeInlineConfirms(scope, selector = '.inline-confirm') {
    $$(selector, scope).forEach((node) => node.remove());
}

function rejectedByRider(order, shopperId) {
    const rejectedBy = Array.isArray(order?.rider_rejected_by)
        ? order.rider_rejected_by
        : Array.isArray(order?.riderRejectedBy)
            ? order.riderRejectedBy
            : [order?.rider_rejected_by || order?.riderRejectedBy].filter(Boolean);

    return Boolean(shopperId && rejectedBy.includes(shopperId));
}

function showCustomerCancelPrompt(root, order, trigger) {
    removeInlineConfirms(root, '[data-cancel-order-confirm]');
    const card = trigger.closest('[data-order-card]') || trigger.closest('.dashboard-card');
    if (!card) {
        return;
    }

    const prompt = document.createElement('div');
    prompt.className = 'inline-confirm';
    prompt.dataset.cancelOrderConfirm = order.id;
    prompt.innerHTML = `
        <strong>Cancel this order?</strong>
        <p>Order ${escapeHtml(order.order_id || order.id)} will be marked as cancelled.</p>
        <div class="confirm-actions">
            <button class="primary-button danger-button" type="button" data-customer-cancel-confirm="${escapeHtml(order.id)}">
                <i data-lucide="check" aria-hidden="true"></i> Yes, cancel order
            </button>
            <button class="ghost-button" type="button" data-customer-cancel-dismiss>
                <i data-lucide="x" aria-hidden="true"></i> Keep order
            </button>
        </div>
    `;
    card.append(prompt);
    refreshIcons();
    applyCurrentLanguage();
}

function customerIdForFeedback(account = getCurrentAccount()) {
    return isCustomerRecordId(accountLinkedId(account))
        ? accountLinkedId(account)
        : readLocal(storageKeys.customerId) || '';
}

async function saveOrderRating({
    ratingId = '',
    orderId,
    customerId = '',
    shopperId = '',
    serviceScore = 5,
    shopperScore = 5,
    comment = ''
}) {
    if (!orderId) {
        throw new Error('Order ID is required before saving a rating.');
    }
    if (!customerId) {
        throw new Error('Please sign in before rating this order.');
    }

    const normalizedServiceScore = Number(serviceScore) || 5;
    const normalizedShopperScore = Number(shopperScore) || 5;
    const existingRating = ratingId ? null : await readCustomerRatingForOrder(orderId, customerId).catch(() => null);
    const targetRef = ratingId
        ? firestoreRatingDoc(ratingId)
        : existingRating?.id
            ? firestoreRatingDoc(existingRating.id)
            : firestoreAutoDoc('ratings');
    const targetId = ratingId || existingRating?.id || targetRef.id;
    const timestamp = firebaseServerTimestamp();

    const ratingPayload = {
        ratingId: targetId,
        orderId,
        customerId,
        riderId: shopperId,
        serviceScore: normalizedServiceScore,
        shopperScore: normalizedShopperScore,
        comment,
        status: 'Active',
        updatedAt: timestamp,
        // Legacy-compatible fields used by the existing honestbee UI.
        RATE_id: targetId,
        ORDER_id: orderId,
        CUST_id: customerId,
        SHOP_id: shopperId,
        RATE_serviceScore: normalizedServiceScore,
        RATE_shopperScore: normalizedShopperScore,
        RATE_feedbackComment: comment,
        RATE_date: timestamp,
        order_id: orderId,
        customer_id: customerId,
        shopper_id: shopperId
    };

    if (!ratingId && !existingRating) {
        ratingPayload.createdAt = timestamp;
    }

    await firebaseSetDoc(targetRef, ratingPayload, { merge: true });
    return {
        id: targetId
    };
}

async function saveOrderRefund({
    orderId,
    customerId = '',
    amount = 0,
    reason = ''
}) {
    if (!orderId) {
        throw new Error('Order ID is required before requesting a refund.');
    }
    if (!customerId) {
        throw new Error('Please sign in before requesting a refund.');
    }

    const refundRef = firestoreAutoDoc('refunds');
    const refundId = refundRef.id;
    const timestamp = firebaseServerTimestamp();
    const normalizedAmount = Number(amount) || 0;

    await firebaseSetDoc(refundRef, {
        refundId,
        orderId,
        customerId,
        amount: normalizedAmount,
        reason,
        status: 'Pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        // Legacy-compatible fields used by the existing honestbee UI.
        REFUND_id: refundId,
        ORDER_id: orderId,
        CUST_id: customerId,
        REFUND_amount: normalizedAmount,
        REFUND_reason: reason,
        REFUND_status: 'Pending',
        REFUND_date: timestamp,
        order_id: orderId,
        customer_id: customerId
    });

    return {
        id: refundId
    };
}

function initCustomerDashboard() {
    const root = $('[data-customer-dashboard]');
    if (!root) {
        return;
    }

    let account = requireSignedRole(['customer']);
    if (!account) {
        return;
    }

    const email = accountEmail(account);
    const customerId = accountLinkedId(account) || account?.USER_id || customerDocId(email);
    const orderLists = $$('[data-customer-orders]', root);
    const activeOrderNodes = $$('[data-customer-active-order]', root);
    const customerCart = new Map();
    const customerCartList = $('[data-customer-cart-list]', root);
    const customerCartBadges = $$('[data-customer-cart-badge]', root);
    const customerCartSubtotal = $('[data-customer-cart-subtotal]', root);
    const customerCartDelivery = $('[data-customer-cart-delivery]', root);
    const customerCartService = $('[data-customer-cart-service]', root);
    const customerCartTotal = $('[data-customer-cart-total]', root);
    const customerCheckoutForm = $('[data-customer-checkout-form]', root);
    const customerCheckoutSubmit = $('[data-customer-checkout-submit]', root);
    const customerCheckoutConfirm = $('[data-customer-checkout-confirm]', root);
    const customerCheckoutConfirmYes = $('[data-customer-checkout-confirm-yes]', root);
    const customerCheckoutConfirmNo = $('[data-customer-checkout-confirm-no]', root);
    const customerPaymentSelect = $('[data-customer-payment-method]', root);
    const customerCardDetails = $('[data-customer-card-details]', root);
    const customerCardInputs = customerCardDetails ? $$('input', customerCardDetails) : [];
    const customerGcashDetails = $('[data-customer-gcash-details]', root);
    const customerGcashInputs = customerGcashDetails ? $$('input', customerGcashDetails) : [];
    const customerCartNotice = $('[data-customer-cart-notice]', root);
    const customerCheckoutSuccess = $('[data-customer-checkout-success]', root);
    const customerCheckoutSuccessId = $('[data-customer-checkout-success-id]', root);
    const customerCheckoutTrack = $('[data-customer-checkout-track]', root);
    const customerOrderModal = $('[data-customer-order-modal]', root);
    const customerOrderModalContent = $('[data-customer-order-modal-content]', root);
    const customerProductModal = $('[data-customer-product-modal]', root);
    const customerProductModalImage = $('[data-customer-product-modal-image]', root);
    const customerProductModalName = $('[data-customer-product-modal-name]', root);
    const customerProductModalMeta = $('[data-customer-product-modal-meta]', root);
    const customerProductModalPrice = $('[data-customer-product-modal-price]', root);
    const customerProductModalQuantity = $('[data-customer-product-modal-quantity]', root);
    const customerProductModalTotal = $('[data-customer-product-modal-total]', root);
    const customerProductModalInstructions = $('[data-customer-product-modal-instructions]', root);
    const customerStoreList = $('[data-customer-store-list]', root);
    const customerStoreMenu = $('[data-customer-store-menu]', root);
    const customerStoreTitle = $('[data-customer-store-title]', root);
    const customerStoreMeta = $('[data-customer-store-meta]', root);
    const customerStoreEta = $('[data-customer-store-eta]', root);
    const customerStoreCount = $('[data-customer-store-count]', root);
    const customerStoreCategories = $('[data-customer-store-categories]', root);
    const customerStoreProducts = $('[data-customer-store-products]', root);
    const customerStoreGrid = $('.customer-store-grid', root);
    const noCurrentOrderHtml = '<div class="empty-state">No current order. New deliveries will appear here after checkout.</div>';
    let activeCustomerStoreId = '';
    let activeCustomerStoreCategory = 'all';
    let pendingCustomerStoreId = '';
    let customerCheckoutPendingPayload = null;
    let customerCheckoutSubmitting = false;
    let currentCustomerModalProduct = null;
    let currentCustomerModalQuantity = 1;
    let customerDashboardOrders = [];
    let currentCustomerOrder = null;
    let customerSellerMerchants = [];
    let customerSellerProducts = [];
    const customerSellerStoreIds = new Set();
    const customerDashboardUrl = (hash = 'dashboard') => `${location.pathname}#${hash}`;

    const showCustomerView = (view) => {
        const targetView = view || 'dashboard';
        $$('[data-customer-view-panel]', root).forEach((panel) => {
            const isActive = panel.dataset.customerViewPanel === targetView;
            panel.hidden = !isActive;
            panel.classList.toggle('is-active', isActive);
        });
        $$('[data-customer-view-trigger]', root).forEach((trigger) => {
            const isActive = trigger.dataset.customerViewTrigger === targetView;
            trigger.classList.toggle('is-active', isActive);
            if (isActive) {
                trigger.setAttribute('aria-current', 'page');
            } else {
                trigger.removeAttribute('aria-current');
            }
        });
        refreshIcons();
    };

    const currentOrderActionsHtml = (order) => {
        const status = orderStatus(order);
        const orderId = order.id || customerOrderNumber(order);
        return `
            <div class="card-actions current-order-actions">
                ${isTerminalOrderStatus(status) ? '' : `
                    <button class="ghost-button danger-button" type="button" data-customer-cancel="${escapeHtml(orderId)}">
                        <i data-lucide="ban" aria-hidden="true"></i> Cancel order
                    </button>
                `}
                <button class="ghost-button current-order-details-action" type="button" data-customer-order-open="${escapeHtml(orderId)}">
                    <i data-lucide="receipt-text" aria-hidden="true"></i> View Details
                </button>
            </div>
        `;
    };

    const renderCurrentOrder = (orders) => {
        const currentOrder = orders.find((order) => !isTerminalOrderStatus(orderStatus(order)));
        activeOrderNodes.forEach((node) => {
            node.innerHTML = currentOrder
                ? orderCard(currentOrder, currentOrderActionsHtml(currentOrder))
                : noCurrentOrderHtml;
        });
    };

    const requestedCustomerStoreId = () => {
        const params = new URLSearchParams(location.search);
        const queryStoreId = params.get('store') || params.get('merchant') || '';
        const hash = location.hash.slice(1);
        const hashStoreId = hash.startsWith('store-') ? hash.replace('store-', '') : '';
        const storeId = queryStoreId || hashStoreId;

        return storeId;
    };

    const customerCartStorageKey = () => (email ? `${storageKeys.cart}_${email}` : storageKeys.cart);
    const customerCartItemDoc = (productId) => firestoreCartItemDoc(customerId, productId);

    const customerCartItemCount = () => [...customerCart.values()]
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const customerCartSubtotalAmount = () => [...customerCart.values()]
        .reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);

    const customerCartFees = (subtotal) => {
        const delivery = subtotal > 0 ? (subtotal >= 500 ? 0 : 100) : 0;
        const serviceFee = subtotal > 0 ? 30 : 0;

        return {
            delivery,
            serviceFee,
            total: subtotal + delivery + serviceFee
        };
    };

    const cartFirestorePayload = (item) => ({
        productId: item.id || item.productId,
        merchantId: item.merchantId || '',
        productName: item.name || item.productName || 'Product',
        name: item.name || item.productName || 'Product',
        merchantName: item.merchant || item.merchantName || 'honestbee Partner',
        merchant: item.merchant || item.merchantName || 'honestbee Partner',
        category: item.category || 'Products',
        unit: item.unit || '1 item',
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        imageUrl: item.image || item.imageUrl || DEFAULT_PRODUCT_IMAGE,
        image: item.image || item.imageUrl || DEFAULT_PRODUCT_IMAGE,
        subtotal: (Number(item.price) || 0) * (Math.max(1, Number(item.quantity) || 1)),
        instructions: item.instructions || '',
        substitutePolicy: item.substitutePolicy || 'suggest',
        substituteName: item.substituteName || '',
        updatedAt: firebaseServerTimestamp()
    });

    const saveCustomerCartItem = async (item) => {
        if (!customerId || !item?.id) {
            return;
        }

        await firebaseSetDoc(firestoreCartDoc(customerId), {
            customerId,
            customerEmail: email,
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
        await firebaseSetDoc(customerCartItemDoc(item.id), cartFirestorePayload(item), { merge: true });
    };

    const deleteCustomerCartItem = async (productId) => {
        if (!customerId || !productId) {
            return;
        }

        await firebaseDeleteDoc(customerCartItemDoc(productId));
        await firebaseSetDoc(firestoreCartDoc(customerId), {
            customerId,
            customerEmail: email,
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
    };

    const clearCustomerCartItems = async () => {
        if (!customerId) {
            return;
        }

        const snapshot = await firebaseGetDocs(firestoreCartItemsCollection(customerId));
        await Promise.all(snapshot.docs.map((itemSnapshot) => firebaseDeleteDoc(itemSnapshot.ref)));
        await firebaseSetDoc(firestoreCartDoc(customerId), {
            customerId,
            customerEmail: email,
            updatedAt: firebaseServerTimestamp(),
            clearedAt: firebaseServerTimestamp()
        }, { merge: true });
    };

    const saveCustomerCart = () => {
        // Firestore cart writes are handled per item in Phase 3.
    };

    const migrateLocalCustomerCartToFirestore = async () => {
        const localKey = customerCartStorageKey();
        const raw = readLocal(localKey);
        if (!raw) {
            return;
        }

        try {
            const localItems = JSON.parse(raw || '[]');
            if (Array.isArray(localItems) && localItems.length > 0) {
                await Promise.all(localItems.map((item) => {
                    const normalized = normalizeFirestoreCartItem({
                        ...item,
                        productId: item.id || item.productId
                    });
                    customerCart.set(normalized.id, normalized);
                    return saveCustomerCartItem(normalized);
                }));
            }
            removeLocal(localKey);
        } catch (error) {
            removeLocal(localKey);
        }
    };

    const loadCustomerCart = () => {
        if (!customerId) {
            customerCart.clear();
            renderCustomerCart();
            return;
        }

        firebaseOnSnapshot(
            firestoreCartItemsCollection(customerId),
            (snapshot) => {
                customerCart.clear();
                snapshot.docs.forEach((documentSnapshot) => {
                    const item = normalizeFirestoreCartItem({
                        id: documentSnapshot.id,
                        ...documentSnapshot.data()
                    });
                    if (item.id) {
                        customerCart.set(item.id, item);
                    }
                });
                renderCustomerCart();
            },
            (error) => {
                console.error('Firestore cart listener failed', error);
                setNotice(customerCartNotice, 'Cart could not be loaded.', true);
            }
        );
        migrateLocalCustomerCartToFirestore().catch((error) => console.error('Cart migration failed', error));
    };

    const customerStoreForProduct = (product = {}) => {
        const merchantId = String(product.merchantId || product.MERCH_id || product.PROD_merchantId || '').trim();
        if (merchantId && storeCatalogs[merchantId]) {
            return storeCatalogs[merchantId];
        }

        return getStoreByMerchantName(product.merchant || product.merchant_name || product.MERCH_name || '') || null;
    };

    const customerStoreForCartItem = (item = {}) => customerStoreForProduct(item);

    const customerProductStoreIsOpen = (product = {}) => {
        const store = customerStoreForProduct(product) || storeCatalogs[activeCustomerStoreId] || {};
        return merchantStoreIsOpen(store);
    };

    const closedCustomerCartStore = () => [...customerCart.values()]
        .map(customerStoreForCartItem)
        .find((store) => store && !merchantStoreIsOpen(store));

    const setCustomerCartClosedNotice = (isClosed) => {
        if (isClosed) {
            setNotice(customerCartNotice, storeCurrentlyClosedMessage, true);
            if (customerCartNotice) {
                customerCartNotice.dataset.closedStoreNotice = 'true';
            }
            return;
        }

        if (customerCartNotice?.dataset.closedStoreNotice === 'true') {
            clearNotice(customerCartNotice);
            delete customerCartNotice.dataset.closedStoreNotice;
        }
    };

    const fillCustomerCheckoutProfile = () => {
        if (!customerCheckoutForm) {
            return;
        }

        const fields = customerCheckoutForm.elements;
        const activeAccount = getCurrentAccount() || account;
        if (fields.name && !fields.name.value) {
            fields.name.value = accountDisplayName(activeAccount);
        }
        if (fields.email) {
            fields.email.value = email;
            fields.email.readOnly = true;
            fields.email.setAttribute('aria-readonly', 'true');
        }
        if (fields.phone && !fields.phone.value && activeAccount?.USER_phone) {
            fields.phone.value = phoneDigits(activeAccount.USER_phone, true);
        }
        const defaultAddress = defaultCustomerAddress(activeAccount);
        if (fields.address && !fields.address.value && defaultAddress?.address) {
            fields.address.value = defaultAddress.address;
        }
    };

    const resetCustomerCheckoutConfirmation = () => {
        customerCheckoutPendingPayload = null;
        if (customerCheckoutConfirm) {
            customerCheckoutConfirm.hidden = true;
        }
        if (customerCheckoutSubmit && !customerCheckoutSubmitting) {
            customerCheckoutSubmit.disabled = customerCart.size === 0 || Boolean(closedCustomerCartStore());
        }
    };

    const resetCustomerCheckoutSuccess = () => {
        if (customerCheckoutForm) {
            customerCheckoutForm.hidden = false;
        }
        if (customerCheckoutSuccess) {
            customerCheckoutSuccess.hidden = true;
        }
    };

    const setCustomerCheckoutSubmitting = (isSubmitting) => {
        customerCheckoutSubmitting = isSubmitting;
        [customerCheckoutSubmit, customerCheckoutConfirmYes, customerCheckoutConfirmNo]
            .filter(Boolean)
            .forEach((button) => {
                button.disabled = isSubmitting
                    || (button === customerCheckoutSubmit && (customerCart.size === 0 || Boolean(closedCustomerCartStore())));
            });
    };

    const syncCustomerPaymentDetails = () => {
        const shouldShowCardFields = customerPaymentSelect?.value === 'Card';
        const shouldShowGcashFields = isGcashPaymentMethod(customerPaymentSelect?.value);
        if (customerCardDetails) {
            customerCardDetails.hidden = !shouldShowCardFields;
        }
        if (customerGcashDetails) {
            customerGcashDetails.hidden = !shouldShowGcashFields;
        }

        customerCardInputs.forEach((input) => {
            input.disabled = !shouldShowCardFields;
            input.required = shouldShowCardFields;

            if (!shouldShowCardFields) {
                input.value = '';
                clearFieldError(input);
            }
        });

        customerGcashInputs.forEach((input) => {
            input.disabled = !shouldShowGcashFields;
            // Firebase Storage is not enabled in Phase 3, so proof upload stays optional for now.
            input.required = shouldShowGcashFields && input.name !== 'gcashProof';

            if (!shouldShowGcashFields) {
                input.value = '';
                clearFieldError(input);
            }
        });
    };

    const renderCustomerCart = () => {
        const subtotal = customerCartSubtotalAmount();
        const fees = customerCartFees(subtotal);
        const itemCount = customerCartItemCount();
        const closedStore = closedCustomerCartStore();

        customerCartBadges.forEach((badge) => {
            badge.hidden = itemCount === 0;
            badge.textContent = itemCount;
        });

        if (customerCartSubtotal) {
            customerCartSubtotal.textContent = formatMoney(subtotal);
        }
        if (customerCartDelivery) {
            customerCartDelivery.textContent = fees.delivery === 0 && subtotal > 0 ? 'Free' : formatMoney(fees.delivery);
        }
        if (customerCartService) {
            customerCartService.textContent = formatMoney(fees.serviceFee);
        }
        if (customerCartTotal) {
            customerCartTotal.textContent = formatMoney(fees.total);
        }
        if (customerCheckoutSubmit && !customerCheckoutSubmitting) {
            customerCheckoutSubmit.disabled = customerCart.size === 0 || Boolean(closedStore);
        }
        setCustomerCartClosedNotice(Boolean(closedStore));

        if (!customerCartList) {
            return;
        }

        if (customerCart.size === 0) {
            customerCartList.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
            setCustomerCartClosedNotice(false);
            resetCustomerCheckoutConfirmation();
            applyCurrentLanguage();
            return;
        }

        customerCartList.innerHTML = [...customerCart.values()].map((item) => {
            const quantity = Number(item.quantity) || 1;
            const itemStore = customerStoreForCartItem(item);
            const isItemStoreClosed = Boolean(itemStore && !merchantStoreIsOpen(itemStore));
            return `
                <article class="customer-cart-line">
                    <img src="${escapeHtml(productImagePath(item.image))}" alt="" loading="lazy">
                    <div class="customer-cart-line-main">
                        <strong>${escapeHtml(item.name)}</strong>
                        <small>${escapeHtml(item.merchant || 'honestbee Partner')} - ${escapeHtml(item.unit || '1 item')}${isItemStoreClosed ? ` - ${storeCurrentlyClosedMessage}` : ''}</small>
                        <button type="button" data-customer-cart-remove="${escapeHtml(item.id)}">Remove</button>
                    </div>
                    <div class="customer-cart-line-side">
                        <div class="qty-control" aria-label="${escapeHtml(item.name)} quantity">
                            <button class="qty-button" type="button" data-customer-cart-decrease="${escapeHtml(item.id)}" aria-label="Decrease ${escapeHtml(item.name)}">-</button>
                            <span>${quantity}</span>
                            <button class="qty-button" type="button" data-customer-cart-increase="${escapeHtml(item.id)}" aria-label="Increase ${escapeHtml(item.name)}" ${isItemStoreClosed ? 'disabled' : ''}>+</button>
                        </div>
                        <strong>${formatMoney((Number(item.price) || 0) * quantity)}</strong>
                    </div>
                </article>
            `;
        }).join('');

        refreshIcons();
        applyCurrentLanguage();
    };

    const productFromCustomerButton = (button) => ({
        id: button.dataset.id,
        name: button.dataset.name,
        price: Number(button.dataset.price) || 0,
        merchant: button.dataset.merchant || 'honestbee Partner',
        merchantId: button.dataset.merchantId || '',
        type: button.dataset.type || 'grocery',
        image: productImagePath(button.dataset.image),
        unit: button.dataset.unit || '1 item',
        description: button.dataset.description || '',
        substitutePolicy: 'suggest',
        substituteName: '',
        instructions: ''
    });

    const addCustomerCartItem = async (product, quantity = 1) => {
        if (!product?.id) {
            return;
        }

        const existing = customerCart.get(product.id);
        const nextItem = existing
            ? {
                ...existing,
                quantity: (Number(existing.quantity) || 1) + quantity,
                instructions: product.instructions || existing.instructions
            }
            : {
                ...product,
                quantity
            };

        customerCart.set(product.id, nextItem);
        resetCustomerCheckoutSuccess();
        renderCustomerCart();
        try {
            await saveCustomerCartItem(nextItem);
            setNotice(customerCartNotice, 'Item added to cart.');
        } catch (error) {
            setNotice(customerCartNotice, error.message || 'Cart item could not be saved.', true);
        }
    };

    const refreshCustomerProductModal = () => {
        if (!currentCustomerModalProduct) {
            return;
        }

        const total = (Number(currentCustomerModalProduct.price) || 0) * currentCustomerModalQuantity;
        if (customerProductModalQuantity) {
            customerProductModalQuantity.textContent = currentCustomerModalQuantity;
        }
        if (customerProductModalTotal) {
            customerProductModalTotal.textContent = formatMoney(total);
        }
    };

    const openCustomerProductModal = (product) => {
        if (!product?.id || !customerProductModal) {
            return;
        }

        currentCustomerModalProduct = product;
        currentCustomerModalQuantity = 1;

        if (customerProductModalImage) {
            customerProductModalImage.src = productImagePath(product.image);
            customerProductModalImage.alt = product.name;
        }
        if (customerProductModalName) {
            customerProductModalName.textContent = product.name;
        }
        if (customerProductModalMeta) {
            customerProductModalMeta.textContent = `${product.merchant || 'honestbee Partner'} - ${product.unit || '1 item'}`;
        }
        if (customerProductModalPrice) {
            customerProductModalPrice.textContent = formatMoney(product.price);
        }
        if (customerProductModalInstructions) {
            customerProductModalInstructions.value = '';
        }

        refreshCustomerProductModal();
        customerProductModal.hidden = false;
        customerProductModal.setAttribute('aria-hidden', 'false');
        document.body?.classList.add('has-open-customer-product-modal');
        window.setTimeout(() => {
            $('[data-customer-product-modal-add]', customerProductModal)?.focus({ preventScroll: true });
        }, 0);
        refreshIcons();
    };

    const closeCustomerProductModal = () => {
        if (!customerProductModal) {
            return;
        }

        customerProductModal.hidden = true;
        customerProductModal.setAttribute('aria-hidden', 'true');
        document.body?.classList.remove('has-open-customer-product-modal');
        currentCustomerModalProduct = null;
        currentCustomerModalQuantity = 1;
    };

    const readCustomerOrderItems = async (orderId) => readFirestoreOrderItems(orderId);

    const findCustomerOrderForModal = async (orderId) => {
        const localOrder = customerDashboardOrders.find((order) => (
            order.id === orderId
            || order.order_id === orderId
            || order.ORDER_id === orderId
        ));

        if (localOrder) {
            return localOrder;
        }

        const order = await readFirestoreOrder(orderId);
        return order && (order.customerId === customerId || order.customer_id === customerId || order.customer_email === email) ? order : null;
    };

    const setCustomerOrderModalAction = async (action) => {
        if (!currentCustomerOrder || !customerOrderModalContent) {
            return;
        }

        const workspace = $('[data-customer-order-modal-workspace]', customerOrderModalContent);
        if (!workspace) {
            return;
        }

        const activeAction = $('[data-customer-order-modal-action].is-active', customerOrderModalContent)
            ?.dataset.customerOrderModalAction || '';
        const nextAction = activeAction === action ? '' : action;

        $$('[data-customer-order-modal-action]', customerOrderModalContent)
            .forEach((button) => {
                button.classList.toggle('is-active', button.dataset.customerOrderModalAction === nextAction);
            });

        if (nextAction === 'rate') {
            workspace.innerHTML = '<div class="empty-state">Loading rating details...</div>';
            try {
                const existingRating = await readCustomerRatingForOrder(customerOrderNumber(currentCustomerOrder), customerId);
                workspace.innerHTML = customerOrderRatingFormHtml(currentCustomerOrder, existingRating);
                initCustomerStarRatings(workspace);
                const form = $('[data-customer-order-rating-form]', workspace);
                if (form && existingRating?.id) {
                    form.dataset.customerOrderRatingId = existingRating.id;
                    setCustomerRatingFormLocked(form, true);
                }
            } catch (error) {
                workspace.innerHTML = '<div class="empty-state">Rating details could not be loaded.</div>';
            }
        } else if (nextAction === 'refund') {
            workspace.innerHTML = '<div class="empty-state">Loading refund requests...</div>';
            try {
                const existingRefunds = await readCustomerRefundsForOrder(customerOrderNumber(currentCustomerOrder), customerId);
                workspace.innerHTML = customerOrderRefundFormHtml(currentCustomerOrder, existingRefunds);
            } catch (error) {
                workspace.innerHTML = customerOrderRefundFormHtml(currentCustomerOrder, []);
            }
        } else {
            workspace.innerHTML = '';
        }

        refreshIcons();
        applyCurrentLanguage();
    };

    const closeCustomerOrderModal = () => {
        if (!customerOrderModal) {
            return;
        }

        customerOrderModal.classList.remove('is-open');
        customerOrderModal.hidden = true;
        customerOrderModal.setAttribute('aria-hidden', 'true');
        document.body?.classList.remove('has-open-customer-order-modal');
        currentCustomerOrder = null;
    };

    const openCustomerOrderModal = async (orderId) => {
        if (!orderId || !customerOrderModal || !customerOrderModalContent) {
            return;
        }

        closeCustomerProductModal();
        currentCustomerOrder = null;
        customerOrderModalContent.innerHTML = '<div class="empty-state">Loading order details...</div>';
        customerOrderModal.hidden = false;
        customerOrderModal.setAttribute('aria-hidden', 'false');
        document.body?.classList.add('has-open-customer-order-modal');
        window.requestAnimationFrame(() => {
            customerOrderModal.classList.add('is-open');
        });

        try {
            const order = await findCustomerOrderForModal(orderId);
            if (!order) {
                customerOrderModalContent.innerHTML = '<div class="empty-state">No order found for that ID.</div>';
                return;
            }

            const orderIdForItems = order.id || customerOrderNumber(order);
            const items = await readCustomerOrderItems(orderIdForItems);
            currentCustomerOrder = order;
            customerOrderModalContent.innerHTML = customerOrderModalTemplate(order, items);
            window.setTimeout(() => {
                $('[data-customer-order-modal-close]', customerOrderModal)?.focus({ preventScroll: true });
            }, 0);
            refreshIcons();
            applyCurrentLanguage();
        } catch (error) {
            customerOrderModalContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message || 'Order details could not be loaded.')}</div>`;
        }
    };

    const updateCustomerProductModalQuantity = (change) => {
        currentCustomerModalQuantity = Math.max(1, currentCustomerModalQuantity + change);
        refreshCustomerProductModal();
    };

    const confirmCustomerProductModalAdd = async () => {
        if (!currentCustomerModalProduct) {
            return;
        }

        if (!customerProductStoreIsOpen(currentCustomerModalProduct)) {
            setNotice(customerCartNotice, storeCurrentlyClosedMessage, true);
            closeCustomerProductModal();
            return;
        }

        await addCustomerCartItem({
            ...currentCustomerModalProduct,
            instructions: String(customerProductModalInstructions?.value || '').trim()
        }, currentCustomerModalQuantity);
        closeCustomerProductModal();
    };

    const updateCustomerCartQuantity = async (productId, change) => {
        const item = customerCart.get(productId);
        if (!item) {
            return;
        }

        if (change > 0) {
            const itemStore = customerStoreForCartItem(item);
            if (itemStore && !merchantStoreIsOpen(itemStore)) {
                setNotice(customerCartNotice, storeCurrentlyClosedMessage, true);
                return;
            }
        }

        const nextQuantity = (Number(item.quantity) || 1) + change;
        if (nextQuantity <= 0) {
            customerCart.delete(productId);
            renderCustomerCart();
            await deleteCustomerCartItem(productId);
            return;
        }

        const nextItem = {
            ...item,
            quantity: nextQuantity
        };
        customerCart.set(productId, nextItem);
        renderCustomerCart();
        try {
            await saveCustomerCartItem(nextItem);
        } catch (error) {
            setNotice(customerCartNotice, error.message || 'Cart quantity could not be saved.', true);
        }
    };

    const removeCustomerCartItem = async (productId) => {
        customerCart.delete(productId);
        renderCustomerCart();
        try {
            await deleteCustomerCartItem(productId);
        } catch (error) {
            setNotice(customerCartNotice, error.message || 'Cart item could not be removed.', true);
        }
    };

    const prepareCustomerCheckoutPayload = (form) => {
        if (customerCart.size === 0) {
            throw new Error('Your cart is empty.');
        }

        if (closedCustomerCartStore()) {
            throw new Error(storeCurrentlyClosedMessage);
        }

        const formData = new FormData(form);
        const customerName = String(formData.get('name') || '').trim();
        const customerEmail = assertEmailAddress(form.elements.email);
        const customerPhone = assertPhoneNumber(form.elements.phone);
        const address = String(formData.get('address') || '').trim();
        const activeAccount = getCurrentAccount() || account;
        const defaultAddress = defaultCustomerAddress(activeAccount);
        const city = deriveServiceCityFromAddress(address)
            || normalizeServiceCity(defaultAddress?.city || activeAccount?.USER_city);
        const deliveryTime = String(formData.get('time') || '').trim();
        const paymentMethod = String(formData.get('payment') || '').trim();

        if (!customerName) {
            throw new Error('Enter the customer name.');
        }
        if (!address) {
            throw new Error('Enter the delivery address.');
        }
        if (!city) {
            throw new Error('Delivery address must include Cebu City, Lapu-Lapu, Mandaue, Consolacion, or Talisay.');
        }
        if (!deliveryTime) {
            throw new Error('Select a delivery time.');
        }
        if (!paymentMethod) {
            throw new Error('Select a payment method.');
        }

        const subtotal = customerCartSubtotalAmount();
        const fees = customerCartFees(subtotal);

        return {
            customer_name: customerName,
            email: customerEmail,
            phone: customerPhone,
            city,
            address,
            delivery_time: timestampLabel(deliveryTime),
            payment_method: paymentMethod,
            card_details: paymentMethod === 'Card' ? assertCardPaymentDetails(form) : null,
            gcash_details: isGcashPaymentMethod(paymentMethod) ? readGcashPaymentDetails(form) : null,
            items: [...customerCart.values()],
            summary: {
                subtotal,
                delivery: fees.delivery,
                serviceFee: fees.serviceFee,
                total: fees.total
            }
        };
    };

    const showCustomerCheckoutSuccess = (orderId) => {
        if (customerCheckoutForm) {
            customerCheckoutForm.hidden = true;
        }
        if (customerCheckoutSuccessId) {
            customerCheckoutSuccessId.textContent = orderId ? `#${orderId}` : '';
        }
        if (customerCheckoutTrack && orderId) {
            customerCheckoutTrack.href = '#orders';
            customerCheckoutTrack.dataset.customerOrderOpen = orderId;
        }
        if (customerCheckoutSuccess) {
            customerCheckoutSuccess.hidden = false;
        }
        refreshIcons();
        applyCurrentLanguage();
    };

    const placeCustomerCheckoutOrder = async () => {
        if (customerCheckoutSubmitting || !customerCheckoutPendingPayload) {
            return;
        }

        setCustomerCheckoutSubmitting(true);

        try {
            const checkoutPayload = {
                ...customerCheckoutPendingPayload
            };
            // TODO: Add Firebase Storage later for proof uploads. Phase 3 saves GCash reference only.

            const result = await saveCustomerOrder(checkoutPayload);
            await clearCustomerCartItems();
            customerCart.clear();
            renderCustomerCart();
            customerCheckoutForm?.reset();
            fillCustomerCheckoutProfile();
            syncCustomerPaymentDetails();
            resetCustomerCheckoutConfirmation();
            customerCartNotice?.classList.remove('is-visible', 'is-error');
            showCustomerCheckoutSuccess(result.id);
        } catch (error) {
            setNotice(customerCartNotice, error.message || 'Order could not be placed.', true);
        } finally {
            setCustomerCheckoutSubmitting(false);
        }
    };

    const customerCategoryKey = (value) => String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'uncategorized';

    const customerProductTemplate = (product) => {
        const productImage = productImagePath(product.image);
        const activeStore = storeCatalogs[activeCustomerStoreId] || {};
        const isStoreOpen = merchantStoreIsOpen(activeStore);
        return `
            <article class="customer-product-card">
                <img src="${escapeHtml(productImage)}" alt="${escapeHtml(product.alt || product.name)}" loading="lazy">
                <div class="customer-product-body">
                    <div>
                        <h3>${escapeHtml(product.name)}</h3>
                        <small>${escapeHtml(product.category || 'Products')} - ${escapeHtml(product.unit || '1 item')}</small>
                    </div>
                    <div class="customer-product-actions">
                        <strong class="customer-product-price">${formatMoney(Number(product.price))}</strong>
                        <button
                            class="customer-add-cart-button"
                            type="button"
                            data-customer-add-cart
                            data-id="${escapeHtml(product.id)}"
                            data-name="${escapeHtml(product.name)}"
                            data-price="${escapeHtml(product.price)}"
                            data-merchant="${escapeHtml(product.merchant || storeCatalogs[activeCustomerStoreId]?.name || 'honestbee Partner')}"
                            data-merchant-id="${escapeHtml(product.merchantId || activeCustomerStoreId || '')}"
                            data-type="${escapeHtml(product.type || 'grocery')}"
                            data-image="${escapeHtml(productImage)}"
                            data-unit="${escapeHtml(product.unit || '1 item')}"
                            data-description="${escapeHtml(product.description || '')}"
                            aria-label="${escapeHtml(isStoreOpen ? `Add ${product.name} to cart` : storeCurrentlyClosedMessage)}"
                            ${isStoreOpen ? '' : 'disabled'}
                        >
                            ${isStoreOpen ? 'Add to Cart' : storeCurrentlyClosedMessage}
                        </button>
                    </div>
                </div>
            </article>
        `;
    };

    const customerStoreInitials = (store) => String(store.logo || store.name || 'HB')
        .split(/\s+/)
        .map((word) => word[0])
        .join('')
        .slice(0, 3)
        .toUpperCase();

    const customerStoreLogoTemplate = (store) => {
        const theme = escapeHtml(store.theme || '#1e7a58');
        if (store.logoImage) {
            return `
                <span class="store-logo-badge" style="--store-theme: ${theme}">
                    <img src="${escapeHtml(store.logoImage)}" alt="${escapeHtml(store.name)} logo" loading="lazy">
                </span>
            `;
        }

        return `<span class="store-logo-badge" style="--store-theme: ${theme}">${escapeHtml(customerStoreInitials(store))}</span>`;
    };

    const customerStoreCardTemplate = ([storeId, store]) => `
        <button class="customer-store-card" type="button" data-customer-store-id="${escapeHtml(storeId)}">
            ${customerStoreLogoTemplate(store)}
            <span>
                <strong>${escapeHtml(store.name)} ${storeStatusBadge(merchantStoreStatusLabel(store))}</strong>
                <small>${escapeHtml(store.type)} &middot; ${escapeHtml(store.eta || 'Merchant managed')} &middot; ${escapeHtml(store.availableDays || 'Monday to Saturday')}</small>
            </span>
        </button>
    `;

    const renderCustomerStoreCards = () => {
        if (!customerStoreGrid) {
            return;
        }

        customerStoreGrid.innerHTML = Object.entries(storeCatalogs)
            .map(customerStoreCardTemplate)
            .join('');
        refreshIcons();
        applyCurrentLanguage();
    };

    const getCustomerStoreCategories = (store) => {
        const categories = new Map();
        (store?.products || []).forEach((product) => {
            const label = product.category || 'Products';
            const key = customerCategoryKey(label);
            if (!categories.has(key)) {
                categories.set(key, label);
            }
        });

        return [
            { key: 'all', label: 'All' },
            ...[...categories.entries()].map(([key, label]) => ({ key, label }))
        ];
    };

    const renderCustomerStoreCategories = (store) => {
        if (!customerStoreCategories) {
            return;
        }

        customerStoreCategories.innerHTML = getCustomerStoreCategories(store).map((category) => `
            <button class="${category.key === activeCustomerStoreCategory ? 'is-active' : ''}" type="button" data-customer-store-category="${escapeHtml(category.key)}">
                ${escapeHtml(category.label)}
            </button>
        `).join('');
    };

    const renderCustomerStoreProducts = () => {
        const store = storeCatalogs[activeCustomerStoreId];
        if (!store || !customerStoreProducts) {
            return;
        }

        const products = (store.products || []).filter((product) => (
            activeCustomerStoreCategory === 'all'
            || customerCategoryKey(product.category) === activeCustomerStoreCategory
        ));

        if (customerStoreCount) {
            customerStoreCount.textContent = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;
        }

        const closedNotice = merchantStoreIsOpen(store)
            ? ''
            : `<div class="customer-store-closed-notice" role="status">${escapeHtml(storeCurrentlyClosedMessage)}</div>`;
        const productsHtml = products.length > 0
            ? products.map(customerProductTemplate).join('')
            : '<div class="empty-state">No products in this category.</div>';

        customerStoreProducts.innerHTML = `${closedNotice}${productsHtml}`;
    };

    const refreshOpenCustomerStore = () => {
        if (!activeCustomerStoreId) {
            return;
        }

        const store = storeCatalogs[activeCustomerStoreId];
        if (!store) {
            closeCustomerStore();
            return;
        }

        const categoryKeys = getCustomerStoreCategories(store).map((category) => category.key);
        if (!categoryKeys.includes(activeCustomerStoreCategory)) {
            activeCustomerStoreCategory = 'all';
        }

        if (customerStoreTitle) {
            customerStoreTitle.textContent = store.name;
        }
        if (customerStoreMeta) {
            customerStoreMeta.textContent = `${store.meta || 'Cebu partner merchant'} - Store ${merchantStoreStatusLabel(store)}`;
        }
        if (customerStoreEta) {
            customerStoreEta.textContent = merchantStoreIsOpen(store)
                ? store.eta ? `Delivery: ${store.eta} - ${store.availableDays || 'Monday to Saturday'}` : ''
                : storeCurrentlyClosedMessage;
        }

        renderCustomerStoreCategories(store);
        renderCustomerStoreProducts();
        refreshIcons();
        applyCurrentLanguage();
    };

    const customerProductMerchantId = (product) => String(
        product.MERCH_id
        || product.merchantId
        || product.PROD_merchantId
        || ''
    );

    const normalizeCustomerSellerProduct = (product, merchant) => {
        const merchantId = merchant.MERCH_id || merchant.id || '';
        const merchantType = merchant.MERCH_type === 'Food' ? 'food' : 'grocery';
        const productName = productRecordName(product);

        return {
            id: productRecordId(product) || `${merchantId}-${slugify(productName)}`,
            type: product.type || product.PROD_type || merchantType,
            category: product.category || product.PROD_category || (merchant.MERCH_type === 'Food' ? 'Meals' : 'Merchant Items'),
            name: productName,
            merchant: merchant.MERCH_name || product.merchant || product.merchant_name || 'Approved merchant',
            merchantId,
            price: Number(product.price ?? product.PROD_price ?? 0),
            tag: product.tag || product.PROD_tag || 'Merchant',
            rating: product.rating || product.PROD_rating || '4.6',
            unit: product.unit || product.PROD_unit || '1 item',
            image: productImagePath(productRecordImageUrl(product)),
            alt: product.alt || product.PROD_alt || productName,
            description: product.description || product.PROD_description || ''
        };
    };

    const rebuildCustomerSellerStores = () => {
        customerSellerStoreIds.forEach((storeId) => delete storeCatalogs[storeId]);
        customerSellerStoreIds.clear();

        customerSellerMerchants
            .filter((merchant) => merchant.MERCH_approvalStatus === 'Approved' && merchant.MERCH_name)
            .forEach((merchant) => {
                const merchantId = merchant.MERCH_id || merchant.id || '';
                if (!merchantId || builtInStoreIds.has(merchantId) || builtInStoreNameKeys.has(slugify(merchant.MERCH_name))) {
                    return;
                }

                const products = customerSellerProducts
                    .filter((product) => {
                        return customerProductMerchantId(product) === merchantId && productIsActive(product);
                    })
                    .map((product) => normalizeCustomerSellerProduct(product, merchant));

                if (products.length === 0) {
                    return;
                }

                customerSellerStoreIds.add(merchantId);
                storeCatalogs[merchantId] = {
                    name: merchant.MERCH_name,
                    type: merchant.MERCH_type || 'Grocery',
                    meta: merchant.MERCH_address || 'Approved honestbee merchant in Cebu',
                    eta: merchant.MERCH_businessHours || 'Merchant managed hours',
                    status: merchantStoreStatusLabel(merchant),
                    availableDays: normalizeMerchantAvailableDays(merchant.MERCH_availableDays || ''),
                    theme: merchant.MERCH_type === 'Food' ? '#d86b2d' : '#1e7a58',
                    logo: merchant.MERCH_name,
                    logoImage: '',
                    products
                };
            });

        renderCustomerStoreCards();
        refreshOpenCustomerStore();
        renderCustomerCart();

        if (pendingCustomerStoreId && storeCatalogs[pendingCustomerStoreId]) {
            openCustomerStore(pendingCustomerStoreId);
            pendingCustomerStoreId = '';
            history.replaceState(null, '', customerDashboardUrl('stores'));
        }
    };

    const listenCustomerSellerCatalogs = () => {
        listenFirestoreMerchants((records) => {
            customerSellerMerchants = records;
            rebuildCustomerSellerStores();
        });

        listenFirestoreProducts((records) => {
            customerSellerProducts = records;
            rebuildCustomerSellerStores();
        });
    };

    const openCustomerStore = (storeId) => {
        const store = storeCatalogs[storeId];
        if (!store || !customerStoreList || !customerStoreMenu) {
            return;
        }

        activeCustomerStoreId = storeId;
        activeCustomerStoreCategory = 'all';
        customerStoreList.hidden = true;
        customerStoreMenu.hidden = false;

        if (customerStoreTitle) {
            customerStoreTitle.textContent = store.name;
        }
        if (customerStoreMeta) {
            customerStoreMeta.textContent = `${store.meta || 'Cebu partner merchant'} - Store ${merchantStoreStatusLabel(store)}`;
        }
        if (customerStoreEta) {
            customerStoreEta.textContent = merchantStoreIsOpen(store)
                ? store.eta ? `Delivery: ${store.eta} - ${store.availableDays || 'Monday to Saturday'}` : ''
                : storeCurrentlyClosedMessage;
        }

        renderCustomerStoreCategories(store);
        renderCustomerStoreProducts();
        refreshIcons();
        applyCurrentLanguage();
    };

    const closeCustomerStore = () => {
        if (!customerStoreList || !customerStoreMenu) {
            return;
        }

        customerStoreList.hidden = false;
        customerStoreMenu.hidden = true;
        activeCustomerStoreId = '';
        activeCustomerStoreCategory = 'all';
        refreshIcons();
    };

    const customerViews = new Set(['dashboard', 'stores', 'cart', 'orders']);
    const initialHash = location.hash.slice(1);
    const requestedStoreId = requestedCustomerStoreId();
    const initialStoreId = requestedStoreId && storeCatalogs[requestedStoreId] ? requestedStoreId : '';
    pendingCustomerStoreId = requestedStoreId && !initialStoreId ? requestedStoreId : '';
    const initialView = requestedStoreId
        ? 'stores'
        : customerViews.has(initialHash)
            ? initialHash
            : 'dashboard';
    showCustomerView(initialView);
    if (initialStoreId) {
        openCustomerStore(initialStoreId);
        history.replaceState(null, '', customerDashboardUrl('stores'));
    } else if (location.search) {
        history.replaceState(null, '', customerDashboardUrl(initialView));
    }
    listenCustomerSellerCatalogs();

    listenFirestoreOrdersForCustomer(customerId, email, (orders, error) => {
        if (error) {
            customerDashboardOrders = [];
            orderLists.forEach((orderList) => {
                orderList.innerHTML = '<div class="empty-state">Orders could not be loaded.</div>';
            });
            activeOrderNodes.forEach((node) => {
                node.innerHTML = '<div class="empty-state">Orders could not be loaded.</div>';
            });
            applyCurrentLanguage();
            return;
        }

        const customerOrders = orders;
        customerDashboardOrders = customerOrders;

        if (customerOrders.length === 0) {
            orderLists.forEach((orderList) => {
                orderList.innerHTML = '<div class="empty-state">No orders yet. Your recent purchases will appear here after checkout.</div>';
            });
            activeOrderNodes.forEach((node) => {
                node.innerHTML = noCurrentOrderHtml;
            });
            applyCurrentLanguage();
            return;
        }

        const ordersHtml = customerOrders.map(customerOrderSummaryCard).join('');
        orderLists.forEach((orderList) => {
            orderList.innerHTML = ordersHtml;
        });

        renderCurrentOrder(customerOrders);
        root.dataset.orders = JSON.stringify(customerOrders);
        refreshIcons();
        applyCurrentLanguage();
    });

    root.addEventListener('click', async (event) => {
        const customerOrderOpen = event.target.closest('[data-customer-order-open]');
        if (customerOrderOpen && root.contains(customerOrderOpen)) {
            event.preventDefault();
            await openCustomerOrderModal(customerOrderOpen.dataset.customerOrderOpen);
            return;
        }

        const viewTrigger = event.target.closest('[data-customer-view-trigger]');
        if (viewTrigger && root.contains(viewTrigger)) {
            event.preventDefault();
            const targetView = viewTrigger.dataset.customerViewTrigger || 'dashboard';
            closeCustomerProductModal();
            closeCustomerOrderModal();
            showCustomerView(targetView);
            history.replaceState(null, '', customerDashboardUrl(targetView));
            if (targetView === 'stores') {
                closeCustomerStore();
            } else if (targetView === 'cart') {
                renderCustomerCart();
            }
            return;
        }

        const customerOrderModalClose = event.target.closest('[data-customer-order-modal-close]');
        if ((customerOrderModalClose && root.contains(customerOrderModalClose)) || event.target === customerOrderModal) {
            event.preventDefault();
            closeCustomerOrderModal();
            return;
        }

        const customerOrderModalAction = event.target.closest('[data-customer-order-modal-action]');
        if (customerOrderModalAction && root.contains(customerOrderModalAction)) {
            event.preventDefault();
            await setCustomerOrderModalAction(customerOrderModalAction.dataset.customerOrderModalAction || '');
            return;
        }

        const customerOrderEditRating = event.target.closest('[data-customer-order-edit-rating]');
        if (customerOrderEditRating && root.contains(customerOrderEditRating)) {
            event.preventDefault();
            const form = customerOrderEditRating.closest('[data-customer-order-rating-form]');
            if (!form) {
                return;
            }

            setCustomerRatingFormLocked(form, false);
            clearNotice($('[data-customer-order-rating-notice]', form));
            const checkedRating = $('input[type="radio"]:checked', form);
            (checkedRating || $('input[type="radio"]', form) || $('textarea[name="comment"]', form))?.focus({ preventScroll: true });
            return;
        }

        const customerStoreTrigger = event.target.closest('[data-customer-store-id]');
        if (customerStoreTrigger && root.contains(customerStoreTrigger)) {
            event.preventDefault();
            showCustomerView('stores');
            openCustomerStore(customerStoreTrigger.dataset.customerStoreId);
            history.replaceState(null, '', customerDashboardUrl('stores'));
            return;
        }

        const customerStoreBack = event.target.closest('[data-customer-store-back]');
        if (customerStoreBack && root.contains(customerStoreBack)) {
            event.preventDefault();
            closeCustomerStore();
            history.replaceState(null, '', customerDashboardUrl('stores'));
            return;
        }

        const customerStoreCategory = event.target.closest('[data-customer-store-category]');
        if (customerStoreCategory && root.contains(customerStoreCategory)) {
            event.preventDefault();
            activeCustomerStoreCategory = customerStoreCategory.dataset.customerStoreCategory || 'all';
            $$('[data-customer-store-category]', root)
                .forEach((button) => button.classList.toggle('is-active', button === customerStoreCategory));
            renderCustomerStoreProducts();
            return;
        }

        const customerAddCartButton = event.target.closest('[data-customer-add-cart]');
        if (customerAddCartButton && root.contains(customerAddCartButton)) {
            event.preventDefault();
            const product = productFromCustomerButton(customerAddCartButton);
            if (!customerProductStoreIsOpen(product)) {
                setNotice(customerCartNotice, storeCurrentlyClosedMessage, true);
                return;
            }

            openCustomerProductModal(product);
            return;
        }

        const customerProductModalClose = event.target.closest('[data-customer-product-modal-close]');
        if ((customerProductModalClose && root.contains(customerProductModalClose)) || event.target === customerProductModal) {
            event.preventDefault();
            closeCustomerProductModal();
            return;
        }

        if (event.target.closest('[data-customer-product-modal-decrease]')) {
            event.preventDefault();
            updateCustomerProductModalQuantity(-1);
            return;
        }

        if (event.target.closest('[data-customer-product-modal-increase]')) {
            event.preventDefault();
            updateCustomerProductModalQuantity(1);
            return;
        }

        if (event.target.closest('[data-customer-product-modal-add]')) {
            event.preventDefault();
            await confirmCustomerProductModalAdd();
            return;
        }

        const customerCartIncrease = event.target.closest('[data-customer-cart-increase]');
        if (customerCartIncrease && root.contains(customerCartIncrease)) {
            event.preventDefault();
            await updateCustomerCartQuantity(customerCartIncrease.dataset.customerCartIncrease, 1);
            return;
        }

        const customerCartDecrease = event.target.closest('[data-customer-cart-decrease]');
        if (customerCartDecrease && root.contains(customerCartDecrease)) {
            event.preventDefault();
            await updateCustomerCartQuantity(customerCartDecrease.dataset.customerCartDecrease, -1);
            return;
        }

        const customerCartRemove = event.target.closest('[data-customer-cart-remove]');
        if (customerCartRemove && root.contains(customerCartRemove)) {
            event.preventDefault();
            await removeCustomerCartItem(customerCartRemove.dataset.customerCartRemove);
            return;
        }

        const cancelButton = event.target.closest('[data-customer-cancel]');
        const confirmCancelButton = event.target.closest('[data-customer-cancel-confirm]');
        const dismissCancelButton = event.target.closest('[data-customer-cancel-dismiss]');

        if (dismissCancelButton) {
            dismissCancelButton.closest('[data-cancel-order-confirm]')?.remove();
            return;
        }

        if (!cancelButton && !confirmCancelButton) {
            return;
        }

        const orders = JSON.parse(root.dataset.orders || '[]');
        const orderId = cancelButton?.dataset.customerCancel || confirmCancelButton?.dataset.customerCancelConfirm;
        const order = orders.find((item) => item.id === orderId);
        if (!order || isTerminalOrderStatus(orderStatus(order))) {
            return;
        }

        if (cancelButton) {
            showCustomerCancelPrompt(root, order, cancelButton);
            return;
        }

        confirmCancelButton.disabled = true;
        confirmCancelButton.textContent = 'Cancelling...';
        await updateOrderStatus(order, 'Cancelled', orderAssignedShopperId(order));
        renderCurrentOrder(orders.map((item) => (
            item.id === order.id
                ? { ...item, order_status: 'Cancelled', ORDER_status: 'Cancelled' }
                : item
        )));
        refreshIcons();
        applyCurrentLanguage();
    });

    root.addEventListener('submit', async (event) => {
        const customerOrderRatingForm = event.target.closest('[data-customer-order-rating-form]');
        const customerOrderRefundForm = event.target.closest('[data-customer-order-refund-form]');
        if (!customerOrderRatingForm && !customerOrderRefundForm) {
            return;
        }

        event.preventDefault();
        const form = customerOrderRatingForm || customerOrderRefundForm;
        if (customerOrderRatingForm && form.classList.contains('is-rating-locked')) {
            return;
        }

        const submitButton = $('button[type="submit"]', form);
        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const formData = new FormData(form);
            if (customerOrderRatingForm) {
                const notice = $('[data-customer-order-rating-notice]', form);
                const savedRating = await saveOrderRating({
                    ratingId: form.dataset.customerOrderRatingId || '',
                    orderId: formData.get('order'),
                    customerId,
                    shopperId: currentCustomerOrder?.shopper_id || currentCustomerOrder?.SHOP_id || '',
                    serviceScore: formData.get('serviceScore'),
                    shopperScore: formData.get('shopperScore'),
                    comment: formData.get('comment')
                });
                if (savedRating?.id) {
                    form.dataset.customerOrderRatingId = savedRating.id;
                }
                setNotice(notice, 'Rating saved.');
                form.elements.order.value = customerOrderNumber(currentCustomerOrder);
                setCustomerRatingFormLocked(form, true);
            } else {
                const notice = $('[data-customer-order-refund-notice]', form);
                await saveOrderRefund({
                    orderId: formData.get('order'),
                    customerId,
                    amount: formData.get('amount'),
                    reason: formData.get('reason')
                });
                setNotice(notice, 'Refund request saved.');
                form.reset();
                form.elements.order.value = customerOrderNumber(currentCustomerOrder);
            }
        } catch (error) {
            const notice = customerOrderRatingForm
                ? $('[data-customer-order-rating-notice]', form)
                : $('[data-customer-order-refund-notice]', form);
            setNotice(notice, error.message || 'Request could not be saved.', true);
        } finally {
            if (submitButton) {
                submitButton.disabled = Boolean(customerOrderRatingForm && form.classList.contains('is-rating-locked'));
            }
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && customerProductModal && !customerProductModal.hidden) {
            closeCustomerProductModal();
        }
        if (event.key === 'Escape' && customerOrderModal && !customerOrderModal.hidden) {
            closeCustomerOrderModal();
        }
    });

    customerPaymentSelect?.addEventListener('change', () => {
        syncCustomerPaymentDetails();
        resetCustomerCheckoutConfirmation();
    });

    customerCheckoutForm?.addEventListener('input', (event) => {
        if (!event.target.closest('[data-customer-checkout-confirm]')) {
            resetCustomerCheckoutConfirmation();
        }
    });

    customerCheckoutForm?.addEventListener('change', (event) => {
        if (!event.target.closest('[data-customer-checkout-confirm]')) {
            resetCustomerCheckoutConfirmation();
        }
    });

    customerCheckoutForm?.addEventListener('submit', (event) => {
        event.preventDefault();

        try {
            customerCheckoutPendingPayload = prepareCustomerCheckoutPayload(customerCheckoutForm);
            if (customerCheckoutConfirm) {
                customerCheckoutConfirm.hidden = false;
            }
            if (customerCheckoutSubmit) {
                customerCheckoutSubmit.disabled = true;
            }
            customerCartNotice?.classList.remove('is-visible', 'is-error');
            refreshIcons();
        } catch (error) {
            setNotice(customerCartNotice, error.message || 'Checkout could not be prepared.', true);
        }
    });

    customerCheckoutConfirmYes?.addEventListener('click', () => {
        placeCustomerCheckoutOrder();
    });

    customerCheckoutConfirmNo?.addEventListener('click', () => {
        resetCustomerCheckoutConfirmation();
    });

    fillCustomerCheckoutProfile();
    hydrateCurrentAccount(account).then((hydratedAccount) => {
        account = hydratedAccount || account;
        fillCustomerCheckoutProfile();
    }).catch(() => {});
    syncCustomerPaymentDetails();
    loadCustomerCart();
    renderCustomerCart();
}

function initRiderApplication() {
    const forms = $$('[data-rider-application-form]');
    if (forms.length === 0) {
        return;
    }

    const account = getCurrentAccount();
    if ($('[data-rider-application-page]') && accountRole(account) === 'rider') {
        location.href = dashboardForAccount(account);
        return;
    }

    forms.forEach((form) => {
        if (form.dataset.formBound === 'true') {
            return;
        }

        form.dataset.formBound = 'true';
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const notice = $('[data-rider-application-notice]', form);
            const formData = new FormData(form);

            try {
                const email = assertEmailAddress(form.elements.email);
                const phone = assertPhoneNumber(form.elements.phone);
                const password = assertStrongPassword(form.elements.password);
                assertMatchingPassword(password, form.elements.confirmPassword);
                const firstName = String(formData.get('firstName') || '').trim();
                const lastName = String(formData.get('lastName') || '').trim();
                const riderAddress = readAddressPickerField(form, {
                    label: currentAddressLabel
                });
                await createRiderFirebaseAccount({
                    firstName,
                    lastName,
                    email,
                    phone,
                    password,
                    vehicleType: formData.get('vehicleType'),
                    currentLocation: riderAddress.address
                });

                await finishPartnerApplicationSubmission(form, notice);
            } catch (error) {
                setNotice(notice, firebaseAuthMessage(error) || 'Rider application could not be saved.', true);
            }
        });
    });
}

function nextRiderStatus(status) {
    const current = status || 'Shopper accepted';
    if (current === 'Shopper accepted') {
        return 'Shopping';
    }
    if (current === 'Shopping') {
        return 'Out for delivery';
    }
    if (current === 'Out for delivery') {
        return 'Delivered';
    }
    return current;
}

async function updateOrderStatus(order, status, shopperId = orderAssignedShopperId(order), paymentStatus = null) {
    const orderId = order?.id || order?.orderId || order?.order_id || order?.ORDER_id;
    if (!orderId) {
        return;
    }

    const payload = {
        orderStatus: status,
        order_status: status,
        ORDER_status: status,
        riderId: shopperId || '',
        rider_id: shopperId || '',
        SHOP_id: shopperId || '',
        shopper_id: shopperId || '',
        deliveryStatus: status,
        delivery_status: status,
        lastRiderAction: status,
        last_rider_action: status,
        lastRiderActionAt: firebaseServerTimestamp(),
        last_rider_action_at: firebaseServerTimestamp(),
        updatedAt: firebaseServerTimestamp()
    };

    if (paymentStatus) {
        payload.paymentStatus = paymentStatus;
        payload.payment_status = paymentStatus;
        payload.PAY_status = paymentStatus;
    }

    await firebaseSetDoc(firestoreOrderDoc(orderId), payload, { merge: true });
}

async function updateSellerPaymentVerification(order, merchantId, isPaid) {
    const orderId = order?.id || order?.orderId || order?.order_id || order?.ORDER_id;
    if (!orderId) {
        return;
    }

    const paymentStatus = isPaid ? 'Paid' : 'Unpaid';
    const verificationStatus = isPaid ? 'Verified by merchant' : 'Merchant marked unpaid';
    const storeAcceptanceStatus = isPaid ? 'Accepted' : 'Payment not verified';
    const payload = {
        paymentStatus,
        payment_status: paymentStatus,
        PAY_status: paymentStatus,
        storeAcceptanceStatus,
        store_acceptance_status: storeAcceptanceStatus,
        STORE_acceptanceStatus: storeAcceptanceStatus,
        requiresSellerPaymentVerification: !isPaid,
        requires_seller_payment_verification: !isPaid,
        sellerPaymentVerified: isPaid,
        seller_payment_verified: isPaid,
        paymentVerificationStatus: verificationStatus,
        payment_verification_status: verificationStatus,
        paymentVerifiedBy: merchantId,
        payment_verified_by: merchantId,
        paymentVerifiedAt: firebaseServerTimestamp(),
        payment_verified_at: firebaseServerTimestamp(),
        updatedAt: firebaseServerTimestamp()
    };

    await firebaseSetDoc(firestoreOrderDoc(orderId), payload, { merge: true });
}

async function rejectOrderForRider(order, shopperId) {
    const orderId = order?.id || order?.orderId || order?.order_id || order?.ORDER_id;
    if (!orderId || !shopperId) {
        return;
    }

    const rejectedBy = Array.isArray(order?.rider_rejected_by)
        ? order.rider_rejected_by
        : Array.isArray(order?.riderRejectedBy)
            ? order.riderRejectedBy
            : [order?.rider_rejected_by || order?.riderRejectedBy].filter(Boolean);
    const updatedRejectedBy = [...new Set([...rejectedBy, shopperId])];
    const payload = {
        riderRejectedBy: updatedRejectedBy,
        rider_rejected_by: updatedRejectedBy,
        lastRiderId: shopperId,
        last_rider_id: shopperId,
        lastRiderAction: 'Rejected',
        last_rider_action: 'Rejected',
        lastRiderActionAt: firebaseServerTimestamp(),
        last_rider_action_at: firebaseServerTimestamp(),
        updatedAt: firebaseServerTimestamp()
    };

    // Rider rejection should only hide the delivery from this rider.
    // The order remains available for other riders and visible to customer/merchant/admin.
    await firebaseSetDoc(firestoreOrderDoc(orderId), payload, { merge: true });
}

function showRiderPaymentPrompt(root, order, shopperId, trigger) {
    removeInlineConfirms(root, '[data-rider-payment-confirm]');
    const card = trigger.closest('[data-order-card]') || trigger.closest('.dashboard-card');
    if (!card) {
        return;
    }

    const panel = document.createElement('div');
    panel.className = 'inline-confirm';
    panel.dataset.riderPaymentConfirm = order.id;
    panel.innerHTML = `
        <strong>Confirm payment before delivery</strong>
        <p>Mark Order ${escapeHtml(order.order_id || order.id)} as paid or unpaid before completing this delivery. This status appears for the customer, merchant, rider, and admin.</p>
        <div class="confirm-actions">
            <button class="primary-button" type="button" data-rider-deliver-paid="${escapeHtml(order.id)}" data-shopper-id="${escapeHtml(shopperId)}">
                <i data-lucide="check-circle" aria-hidden="true"></i> Paid
            </button>
            <button class="ghost-button" type="button" data-rider-deliver-unpaid="${escapeHtml(order.id)}" data-shopper-id="${escapeHtml(shopperId)}">
                <i data-lucide="x-circle" aria-hidden="true"></i> Not paid
            </button>
        </div>
    `;
    card.append(panel);
    refreshIcons();
    applyCurrentLanguage();
}

function orderAssignedShopperId(order) {
    return String(order?.riderId || order?.rider_id || order?.shopper_id || order?.SHOP_id || order?.ORDER_riderId || '').trim();
}

function riderOwnsOrder(order, shopperId) {
    return Boolean(shopperId && orderAssignedShopperId(order) === String(shopperId).trim());
}

function orderCreatedMillis(order) {
    return timestampMillis(order?.createdAt || order?.ORDER_date || order?.order_date || order?.created_at);
}

function riderActivationMillis(shopper) {
    return timestampMillis(
        shopper?.SHOP_approvedAt
        || shopper?.RIDER_approvedAt
        || shopper?.approvedAt
        || shopper?.updatedAt
        || shopper?.SHOP_updatedAt
        || shopper?.RIDER_updatedAt
        || shopper?.SHOP_createdAt
        || shopper?.createdAt
    );
}

function orderAfterRiderActivation(order, riderReadySince) {
    if (!riderReadySince) {
        return true;
    }

    const created = orderCreatedMillis(order);
    return !created || created >= riderReadySince - 1000;
}

function riderCanSeeAvailableOrder(order, shopperId, riderReadySince) {
    const assignedShopper = orderAssignedShopperId(order);
    const status = orderStatus(order);
    const openStatuses = ['Placed', 'Pending', 'Accepted', 'Ready', 'Ready for pickup', 'Ready to claim'];
    return Boolean(
        !assignedShopper
        && openStatuses.includes(status)
        && !rejectedByRider(order, shopperId)
        && orderReadyForRider(order)
        && orderAfterRiderActivation(order, riderReadySince)
    );
}

function riderOrderSortValue(order) {
    return orderCreatedMillis(order) || timestampMillis(order?.updatedAt || order?.ORDER_updatedAt);
}

function sortRiderOrders(orders) {
    return [...orders].sort((first, second) => riderOrderSortValue(second) - riderOrderSortValue(first));
}

function orderDeliveryFee(order) {
    return Number(
        order?.summary?.delivery
        || order?.DELIVERY_fee
        || order?.delivery_fee
        || order?.deliveryFee
        || order?.ORDER_deliveryFee
        || 0
    ) || 0;
}

function riderDeliveryEarning(order) {
    const deliveryFee = orderDeliveryFee(order);
    return deliveryFee > 0 ? deliveryFee : 50;
}

function merchantSalesAmount(order) {
    const total = Number(orderTotal(order)) || 0;
    const serviceFee = Number(order?.summary?.serviceFee || order?.SERVICE_fee || order?.service_fee || 0) || 0;
    const deliveryFee = orderDeliveryFee(order);
    return Math.max(0, total - serviceFee - deliveryFee);
}

function sortDashboardOrders(orders = []) {
    return [...orders].sort((first, second) => orderCreatedMillis(second) - orderCreatedMillis(first));
}

function dashboardOrderRowMeta(order) {
    return `${escapeHtml(orderStatus(order))} - ${escapeHtml(orderPaymentDisplay(order))} - ${escapeHtml(customerOrderDate(order))}`;
}

function sellerSalesRowHtml(order) {
    const orderId = customerOrderNumber(order);
    return `
        <article class="mini-row linked-row sales-earning-row">
            <div>
                <strong>Order ${escapeHtml(orderId)}</strong>
                <small>${dashboardOrderRowMeta(order)}</small>
            </div>
            <span>${formatMoney(merchantSalesAmount(order))}</span>
        </article>
    `;
}

function riderEarningRowHtml(order) {
    const orderId = customerOrderNumber(order);
    return `
        <article class="mini-row linked-row sales-earning-row">
            <div>
                <strong>Order ${escapeHtml(orderId)}</strong>
                <small>${escapeHtml(customerOrderStoreName(order))} - ${escapeHtml(customerOrderDate(order))}</small>
            </div>
            <span>${formatMoney(riderDeliveryEarning(order))}</span>
        </article>
    `;
}

const merchantStoreStatusCache = new Map();

function cacheMerchantStoreStatuses(records = []) {
    records.forEach((record) => {
        const status = merchantStoreStatusLabel(record);
        const merchantId = String(record.MERCH_id || record.id || '').trim();
        const merchantName = String(record.MERCH_name || record.merchant_name || '').trim();
        if (merchantId) {
            merchantStoreStatusCache.set(`id:${merchantId}`, status);
        }
        if (merchantName) {
            merchantStoreStatusCache.set(`name:${slugify(merchantName)}`, status);
        }
    });
}

function orderStoreStatus(order = {}) {
    const merchantId = String(order.merch_id || order.MERCH_id || order.ORDER_merchantId || '').trim();
    const merchantName = String(order.merchant_name || order.ORDER_merchantName || '').trim();
    return merchantStoreStatusCache.get(`id:${merchantId}`)
        || merchantStoreStatusCache.get(`name:${slugify(merchantName)}`)
        || merchantStoreStatusLabel({
            MERCH_storeStatus: order.store_status || order.STORE_status || order.MERCH_storeStatus || 'Open'
        });
}

function riderOrderListCard(order, context = '') {
    const orderId = customerOrderNumber(order);
    const modalOrderId = order.id || orderId;
    const status = orderStatus(order);
    const contextText = context ? `<span>${escapeHtml(context)}</span>` : '';

    return `
        <article class="customer-order-card rider-order-card">
            <div class="customer-order-card-main">
                <div>
                    <strong>Order ${escapeHtml(orderId)}</strong>
                    <span>${escapeHtml(customerOrderStoreName(order))}</span>
                </div>
                <span class="customer-order-status">${escapeHtml(status)}</span>
            </div>
            <div class="customer-order-card-meta">
                <div>
                    <small>Customer</small>
                    <strong>${escapeHtml(order.customer_name || 'Customer')}</strong>
                </div>
                <div>
                    <small>Payment</small>
                    <strong>${escapeHtml(orderPaymentDisplay(order))}</strong>
                </div>
                <div>
                    <small>Store Status</small>
                    <strong>${escapeHtml(orderStoreStatus(order))}</strong>
                </div>
                <div>
                    <small>Delivery Time</small>
                    <strong>${escapeHtml(orderScheduledLabel(order))}</strong>
                </div>
                <div>
                    <small>Total Amount</small>
                    <strong>${formatMoney(orderTotal(order))}</strong>
                </div>
            </div>
            <div class="customer-order-card-actions">
                ${contextText}
                <button class="ghost-button" type="button" data-rider-order-open="${escapeHtml(modalOrderId)}" aria-label="View details for order ${escapeHtml(orderId)}">
                    <i data-lucide="receipt-text" aria-hidden="true"></i> View Details
                </button>
            </div>
        </article>
    `;
}

function orderTrackingSteps(status) {
    if (status === 'Rejected') {
        return ['Placed', 'Rejected'];
    }

    if (status === 'Cancelled') {
        return ['Placed', 'Cancelled'];
    }

    return ['Placed', 'Shopper accepted', 'Shopping', 'Out for delivery', 'Delivered'];
}

function orderTrackingItemsHtml(items = []) {
    return items.length === 0
        ? '<div class="empty-state">No item documents found yet.</div>'
        : items.map((item) => `
            <article class="mini-row">
                <strong>${escapeHtml(orderItemName(item))}</strong>
                <span>${escapeHtml(orderItemQuantity(item))} x ${formatMoney(orderItemUnitPrice(item))}</span>
            </article>
        `).join('');
}

function orderTrackingTimelineHtml(order, items = []) {
    const status = orderStatus(order);
    const steps = orderTrackingSteps(status);
    const activeIndex = Math.max(0, steps.indexOf(status));

    return `
        <div class="timeline">
            ${steps.map((step, index) => `
                <div class="timeline-step ${index <= activeIndex ? 'is-done' : ''}">
                    <span>${index + 1}</span>
                    <strong>${escapeHtml(step)}</strong>
                </div>
            `).join('')}
        </div>
        <div class="dashboard-list">
            ${orderTrackingItemsHtml(items)}
        </div>
    `;
}

function riderTrackingModalTemplate(order, items = [], shopperId = '') {
    const orderId = customerOrderNumber(order);
    const status = orderStatus(order);
    const nextStatus = nextRiderStatus(status);
    const canUpdate = riderOwnsOrder(order, shopperId) && !isTerminalOrderStatus(status);

    return `
        <div class="customer-order-modal-head">
            <div>
                <span class="customer-order-status">${escapeHtml(status)}</span>
                <h2 id="riderOrderModalTitle">Tracking view</h2>
            </div>
            <strong>Order ${escapeHtml(orderId)}</strong>
        </div>
        ${orderTrackingTimelineHtml(order, items)}
        <div class="customer-order-modal-actions">
            <button class="ghost-button" type="button" data-rider-order-open="${escapeHtml(order.id || orderId)}">
                <i data-lucide="arrow-left" aria-hidden="true"></i> Order details
            </button>
            ${canUpdate ? `
                <button class="primary-button" type="button" data-rider-update-status="${escapeHtml(order.id || orderId)}">
                    <i data-lucide="arrow-right" aria-hidden="true"></i> Update Status: ${escapeHtml(nextStatus)}
                </button>
            ` : ''}
        </div>
        <div class="customer-order-modal-workspace" data-rider-order-modal-workspace></div>
    `;
}

function riderPaymentDonePanelHtml(order) {
    const orderId = customerOrderNumber(order);
    return `
        <div class="customer-order-action-panel">
            <div class="customer-order-form-head">
                <div>
                    <h3>Confirm cash payment</h3>
                    <span>Order ${escapeHtml(orderId)}</span>
                </div>
                <strong>${formatMoney(orderTotal(order))}</strong>
            </div>
            <p>Complete the delivery after the customer cash payment is received.</p>
            <div class="customer-order-form-actions">
                <button class="primary-button" type="button" data-rider-modal-deliver-paid="${escapeHtml(order.id || orderId)}">
                    <i data-lucide="check-circle" aria-hidden="true"></i> Payment Done
                </button>
            </div>
        </div>
    `;
}

function riderOrderModalTemplate(order, items = [], options = {}) {
    const status = orderStatus(order);
    const orderId = customerOrderNumber(order);
    const customerName = order.customer_name || order.CUST_fullName || 'Customer';
    const customerEmail = order.customer_email || order.CUST_email || 'No email on file';
    const customerPhone = order.customer_phone || order.CUST_phone || 'No phone on file';
    const deliveryAddress = order.customer_address || order.DELIVERY_address || order.address || 'No delivery address';
    const assignedShopper = orderAssignedShopperId(order) || 'Not assigned';
    const nextStatus = nextRiderStatus(status);
    const canUpdate = options.isAssignedToRider && !isTerminalOrderStatus(status);
    const canAccept = options.isAvailable && options.riderCanWork;

    return `
        <div class="customer-order-modal-head">
            <div>
                <span class="customer-order-status">${escapeHtml(status)}</span>
                <h2 id="riderOrderModalTitle">Order ${escapeHtml(orderId)}</h2>
            </div>
            <strong>${formatMoney(orderTotal(order))}</strong>
        </div>

        <div class="customer-order-detail-grid">
            <div>
                <span>Order ID</span>
                <strong>${escapeHtml(orderId)}</strong>
            </div>
            <div>
                <span>Store Name</span>
                <strong>${escapeHtml(customerOrderStoreName(order))}</strong>
            </div>
            <div>
                <span>Order Date</span>
                <strong>${escapeHtml(customerOrderDate(order))}</strong>
            </div>
            <div>
                <span>Payment</span>
                <strong>${escapeHtml(orderPaymentDisplay(order))}</strong>
            </div>
            <div>
                <span>Delivery Time</span>
                <strong>${escapeHtml(orderScheduledLabel(order))}</strong>
            </div>
            <div>
                <span>Assigned Rider</span>
                <strong>${escapeHtml(assignedShopper)}</strong>
            </div>
            <div>
                <span>Next Status</span>
                <strong>${escapeHtml(isTerminalOrderStatus(status) ? status : nextStatus)}</strong>
            </div>
            <div>
                <span>Delivery Address</span>
                <strong>${escapeHtml(deliveryAddress)}</strong>
            </div>
        </div>

        <section class="customer-order-modal-section">
            <h3>Customer information</h3>
            <div class="customer-order-customer-grid">
                <div>
                    <span>Name</span>
                    <strong>${escapeHtml(customerName)}</strong>
                </div>
                <div>
                    <span>Email</span>
                    <strong>${escapeHtml(customerEmail)}</strong>
                </div>
                <div>
                    <span>Phone</span>
                    <strong>${escapeHtml(customerPhone)}</strong>
                </div>
            </div>
        </section>

        <section class="customer-order-modal-section">
            <div class="customer-order-section-head">
                <h3>Ordered products</h3>
                <strong>${escapeHtml(items.length)} ${items.length === 1 ? 'item' : 'items'}</strong>
            </div>
            <div class="customer-order-items">
                ${customerOrderItemsHtml(items)}
            </div>
            <div class="customer-order-modal-total">
                <span>Total price</span>
                <strong>${formatMoney(orderTotal(order))}</strong>
            </div>
        </section>

        <div class="customer-order-modal-actions">
            ${canAccept ? `
                <button class="primary-button" type="button" data-rider-accept="${escapeHtml(order.id || orderId)}">
                    <i data-lucide="check" aria-hidden="true"></i> Accept
                </button>
                <button class="ghost-button" type="button" data-rider-reject="${escapeHtml(order.id || orderId)}">
                    <i data-lucide="x" aria-hidden="true"></i> Reject
                </button>
            ` : ''}
            <button class="ghost-button" type="button" data-rider-tracking-open="${escapeHtml(order.id || orderId)}">
                <i data-lucide="route" aria-hidden="true"></i> Tracking view
            </button>
        </div>
        <div class="customer-order-modal-workspace" data-rider-order-modal-workspace></div>
    `;
}

function initRiderDashboard() {
    const root = $('[data-rider-dashboard]');
    if (!root) {
        return;
    }

    const account = requireSignedRole(['rider']);
    if (!account) {
        return;
    }

    const shopperId = accountLinkedId(account);
    const statusNode = $('[data-rider-status]', root);
    const currentOrderNode = $('[data-rider-current-order]', root);
    const riderOrdersNode = $('[data-rider-orders]', root);
    const riderOrderLogsNode = $('[data-rider-order-logs]', root);
    const riderEarningsNode = $('[data-rider-earnings]', root);
    const riderOrderModal = $('[data-rider-order-modal]', root);
    const riderOrderModalContent = $('[data-rider-order-modal-content]', root);
    let riderCanWork = false;
    let riderReadySince = 0;
    let riderOrders = [];
    let currentRiderOrder = null;

    const showRiderView = (view) => {
        const targetView = view || 'dashboard';
        $$('[data-rider-view-panel]', root).forEach((panel) => {
            const isActive = panel.dataset.riderViewPanel === targetView;
            panel.hidden = !isActive;
            panel.classList.toggle('is-active', isActive);
        });
        $$('[data-rider-view-trigger]', root).forEach((trigger) => {
            const isActive = trigger.dataset.riderViewTrigger === targetView;
            trigger.classList.toggle('is-active', isActive);
            if (isActive) {
                trigger.setAttribute('aria-current', 'page');
            } else {
                trigger.removeAttribute('aria-current');
            }
        });
        refreshIcons();
    };

    const riderViews = new Set(['dashboard', 'orders', 'earnings', 'order-logs']);
    const initialRiderView = riderViews.has(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
    showRiderView(initialRiderView);

    const sameRiderOrder = (order, id) => {
        const expectedId = String(id || '').trim();
        return Boolean(expectedId && [
            order?.id,
            order?.order_id,
            order?.ORDER_id
        ].some((candidate) => String(candidate || '').trim() === expectedId));
    };

    const activeAssignedOrders = () => sortRiderOrders(riderOrders.filter((order) => (
        riderOwnsOrder(order, shopperId)
        && !isTerminalOrderStatus(orderStatus(order))
    )));

    const availableOrders = () => (
        riderCanWork
            ? sortRiderOrders(riderOrders.filter((order) => riderCanSeeAvailableOrder(order, shopperId, riderReadySince)))
            : []
    );

    const orderLogRecords = () => sortRiderOrders(riderOrders.filter((order) => (
        (riderOwnsOrder(order, shopperId) && isTerminalOrderStatus(orderStatus(order)))
        || rejectedByRider(order, shopperId)
    )));

    const findRiderOrder = (orderId) => riderOrders.find((order) => sameRiderOrder(order, orderId)) || null;

    const renderRiderEarnings = () => {
        if (!riderEarningsNode) {
            return;
        }

        const assignedOrders = sortRiderOrders(riderOrders.filter((order) => riderOwnsOrder(order, shopperId)));
        const deliveredOrders = assignedOrders.filter((order) => orderStatus(order) === 'Delivered');
        const activeOrders = assignedOrders.filter((order) => !isTerminalOrderStatus(orderStatus(order)));
        const rejectedOrders = sortRiderOrders(riderOrders.filter((order) => rejectedByRider(order, shopperId)));
        const totalEarnings = deliveredOrders.reduce((sum, order) => sum + riderDeliveryEarning(order), 0);
        const pendingEarnings = activeOrders.reduce((sum, order) => sum + riderDeliveryEarning(order), 0);
        const averageEarning = deliveredOrders.length ? totalEarnings / deliveredOrders.length : 0;
        const recentEarnings = deliveredOrders.slice(0, 5);

        riderEarningsNode.innerHTML = `
            <div class="admin-detail-grid account-stat-grid">
                <div class="admin-detail-item">
                    <span>Total Earnings</span>
                    <strong>${formatMoney(totalEarnings)}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Completed Deliveries</span>
                    <strong>${deliveredOrders.length}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Pending Earnings</span>
                    <strong>${formatMoney(pendingEarnings)}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Average Per Delivery</span>
                    <strong>${formatMoney(averageEarning)}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Active Deliveries</span>
                    <strong>${activeOrders.length}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Rejected Orders</span>
                    <strong>${rejectedOrders.length}</strong>
                </div>
            </div>
            <article class="dashboard-card account-detail-summary-card">
                <div class="dashboard-card-head">
                    <div>
                        <small>Earning Basis</small>
                        <h3>Delivery fee per completed order</h3>
                    </div>
                    <span class="status-pill">Rider</span>
                </div>
                <p>Earnings use the order delivery fee when available. If an old order has no stored delivery fee, the dashboard estimates PHP 50.00 for that delivery.</p>
            </article>
            <div class="dashboard-heading compact-detail-heading">
                <div>
                    <h2>Recent Earnings</h2>
                </div>
            </div>
            <div class="dashboard-list">
                ${recentEarnings.length === 0
                    ? '<div class="empty-state">No completed delivery earnings yet.</div>'
                    : recentEarnings.map((order) => riderEarningRowHtml(order)).join('')}
            </div>
        `;
    };

    const readRiderOrderItems = async (orderId) => readFirestoreOrderItems(orderId);

    const updateLocalRiderOrder = (orderId, patch) => {
        riderOrders = riderOrders.map((order) => (
            sameRiderOrder(order, orderId)
                ? { ...order, ...patch }
                : order
        ));
        renderRiderOrders();
    };

    const renderRiderOrders = () => {
        const activeOrders = activeAssignedOrders();
        const readyOrders = availableOrders();
        const orderQueue = sortRiderOrders([
            ...activeOrders,
            ...readyOrders.filter((order) => !activeOrders.some((activeOrder) => sameRiderOrder(activeOrder, order.id)))
        ]);
        const logOrders = orderLogRecords();
        const currentOrder = activeOrders[0] || null;

        if (currentOrderNode) {
            currentOrderNode.innerHTML = currentOrder
                ? riderOrderListCard(currentOrder, 'Current order')
                : '<div class="empty-state">No current order assigned to you.</div>';
        }

        if (riderOrdersNode) {
            riderOrdersNode.innerHTML = orderQueue.length === 0
                ? '<div class="empty-state">No ready orders. Online payments appear here after merchant acceptance.</div>'
                : orderQueue.map((order) => {
                    const context = riderOwnsOrder(order, shopperId) ? 'Assigned to you' : 'Ready for pickup';
                    return riderOrderListCard(order, context);
                }).join('');
        }

        if (riderOrderLogsNode) {
            riderOrderLogsNode.innerHTML = logOrders.length === 0
                ? '<div class="empty-state">No completed or rejected rider orders yet.</div>'
                : logOrders.map((order) => riderOrderListCard(order, 'Order log')).join('');
        }

        renderRiderEarnings();
        refreshIcons();
        applyCurrentLanguage();
    };

    const closeRiderOrderModal = () => {
        if (!riderOrderModal) {
            return;
        }

        riderOrderModal.classList.remove('is-open');
        riderOrderModal.hidden = true;
        riderOrderModal.setAttribute('aria-hidden', 'true');
        document.body?.classList.remove('has-open-rider-order-modal');
        currentRiderOrder = null;
    };

    const openRiderOrderModal = async (orderId) => {
        if (!orderId || !riderOrderModal || !riderOrderModalContent) {
            return;
        }

        currentRiderOrder = null;
        riderOrderModalContent.innerHTML = '<div class="empty-state">Loading order details...</div>';
        riderOrderModal.hidden = false;
        riderOrderModal.setAttribute('aria-hidden', 'false');
        document.body?.classList.add('has-open-rider-order-modal');
        window.requestAnimationFrame(() => {
            riderOrderModal.classList.add('is-open');
        });

        try {
            let order = findRiderOrder(orderId);
            if (!order) {
                order = await readFirestoreOrder(orderId);
            }

            const isAvailable = order ? riderCanSeeAvailableOrder(order, shopperId, riderReadySince) : false;
            const isAssignedToRider = order ? riderOwnsOrder(order, shopperId) : false;
            const isRejectedByRider = order ? rejectedByRider(order, shopperId) : false;
            if (!order || (!isAvailable && !isAssignedToRider && !isRejectedByRider)) {
                riderOrderModalContent.innerHTML = '<div class="empty-state">No rider order found for this account.</div>';
                return;
            }

            const itemOrderId = order.id || customerOrderNumber(order);
            const items = await readRiderOrderItems(itemOrderId);
            currentRiderOrder = order;
            riderOrderModalContent.innerHTML = riderOrderModalTemplate(order, items, {
                isAvailable,
                isAssignedToRider,
                riderCanWork
            });
            window.setTimeout(() => {
                $('[data-rider-order-modal-close]', riderOrderModal)?.focus({ preventScroll: true });
            }, 0);
            refreshIcons();
            applyCurrentLanguage();
        } catch (error) {
            riderOrderModalContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message || 'Order details could not be loaded.')}</div>`;
        }
    };

    if (!shopperId) {
        location.href = 'index.html?modal=rider';
        return;
    } else {
        firebaseOnSnapshot(firebaseRoleDoc('rider', shopperId), async (snapshot) => {
            if (!snapshot.exists()) {
                statusNode.textContent = 'Rider application was not found.';
                return;
            }

            const userSnapshot = await firebaseGetDoc(firebaseUserDoc(shopperId)).catch(() => null);
            const shopper = firebaseRiderRecord(
                shopperId,
                snapshot.data(),
                userSnapshot?.exists?.() ? userSnapshot.data() : {},
                account
            );
            const status = shopper.SHOP_employmentStatus;
            if (status !== 'Active') {
                redirectToPendingSignIn();
                return;
            }

            riderCanWork = true;
            riderReadySince = riderActivationMillis(shopper);
            statusNode.textContent = `${riderFullName(shopper) || 'Rider'} - ${status}`;
            renderRiderOrders();
        });
    }

    listenFirestoreMerchants((records) => {
        cacheMerchantStoreStatuses(records);
        renderRiderOrders();
    });

    listenFirestoreOrders((orders) => {
        riderOrders = orders;
        renderRiderOrders();
    });

    root.addEventListener('click', async (event) => {
        const viewTrigger = event.target.closest('[data-rider-view-trigger]');
        const orderOpenButton = event.target.closest('[data-rider-order-open]');
        const modalCloseButton = event.target.closest('[data-rider-order-modal-close]');
        const acceptButton = event.target.closest('[data-rider-accept]');
        const rejectButton = event.target.closest('[data-rider-reject]');
        const updateStatusButton = event.target.closest('[data-rider-update-status]');
        const trackingButton = event.target.closest('[data-rider-tracking-open]');
        const deliverPaidButton = event.target.closest('[data-rider-modal-deliver-paid]');

        if (viewTrigger && root.contains(viewTrigger)) {
            event.preventDefault();
            const targetView = viewTrigger.dataset.riderViewTrigger || 'dashboard';
            showRiderView(targetView);
            history.replaceState(null, '', `#${targetView}`);
            return;
        }

        if (orderOpenButton && root.contains(orderOpenButton)) {
            event.preventDefault();
            await openRiderOrderModal(orderOpenButton.dataset.riderOrderOpen);
            return;
        }

        if ((modalCloseButton && root.contains(modalCloseButton)) || event.target === riderOrderModal) {
            event.preventDefault();
            closeRiderOrderModal();
            return;
        }

        if (trackingButton && root.contains(trackingButton)) {
            event.preventDefault();
            const order = findRiderOrder(trackingButton.dataset.riderTrackingOpen) || currentRiderOrder;
            if (!order || !riderOrderModalContent) {
                return;
            }

            riderOrderModalContent.innerHTML = '<div class="empty-state">Loading tracking...</div>';
            const items = await readRiderOrderItems(order.id || customerOrderNumber(order));
            currentRiderOrder = order;
            riderOrderModalContent.innerHTML = riderTrackingModalTemplate(order, items, shopperId);
            refreshIcons();
            applyCurrentLanguage();
            return;
        }

        const activeButton = acceptButton || rejectButton || updateStatusButton || deliverPaidButton;
        if (!activeButton) {
            return;
        }

        activeButton.disabled = true;

        if (acceptButton) {
            if (!shopperId || !riderCanWork) {
                statusNode.textContent = 'Apply and wait for admin approval before accepting deliveries.';
                activeButton.disabled = false;
                return;
            }

            const order = findRiderOrder(acceptButton.dataset.riderAccept);
            if (order) {
                if (!orderReadyForRider(order)) {
                    statusNode.textContent = 'Merchant payment verification is required before this delivery can be accepted.';
                    activeButton.disabled = false;
                    return;
                }

                const conflictReason = riderAcceptConflictReason(order, activeAssignedOrders());
                if (conflictReason) {
                    statusNode.textContent = conflictReason;
                    activeButton.disabled = false;
                    return;
                }

                await updateOrderStatus(order, 'Shopper accepted', shopperId);
                updateLocalRiderOrder(order.id, {
                    riderId: shopperId,
                    rider_id: shopperId,
                    SHOP_id: shopperId,
                    shopper_id: shopperId,
                    ORDER_status: 'Shopper accepted',
                    order_status: 'Shopper accepted',
                    orderStatus: 'Shopper accepted',
                    deliveryStatus: 'Shopper accepted'
                });
                statusNode.textContent = `Order ${order.order_id || order.id} accepted.`;
                await openRiderOrderModal(order.id);
            }
        }

        if (rejectButton) {
            if (!shopperId || !riderCanWork) {
                statusNode.textContent = 'Apply and wait for admin approval before rejecting deliveries.';
                activeButton.disabled = false;
                return;
            }

            const order = findRiderOrder(rejectButton.dataset.riderReject);
            if (order) {
                await rejectOrderForRider(order, shopperId);
                updateLocalRiderOrder(order.id, {
                    rider_rejected_by: [...new Set([...(Array.isArray(order.rider_rejected_by) ? order.rider_rejected_by : []), shopperId])],
                    riderRejectedBy: [...new Set([...(Array.isArray(order.riderRejectedBy) ? order.riderRejectedBy : []), shopperId])],
                    lastRiderId: shopperId,
                    last_rider_id: shopperId,
                    lastRiderAction: 'Rejected',
                    last_rider_action: 'Rejected'
                });
                statusNode.textContent = 'Order skipped. It remains available for other riders.';
                closeRiderOrderModal();
            }
        }

        if (updateStatusButton) {
            const order = findRiderOrder(updateStatusButton.dataset.riderUpdateStatus);
            if (order) {
                if (!riderOwnsOrder(order, shopperId)) {
                    statusNode.textContent = 'This order is not assigned to your rider account.';
                    activeButton.disabled = false;
                    return;
                }

                const nextStatus = nextRiderStatus(orderStatus(order));
                if (nextStatus === 'Delivered' && needsRiderPaymentCollection(order)) {
                    const workspace = $('[data-rider-order-modal-workspace]', riderOrderModalContent);
                    if (workspace) {
                        workspace.innerHTML = riderPaymentDonePanelHtml(order);
                        refreshIcons();
                        applyCurrentLanguage();
                    }
                    activeButton.disabled = false;
                    return;
                }
                await updateOrderStatus(order, nextStatus, shopperId, nextStatus === 'Delivered' ? orderPaymentStatus(order) : null);
                updateLocalRiderOrder(order.id, {
                    ORDER_status: nextStatus,
                    order_status: nextStatus,
                    orderStatus: nextStatus,
                    deliveryStatus: nextStatus
                });
                statusNode.textContent = `Order updated to ${nextStatus}.`;
                await openRiderOrderModal(order.id);
            }
        }

        if (deliverPaidButton) {
            const orderId = deliverPaidButton.dataset.riderModalDeliverPaid;
            const order = findRiderOrder(orderId) || currentRiderOrder;
            if (order) {
                await updateOrderStatus(order, 'Delivered', shopperId, 'Paid');
                updateLocalRiderOrder(order.id, {
                    ORDER_status: 'Delivered',
                    order_status: 'Delivered',
                    orderStatus: 'Delivered',
                    deliveryStatus: 'Delivered',
                    PAY_status: 'Paid',
                    payment_status: 'Paid',
                    paymentStatus: 'Paid'
                });
                statusNode.textContent = `Order delivered. Payment: ${orderPaymentDisplay(order, 'Paid')}.`;
                await openRiderOrderModal(order.id);
            }
        }

        activeButton.disabled = false;
    });

    root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && riderOrderModal && !riderOrderModal.hidden) {
            closeRiderOrderModal();
        }
    });
}

function businessHoursValue(form) {
    const openInput = form.elements.businessOpenTime;
    const closeInput = form.elements.businessCloseTime;
    const openTime = String(openInput?.value || '').trim();
    const closeTime = String(closeInput?.value || '').trim();

    if (!openTime || !closeTime) {
        const message = 'Choose opening and closing time.';
        showFieldError(openTime ? closeInput : openInput, message);
        throw new Error(message);
    }

    clearFieldError(openInput);
    clearFieldError(closeInput);
    return `${openTime}-${closeTime}`;
}

const merchantAvailableDayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function normalizeMerchantStoreStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'closed' ? 'Closed' : 'Open';
}

function merchantStoreStatusLabel(record = {}) {
    return normalizeMerchantStoreStatus(record.MERCH_storeStatus || record.store_status || record.STORE_status || record.status || 'Open');
}

function merchantStoreIsOpen(record = {}) {
    return merchantStoreStatusLabel(record) === 'Open';
}

const storeCurrentlyClosedMessage = 'Store is currently closed';

function normalizeMerchantAvailableDays(value) {
    const raw = Array.isArray(value) ? value.join(',') : String(value || 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday');
    if (/mon(?:day)?\s*(to|-|–|—)\s*sat(?:urday)?/i.test(raw)) {
        return 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday';
    }
    if (/mon(?:day)?\s*(to|-|–|—)\s*sun(?:day)?/i.test(raw)) {
        return merchantAvailableDayOptions.join(', ');
    }
    const normalized = raw
        .replace(/\bmon(?:day)?\b/ig, 'Monday')
        .replace(/\btue(?:sday)?\b/ig, 'Tuesday')
        .replace(/\bwed(?:nesday)?\b/ig, 'Wednesday')
        .replace(/\bthu(?:rsday)?\b/ig, 'Thursday')
        .replace(/\bfri(?:day)?\b/ig, 'Friday')
        .replace(/\bsat(?:urday)?\b/ig, 'Saturday')
        .replace(/\bsun(?:day)?\b/ig, 'Sunday');

    const values = merchantAvailableDayOptions.filter((day) => new RegExp(`\b${day}\b`, 'i').test(normalized));
    return values.length ? values.join(', ') : 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday';
}

function cleanMerchantAddressValue(value) {
    const address = cleanAddressPart(value);
    return /^(yes|no|true|false)$/i.test(address) ? '' : address;
}

function storeStatusBadge(status) {
    const label = normalizeMerchantStoreStatus(status);
    return `<span class="store-status-badge ${label === 'Open' ? 'is-open' : 'is-closed'}">${escapeHtml(label)}</span>`;
}

function initSellerRegistration() {
    const forms = $$('[data-seller-registration-form]');
    if (forms.length === 0) {
        return;
    }

    const account = getCurrentAccount();
    if ($('[data-seller-registration-page]') && accountRole(account) === 'seller') {
        location.href = dashboardForAccount(account);
        return;
    }

    forms.forEach((form) => {
        if (form.dataset.formBound === 'true') {
            return;
        }

        form.dataset.formBound = 'true';
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const notice = $('[data-seller-registration-notice]', form);
            const formData = new FormData(form);
            const merchantName = formData.get('merchantName');

            try {
                const email = assertEmailAddress(form.elements.ownerEmail);
                const phone = assertPhoneNumber(form.elements.phone);
                const password = assertStrongPassword(form.elements.password);
                assertMatchingPassword(password, form.elements.confirmPassword);
                const ownerFirstName = String(formData.get('ownerFirstName') || '').trim();
                const ownerLastName = String(formData.get('ownerLastName') || '').trim();
                const merchantAddress = readAddressPickerField(form, {
                    label: currentAddressLabel
                });
                const businessHours = businessHoursValue(form);
                await createMerchantFirebaseAccount({
                    ownerFirstName,
                    ownerLastName,
                    email,
                    phone,
                    password,
                    storeName: merchantName,
                    merchantType: formData.get('merchantType'),
                    address: merchantAddress.address,
                    businessHours
                });

                await finishPartnerApplicationSubmission(form, notice);
            } catch (error) {
                setNotice(notice, firebaseAuthMessage(error) || 'Merchant registration could not be saved.', true);
            }
        });
    });
}

function initSellerDashboard() {
    const root = $('[data-seller-dashboard]');
    if (!root) {
        return;
    }

    const account = requireSignedRole(['seller']);
    if (!account) {
        return;
    }

    const merchantId = accountLinkedId(account);
    const statusNode = $('[data-seller-status]', root);
    const orderList = $('[data-seller-orders]', root);
    const pendingPaymentList = $('[data-seller-pending-payments]', root);
    const productList = $('[data-seller-products]', root);
    const sellerSalesNode = $('[data-seller-sales]', root);
    const productForm = $('[data-seller-product-form]', root);
    const inlineProductEditor = $('[data-seller-inline-product-editor]', root);
    const inlineProductEditorStatus = $('[data-seller-product-editor-status]', root);
    const inlineProductEditorNotice = $('[data-seller-inline-product-notice]', root);
    const inlineProductSummary = $('[data-seller-product-edit-summary]', root);
    const inlineProductPreviewImage = $('[data-seller-product-preview-image]', root);
    const inlineProductPreviewName = $('[data-seller-product-preview-name]', root);
    const inlineProductPreviewMeta = $('[data-seller-product-preview-meta]', root);
    const inlineProductImageInput = $('[data-seller-inline-product-image-upload]', root);
    const sellerOrderModal = $('[data-seller-order-modal]', root);
    const sellerOrderModalContent = $('[data-seller-order-modal-content]', root);
    let merchantName = '';
    let merchantType = 'Grocery';
    let sellerCanSell = false;
    let sellerOrders = [];
    let sellerProducts = [];
    let currentSellerOrder = null;
    let editingSellerProduct = null;
    let inlineProductDirty = false;

    const showSellerView = (view) => {
        const targetView = view || 'dashboard';
        $$('[data-seller-view-panel]', root).forEach((panel) => {
            const isActive = panel.dataset.sellerViewPanel === targetView;
            panel.hidden = !isActive;
            panel.classList.toggle('is-active', isActive);
        });
        $$('[data-seller-view-trigger]', root).forEach((trigger) => {
            const isActive = trigger.dataset.sellerViewTrigger === targetView;
            trigger.classList.toggle('is-active', isActive);
            if (isActive) {
                trigger.setAttribute('aria-current', 'page');
            } else {
                trigger.removeAttribute('aria-current');
            }
        });
        refreshIcons();
    };

    const renderSellerSales = () => {
        if (!sellerSalesNode) {
            return;
        }

        const merchantOrders = sellerOrders.filter((order) => orderBelongsToMerchant(order, merchantId, merchantName));
        const paidOrders = merchantOrders.filter((order) => orderPaymentStatus(order) === 'Paid');
        const deliveredOrders = merchantOrders.filter((order) => orderStatus(order) === 'Delivered');
        const payableSalesOrders = paidOrders.length ? paidOrders : deliveredOrders;
        const grossSales = payableSalesOrders.reduce((sum, order) => sum + merchantSalesAmount(order), 0);
        const pendingPaymentOrders = merchantOrders.filter((order) => (
            sellerPaymentVerificationPending(order)
            && !isTerminalOrderStatus(orderStatus(order))
        ));
        const activeOrders = merchantOrders.filter((order) => !isTerminalOrderStatus(orderStatus(order)));
        const averageOrder = payableSalesOrders.length ? grossSales / payableSalesOrders.length : 0;
        const recentSales = sortDashboardOrders(payableSalesOrders.length ? payableSalesOrders : merchantOrders).slice(0, 5);

        sellerSalesNode.innerHTML = `
            <div class="admin-detail-grid account-stat-grid">
                <div class="admin-detail-item">
                    <span>Gross Sales</span>
                    <strong>${formatMoney(grossSales)}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Paid Orders</span>
                    <strong>${paidOrders.length}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Completed Orders</span>
                    <strong>${deliveredOrders.length}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Average Order</span>
                    <strong>${formatMoney(averageOrder)}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Pending Payments</span>
                    <strong>${pendingPaymentOrders.length}</strong>
                </div>
                <div class="admin-detail-item">
                    <span>Active Products</span>
                    <strong>${sellerProducts.length}</strong>
                </div>
            </div>
            <article class="dashboard-card account-detail-summary-card">
                <div class="dashboard-card-head">
                    <div>
                        <small>Merchant Type</small>
                        <h3>${escapeHtml(merchantType || 'Grocery')}</h3>
                    </div>
                    <span class="status-pill">Sales</span>
                </div>
                <p>Sales totals are based on paid merchant orders. If no paid records exist yet, delivered orders are shown as the sales reference.</p>
            </article>
            <div class="dashboard-heading compact-detail-heading">
                <div>
                    <h2>Recent Sales</h2>
                </div>
            </div>
            <div class="dashboard-list">
                ${recentSales.length === 0
                    ? '<div class="empty-state">No sales records yet.</div>'
                    : recentSales.map((order) => sellerSalesRowHtml(order)).join('')}
            </div>
        `;
    };

    const renderSellerOrders = () => {
        const merchantOrders = sellerOrders.filter((order) => orderBelongsToMerchant(order, merchantId, merchantName));
        const pendingPaymentOrders = merchantOrders.filter((order) => (
            sellerPaymentVerificationPending(order)
            && !isTerminalOrderStatus(orderStatus(order))
        ));

        if (pendingPaymentList) {
            pendingPaymentList.innerHTML = pendingPaymentOrders.length === 0
                ? '<div class="empty-state">No pending customer payment orders.</div>'
                : pendingPaymentOrders.map((order) => sellerOrderCard(order)).join('');
        }

        if (orderList) {
            orderList.innerHTML = merchantOrders.length === 0
                ? '<div class="empty-state">No merchant orders yet. New customer orders for your approved merchant will appear here.</div>'
                : merchantOrders.map((order) => sellerOrderCard(order)).join('');
        }

        renderSellerSales();
        refreshIcons();
        applyCurrentLanguage();
    };

    const sellerViews = new Set(['dashboard', 'add-product', 'product-list', 'edit-product', 'sales', 'order-logs']);
    const initialSellerView = sellerViews.has(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
    showSellerView(initialSellerView);

    const sameSellerOrder = (order, id) => {
        const expectedId = String(id || '').trim();
        return Boolean(expectedId && [
            order?.id,
            order?.order_id,
            order?.ORDER_id
        ].some((candidate) => String(candidate || '').trim() === expectedId));
    };

    const readSellerOrderItems = async (orderId) => readFirestoreOrderItems(orderId);

    const findSellerOrder = async (orderId) => {
        const localOrder = sellerOrders.find((order) => sameSellerOrder(order, orderId));
        if (localOrder) {
            return localOrder;
        }

        return readFirestoreOrder(orderId);
    };

    const closeSellerOrderModal = () => {
        if (!sellerOrderModal) {
            return;
        }

        sellerOrderModal.classList.remove('is-open');
        sellerOrderModal.hidden = true;
        sellerOrderModal.setAttribute('aria-hidden', 'true');
        document.body?.classList.remove('has-open-seller-order-modal');
        currentSellerOrder = null;
    };

    const openSellerOrderModal = async (orderId) => {
        if (!orderId || !sellerOrderModal || !sellerOrderModalContent) {
            return;
        }

        currentSellerOrder = null;
        sellerOrderModalContent.innerHTML = '<div class="empty-state">Loading preparation details...</div>';
        sellerOrderModal.hidden = false;
        sellerOrderModal.setAttribute('aria-hidden', 'false');
        document.body?.classList.add('has-open-seller-order-modal');
        window.requestAnimationFrame(() => {
            sellerOrderModal.classList.add('is-open');
        });

        try {
            const order = await findSellerOrder(orderId);
            if (!order || !orderBelongsToMerchant(order, merchantId, merchantName)) {
                sellerOrderModalContent.innerHTML = '<div class="empty-state">Open an order assigned to your merchant account.</div>';
                return;
            }

            const items = await readSellerOrderItems(order.id || customerOrderNumber(order));
            const canVerifyPayment = sellerCanVerifyPayment(order);
            currentSellerOrder = order;
            sellerOrderModalContent.innerHTML = sellerOrderModalTemplate(order, items, {
                canVerifyPayment
            });
            window.setTimeout(() => {
                $('[data-seller-order-modal-close]', sellerOrderModal)?.focus({ preventScroll: true });
            }, 0);
            refreshIcons();
            applyCurrentLanguage();
        } catch (error) {
            sellerOrderModalContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message || 'Preparation details could not be loaded.')}</div>`;
        }
    };

    const updateLocalSellerOrder = (orderId, patch) => {
        sellerOrders = sellerOrders.map((order) => (
            sameSellerOrder(order, orderId)
                ? { ...order, ...patch }
                : order
        ));
        renderSellerOrders();
    };

    const findSellerProduct = (productId) => {
        const expectedId = String(productId || '').trim();
        return sellerProducts.find((product) => [productRecordId(product), product.id, product.PROD_id].some((candidate) => String(candidate || '').trim() === expectedId));
    };

    const updateInlineProductSummary = (product) => {
        if (!inlineProductSummary || !product) {
            return;
        }

        const productName = productRecordName(product) || 'Selected product';
        const productCategory = product.category || product.PROD_category || 'No category';
        const productUnit = product.unit || product.PROD_unit || 'No unit';
        const productPrice = formatMoney(product.price || product.PROD_price || 0);
        const productImage = productImagePath(productRecordImageUrl(product));

        inlineProductSummary.hidden = false;
        if (inlineProductPreviewImage) {
            inlineProductPreviewImage.src = productImage;
            inlineProductPreviewImage.alt = product.alt || productName;
        }
        if (inlineProductPreviewName) {
            inlineProductPreviewName.textContent = productName;
        }
        if (inlineProductPreviewMeta) {
            inlineProductPreviewMeta.textContent = `${productCategory} • ${productUnit} • ${productPrice}`;
        }
    };

    const fillInlineProductEditor = (product) => {
        if (!inlineProductEditor || !product) {
            return;
        }

        setProductEditorField(inlineProductEditor, 'name', productRecordName(product) || '');
        setProductEditorField(inlineProductEditor, 'category', product.category || product.PROD_category || '');
        setProductEditorField(inlineProductEditor, 'unit', product.unit || product.PROD_unit || '');
        setProductEditorField(inlineProductEditor, 'price', product.price || product.PROD_price || '');
        setProductEditorField(inlineProductEditor, 'alt', product.alt || productRecordName(product) || '');
        setProductEditorField(inlineProductEditor, 'description', product.description || product.PROD_description || '');
        if (inlineProductImageInput) {
            inlineProductImageInput.value = '';
        }
        updateInlineProductSummary(product);
        inlineProductDirty = false;
        clearNotice(inlineProductEditorNotice);
    };

    const openInlineProductEditor = (productId) => {
        const product = findSellerProduct(productId);
        if (!product || !inlineProductEditor) {
            statusNode.textContent = 'Product was not found.';
            return;
        }

        editingSellerProduct = product;
        inlineProductEditor.hidden = false;
        if (inlineProductEditorStatus) {
            inlineProductEditorStatus.textContent = `${productRecordName(product) || 'Product'} - edit product details below.`;
        }
        fillInlineProductEditor(product);
        showSellerView('edit-product');
        history.replaceState(null, '', '#edit-product');
        refreshIcons();
    };

    const closeInlineProductEditor = () => {
        editingSellerProduct = null;
        inlineProductDirty = false;
        if (inlineProductEditor) {
            inlineProductEditor.reset();
            inlineProductEditor.hidden = true;
        }
        if (inlineProductEditorStatus) {
            inlineProductEditorStatus.textContent = 'Select a product from Product List.';
        }
        if (inlineProductSummary) {
            inlineProductSummary.hidden = true;
        }
        clearNotice(inlineProductEditorNotice);
        showSellerView('product-list');
        history.replaceState(null, '', '#product-list');
    };

    if (inlineProductEditor) {
        inlineProductEditor.addEventListener('input', () => {
            inlineProductDirty = true;
        });

        inlineProductEditor.addEventListener('change', () => {
            inlineProductDirty = true;
        });

        inlineProductEditor.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!editingSellerProduct) {
                setNotice(inlineProductEditorNotice, 'Select a product first.', true);
                return;
            }

            const productId = productRecordId(editingSellerProduct);
            const productName = productEditorFieldValue(inlineProductEditor, 'name');
            const productCategory = productEditorFieldValue(inlineProductEditor, 'category');
            const productUnit = productEditorFieldValue(inlineProductEditor, 'unit');
            const productPrice = Number(productEditorFieldValue(inlineProductEditor, 'price')) || 0;
            const productAlt = productEditorFieldValue(inlineProductEditor, 'alt') || productName;
            const productDescription = productEditorFieldValue(inlineProductEditor, 'description');
            const currentProductImage = productRecordImageUrl(editingSellerProduct, DEFAULT_PRODUCT_IMAGE);

            try {
                const productImage = productImageUrlForSave(
                    inlineProductImageInput,
                    currentProductImage
                );

                await firebaseSetDoc(firestoreProductDoc(productId), {
                    productId,
                    merchantId,
                    productName,
                    category: productCategory,
                    unit: productUnit,
                    price: productPrice,
                    description: productDescription,
                    imageUrl: productImage,
                    status: 'Active',
                    updatedAt: firebaseServerTimestamp()
                }, { merge: true });
                inlineProductDirty = false;
                if (inlineProductImageInput) {
                    inlineProductImageInput.value = '';
                }
                const savedProduct = {
                    ...editingSellerProduct,
                    name: productName,
                    PROD_name: productName,
                    category: productCategory,
                    PROD_category: productCategory,
                    unit: productUnit,
                    PROD_unit: productUnit,
                    price: productPrice,
                    PROD_price: productPrice,
                    description: productDescription,
                    image: productImage,
                    PROD_image: productImage,
                    imageUrl: productImage,
                    alt: productAlt,
                    status: 'Active'
                };
                editingSellerProduct = savedProduct;
                updateInlineProductSummary(savedProduct);
                setNotice(inlineProductEditorNotice, 'Product changes saved.');
                if (inlineProductEditorStatus) {
                    inlineProductEditorStatus.textContent = `${productName || 'Product'} - changes saved.`;
                }
            } catch (error) {
                setNotice(inlineProductEditorNotice, error.message || 'Product could not be updated.', true);
            }
        });
    }

    if (!merchantId) {
        location.href = 'index.html?modal=merchant';
        return;
    } else {
        firebaseOnSnapshot(firebaseRoleDoc('seller', merchantId), async (snapshot) => {
            if (!snapshot.exists()) {
                statusNode.textContent = 'Merchant profile was not found.';
                return;
            }

            const userSnapshot = await firebaseGetDoc(firebaseUserDoc(merchantId)).catch(() => null);
            const merchant = firebaseMerchantRecord(
                merchantId,
                snapshot.data(),
                userSnapshot?.exists?.() ? userSnapshot.data() : {},
                account
            );
            merchantName = merchant.MERCH_name || '';
            merchantType = merchant.MERCH_type || 'Grocery';
            const status = merchant.MERCH_approvalStatus;
            if (status !== 'Approved') {
                redirectToPendingSignIn();
                return;
            }

            sellerCanSell = status === 'Approved';
            statusNode.textContent = `${merchantName} - ${status} - Store ${merchantStoreStatusLabel(merchant)}`;
            root.classList.toggle('is-approved', sellerCanSell);
            renderSellerOrders();
        });
    }

    listenFirestoreOrdersForMerchant(merchantId, (orders) => {
        sellerOrders = orders;
        renderSellerOrders();
    });

    listenFirestoreProductsForMerchant(merchantId, (products) => {
        const merchantProducts = products.filter((product) => {
            return merchantId && productRecordMerchantId(product) === merchantId && productIsActive(product);
        });

        sellerProducts = merchantProducts;
        if (editingSellerProduct) {
            const refreshedProduct = findSellerProduct(productRecordId(editingSellerProduct));
            if (refreshedProduct) {
                editingSellerProduct = refreshedProduct;
                if (!inlineProductDirty) {
                    fillInlineProductEditor(refreshedProduct);
                }
            }
        }
        if (productList) {
            productList.innerHTML = merchantProducts.length === 0
                ? '<div class="empty-state">No merchant products yet.</div>'
                : merchantProducts.map((product) => `
                    <button class="mini-row linked-row seller-product-edit-row" type="button" data-seller-edit-product="${escapeHtml(productRecordId(product))}">
                        <strong>${escapeHtml(productRecordName(product))}</strong>
                        <span>${formatMoney(product.price || product.PROD_price || 0)} - Edit</span>
                    </button>
                `).join('');
        }
        renderSellerSales();
        applyCurrentLanguage();
    });

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const notice = $('[data-seller-product-notice]');
        const formData = new FormData(productForm);

        if (!merchantId || !sellerCanSell) {
            setNotice(notice, 'Register and wait for admin approval before adding products.', true);
            return;
        }

        const productId = `${merchantId}-${slugify(formData.get('name'))}`;
        const productName = String(formData.get('name') || '').trim();
        const productCategory = String(formData.get('category') || '').trim();
        const productUnit = String(formData.get('unit') || '').trim();
        const productPrice = Number(formData.get('price')) || 0;
        const productDescription = String(formData.get('description') || '').trim();

        try {
            const productImage = productImageUrlForSave(
                productForm.elements.productImage,
                DEFAULT_PRODUCT_IMAGE
            );

            await firebaseSetDoc(firestoreProductDoc(productId), {
                productId,
                merchantId,
                productName,
                category: productCategory,
                unit: productUnit,
                price: productPrice,
                description: productDescription,
                imageUrl: productImage,
                status: 'Active',
                createdAt: firebaseServerTimestamp(),
                updatedAt: firebaseServerTimestamp()
            }, { merge: true });

            setNotice(notice, 'Product saved.');
            productForm.reset();
        } catch (error) {
            setNotice(notice, error.message || 'Product could not be saved.', true);
        }
    });

    root.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-seller-view-trigger]');
        if (!trigger || !root.contains(trigger)) {
            return;
        }

        event.preventDefault();
        const targetView = trigger.dataset.sellerViewTrigger || 'dashboard';
        showSellerView(targetView);
        history.replaceState(null, '', `#${targetView}`);
    });

    root.addEventListener('click', async (event) => {
        const orderOpenButton = event.target.closest('[data-seller-order-open]');
        const modalCloseButton = event.target.closest('[data-seller-order-modal-close]');
        const cardDetailsButton = event.target.closest('[data-seller-card-details]');
        const editProductButton = event.target.closest('[data-seller-edit-product]');
        const productEditorBackButton = event.target.closest('[data-seller-product-editor-back]');
        const deleteProductButton = event.target.closest('[data-seller-product-delete]');
        const paidButton = event.target.closest('[data-seller-verify-paid]');
        const unpaidButton = event.target.closest('[data-seller-verify-unpaid]');

        if (editProductButton && root.contains(editProductButton)) {
            event.preventDefault();
            openInlineProductEditor(editProductButton.dataset.sellerEditProduct);
            return;
        }

        if (productEditorBackButton && root.contains(productEditorBackButton)) {
            event.preventDefault();
            closeInlineProductEditor();
            return;
        }

        if (deleteProductButton && root.contains(deleteProductButton)) {
            event.preventDefault();
            if (!editingSellerProduct) {
                setNotice(inlineProductEditorNotice, 'Select a product first.', true);
                return;
            }

            const productId = productRecordId(editingSellerProduct);
            if (!productId || !window.confirm('Delete this product?')) {
                return;
            }

            deleteProductButton.disabled = true;
            try {
                await deleteFirestoreProduct(productId);
                closeInlineProductEditor();
                statusNode.textContent = 'Product deleted.';
            } catch (error) {
                setNotice(inlineProductEditorNotice, error.message || 'Product could not be deleted.', true);
            } finally {
                deleteProductButton.disabled = false;
            }
            return;
        }

        if (orderOpenButton && root.contains(orderOpenButton)) {
            event.preventDefault();
            await openSellerOrderModal(orderOpenButton.dataset.sellerOrderOpen);
            return;
        }

        if ((modalCloseButton && root.contains(modalCloseButton)) || event.target === sellerOrderModal) {
            event.preventDefault();
            closeSellerOrderModal();
            return;
        }

        if (cardDetailsButton && root.contains(cardDetailsButton)) {
            event.preventDefault();
            const workspace = $('[data-seller-order-modal-workspace]', sellerOrderModalContent);
            if (!workspace || !currentSellerOrder) {
                return;
            }

            cardDetailsButton.classList.toggle('is-active');
            workspace.innerHTML = cardDetailsButton.classList.contains('is-active')
                ? sellerCardDetailsPanelHtml(currentSellerOrder)
                : '';
            refreshIcons();
            applyCurrentLanguage();
            return;
        }

        const paymentButton = paidButton || unpaidButton;
        if (!paymentButton) {
            return;
        }

        const selectedOrderId = paidButton?.dataset.sellerVerifyPaid || unpaidButton?.dataset.sellerVerifyUnpaid;
        paymentButton.disabled = true;
        try {
            const order = await findSellerOrder(selectedOrderId);
            if (!order || !orderBelongsToMerchant(order, merchantId, merchantName)) {
                statusNode.textContent = 'This order belongs to another merchant account.';
                return;
            }
            if (!isRegisteredSellerOrder(order) || !isOnlinePaymentMethod(orderPaymentMethod(order))) {
                statusNode.textContent = 'This payment does not require merchant verification.';
                return;
            }
            if (orderAssignedShopperId(order)) {
                statusNode.textContent = 'Payment verification is locked after a rider accepts the order.';
                return;
            }

            await updateSellerPaymentVerification(order, merchantId, Boolean(paidButton));
            const paymentStatus = paidButton ? 'Paid' : 'Unpaid';
            const storeAcceptanceStatus = paidButton ? 'Accepted' : 'Payment not verified';
            updateLocalSellerOrder(order.id || customerOrderNumber(order), {
                PAY_status: paymentStatus,
                payment_status: paymentStatus,
                paymentStatus,
                store_acceptance_status: storeAcceptanceStatus,
                STORE_acceptanceStatus: storeAcceptanceStatus,
                requires_seller_payment_verification: !paidButton,
                seller_payment_verified: Boolean(paidButton)
            });
            statusNode.textContent = Boolean(paidButton)
                ? 'Payment verified. This order is ready for rider pickup.'
                : 'Payment marked unpaid. Riders will wait until payment is verified.';
            await openSellerOrderModal(order.id || customerOrderNumber(order));
        } catch (error) {
            statusNode.textContent = error.message || 'Payment verification could not be saved.';
        } finally {
            paymentButton.disabled = false;
        }
    });

    root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sellerOrderModal && !sellerOrderModal.hidden) {
            closeSellerOrderModal();
        }
    });
}

function setProductEditorField(form, field, value) {
    const input = $(`[data-product-field="${field}"]`, form);
    if (!input) {
        return;
    }

    if (input.type === 'file') {
        input.value = '';
        return;
    }

    input.value = value || '';
}

function productEditorFieldValue(form, field) {
    const input = $(`[data-product-field="${field}"]`, form);
    if (!input || input.type === 'file') {
        return '';
    }

    return input.value.trim() || '';
}

function orderMerchantId(order) {
    return String(order?.merch_id || order?.MERCH_id || order?.ORDER_merchantId || '').trim();
}

function orderBelongsToMerchant(order, merchantId, merchantName) {
    const expectedMerchantId = String(merchantId || '').trim();
    const assignedMerchantId = orderMerchantId(order);
    if (!expectedMerchantId) {
        return false;
    }

    if (assignedMerchantId) {
        return assignedMerchantId === expectedMerchantId;
    }

    const orderMerchantName = String(order?.merchant_name || order?.ORDER_merchantName || '').trim();
    const expectedMerchantName = String(merchantName || '').trim();
    return Boolean(
        expectedMerchantName
        && orderMerchantName === expectedMerchantName
        && isRegisteredSellerOrder(order)
    );
}

function adminStatusLabel(type, record) {
    if (type === 'customers') {
        return roleLower(record.USER_role) || 'customer';
    }

    if (type === 'riders') {
        return record.SHOP_employmentStatus || record.RIDER_employmentStatus || 'Pending';
    }

    if (type === 'sellers') {
        return record.MERCH_approvalStatus || 'Pending';
    }

    return 'Record';
}

function adminAccountTypeLabel(type) {
    if (type === 'customers') {
        return 'Customer';
    }

    if (type === 'riders') {
        return 'Rider';
    }

    if (type === 'sellers') {
        return 'Merchant';
    }

    return 'Account';
}

function adminAccountTitle(record, type) {
    if (type === 'customers') {
        return userFullName(record) || 'Customer account';
    }

    if (type === 'riders') {
        return riderFullName(record) || 'Rider account';
    }

    return record.MERCH_name || 'Merchant account';
}

function adminAccountEmail(record, type) {
    if (type === 'customers') {
        return record.USER_email || record.email || '';
    }

    if (type === 'riders') {
        return record.SHOP_email || record.RIDER_email || '';
    }

    return record.MERCH_ownerEmail || record.email || '';
}

function adminAccountPhone(record, type) {
    if (type === 'customers') {
        return record.USER_phone || record.phone || '';
    }

    if (type === 'riders') {
        return record.SHOP_phone || record.RIDER_phone || '';
    }

    return record.MERCH_phone || record.phone || '';
}

function adminAccountDetailText(record, type) {
    if (type === 'customers') {
        return record.USER_city || record.USER_preferredDeliveryTime || record.USER_status || 'Customer account';
    }

    if (type === 'riders') {
        return record.SHOP_vehicleType || record.RIDER_vehicleType || 'Vehicle not set';
    }

    return `${merchantOwnerName(record) || 'Owner not set'} / ${record.MERCH_type || 'Merchant type not set'} / Store ${merchantStoreStatusLabel(record)}`;
}

function adminAccountCollection(type) {
    return type === 'riders'
        ? collections.shopper
        : type === 'sellers'
            ? collections.merchant
            : collections.userAccount;
}

function adminVerificationProof(record, type) {
    if (type === 'riders') {
        return record.validIdUrl || record.licenseUrl || record.SHOP_validId || record.RIDER_validId || record.SHOP_license || record.RIDER_license || record.validId || record.license || '';
    }

    if (type === 'sellers') {
        return record.documentUrl || record.MERCH_businessProof || record.MERCH_businessPermit || record.MERCH_permit || record.businessProof || '';
    }

    return '';
}

function isUploadedDocumentPath(value) {
    const rawValue = String(value ?? '').trim();

    if (!rawValue) {
        return false;
    }

    const normalizedValue = rawValue.toLowerCase().replace(/[’]/g, "'");
    const emptyDocumentLabels = new Set([
        'valid id / driver\'s license',
        'valid id / drivers license',
        'business permit',
        'business permit / proof of merchant',
        'product image unavailable',
        'not provided',
        'n/a',
        'none',
        'null',
        'undefined'
    ]);

    if (emptyDocumentLabels.has(normalizedValue)) {
        return false;
    }

    if (/^data:image\//i.test(rawValue) || /^(https?:)?\/\//i.test(rawValue)) {
        return true;
    }

    if (/^(uploads?|assets?|images?)\//i.test(rawValue)) {
        return true;
    }

    return /[\\/.]/.test(rawValue) && /\.(png|jpe?g|gif|webp|bmp|svg|pdf)(?:[?#].*)?$/i.test(rawValue);
}

function adminFieldRow(label, value) {
    const cleanValue = String(value ?? '').trim();
    return `
        <div class="admin-detail-item">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(cleanValue || 'Not provided')}</strong>
        </div>
    `;
}

function adminDetailRows(record, type) {
    if (type === 'customers') {
        return [
            ['Customer ID', record.USER_linkedId || record.USER_id || record.id],
            ['Full Name', userFullName(record)],
            ['Email', adminAccountEmail(record, type)],
            ['Phone Number', adminAccountPhone(record, type)],
            ['Role', roleLower(record.USER_role) || 'customer'],
            ['Status', record.USER_status || 'Active'],
            ['Address', record.USER_address || record.CUST_address || record.address || ''],
            ['City', record.USER_city || record.CUST_city || ''],
            ['Preferred Delivery Time', record.USER_preferredDeliveryTime || record.CUST_preferredDeliveryTime || '']
        ].map(([label, value]) => adminFieldRow(label, value)).join('');
    }

    if (type === 'riders') {
        return [
            ['Rider ID', record.SHOP_id || record.RIDER_id || record.id],
            ['Full Name', riderFullName(record)],
            ['Email', adminAccountEmail(record, type)],
            ['Phone Number', adminAccountPhone(record, type)],
            ['Current Location', record.SHOP_currentLocation || record.RIDER_currentLocation || ''],
            ['Vehicle Type', record.SHOP_vehicleType || record.RIDER_vehicleType || ''],
            ['Max Active Orders', record.SHOP_maxActiveOrders || record.RIDER_maxActiveOrders || ''],
            ['Availability Status', record.SHOP_availabilityStatus || record.RIDER_availabilityStatus || ''],
            ['Employment Status', record.SHOP_employmentStatus || record.RIDER_employmentStatus || 'Pending']
        ].map(([label, value]) => adminFieldRow(label, value)).join('');
    }

    return [
        ['Merchant ID', record.MERCH_id || record.id],
        ['Merchant Name', record.MERCH_name],
        ['Owner Name', merchantOwnerName(record)],
        ['Owner Email', adminAccountEmail(record, type)],
        ['Phone Number', adminAccountPhone(record, type)],
        ['Merchant Type', record.MERCH_type],
        ['Business Address', cleanMerchantAddressValue(record.MERCH_address)],
        ['Business Hours', record.MERCH_businessHours],
        ['Available Days', normalizeMerchantAvailableDays(record.MERCH_availableDays || '')],
        ['Preparation Time', record.MERCH_preparationTime],
        ['Store Status', merchantStoreStatusLabel(record)],
        ['Approval Status', record.MERCH_approvalStatus || 'Pending']
    ].map(([label, value]) => adminFieldRow(label, value)).join('');
}

function adminProofSection(record, type) {
    const proof = String(adminVerificationProof(record, type) ?? '').trim();
    const label = type === 'riders' ? 'Valid ID / Driver\'s License' : 'Business Permit';
    const proofPath = isUploadedDocumentPath(proof) ? offlineImagePath(proof, proof) : '';

    if (!proofPath) {
        return `
            <section class="admin-proof-section">
                <h3>${escapeHtml(label)}</h3>
                <div class="empty-state">No uploaded ${escapeHtml(label.toLowerCase())} found.</div>
            </section>
        `;
    }

    return `
        <section class="admin-proof-section">
            <h3>${escapeHtml(label)}</h3>
            <a class="admin-proof-link" href="${escapeHtml(proofPath)}" target="_blank" rel="noopener">
                <img class="admin-proof-image" src="${escapeHtml(proofPath)}" alt="${escapeHtml(label)}">
                <span>Open uploaded document</span>
            </a>
        </section>
    `;
}


function trashActionContent(label) {
    const safeLabel = escapeHtml(label);
    return `
        <span class="trash-action-label">${safeLabel}</span>
        <span class="trash-action-icon" aria-hidden="true">
            <i class="trash-action-remove-icon" data-lucide="x" aria-hidden="true"></i>
            <i class="trash-action-check-icon" data-lucide="check" aria-hidden="true"></i>
        </span>
    `;
}

function adminFullDetailsTitle(type) {
    if (type === 'customers') {
        return 'Full Customer Details';
    }

    if (type === 'riders') {
        return 'Rider Full Details';
    }

    return 'Merchant Full Details';
}

function adminAccountFullDetails(record, type) {
    const title = adminAccountTitle(record, type);
    const status = adminStatusLabel(type, record);
    const label = adminAccountTypeLabel(type);
    const canApprove = (type === 'riders' && status === 'Pending') || (type === 'sellers' && status === 'Pending');
    const collectionName = adminAccountCollection(type);

    return `
        <article class="dashboard-card admin-full-details-card" data-admin-account-card="${escapeHtml(type)}" data-id="${escapeHtml(record.id)}">
            <div class="dashboard-card-head admin-full-details-head">
                <div>
                    ${type !== 'customers' ? `<span class="status-pill">${escapeHtml(status)}</span>` : ''}
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(label)} account full details</p>
                </div>
                <button class="ghost-button" type="button" data-admin-back-accounts>
                    <i data-lucide="arrow-left" aria-hidden="true"></i> Back
                </button>
            </div>
            <div class="admin-detail-grid">
                ${adminDetailRows(record, type)}
            </div>
            ${type === 'riders' || type === 'sellers' ? adminProofSection(record, type) : ''}
            <div class="card-actions admin-full-detail-actions">
                ${canApprove ? `
                    <button class="primary-button" type="button" data-admin-open-approval="${escapeHtml(collectionName)}" data-id="${escapeHtml(record.id)}" data-account-type="${escapeHtml(type)}">
                        <i data-lucide="check" aria-hidden="true"></i> Review Approval
                    </button>
                ` : ''}
                <button class="ghost-button trash-action-button" type="button" data-admin-delete-account="${escapeHtml(type)}" data-id="${escapeHtml(record.id)}" aria-label="Delete account">
                    ${trashActionContent('Delete account')}
                </button>
            </div>
        </article>
    `;
}

function adminApprovalModalMarkup() {
    return `
        <div class="customer-order-modal-backdrop admin-approval-modal-backdrop" data-admin-approval-modal hidden aria-hidden="true">
            <section class="customer-order-modal admin-approval-modal" role="dialog" aria-modal="true" aria-labelledby="admin-approval-modal-title">
                <button class="customer-order-modal-close" type="button" data-admin-approval-close aria-label="Close approval review">
                    <i data-lucide="x" aria-hidden="true"></i>
                </button>
                <div class="customer-order-modal-content" data-admin-approval-modal-content></div>
            </section>
        </div>
    `;
}

function ensureAdminApprovalModal(root) {
    let modal = $('[data-admin-approval-modal]', root);
    if (modal) {
        return modal;
    }

    root.insertAdjacentHTML('beforeend', adminApprovalModalMarkup());
    modal = $('[data-admin-approval-modal]', root);
    refreshIcons();
    return modal;
}

function adminApprovalModalContent(record, type) {
    const title = type === 'riders' ? 'Full Details of Rider' : 'Full Details of Merchant';
    const proofTitle = type === 'riders' ? 'Valid ID / Driver\'s License' : 'Business Permit';
    const collectionName = adminAccountCollection(type);

    return `
        <div class="customer-order-modal-head admin-approval-head">
            <div>
                <span class="status-pill">Pending</span>
                <h2 id="admin-approval-modal-title">${escapeHtml(title)}</h2>
                <p>Review the account information and ${escapeHtml(proofTitle)} before approving.</p>
            </div>
        </div>
        <section class="customer-order-modal-section">
            <h3>Account Information</h3>
            <div class="admin-detail-grid">
                ${adminDetailRows(record, type)}
            </div>
        </section>
        ${adminProofSection(record, type)}
        <div class="customer-order-modal-actions admin-approval-actions">
            <button class="primary-button" type="button" data-admin-confirm-approval="${escapeHtml(collectionName)}" data-id="${escapeHtml(record.id)}" data-account-type="${escapeHtml(type)}">
                <i data-lucide="check" aria-hidden="true"></i> Confirm Approval
            </button>
            <button class="ghost-button" type="button" data-admin-reject-approval="${escapeHtml(collectionName)}" data-id="${escapeHtml(record.id)}" data-account-type="${escapeHtml(type)}">
                <i data-lucide="x" aria-hidden="true"></i> Reject Approval
            </button>
        </div>
    `;
}

function openAdminApprovalModal(root, record, type) {
    const modal = ensureAdminApprovalModal(root);
    const content = $('[data-admin-approval-modal-content]', modal);
    if (!content) {
        return;
    }

    content.innerHTML = adminApprovalModalContent(record, type);
    modal.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body?.classList.add('has-open-customer-order-modal');
    refreshIcons();
    applyCurrentLanguage();
    requestAnimationFrame(() => {
        $('[data-admin-confirm-approval]', modal)?.focus({ preventScroll: true });
    });
}

function closeAdminApprovalModal(root) {
    const modal = $('[data-admin-approval-modal]', root);
    if (!modal) {
        return;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body?.classList.remove('has-open-customer-order-modal');
    setTimeout(() => {
        modal.hidden = true;
    }, 180);
}

async function setAdminApprovalStatus(collectionName, id, approved) {
    if (!id) {
        return;
    }

    const status = approved ? 'approved' : 'rejected';
    const timestamp = firebaseServerTimestamp();

    if (collectionName === collections.shopper || collectionName === 'riders') {
        await firebaseSetDoc(firebaseRoleDoc('rider', id), {
            approvalStatus: status,
            availabilityStatus: approved ? 'Available' : 'Unavailable',
            SHOP_employmentStatus: approved ? 'Active' : 'Inactive',
            updatedAt: timestamp
        }, { merge: true });
        await firebaseSetDoc(firebaseUserDoc(id), {
            role: 'rider',
            status,
            updatedAt: timestamp
        }, { merge: true });
        return;
    }

    if (collectionName === collections.merchant || collectionName === 'merchants') {
        await firebaseSetDoc(firebaseRoleDoc('seller', id), {
            approvalStatus: status,
            storeStatus: approved ? 'Open' : 'Closed',
            updatedAt: timestamp
        }, { merge: true });
        await firebaseSetDoc(firebaseUserDoc(id), {
            role: 'merchant',
            status,
            updatedAt: timestamp
        }, { merge: true });
    }
}


function adminAccountCard(record, type) {
    const status = adminStatusLabel(type, record);
    const title = adminAccountTitle(record, type);
    const detail = adminAccountDetailText(record, type);
    const isPendingApproval = (type === 'riders' && status === 'Pending') || (type === 'sellers' && status === 'Pending');
    const collectionName = adminAccountCollection(type);
    const accountLabel = adminAccountTypeLabel(type).toUpperCase();

    return `
        <article class="dashboard-card" data-admin-account-card="${escapeHtml(type)}" data-id="${escapeHtml(record.id)}">
            <div class="dashboard-card-head">
                <div>
                    ${type !== 'customers' ? `<span class="status-pill">${escapeHtml(status)}</span>` : ''}
                    <h3>${escapeHtml(title)}</h3>
                </div>
                <small>${escapeHtml(accountLabel)}</small>
            </div>
            <p>${escapeHtml(detail)}</p>
            <div class="card-actions">
                ${!isPendingApproval ? `
                    <button class="ghost-button" type="button" data-admin-view-details="${escapeHtml(type)}" data-id="${escapeHtml(record.id)}">
                        <i data-lucide="eye" aria-hidden="true"></i> View Details
                    </button>
                ` : ''}
                ${isPendingApproval ? `
                    <button class="primary-button" type="button" data-admin-open-approval="${escapeHtml(collectionName)}" data-id="${escapeHtml(record.id)}" data-account-type="${escapeHtml(type)}">
                        <i data-lucide="check" aria-hidden="true"></i> Approve
                    </button>
                    <button class="ghost-button" type="button" data-admin-reject="${escapeHtml(collectionName)}" data-id="${escapeHtml(record.id)}">
                        <i data-lucide="x" aria-hidden="true"></i> Reject
                    </button>
                ` : ''}
            </div>
        </article>
    `;
}

function adminIssueDate(value) {
    if (!value) {
        return 'No date recorded';
    }

    const date = value?.toDate
        ? value.toDate()
        : value?.seconds
            ? new Date(value.seconds * 1000)
            : new Date(value);

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return 'No date recorded';
    }

    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function adminRatingStars(score) {
    const value = Math.max(0, Math.min(5, Number(score) || 0));

    return `
        <span class="admin-rating-stars" aria-label="${escapeHtml(value)}/5 rating">
            ${[1, 2, 3, 4, 5].map((star) => `<span class="${star <= value ? 'is-filled' : ''}" aria-hidden="true">★</span>`).join('')}
        </span>
    `;
}

function adminIssueCard(record, type) {
    const isRefund = type === 'refund';
    const orderId = record.ORDER_id || record.order_id || 'No order linked';

    if (isRefund) {
        const status = record.REFUND_status || record.status || 'Refund';
        const amount = record.REFUND_amount || record.amount || 0;
        const reason = record.REFUND_reason || record.reason || 'No refund reason provided.';
        const date = adminIssueDate(record.REFUND_date || record.createdAt || record.updatedAt);

        return `
            <article class="dashboard-card admin-issue-card admin-refund-card">
                <div class="dashboard-card-head admin-issue-head">
                    <div>
                        <span class="status-pill admin-refund-pill">${escapeHtml(status)}</span>
                        <h3>Refund ${escapeHtml(record.id)}</h3>
                        <p class="admin-issue-subtitle">Refund request connected to order ${escapeHtml(orderId)}.</p>
                    </div>
                    <small>REFUND</small>
                </div>
                <div class="admin-issue-meta-grid">
                    <div><span>Order ID</span><strong>${escapeHtml(orderId)}</strong></div>
                    <div><span>Amount</span><strong>${formatMoney(amount)}</strong></div>
                    <div><span>Date</span><strong>${escapeHtml(date)}</strong></div>
                    <div><span>Status</span><strong>${escapeHtml(status)}</strong></div>
                </div>
                <div class="admin-issue-comment">
                    <span>Refund Reason</span>
                    <p>${escapeHtml(reason)}</p>
                </div>
            </article>
        `;
    }

    const serviceScore = Number(record.RATE_serviceScore || record.serviceScore || 5);
    const shopperScore = Number(record.RATE_shopperScore || record.shopperScore || 5);
    const comment = record.RATE_feedbackComment || record.comment || 'No rating comment provided.';
    const customerId = record.CUST_id || record.customer_id || 'No customer linked';
    const shopperId = record.SHOP_id || record.shopper_id || 'No rider linked';
    const date = adminIssueDate(record.RATE_date || record.createdAt || record.updatedAt);

    return `
        <article class="dashboard-card admin-issue-card admin-rating-card" data-admin-rating-card data-id="${escapeHtml(record.id)}">
            <div class="dashboard-card-head admin-issue-head">
                <div>
                    <span class="status-pill admin-rating-pill"><i data-lucide="star" aria-hidden="true"></i> Rating</span>
                    <h3>Rating ${escapeHtml(record.id)}</h3>
                    <p class="admin-issue-subtitle">Customer feedback connected to order ${escapeHtml(orderId)}.</p>
                </div>
                <small>RATING</small>
            </div>
            <div class="admin-rating-score-panel">
                <div>
                    <span>Service</span>
                    ${adminRatingStars(serviceScore)}
                    <strong>${escapeHtml(serviceScore)}/5</strong>
                </div>
                <div>
                    <span>Rider</span>
                    ${adminRatingStars(shopperScore)}
                    <strong>${escapeHtml(shopperScore)}/5</strong>
                </div>
            </div>
            <div class="admin-issue-meta-grid">
                <div><span>Order ID</span><strong>${escapeHtml(orderId)}</strong></div>
                <div><span>Customer ID</span><strong>${escapeHtml(customerId)}</strong></div>
                <div><span>Rider ID</span><strong>${escapeHtml(shopperId)}</strong></div>
                <div><span>Date</span><strong>${escapeHtml(date)}</strong></div>
            </div>
            <div class="admin-issue-comment">
                <span>Customer Comment</span>
                <p>${escapeHtml(comment)}</p>
            </div>
            <div class="card-actions admin-issue-actions">
                <button class="ghost-button trash-action-button" type="button" data-admin-remove-rating="${escapeHtml(record.id)}" aria-label="Remove Rating">
                    ${trashActionContent('Remove Rating')}
                </button>
            </div>
        </article>
    `;
}

async function safeDeleteRecord(collectionName, id) {
    if (!id) {
        return;
    }

    await deleteDoc(docRef(collectionName, id));
}

async function markAdminAccountDeleted(email, role, details = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        return;
    }
    if (roleLower(role) !== 'customer') {
        return;
    }

    const existing = await findFirstByField(collections.userAccount, 'USER_email', normalizedEmail);
    const userId = existing?.USER_linkedId
        || existing?.USER_id
        || existing?.id
        || details.linkedId
        || userAccountDocId(normalizedEmail);
    const marker = {
        USER_id: userId,
        USER_email: normalizedEmail,
        USER_password: 'deleted-account',
        USER_role: role,
        USER_status: 'Deleted',
        USER_linkedId: details.linkedId || existing?.USER_linkedId || '',
        USER_firstName: details.firstName || existing?.USER_firstName || '',
        USER_lastName: details.lastName || existing?.USER_lastName || '',
        USER_phone: details.phone || existing?.USER_phone || '',
        updatedAt: serverTimestamp()
    };

    await setDoc(docRef(collections.userAccount, userId), marker, { merge: true });
}

async function deleteAdminAccount(type, record) {
    const uid = record?.id || record?.USER_linkedId || record?.USER_id || record?.MERCH_id || record?.SHOP_id || record?.RIDER_id || '';
    if (!uid) {
        return;
    }

    if (type === 'customers') {
        await firebaseSetDoc(firebaseUserDoc(uid), {
            role: 'customer',
            status: 'deleted',
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
        await firebaseDeleteDoc(firebaseRoleDoc('customer', uid)).catch(() => {});
        return;
    }

    if (type === 'riders') {
        await firebaseSetDoc(firebaseUserDoc(uid), {
            role: 'rider',
            status: 'deleted',
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
        await firebaseDeleteDoc(firebaseRoleDoc('rider', uid)).catch(() => {});
        return;
    }

    if (type === 'sellers') {
        const products = await readFirestoreProducts(1000);
        await Promise.all(products
            .filter((product) => productRecordMerchantId(product) === uid)
            .map((product) => deleteFirestoreProduct(productRecordId(product))));
        await firebaseSetDoc(firebaseUserDoc(uid), {
            role: 'merchant',
            status: 'deleted',
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
        await firebaseDeleteDoc(firebaseRoleDoc('seller', uid)).catch(() => {});
    }
}


async function deleteOrderEverywhere(order) {
    const orderId = order.id || order.orderId || order.order_id || order.ORDER_id;
    if (!orderId) {
        return;
    }

    await deleteFirestoreOrder(orderId);
}

function showAdminRemoveOrderPrompt(root, order, trigger) {
    removeInlineConfirms(root, '[data-admin-remove-order-confirm-panel]');
    const card = trigger.closest('[data-order-card]') || trigger.closest('.dashboard-card');
    if (!card) {
        return;
    }

    const panel = document.createElement('div');
    panel.className = 'inline-confirm';
    panel.dataset.adminRemoveOrderConfirmPanel = 'true';
    panel.innerHTML = `
        <strong>Remove this order?</strong>
        <p>Order ${escapeHtml(order.order_id || order.id)} will be removed from admin, rider, merchant, and customer views.</p>
        <div class="confirm-actions">
            <button class="primary-button trash-action-button" type="button" data-admin-remove-order-confirm="${escapeHtml(order.id)}" aria-label="Remove Order">
                ${trashActionContent('Remove Order')}
            </button>
            <button class="ghost-button" type="button" data-admin-remove-order-dismiss>
                <i data-lucide="x" aria-hidden="true"></i> Keep order
            </button>
        </div>
    `;
    card.append(panel);
    refreshIcons();
    applyCurrentLanguage();
}

function showAdminRemoveRatingPrompt(root, rating, trigger) {
    removeInlineConfirms(root, '[data-admin-remove-rating-confirm-panel]');
    const card = trigger.closest('[data-admin-rating-card]') || trigger.closest('.dashboard-card');
    if (!card) {
        return;
    }

    const orderId = rating.ORDER_id || rating.order_id || 'this order';
    const panel = document.createElement('div');
    panel.className = 'inline-confirm admin-rating-remove-confirm';
    panel.dataset.adminRemoveRatingConfirmPanel = 'true';
    panel.innerHTML = `
        <strong>Remove this rating?</strong>
        <p>Rating ${escapeHtml(rating.id)} for order ${escapeHtml(orderId)} will be removed from admin records.</p>
        <div class="confirm-actions">
            <button class="primary-button trash-action-button" type="button" data-admin-remove-rating-confirm="${escapeHtml(rating.id)}" aria-label="Remove Rating">
                ${trashActionContent('Remove Rating')}
            </button>
            <button class="ghost-button" type="button" data-admin-remove-rating-dismiss>
                <i data-lucide="x" aria-hidden="true"></i> Keep rating
            </button>
        </div>
    `;
    card.append(panel);
    refreshIcons();
    applyCurrentLanguage();
}

function showAdminDeletePrompt(root, type, record, trigger) {
    removeInlineConfirms(root, '[data-admin-delete-confirm-panel]');
    const card = trigger.closest('[data-admin-account-card]') || trigger.closest('.dashboard-card');
    if (!card) {
        return;
    }

    const name = type === 'customers'
        ? userFullName(record) || record.USER_email || 'this customer'
        : type === 'riders'
            ? riderFullName(record) || record.SHOP_email || 'this rider'
            : record.MERCH_name || record.MERCH_ownerEmail || 'this merchant';
    const panel = document.createElement('div');
    panel.className = 'inline-confirm';
    panel.dataset.adminDeleteConfirmPanel = 'true';
    panel.innerHTML = `
        <strong>Delete ${escapeHtml(name)}?</strong>
        <p>This removes the account from the admin records.</p>
        <div class="confirm-actions">
            <button class="primary-button trash-action-button" type="button" data-admin-delete-confirm="${escapeHtml(type)}" data-id="${escapeHtml(record.id)}" aria-label="Delete account">
                ${trashActionContent('Delete account')}
            </button>
            <button class="ghost-button" type="button" data-admin-delete-dismiss>
                <i data-lucide="x" aria-hidden="true"></i> Keep account
            </button>
        </div>
    `;
    card.append(panel);
    refreshIcons();
    applyCurrentLanguage();
}

function initAdminDashboard() {
    const root = $('[data-admin-dashboard]');
    if (!root) {
        return;
    }

    const account = getCurrentAccount();
    if (!isCurrentAdminAccount(account)) {
        enforceProtectedPageAccess({ replace: true });
        return;
    }

    const tabs = $$('[data-admin-tab]', root);
    const viewTitle = $('[data-admin-view-title]', root);
    const viewList = $('[data-admin-view-list]', root);
    const viewHeading = viewTitle?.closest('.dashboard-heading');
    const adminNotice = $('[data-admin-notice]', root);
    const statOrders = $('[data-stat-orders]', root);
    const statCustomers = $('[data-stat-customers]', root);
    const statRiders = $('[data-stat-riders]', root);
    const statSellers = $('[data-stat-sellers]', root);
    const statIssues = $('[data-stat-issues]', root);
    const initialAdminView = ['customers', 'riders', 'sellers', 'issues', 'orders'].includes(location.hash.slice(1))
        ? location.hash.slice(1)
        : 'customers';
    const adminState = {
        activeView: initialAdminView,
        orders: [],
        users: [],
        customerProfiles: [],
        merchantProfiles: [],
        riderProfiles: [],
        customers: [],
        riders: [],
        sellers: [],
        ratings: [],
        refunds: [],
        detailView: null
    };
    const viewTitles = {
        customers: 'Customer Accounts',
        riders: 'Rider Accounts',
        sellers: 'Merchant Accounts',
        issues: 'Ratings/Refunds',
        orders: 'Order Logs'
    };
    const customerProfileRepairIds = new Set();

    function playAdminSidebarSlide() {
        [viewHeading, viewList].forEach((node) => {
            if (!node) {
                return;
            }
            node.classList.remove('is-sidebar-slide');
            void node.offsetWidth;
            node.classList.add('is-sidebar-slide');
        });
    }

    function syncFirestoreAdminAccounts() {
        const combined = combineFirestoreAdminAccounts(
            adminState.users,
            adminState.customerProfiles,
            adminState.merchantProfiles,
            adminState.riderProfiles
        );
        adminState.customers = combined.customers;
        adminState.sellers = combined.sellers;
        adminState.riders = combined.riders;

        adminState.users
            .filter((user) => adminUserRecordRole(user) === 'customer')
            .forEach((user) => {
                const customer = adminState.customerProfiles.find((record) => record.id === user.id) || {};
                if (!customerProfileNeedsAdminRepair(customer, user) || customerProfileRepairIds.has(user.id)) {
                    return;
                }

                customerProfileRepairIds.add(user.id);
                firebaseSetDoc(
                    firebaseRoleDoc('customer', user.id),
                    adminCustomerProfileRepairPayload(user.id, user, customer),
                    { merge: true }
                ).catch((error) => {
                    customerProfileRepairIds.delete(user.id);
                    console.error('Customer profile repair failed', error);
                });
            });
    }

    function accountRecords(type) {
        if (type === 'customers') {
            return adminState.customers.filter((record) => normalizedAccountRole(record.USER_role || record.role) === 'customer' && !isDeletedAccountRecord(record));
        }

        if (type === 'riders') {
            return adminState.riders.filter((record) => isRiderRecord(record) && !isDeletedAccountRecord(record));
        }

        if (type === 'sellers') {
            return adminState.sellers.filter((record) => isSellerAccountRecord(record) && !isDeletedAccountRecord(record));
        }

        return [];
    }

    function updateAdminStats() {
        statOrders.textContent = String(adminState.orders.length);
        statCustomers.textContent = String(accountRecords('customers').length);
        statRiders.textContent = String(accountRecords('riders').length);
        statSellers.textContent = String(accountRecords('sellers').length);
        statIssues.textContent = String(adminState.ratings.length + adminState.refunds.length);
    }

    function renderAdminView() {
        const isAccountView = ['customers', 'riders', 'sellers'].includes(adminState.activeView);
        let title = viewTitles[adminState.activeView] || viewTitles.orders;
        tabs.forEach((tab) => {
            const isActive = tab.dataset.adminTab === adminState.activeView;
            tab.classList.toggle('is-active', isActive);
            if (isActive) {
                tab.setAttribute('aria-current', 'page');
            } else {
                tab.removeAttribute('aria-current');
            }
        });

        if (isAccountView && adminState.detailView?.type === adminState.activeView) {
            const record = findAdminRecord(adminState.detailView.type, adminState.detailView.id);
            if (record) {
                title = adminFullDetailsTitle(adminState.detailView.type);
                viewTitle.textContent = title;
                viewList.classList.remove('admin-account-grid');
                viewList.innerHTML = adminAccountFullDetails(record, adminState.detailView.type);
                playAdminSidebarSlide();
                refreshIcons();
                applyCurrentLanguage();
                return;
            }
            adminState.detailView = null;
        }

        viewTitle.textContent = title;
        viewList.classList.toggle('admin-account-grid', isAccountView);
        viewList.classList.toggle('admin-issue-list', adminState.activeView === 'issues');

        if (adminState.activeView === 'orders') {
            viewList.innerHTML = adminState.orders.length === 0
                ? '<div class="empty-state">No order logs found.</div>'
                : adminState.orders.map((order) => orderCard(order, `
                    <div class="card-actions">
                        <button class="ghost-button trash-action-button" type="button" data-admin-remove-order="${escapeHtml(order.id)}" aria-label="Remove Order">
                            ${trashActionContent('Remove Order')}
                        </button>
                    </div>
                `)).join('');
        }

        if (isAccountView) {
            const records = accountRecords(adminState.activeView);
            viewList.innerHTML = records.length === 0
                ? `<div class="empty-state">No ${escapeHtml(title.toLowerCase())} found.</div>`
                : records.map((record) => adminAccountCard(record, adminState.activeView)).join('');
        }

        if (adminState.activeView === 'issues') {
            const issueCards = [
                ...adminState.ratings.map((record) => adminIssueCard(record, 'rating')),
                ...adminState.refunds.map((record) => adminIssueCard(record, 'refund'))
            ];
            viewList.innerHTML = issueCards.length === 0
                ? '<div class="empty-state">No ratings or refunds found.</div>'
                : issueCards.join('');
        }

        playAdminSidebarSlide();
        refreshIcons();
        applyCurrentLanguage();
    }

    function findAdminRecord(type, id) {
        if (type === 'customers') {
            return accountRecords('customers').find((record) => record.id === id);
        }

        if (type === 'riders') {
            return accountRecords('riders').find((record) => record.id === id);
        }

        if (type === 'sellers') {
            return accountRecords('sellers').find((record) => record.id === id);
        }

        return null;
    }

    function findAdminOrder(id) {
        return adminState.orders.find((record) => record.id === id || record.order_id === id || record.ORDER_id === id);
    }

    function findAdminRating(id) {
        return adminState.ratings.find((record) => record.id === id || record.RATE_id === id || record.rating_id === id);
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            adminState.activeView = tab.dataset.adminTab || 'customers';
            adminState.detailView = null;
            renderAdminView();
        });
    });

    listenFirestoreOrders((orders) => {
        adminState.orders = orders;
        updateAdminStats();
        if (adminState.activeView === 'orders') {
            renderAdminView();
        }
    });

    listenFirestoreCollectionRecords('users', (records) => {
        adminState.users = records;
        syncFirestoreAdminAccounts();
        updateAdminStats();
        if (['customers', 'riders', 'sellers'].includes(adminState.activeView)) {
            renderAdminView();
        }
    });

    listenFirestoreCollectionRecords('customers', (records) => {
        adminState.customerProfiles = records;
        syncFirestoreAdminAccounts();
        updateAdminStats();
        if (adminState.activeView === 'customers') {
            renderAdminView();
        }
    });

    listenFirestoreCollectionRecords('riders', (records) => {
        adminState.riderProfiles = records;
        syncFirestoreAdminAccounts();
        updateAdminStats();
        if (adminState.activeView === 'riders') {
            renderAdminView();
        }
    });

    listenFirestoreCollectionRecords('merchants', (records) => {
        adminState.merchantProfiles = records;
        syncFirestoreAdminAccounts();
        updateAdminStats();
        if (adminState.activeView === 'sellers') {
            renderAdminView();
        }
    });

    listenFirestoreRatings((records) => {
        adminState.ratings = records;
        updateAdminStats();
        if (adminState.activeView === 'issues') {
            renderAdminView();
        }
    });

    listenFirestoreRefunds((records) => {
        adminState.refunds = records;
        updateAdminStats();
        if (adminState.activeView === 'issues') {
            renderAdminView();
        }
    });

    renderAdminView();

    root.addEventListener('click', async (event) => {
        const deleteButton = event.target.closest('[data-admin-delete-account]');
        const deleteConfirmButton = event.target.closest('[data-admin-delete-confirm]');
        const deleteDismissButton = event.target.closest('[data-admin-delete-dismiss]');
        const removeOrderButton = event.target.closest('[data-admin-remove-order]');
        const removeOrderConfirmButton = event.target.closest('[data-admin-remove-order-confirm]');
        const removeOrderDismissButton = event.target.closest('[data-admin-remove-order-dismiss]');
        const removeRatingButton = event.target.closest('[data-admin-remove-rating]');
        const removeRatingConfirmButton = event.target.closest('[data-admin-remove-rating-confirm]');
        const removeRatingDismissButton = event.target.closest('[data-admin-remove-rating-dismiss]');
        const approveButton = event.target.closest('[data-admin-approve]');
        const rejectButton = event.target.closest('[data-admin-reject]');
        const viewDetailsButton = event.target.closest('[data-admin-view-details]');
        const backAccountsButton = event.target.closest('[data-admin-back-accounts]');
        const openApprovalButton = event.target.closest('[data-admin-open-approval]');
        const approvalCloseButton = event.target.closest('[data-admin-approval-close]');
        const confirmApprovalButton = event.target.closest('[data-admin-confirm-approval]');
        const rejectApprovalButton = event.target.closest('[data-admin-reject-approval]');
        const approvalModal = event.target.closest('[data-admin-approval-modal]');

        if (approvalCloseButton || (approvalModal && event.target === approvalModal)) {
            closeAdminApprovalModal(root);
            return;
        }

        if (backAccountsButton) {
            adminState.detailView = null;
            renderAdminView();
            return;
        }

        if (viewDetailsButton) {
            const type = viewDetailsButton.dataset.adminViewDetails;
            const record = findAdminRecord(type, viewDetailsButton.dataset.id);
            if (record) {
                adminState.activeView = type;
                adminState.detailView = { type, id: record.id };
                renderAdminView();
            }
            return;
        }

        if (openApprovalButton) {
            const type = openApprovalButton.dataset.accountType || adminState.activeView;
            const record = findAdminRecord(type, openApprovalButton.dataset.id);
            if (record) {
                openAdminApprovalModal(root, record, type);
            }
            return;
        }

        if (confirmApprovalButton || rejectApprovalButton) {
            const modalButton = confirmApprovalButton || rejectApprovalButton;
            const approved = Boolean(confirmApprovalButton);
            modalButton.disabled = true;
            modalButton.textContent = approved ? 'Approving...' : 'Rejecting...';
            try {
                await setAdminApprovalStatus(modalButton.dataset.adminConfirmApproval || modalButton.dataset.adminRejectApproval, modalButton.dataset.id, approved);
                closeAdminApprovalModal(root);
                setNotice(adminNotice, approved ? 'Account approved.' : 'Account rejected.');
            } catch (error) {
                setNotice(adminNotice, error.message || 'Approval status could not be saved.', true);
                modalButton.disabled = false;
                modalButton.textContent = approved ? 'Confirm Approval' : 'Reject Approval';
            }
            return;
        }

        if (removeOrderDismissButton) {
            removeOrderDismissButton.closest('[data-admin-remove-order-confirm-panel]')?.remove();
            return;
        }

        if (removeOrderButton) {
            const order = findAdminOrder(removeOrderButton.dataset.adminRemoveOrder);
            if (order) {
                showAdminRemoveOrderPrompt(root, order, removeOrderButton);
            }
            return;
        }

        if (removeOrderConfirmButton) {
            const order = findAdminOrder(removeOrderConfirmButton.dataset.adminRemoveOrderConfirm);
            if (!order) {
                return;
            }

            removeOrderConfirmButton.disabled = true;
            removeOrderConfirmButton.setAttribute('aria-busy', 'true');
            try {
                await deleteOrderEverywhere(order);
                setNotice(adminNotice, 'Order removed.');
            } catch (error) {
                setNotice(adminNotice, error.message || 'Order could not be removed.', true);
            }
            return;
        }

        if (removeRatingDismissButton) {
            removeRatingDismissButton.closest('[data-admin-remove-rating-confirm-panel]')?.remove();
            return;
        }

        if (removeRatingButton) {
            const rating = findAdminRating(removeRatingButton.dataset.adminRemoveRating);
            if (rating) {
                showAdminRemoveRatingPrompt(root, rating, removeRatingButton);
            }
            return;
        }

        if (removeRatingConfirmButton) {
            const rating = findAdminRating(removeRatingConfirmButton.dataset.adminRemoveRatingConfirm);
            if (!rating) {
                return;
            }

            removeRatingConfirmButton.disabled = true;
            removeRatingConfirmButton.setAttribute('aria-busy', 'true');
            try {
                await deleteFirestoreRating(rating.id);
                setNotice(adminNotice, 'Rating removed.');
            } catch (error) {
                setNotice(adminNotice, error.message || 'Rating could not be removed.', true);
            }
            return;
        }

        if (deleteDismissButton) {
            deleteDismissButton.closest('[data-admin-delete-confirm-panel]')?.remove();
            return;
        }

        if (deleteButton) {
            const type = deleteButton.dataset.adminDeleteAccount;
            const record = findAdminRecord(type, deleteButton.dataset.id);
            if (record) {
                showAdminDeletePrompt(root, type, record, deleteButton);
            }
            return;
        }

        if (deleteConfirmButton) {
            const type = deleteConfirmButton.dataset.adminDeleteConfirm;
            const record = findAdminRecord(type, deleteConfirmButton.dataset.id);
            if (!record) {
                return;
            }

            deleteConfirmButton.disabled = true;
            deleteConfirmButton.setAttribute('aria-busy', 'true');
            try {
                await deleteAdminAccount(type, record);
                setNotice(adminNotice, 'Account deleted.');
            } catch (error) {
                setNotice(adminNotice, error.message || 'Account could not be deleted.', true);
            }
            return;
        }

        const button = approveButton || rejectButton;
        if (!button) {
            return;
        }

        const collectionName = approveButton ? approveButton.dataset.adminApprove : rejectButton.dataset.adminReject;
        const id = button.dataset.id;
        const approved = Boolean(approveButton);

        button.disabled = true;
        button.textContent = approved ? 'Approving...' : 'Rejecting...';

        try {
            await setAdminApprovalStatus(collectionName, id, approved);
            setNotice(adminNotice, approved ? 'Account approved.' : 'Account rejected.');
        } catch (error) {
            setNotice(adminNotice, error.message || 'Approval status could not be saved.', true);
            button.disabled = false;
            button.textContent = approved ? 'Approve' : 'Reject';
        }
    });
}

function applicationStatusConfig(role, data, user = {}) {
    if (role === 'seller') {
        const status = recordApprovalStatus(data.approvalStatus || data.MERCH_approvalStatus, user.status, 'Approved', 'Rejected', 'Pending');
        return {
            status,
            name: data.storeName || data.MERCH_name || 'Merchant application',
            displayName: user.username || merchantOwnerName(data) || data.storeName || data.MERCH_name || 'Merchant',
            email: user.email || data.MERCH_ownerEmail || '',
            pending: 'Your merchant application is pending admin approval.',
            approved: 'Your application has been approved.',
            rejected: 'Your application has been rejected.',
            dashboard: 'seller-dashboard.html'
        };
    }

    const status = recordApprovalStatus(data.approvalStatus || data.SHOP_employmentStatus, user.status, 'Active', 'Inactive', 'Pending');
    return {
        status,
        name: data.fullName || riderFullName(data) || 'Rider application',
        displayName: user.username || data.fullName || riderFullName(data) || 'Rider',
        email: user.email || data.SHOP_email || '',
        pending: 'Your rider application is pending admin approval.',
        approved: 'Your application has been approved.',
        rejected: 'Your application has been rejected.',
        dashboard: 'rider-dashboard.html'
    };
}

function initApplicationStatus() {
    const root = $('[data-application-status]');
    if (!root) {
        return;
    }

    const params = new URLSearchParams(location.search);
    const account = getCurrentAccount();
    const role = normalizedAccountRole(params.get('role') || accountRole(account) || '');
    const id = params.get('id')
        || accountLinkedId(account)
        || '';
    const title = $('[data-status-title]', root);
    const message = $('[data-status-message]', root);
    const details = $('[data-status-details]', root);
    const actions = $('[data-status-actions]', root);
    const sessionApplicationId = role === 'seller'
        ? readLocal(storageKeys.sellerApplication)
        : readLocal(storageKeys.riderApplication);
    const accountMatchesApplication = account && accountRole(account) === role && accountLinkedId(account) === id;
    const sessionMatchesApplication = sessionApplicationId === id;

    if (!['seller', 'rider'].includes(role) || !id) {
        title.textContent = 'No application selected.';
        message.textContent = 'Submit a merchant or rider application first.';
        details.innerHTML = '<div class="empty-state">No merchant or rider application ID was found on this browser.</div>';
        return;
    }

    if (!accountMatchesApplication && !sessionMatchesApplication) {
        location.href = 'index.html?modal=signin';
        return;
    }

    firebaseOnSnapshot(firebaseRoleDoc(role, id), async (snapshot) => {
        if (!snapshot.exists()) {
            title.textContent = 'Application not found.';
            message.textContent = 'The application record does not exist.';
            details.innerHTML = '<div class="empty-state">No matching application record.</div>';
            return;
        }

        const data = snapshot.data();
        const userSnapshot = await firebaseGetDoc(firebaseUserDoc(id)).catch(() => null);
        const userData = userSnapshot?.exists?.() ? userSnapshot.data() : {};
        const user = {
            ...userData,
            role: userData.role || (role === 'seller' ? 'merchant' : 'rider'),
            email: userData.email || accountEmail(account)
        };
        const config = applicationStatusConfig(role, data, user);
        const isApproved = role === 'seller'
            ? config.status === 'Approved'
            : config.status === 'Active';
        const isRejected = role === 'seller'
            ? config.status === 'Rejected'
            : config.status === 'Inactive';

        title.textContent = config.name;

        if (isApproved) {
            message.textContent = config.approved;
            if (accountMatchesApplication) {
                const nextAccount = buildAccountFromFirebaseRecords(id, config.email, user, data);
                setCurrentAccount(nextAccount);
                saveRoleStorageForAccount(nextAccount);
            }
            actions.innerHTML = `
                ${accountMatchesApplication ? `<a class="primary-button" href="${config.dashboard}"><i data-lucide="layout-dashboard" aria-hidden="true"></i> Open dashboard</a>` : '<a class="primary-button" href="index.html?modal=signin" data-account-modal-trigger="signin"><i data-lucide="log-in" aria-hidden="true"></i> Sign in to approved account</a>'}
                <a class="ghost-button" href="index.html"><i data-lucide="home" aria-hidden="true"></i> Start page</a>
            `;
        } else if (isRejected) {
            message.textContent = config.rejected;
            if (accountMatchesApplication) {
                const nextAccount = buildAccountFromFirebaseRecords(id, config.email, user, data);
                setCurrentAccount(nextAccount);
                saveRoleStorageForAccount(nextAccount);
            }
            actions.innerHTML = '<a class="ghost-button" href="index.html"><i data-lucide="home" aria-hidden="true"></i> Start page</a>';
        } else {
            message.textContent = config.pending;
            if (accountMatchesApplication) {
                const nextAccount = buildAccountFromFirebaseRecords(id, config.email, user, data);
                setCurrentAccount(nextAccount);
                saveRoleStorageForAccount(nextAccount);
            }
            actions.innerHTML = '<a class="ghost-button" href="index.html"><i data-lucide="home" aria-hidden="true"></i> Start page</a>';
        }

        details.innerHTML = `
            <article class="dashboard-card">
                <div class="dashboard-card-head">
                    <div>
                        <span class="status-pill">${escapeHtml(config.status)}</span>
                        <h3>${escapeHtml(config.name)}</h3>
                    </div>
                    <small>${escapeHtml(role === 'seller' ? 'MERCHANT' : role.toUpperCase())}</small>
                </div>
                <p>${escapeHtml(config.email)}</p>
            </article>
        `;
        initAuthChrome();
        refreshIcons();
        applyCurrentLanguage();
    });
}

function updateAccountLinks() {
    const account = getCurrentAccount();
    const profileLink = $('[data-more-profile-link]');
    const settingsLink = $('[data-more-settings-link]');
    const logoutButton = $('[data-more-logout]');

    if (profileLink) {
        profileLink.hidden = !account;
        if (accountRole(account) === 'customer' || isSellerApproved(account) || isRiderActive(account) || accountRole(account) === 'admin') {
            profileLink.href = '#profile';
            profileLink.setAttribute('data-account-modal-trigger', 'profile');
        } else {
            profileLink.href = account ? dashboardForAccount(account) : 'index.html?modal=signin';
            profileLink.removeAttribute('data-account-modal-trigger');
        }
        profileLink.innerHTML = '<i data-lucide="user" aria-hidden="true"></i> Profile';
    }

    if (settingsLink) {
        settingsLink.href = '#settings';
        settingsLink.setAttribute('data-guest-settings-trigger', '');
        settingsLink.innerHTML = '<i data-lucide="languages" aria-hidden="true"></i> Language';
    }

    if (logoutButton) {
        logoutButton.hidden = !account;
    }
}

function renderAuthChrome(account) {
    syncAccountRoleClass(account);

    $$('[data-auth-guest]').forEach((node) => {
        node.hidden = Boolean(account);
    });

    $$('[data-auth-user]').forEach((node) => {
        node.hidden = !account;
        node.textContent = account ? accountLabel(account) : '';
    });

    $$('[data-auth-dashboard]').forEach((node) => {
        const role = accountRole(account);
        node.hidden = !account;
        if (!account) {
            return;
        }

        node.href = dashboardForAccount(account);
        if (role === 'admin') {
            node.innerHTML = '<i data-lucide="shield-check" aria-hidden="true"></i> Admin Dashboard';
        } else if (role === 'seller') {
            node.innerHTML = account?.MERCH_approvalStatus === 'Approved'
                ? '<i data-lucide="store" aria-hidden="true"></i> Merchant Dashboard'
                : '<i data-lucide="hourglass" aria-hidden="true"></i> Merchant Application Status';
        } else if (role === 'rider') {
            node.innerHTML = account?.SHOP_employmentStatus === 'Active'
                ? '<i data-lucide="bike" aria-hidden="true"></i> Rider Dashboard'
                : '<i data-lucide="hourglass" aria-hidden="true"></i> Rider Application Status';
        } else {
            node.innerHTML = '<i data-lucide="layout-dashboard" aria-hidden="true"></i> Dashboard';
        }
    });

    $$('[data-nav-dashboard]').forEach((node) => {
        node.hidden = !account;
        node.href = account ? dashboardForAccount(account) : 'index.html?modal=signin';
    });

    $$('[data-customer-shop]').forEach((node) => {
        const role = accountRole(account);
        node.hidden = Boolean(account) && role !== 'customer';
    });

    $$('[data-shopping-only]').forEach((node) => {
        const role = accountRole(account);
        node.hidden = Boolean(account) && role !== 'customer';
    });

    $$('[data-seller-hidden]').forEach((node) => {
        node.hidden = accountRole(account) === 'seller';
    });

    updateAccountLinks();
    if (readPreference(storageKeys.language, 'english') !== 'english') {
        translatePage();
    }
    refreshIcons();
}

function initAuthChrome() {
    const account = getCurrentAccount();
    renderAuthChrome(account);

    if (account && (!storedAccountName(account) || (accountRole(account) === 'customer' && !account.USER_phone))) {
        hydrateCurrentAccount(account)
            .then((hydratedAccount) => renderAuthChrome(hydratedAccount))
            .catch(() => {});
    }
}

function syncAuthStateAfterHistoryRestore({ replace = false } = {}) {
    const account = getCurrentAccount();
    renderAuthChrome(account);
    enforceProtectedPageAccess({ replace });
}

function initBackForwardAuthGuard() {
    if (document.documentElement.dataset.historyAuthGuardBound === 'true') {
        return;
    }

    document.documentElement.dataset.historyAuthGuardBound = 'true';

    window.addEventListener('pageshow', (event) => {
        syncAuthStateAfterHistoryRestore({ replace: Boolean(event.persisted) });
    });

    window.addEventListener('storage', (event) => {
        if (event.key === storageKeys.account) {
            syncAuthStateAfterHistoryRestore({ replace: true });
        }
    });
}

function closeMoreMenu() {
    const moreMenu = $('[data-more-menu]');
    const moreToggle = $('[data-more-toggle]');
    if (moreMenu && moreToggle) {
        moreMenu.hidden = true;
        moreToggle.setAttribute('aria-expanded', 'false');
    }
}

function initAccountModals() {
    if (!$('[data-account-modal]')) {
        return;
    }

    let backdropPointerStarted = false;

    document.addEventListener('pointerdown', (event) => {
        const backdrop = event.target.closest('[data-account-modal]');
        backdropPointerStarted = Boolean(backdrop && event.target === backdrop);
    });

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-account-modal-trigger]');
        if (trigger) {
            const opened = openAccountModal(trigger.dataset.accountModalTrigger, {
                profileFocus: trigger.dataset.profileFocus || ''
            });
            if (opened) {
                event.preventDefault();
                closeMoreMenu();
            }
            return;
        }

        if (event.target.closest('[data-account-modal-close]')) {
            closeAccountModals();
            return;
        }

        const backdrop = event.target.closest('[data-account-modal]');
        if (backdrop && event.target === backdrop && backdropPointerStarted) {
            closeAccountModals();
        }
        backdropPointerStarted = false;
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && $('[data-account-modal].is-open')) {
            closeAccountModals();
        }
    });

    window.addEventListener('honestbee:open-account-modal', (event) => {
        openAccountModal(event.detail);
    });

    const params = new URLSearchParams(location.search);
    const modalName = params.get('modal') || params.get('auth');
    if (modalName) {
        openAccountModal(modalName);
        if (normalizeAccountModalName(modalName) === 'signin') {
            const noticeMessage = signInNoticeMessage(params.get('notice'));
            if (noticeMessage) {
                setSignInNotice(noticeMessage, params.get('notice') === 'pending-approval');
            }
        }
    }
}

function settingsTriggerPointsToSettings(trigger) {
    const href = trigger.getAttribute('href') || '';
    return trigger.matches('[data-guest-settings-trigger], [data-more-settings-link]')
        || /(^|\/)settings\.html(?:[?#].*)?$/.test(href);
}

function initGuestSettingsDrawer() {
    const modal = $('[data-account-modal="settings"]');
    if (!modal) {
        return;
    }

    initWebsiteSettings(modal);

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-guest-settings-trigger], [data-more-settings-link], a[href]');
        if (!trigger || !settingsTriggerPointsToSettings(trigger)) {
            return;
        }

        event.preventDefault();
        closeMoreMenu();
        openAccountModal('settings');
    });
}

function initMoreMenu() {
    const toggle = $('[data-more-toggle]');
    const menu = $('[data-more-menu]');
    if (!toggle || !menu) {
        return;
    }

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const nextOpen = menu.hidden;
        menu.hidden = !nextOpen;
        toggle.setAttribute('aria-expanded', String(nextOpen));
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-more-menu]') && !event.target.closest('[data-more-toggle]')) {
            closeMoreMenu();
        }
    });
}

function setSettingField(section, field, value) {
    $$(`[data-account-field="${field}"]`, section).forEach((input) => {
        if (input.tagName === 'SELECT') {
            const normalizedValue = field === 'storeStatus' ? normalizeMerchantStoreStatus(value) : value;
            const option = [...input.options].find((item) => item.value === normalizedValue || item.textContent === normalizedValue);
            if (option) {
                input.value = option.value;
            }
            return;
        }

        if (input.classList?.contains('day-selector')) {
            const selectedDays = normalizeMerchantAvailableDays(value).split(',').map((day) => day.trim());
            $$('input[type="checkbox"]', input).forEach((checkbox) => {
                checkbox.checked = selectedDays.includes(checkbox.value);
            });
            return;
        }

        const isAddressLikeField = field === 'storeAddress' || field === 'currentLocation';
        input.value = field === 'storeAddress' ? cleanMerchantAddressValue(value) : (value || '');
        if (isAddressLikeField) {
            const pickerField = input.closest?.('[data-address-picker-field]');
            const emptyPreview = field === 'currentLocation'
                ? 'Choose your current rider location in Cebu.'
                : 'Choose your real store address in Cebu.';
            if (pickerField && input.value) {
                fillAddressPickerField(pickerField, parseCebuAddress(input.value));
            } else if (pickerField) {
                const partsInput = $('[data-address-parts]', pickerField);
                const preview = $('[data-address-preview]', pickerField);
                if (partsInput) {
                    partsInput.value = '';
                }
                if (preview) {
                    preview.textContent = emptyPreview;
                }
            }
        }
    });
}

function settingFieldValue(section, field) {
    const input = $(`[data-account-field="${field}"]`, section);
    if (!input) {
        return '';
    }

    if (input.classList?.contains('day-selector')) {
        return $$('input[type="checkbox"]:checked', input)
            .map((checkbox) => checkbox.value)
            .join(', ');
    }

    return input.value?.trim() || '';
}

function passwordFieldValue(section, field) {
    return $(`[data-password-field="${field}"]`, section)?.value || '';
}

function clearPasswordFields(section) {
    $$('[data-password-field]', section).forEach((input) => {
        input.value = '';
    });
}

function fillAccountSettings(section, account) {
    if (!section || !account) {
        return;
    }

    const role = accountRole(account);
    const nameParts = accountNameParts(account);
    setSettingField(section, 'firstName', nameParts.firstName);
    setSettingField(section, 'lastName', nameParts.lastName);
    setSettingField(section, 'email', accountEmail(account));

    if (role === 'admin') {
        setSettingField(section, 'adminId', account.USER_id || accountLinkedId(account) || adminAccount.USER_id);
    }

    if (role === 'customer') {
        setSettingField(section, 'phone', account.USER_phone || '');
        setSettingField(section, 'preferredDeliveryTime', account.USER_preferredDeliveryTime || '');
    }

    if (role === 'seller') {
        setSettingField(section, 'phone', account.MERCH_phone || '');
        setSettingField(section, 'storeName', account.MERCH_name || '');
        setSettingField(section, 'merchantType', account.MERCH_type || '');
        setSettingField(section, 'storeAddress', cleanMerchantAddressValue(account.MERCH_address || ''));
        setSettingField(section, 'availableDays', normalizeMerchantAvailableDays(account.MERCH_availableDays || ''));
        setSettingField(section, 'preparationTime', account.MERCH_preparationTime || '');
        setSettingField(section, 'storeStatus', merchantStoreStatusLabel(account));
    }

    if (role === 'rider') {
        setSettingField(section, 'phone', account.SHOP_phone || '');
        setSettingField(section, 'currentLocation', account.SHOP_currentLocation || '');
        setSettingField(section, 'vehicleType', account.SHOP_vehicleType || '');
        setSettingField(section, 'maxActiveOrders', account.SHOP_maxActiveOrders || '1');
    }
}

async function assertPasswordChange(section, collectionName, id, passwordField, payload) {
    const currentPassword = passwordFieldValue(section, 'current');
    const newPassword = passwordFieldValue(section, 'new');
    const confirmPassword = passwordFieldValue(section, 'confirm');

    if (!currentPassword && !newPassword && !confirmPassword) {
        return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Enter current password, new password, and confirm password.');
    }

    if (newPassword !== confirmPassword) {
        updateAccountSettingsPasswordMatch(section, { force: true });
        throw new Error('New password and confirm password do not match.');
    }

    assertStrongPassword($(`[data-password-field="new"]`, section));

    const snapshot = await getDoc(docRef(collectionName, id));
    if (!snapshot.exists() || snapshot.data()[passwordField] !== currentPassword) {
        throw new Error('Current password is incorrect.');
    }

    payload[passwordField] = newPassword;
}

async function applyAccountSettings(role, section) {
    const account = getCurrentAccount();
    if (!account || accountRole(account) !== role) {
        throw new Error('Sign in with the correct account before saving settings.');
    }

    const linkedId = accountLinkedId(account);
    if (!linkedId) {
        throw new Error('Account record was not found.');
    }

    if (role === 'admin') {
        const currentPassword = passwordFieldValue(section, 'current');
        const newPassword = passwordFieldValue(section, 'new');
        const confirmPassword = passwordFieldValue(section, 'confirm');

        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new Error('Enter current password, new password, and confirm password.');
        }

        if (currentPassword !== currentAdminPassword()) {
            throw new Error('Current password is incorrect.');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('New password and confirm password do not match.');
        }

        assertStrongPassword($('[data-password-field="new"]', section));
        setAdminPassword(newPassword);
        setCurrentAccount({
            ...account,
            USER_id: adminAccount.USER_id,
            USER_email: adminAccount.USER_email,
            USER_linkedId: adminAccount.USER_linkedId,
            USER_status: adminAccount.USER_status
        });
        clearPasswordFields(section);
        initAuthChrome();
        return;
    }

    const phone = assertPhoneNumber($('[data-account-field="phone"]', section));
    const email = assertEmailAddress($('[data-account-field="email"]', section));
    const firstName = settingFieldValue(section, 'firstName');
    const lastName = settingFieldValue(section, 'lastName');
    const fullName = fullNameFromParts(firstName, lastName);

    if (role === 'customer') {
        const currentEmail = accountEmail(account);
        const existingUser = await findFirstByField(collections.userAccount, 'USER_email', currentEmail || email);
        const userId = existingUser?.USER_id
            || existingUser?.id
            || (/^user-/i.test(linkedId) ? linkedId : userAccountDocId(currentEmail || email));
        const existingCustomer = await findFirstByField(collections.customer, 'CUST_email', currentEmail || email);
        const customerId = existingCustomer?.CUST_id
            || existingCustomer?.id
            || (isCustomerRecordId(linkedId) ? linkedId : await nextId(collections.customer));
        const currentDefaultAddress = defaultCustomerAddress(account);
        const city = normalizeServiceCity(currentDefaultAddress?.city || account.USER_city) || '';
        const address = cleanAddressPart(currentDefaultAddress?.address || account.USER_address || '');
        const savedAddresses = readCustomerAddresses(account);
        const payload = {
            USER_id: userId,
            USER_firstName: firstName,
            USER_lastName: lastName,
            USER_email: email,
            USER_phone: phone,
            USER_linkedId: customerId,
            USER_city: city,
            USER_preferredDeliveryTime: settingFieldValue(section, 'preferredDeliveryTime')
        };

        await assertPasswordChange(section, collections.userAccount, userId, 'USER_password', payload);
        await setDoc(docRef(collections.userAccount, userId), payload, { merge: true });
        await setDoc(docRef(collections.customer, customerId), {
            CUST_id: customerId,
            CUST_firstName: firstName,
            CUST_lastName: lastName,
            CUST_email: email,
            CUST_phone: phone,
            CUST_city: city,
            CUST_address: address,
            firstName,
            lastName,
            email,
            phone,
            city,
            address,
            role: 'customer',
            status: 'active',
            username: fullName,
            USER_role: 'customer',
            USER_email: email,
            USER_status: 'Active',
            updatedAt: serverTimestamp()
        }, { merge: true });
        const nextAccount = {
            ...account,
            USER_id: userId,
            USER_linkedId: customerId,
            USER_email: payload.USER_email,
            USER_displayName: fullName,
            USER_firstName: payload.USER_firstName,
            USER_lastName: payload.USER_lastName,
            USER_phone: payload.USER_phone,
            USER_city: payload.USER_city,
            USER_address: address,
            USER_preferredDeliveryTime: payload.USER_preferredDeliveryTime
        };
        setCurrentAccount(nextAccount);
        if (email !== currentEmail && savedAddresses.length) {
            saveCustomerAddresses(nextAccount, savedAddresses);
        }
    }

    if (role === 'seller') {
        const merchantAddressInput = $('[data-account-field="storeAddress"]', section);
        const merchantAddress = cleanMerchantAddressValue(settingFieldValue(section, 'storeAddress'));
        if (!merchantAddress) {
            showFieldError(merchantAddressInput, 'Enter the real merchant address.');
            throw new Error('Enter the real merchant address.');
        }

        const payload = {
            MERCH_ownerFirstName: firstName,
            MERCH_ownerLastName: lastName,
            MERCH_ownerEmail: email,
            MERCH_phone: phone,
            MERCH_name: settingFieldValue(section, 'storeName'),
            MERCH_type: settingFieldValue(section, 'merchantType'),
            MERCH_address: merchantAddress,
            MERCH_availableDays: normalizeMerchantAvailableDays(settingFieldValue(section, 'availableDays')),
            MERCH_preparationTime: settingFieldValue(section, 'preparationTime'),
            MERCH_storeStatus: normalizeMerchantStoreStatus(settingFieldValue(section, 'storeStatus'))
        };

        if (passwordFieldValue(section, 'current') || passwordFieldValue(section, 'new') || passwordFieldValue(section, 'confirm')) {
            throw new Error('Merchant password changes will move to Firebase Authentication in a later auth settings phase.');
        }

        await firebaseSetDoc(firebaseRoleDoc('seller', linkedId), {
            storeName: payload.MERCH_name,
            merchantType: payload.MERCH_type,
            address: payload.MERCH_address,
            approvalStatus: roleLower(account.MERCH_approvalStatus || account.USER_status || 'pending'),
            storeStatus: payload.MERCH_storeStatus,
            availableDays: payload.MERCH_availableDays,
            logoUrl: account.logoUrl || '',
            documentUrl: account.documentUrl || '',
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
        await firebaseSetDoc(firebaseUserDoc(linkedId), {
            email,
            username: fullName || payload.MERCH_name,
            role: 'merchant',
            updatedAt: firebaseServerTimestamp()
        }, { merge: true });
        setCurrentAccount({
            ...account,
            USER_email: payload.MERCH_ownerEmail,
            USER_displayName: fullName,
            MERCH_ownerFirstName: payload.MERCH_ownerFirstName,
            MERCH_ownerLastName: payload.MERCH_ownerLastName,
            MERCH_phone: payload.MERCH_phone,
            MERCH_name: payload.MERCH_name,
            MERCH_type: payload.MERCH_type,
            MERCH_address: payload.MERCH_address,
            MERCH_availableDays: payload.MERCH_availableDays,
            MERCH_preparationTime: payload.MERCH_preparationTime,
            MERCH_storeStatus: payload.MERCH_storeStatus
        });
    }

    if (role === 'rider') {
        const currentLocationInput = $('[data-account-field="currentLocation"]', section);
        const currentLocation = cleanAddressPart(settingFieldValue(section, 'currentLocation'));
        if (!currentLocation) {
            showFieldError(currentLocationInput, 'Choose or enter your current rider location.');
            throw new Error('Choose or enter your current rider location.');
        }

        const registeredVehicleType = account.SHOP_vehicleType || account.RIDER_vehicleType || settingFieldValue(section, 'vehicleType');
        const payload = {
            SHOP_firstName: firstName,
            SHOP_lastName: lastName,
            SHOP_email: email,
            SHOP_phone: phone,
            SHOP_currentLocation: currentLocation,
            SHOP_vehicleType: registeredVehicleType,
            SHOP_maxActiveOrders: Number(settingFieldValue(section, 'maxActiveOrders')) || 1
        };

        await assertPasswordChange(section, collections.shopper, linkedId, 'SHOP_password', payload);
        await setDoc(docRef(collections.shopper, linkedId), payload, { merge: true });
        setCurrentAccount({
            ...account,
            USER_email: payload.SHOP_email,
            USER_displayName: fullName,
            SHOP_firstName: payload.SHOP_firstName,
            SHOP_lastName: payload.SHOP_lastName,
            SHOP_phone: payload.SHOP_phone,
            SHOP_currentLocation: payload.SHOP_currentLocation,
            SHOP_vehicleType: payload.SHOP_vehicleType,
            SHOP_maxActiveOrders: payload.SHOP_maxActiveOrders
        });
    }

    clearPasswordFields(section);
    initAuthChrome();
}

function syncWebsiteSettingsControls(root = document) {
    const account = getCurrentAccount();
    syncThemeToggles(root);

    $$('[data-home-toggle]', root).forEach((input) => {
        const feature = input.dataset.homeToggle;
        input.checked = isHomeFeatureVisible(feature);
    });

    $$('[data-language-setting]', root).forEach((select) => {
        select.value = readPreference(storageKeys.language, 'english');
    });

    $$('[data-language-sticky]', root).forEach((input) => {
        input.checked = readLocal(accountPreferenceKey(storageKeys.languageSticky, account)) === 'on';
    });

    $$('[data-language-logout]', root).forEach((button) => {
        button.hidden = !account;
    });
}

function syncThemeToggles(root = document) {
    const isDark = currentThemeIsDark();
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    $$('[data-theme-toggle]', root).forEach((input) => {
        input.checked = isDark;
        input.setAttribute('aria-label', label);
        input.closest('.theme-switch')?.setAttribute('title', label);
    });
}

function initThemeToggles(root = document) {
    syncThemeToggles(root);

    $$('[data-theme-toggle]', root).forEach((input) => {
        if (input.dataset.themeToggleBound === 'true') {
            return;
        }

        input.dataset.themeToggleBound = 'true';
        input.addEventListener('change', () => {
            const mode = input.checked ? 'dark' : 'light';
            savePreference(storageKeys.themeMode, mode);
            applyThemeMode(mode);
        });
    });
}

function applyLanguageSetting(root = document) {
    const account = getCurrentAccount();
    const select = $('[data-language-setting]', root);
    const sticky = $('[data-language-sticky]', root);
    const language = select?.value || 'english';
    const shouldKeepLanguage = Boolean(sticky?.checked);

    saveLocal(storageKeys.language, language);
    if (accountEmail(account)) {
        if (shouldKeepLanguage) {
            saveLocal(accountPreferenceKey(storageKeys.language, account), language);
            saveLocal(accountPreferenceKey(storageKeys.languageSticky, account), 'on');
        } else {
            removeLocal(accountPreferenceKey(storageKeys.language, account));
            removeLocal(accountPreferenceKey(storageKeys.languageSticky, account));
        }
    } else {
        saveLocal(storageKeys.languageSticky, shouldKeepLanguage ? 'on' : 'off');
    }
    translatePage(language);
    syncWebsiteSettingsControls(root);
    setNotice($('[data-language-notice]', root), translateValue('Language applied.', language));
}

function initWebsiteSettings(root = document) {
    syncWebsiteSettingsControls(root);

    $$('[data-home-toggle]', root).forEach((input) => {
        if (input.dataset.homeToggleBound === 'true') {
            return;
        }

        input.dataset.homeToggleBound = 'true';
        input.addEventListener('change', () => {
            const feature = input.dataset.homeToggle;
            savePreference(homeFeatureKey(feature), input.checked ? 'on' : 'off');
            applyHomepagePreferences();
        });
    });

    $$('[data-language-setting]', root).forEach((select) => {
        if (select.dataset.languageBound === 'true') {
            return;
        }

        select.dataset.languageBound = 'true';
        if (select.hasAttribute('data-language-auto')) {
            select.addEventListener('change', () => applyLanguageSetting(root));
        }
    });

    const applyLanguageButton = $('[data-apply-language]', root);
    if (applyLanguageButton && applyLanguageButton.dataset.languageApplyBound !== 'true') {
        applyLanguageButton.dataset.languageApplyBound = 'true';
        applyLanguageButton.addEventListener('click', () => applyLanguageSetting(root));
    }
}

const cebuMapCenter = [10.3157, 123.8854];
const locationPickerState = {
    target: null,
    map: null,
    marker: null,
    selected: null,
    mapLoadAttempts: 0
};

function locationRecordFromNominatim(result = {}) {
    const address = result.address || {};
    const street = cleanAddressPart([
        address.house_number,
        address.road || address.pedestrian || address.residential || address.footway || address.path
    ].filter(Boolean).join(' '));
    const barangay = cleanAddressPart(
        address.suburb
        || address.quarter
        || address.neighbourhood
        || address.village
        || address.hamlet
        || address.city_district
        || ''
    );
    const cityMunicipal = cleanAddressPart(
        address.city
        || address.town
        || address.municipality
        || address.county
        || address.state_district
        || ''
    );

    return addressRecordFromParts({
        street,
        barangay,
        cityMunicipal,
        city: normalizeServiceCity(cityMunicipal) || deriveServiceCityFromAddress(result.display_name || ''),
        address: formatCebuAddress({ street, barangay, cityMunicipal }, result.display_name),
        lat: Number(result.lat),
        lng: Number(result.lon)
    });
}

function setLocationPickerSummary(record, message = '') {
    const summary = $('[data-location-summary]');
    if (!summary) {
        return;
    }

    summary.textContent = message || record?.address || 'Choose a point in Cebu to fill the address.';
    summary.classList.toggle('is-error', Boolean(message && !record?.address && !/^(Searching|Reading|Map is)/i.test(message)));
}

function placeLocationMarker(record) {
    if (!locationPickerState.map || !Number.isFinite(Number(record?.lat)) || !Number.isFinite(Number(record?.lng))) {
        return;
    }

    const latLng = [Number(record.lat), Number(record.lng)];
    if (!locationPickerState.marker) {
        locationPickerState.marker = window.L.marker(latLng).addTo(locationPickerState.map);
    } else {
        locationPickerState.marker.setLatLng(latLng);
    }

    locationPickerState.map.setView(latLng, Math.max(locationPickerState.map.getZoom(), 15));
}

function selectLocationRecord(record) {
    const normalized = addressRecordFromParts(record, {
        id: record.id,
        label: record.label,
        isDefault: record.isDefault
    });
    locationPickerState.selected = normalized;
    setLocationPickerSummary(normalized);
    placeLocationMarker(normalized);
}

async function reverseGeocodeLocation(lat, lng) {
    const fallback = addressRecordFromParts({
        address: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}, Cebu`,
        cityMunicipal: 'Cebu City',
        city: 'Cebu City',
        lat,
        lng
    });

    try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('accept-language', 'en');
        url.searchParams.set('lat', lat);
        url.searchParams.set('lon', lng);
        const response = await fetch(url.toString());
        if (!response.ok) {
            return fallback;
        }

        return locationRecordFromNominatim(await response.json());
    } catch (error) {
        return fallback;
    }
}

async function searchCebuLocation(queryText) {
    const queryValue = cleanAddressPart(queryText);
    if (!queryValue) {
        setLocationPickerSummary(null, 'Enter a Cebu address to search.');
        return;
    }

    setLocationPickerSummary(null, 'Searching Cebu...');
    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '1');
        url.searchParams.set('countrycodes', 'ph');
        url.searchParams.set('accept-language', 'en');
        url.searchParams.set('q', `${queryValue} Cebu Philippines`);
        const response = await fetch(url.toString());
        const results = response.ok ? await response.json() : [];
        const result = Array.isArray(results) ? results[0] : null;

        if (!result) {
            setLocationPickerSummary(null, 'No Cebu location found for that search.');
            return;
        }

        selectLocationRecord(locationRecordFromNominatim(result));
    } catch (error) {
        setLocationPickerSummary(null, 'Location search is not available right now.');
    }
}

function ensureLocationMap() {
    const mapNode = $('[data-location-map]');
    if (!mapNode || locationPickerState.map) {
        return;
    }
    if (!window.L) {
        locationPickerState.mapLoadAttempts += 1;
        setLocationPickerSummary(null, locationPickerState.mapLoadAttempts > 20
            ? 'Map could not be loaded. Check your internet connection.'
            : 'Map is still loading...');
        if (locationPickerState.mapLoadAttempts <= 20) {
            window.setTimeout(ensureLocationMap, 300);
        }
        return;
    }

    locationPickerState.map = window.L.map(mapNode).setView(cebuMapCenter, 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(locationPickerState.map);

    locationPickerState.map.on('click', async (event) => {
        setLocationPickerSummary(null, 'Reading address...');
        const record = await reverseGeocodeLocation(event.latlng.lat, event.latlng.lng);
        selectLocationRecord(record);
    });
}

function openLocationPicker(button) {
    const modal = $('[data-location-modal]');
    const target = button?.closest?.('[data-address-picker-field]');
    if (!modal || !target) {
        return;
    }

    locationPickerState.target = target;
    locationPickerState.mapLoadAttempts = 0;
    const currentAddress = $('[data-address-input]', target)?.value || '';
    locationPickerState.selected = currentAddress ? parseCebuAddress(currentAddress) : null;
    const searchInput = $('[data-location-search]', modal);
    if (searchInput) {
        searchInput.value = currentAddress;
    }

    modal.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body?.classList.add('has-open-account-modal');
    setLocationPickerSummary(locationPickerState.selected);

    window.setTimeout(() => {
        ensureLocationMap();
        locationPickerState.map?.invalidateSize();
        if (locationPickerState.selected) {
            placeLocationMarker(locationPickerState.selected);
        }
        searchInput?.focus({ preventScroll: true });
    }, 80);
}

function closeLocationPicker() {
    const modal = $('[data-location-modal]');
    if (!modal) {
        return;
    }

    modal.classList.remove('is-open');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (!$('[data-account-modal].is-open')) {
        document.body?.classList.remove('has-open-account-modal');
    }
    locationPickerState.target = null;
}

function initLocationPicker() {
    const modal = $('[data-location-modal]');
    if (!modal || modal.dataset.locationPickerBound === 'true') {
        return;
    }

    modal.dataset.locationPickerBound = 'true';
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-location-picker-open]');
        if (trigger) {
            event.preventDefault();
            openLocationPicker(trigger);
        }
    });

    $$('[data-location-close]', modal).forEach((button) => {
        button.addEventListener('click', closeLocationPicker);
    });

    $('[data-location-search-button]', modal)?.addEventListener('click', () => {
        searchCebuLocation($('[data-location-search]', modal)?.value || '');
    });

    $('[data-location-search]', modal)?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchCebuLocation(event.currentTarget.value);
        }
    });

    $('[data-location-use]', modal)?.addEventListener('click', () => {
        if (!locationPickerState.target || !locationPickerState.selected) {
            setLocationPickerSummary(null, 'Choose a point on the map first.');
            return;
        }

        const record = addressRecordFromParts(locationPickerState.selected);
        if (!record.city || !serviceCities.includes(record.city)) {
            setLocationPickerSummary(null, 'Choose a delivery address in Cebu City, Lapu-Lapu, Mandaue, Consolacion, or Talisay.');
            return;
        }

        fillAddressPickerField(locationPickerState.target, record);
        closeLocationPicker();
    });
}

function addressManagerNotice(manager) {
    let notice = $('[data-address-notice]', manager);
    if (!notice) {
        notice = document.createElement('div');
        notice.className = 'notice';
        notice.dataset.addressNotice = '';
        manager.append(notice);
    }

    return notice;
}

function syncCheckoutDefaultAddress(account = getCurrentAccount()) {
    const form = $('[data-customer-checkout-form]');
    if (!form) {
        return;
    }

    const address = defaultCustomerAddress(account);
    if (form.elements.address) {
        form.elements.address.value = address?.address || '';
    }
}

async function persistCustomerDefaultAddress(address, account = getCurrentAccount()) {
    if (!isCustomerAccount(account)) {
        return account;
    }

    const currentEmail = accountEmail(account);
    const user = await findFirstByField(collections.userAccount, 'USER_email', currentEmail);
    const userId = user?.USER_id || user?.id || userAccountDocId(currentEmail);
    const existingCustomer = await customerProfileForUser(user || account, accountLinkedId(account));
    const customerId = existingCustomer?.CUST_id
        || existingCustomer?.id
        || (isCustomerRecordId(accountLinkedId(account)) ? accountLinkedId(account) : await nextId(collections.customer));
    const addressText = cleanAddressPart(address?.address || '');
    const city = normalizeServiceCity(address?.city || account.USER_city) || deriveServiceCityFromAddress(addressText) || '';

    if (userId) {
        await setDoc(docRef(collections.userAccount, userId), {
            USER_linkedId: customerId,
            USER_city: city,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    await setDoc(docRef(collections.customer, customerId), {
        CUST_id: customerId,
        CUST_email: currentEmail,
        CUST_address: addressText,
        CUST_city: city || null,
        address: addressText,
        city,
        email: currentEmail,
        role: 'customer',
        status: 'active',
        USER_role: 'customer',
        USER_email: currentEmail,
        USER_status: 'Active',
        updatedAt: serverTimestamp()
    }, { merge: true });

    const nextAccount = {
        ...account,
        USER_linkedId: customerId,
        USER_city: city,
        USER_address: addressText
    };
    setCurrentAccount(nextAccount);
    syncCheckoutDefaultAddress(nextAccount);
    return nextAccount;
}

function renderCustomerAddressManager(manager, account = getCurrentAccount()) {
    const list = $('[data-address-list]', manager);
    const detail = $('[data-address-detail]', manager);
    if (!list || !detail) {
        return;
    }

    const addresses = isCustomerAccount(account) ? readCustomerAddresses(account) : [];
    const selectedId = manager.dataset.selectedAddressId || '';
    const selectedAddress = addresses.find((address) => address.id === selectedId);

    list.innerHTML = addresses.length
        ? addresses.map((address) => `
            <article class="customer-address-item${address.isDefault ? ' is-default' : ''}">
                <span class="customer-address-icon" aria-hidden="true"><i data-lucide="map-pin"></i></span>
                <button class="customer-address-main" type="button" data-address-open="${escapeHtml(address.id)}">
                    <span>
                        <strong>${escapeHtml(customerAddressRowLabel(address))}</strong>
                        <small>${escapeHtml(address.address)}</small>
                    </span>
                    ${address.isDefault ? '<em>Default</em>' : ''}
                </button>
                <button class="customer-address-settings-button" type="button" data-address-settings-open="${escapeHtml(address.id)}" aria-label="Address settings" aria-expanded="${manager.dataset.openAddressSettingsId === address.id ? 'true' : 'false'}">
                    <i data-lucide="settings" aria-hidden="true"></i>
                </button>
                <div class="customer-address-settings" data-address-settings-panel="${escapeHtml(address.id)}" ${manager.dataset.openAddressSettingsId === address.id ? '' : 'hidden'}>
                    <button type="button" data-address-label="${legacyDefaultAddressLabel}" data-address-id="${escapeHtml(address.id)}">Default Address</button>
                    <button type="button" data-address-label="Home" data-address-id="${escapeHtml(address.id)}">Home</button>
                    <button type="button" data-address-label="Work" data-address-id="${escapeHtml(address.id)}">Work</button>
                    <button type="button" data-address-delete data-address-id="${escapeHtml(address.id)}">Delete Address</button>
                </div>
            </article>
        `).join('')
        : '<div class="empty-state compact">No saved address yet.</div>';

    if (!selectedAddress) {
        detail.hidden = true;
        detail.innerHTML = '';
        refreshIcons();
        return;
    }

    detail.hidden = false;
    detail.innerHTML = `
        <div class="customer-address-detail-card">
            <div>
                <span class="address-detail-label">${escapeHtml(customerAddressDetailLabel(selectedAddress))}</span>
                <p>${escapeHtml(selectedAddress.address)}</p>
            </div>
        </div>
    `;
    refreshIcons();
}

function renderCustomerAddressManagers(root = document) {
    const account = getCurrentAccount();
    $$('[data-address-manager]', root).forEach((manager) => renderCustomerAddressManager(manager, account));
}

function clearAddressEditor(editor) {
    if (!editor) {
        return;
    }

    const input = $('[data-address-input]', editor);
    if (input) {
        input.value = '';
        clearFieldError(input);
    }
    if ($('[data-address-city]', editor)) {
        $('[data-address-city]', editor).value = '';
    }
    if ($('[data-address-parts]', editor)) {
        $('[data-address-parts]', editor).value = '';
    }
    const preview = $('[data-address-preview]', editor);
    if (preview) {
        preview.textContent = 'Street, Barangay, City/Municipal, Cebu';
    }
}

function initCustomerAddressManagers(root = document) {
    $$('[data-address-manager]', root).forEach((manager) => {
        if (manager.dataset.addressManagerBound === 'true') {
            renderCustomerAddressManager(manager);
            return;
        }

        manager.dataset.addressManagerBound = 'true';
        manager.addEventListener('click', async (event) => {
            const account = getCurrentAccount();
            const editor = $('[data-address-editor]', manager);
            const notice = addressManagerNotice(manager);
            const openButton = event.target.closest('[data-address-open]');
            const settingsButton = event.target.closest('[data-address-settings-open]');
            const labelButton = event.target.closest('[data-address-label]');

            if (openButton) {
                manager.dataset.selectedAddressId = openButton.dataset.addressOpen;
                manager.dataset.openAddressSettingsId = '';
                renderCustomerAddressManager(manager, account);
                return;
            }

            if (settingsButton) {
                const addressId = settingsButton.dataset.addressSettingsOpen;
                manager.dataset.selectedAddressId = addressId;
                manager.dataset.openAddressSettingsId = manager.dataset.openAddressSettingsId === addressId ? '' : addressId;
                renderCustomerAddressManager(manager, account);
                return;
            }

            if (event.target.closest('[data-address-add]')) {
                manager.dataset.openAddressSettingsId = '';
                clearAddressEditor(editor);
                if (editor) {
                    editor.hidden = false;
                    $('[data-address-input]', editor)?.focus();
                }
                return;
            }

            if (event.target.closest('[data-address-cancel]')) {
                if (editor) {
                    editor.hidden = true;
                }
                return;
            }

            if (event.target.closest('[data-address-save]')) {
                try {
                    const addresses = readCustomerAddresses(account);
                    const record = readAddressPickerField(editor, {
                        label: addresses.length ? 'Home' : currentAddressLabel,
                        isDefault: addresses.length === 0
                    });
                    saveCustomerAddresses(account, [...addresses, record]);
                    manager.dataset.selectedAddressId = record.id;
                    if (record.isDefault) {
                        await persistCustomerDefaultAddress(record, account);
                    }
                    if (editor) {
                        editor.hidden = true;
                    }
                    setNotice(notice, 'Address saved.');
                    renderCustomerAddressManagers(document);
                } catch (error) {
                    setNotice(notice, error.message || 'Address could not be saved.', true);
                }
                return;
            }

            if (labelButton) {
                try {
                    const label = labelButton.dataset.addressLabel;
                    const addresses = readCustomerAddresses(account);
                    const selectedId = labelButton.dataset.addressId || manager.dataset.selectedAddressId;
                    const isCurrentAddress = label === currentAddressLabel || label === legacyDefaultAddressLabel;
                    const updated = addresses.map((address) => {
                        if (address.id !== selectedId) {
                            return isCurrentAddress ? { ...address, isDefault: false } : address;
                        }

                        return {
                            ...address,
                            label: normalizeCustomerAddressLabel(label),
                            isDefault: isCurrentAddress ? true : address.isDefault
                        };
                    });
                    const nextAddresses = saveCustomerAddresses(account, updated);
                    const selectedAddress = nextAddresses.find((address) => address.id === selectedId);
                    if (isCurrentAddress && selectedAddress) {
                        await persistCustomerDefaultAddress(selectedAddress, account);
                    }
                    manager.dataset.selectedAddressId = selectedId;
                    manager.dataset.openAddressSettingsId = '';
                    setNotice(notice, 'Address settings updated.');
                    renderCustomerAddressManagers(document);
                } catch (error) {
                    setNotice(notice, error.message || 'Address settings could not be updated.', true);
                }
                return;
            }

            if (event.target.closest('[data-address-delete]')) {
                try {
                    const deleteButton = event.target.closest('[data-address-delete]');
                    const selectedId = deleteButton.dataset.addressId || manager.dataset.selectedAddressId;
                    const addresses = readCustomerAddresses(account);
                    const wasDefault = addresses.find((address) => address.id === selectedId)?.isDefault;
                    let nextAddresses = addresses.filter((address) => address.id !== selectedId);
                    if (wasDefault && nextAddresses.length) {
                        nextAddresses = nextAddresses.map((address, index) => ({
                            ...address,
                            isDefault: index === 0
                        }));
                    }
                    nextAddresses = saveCustomerAddresses(account, nextAddresses);
                    manager.dataset.selectedAddressId = nextAddresses[0]?.id || '';
                    manager.dataset.openAddressSettingsId = '';
                    if (wasDefault) {
                        await persistCustomerDefaultAddress(nextAddresses.find((address) => address.isDefault) || null, account);
                    }
                    setNotice(notice, 'Address deleted.');
                    renderCustomerAddressManagers(document);
                } catch (error) {
                    setNotice(notice, error.message || 'Address could not be deleted.', true);
                }
            }
        });

        renderCustomerAddressManager(manager);
    });
}

function syncCustomerProfileModal(root = document) {
    const account = getCurrentAccount();
    const modal = root.matches?.('[data-account-modal="profile"]')
        ? root
        : $('[data-account-modal="profile"]', root);
    if (!modal || !account) {
        return;
    }

    const role = accountRole(account);
    const activeSectionName = role === 'customer'
        ? 'customer'
        : isSellerApproved(account)
            ? 'seller'
            : isRiderActive(account)
                ? 'rider'
                : role === 'admin'
                    ? 'admin'
                    : '';
    $$('[data-settings-section]', modal).forEach((section) => {
        const isActive = section.dataset.settingsSection === activeSectionName;
        section.hidden = !isActive;
        section.classList.toggle('is-current', isActive);
    });

    const section = activeSectionName ? $(`[data-settings-section="${activeSectionName}"]`, modal) : null;
    if (!section) {
        return;
    }

    fillAccountSettings(section, account);
    initCustomerAddressManagers(modal);
    renderCustomerAddressManagers(modal);

    const sellerStatus = $('[data-seller-settings-status]', modal);
    const riderStatus = $('[data-rider-settings-status]', modal);
    if (sellerStatus) {
        sellerStatus.textContent = `Approval Status: ${account?.MERCH_approvalStatus || 'Pending/Approved/Rejected'} · Store ${merchantStoreStatusLabel(account)}`;
    }
    if (riderStatus) {
        riderStatus.textContent = `Employment Status: ${account?.SHOP_employmentStatus || 'Pending/Active/Inactive'}`;
    }
}

function bindAccountSettingsButtons(root = document) {
    $$('[data-apply-settings]', root).forEach((button) => {
        if (button.dataset.applySettingsBound === 'true') {
            return;
        }

        button.dataset.applySettingsBound = 'true';
        button.addEventListener('click', async () => {
            const section = button.closest('[data-settings-section]');
            const noticeScope = button.closest('.settings-card') || section;
            const notice = $('[data-settings-notice]', noticeScope) || $('[data-settings-notice]', section);
            button.disabled = true;

            try {
                await applyAccountSettings(button.dataset.applySettings, section);
                setNotice(notice, 'Settings updated.');
                syncCustomerProfileModal(root);
            } catch (error) {
                if (noticeScope.querySelector('.field-error-message, .is-invalid')) {
                    clearNotice(notice);
                } else {
                    setNotice(notice, error.message || 'Settings could not be updated.', true);
                }
            } finally {
                button.disabled = false;
            }
        });
    });
}

function initCustomerProfileModal() {
    const modal = $('[data-account-modal="profile"]');
    if (!modal) {
        return;
    }

    bindAccountSettingsButtons(modal);
    initCustomerAddressManagers(modal);
    syncCustomerProfileModal(modal);
}

function initRoleFooterNavigation() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest('[data-footer-view-link]');
        if (!link) {
            return;
        }

        const targetRole = link.dataset.footerRoleTarget || '';
        const targetView = link.dataset.footerView || '';
        if (!targetRole || !targetView) {
            return;
        }

        const dashboardSelectors = {
            customer: `[data-customer-view-trigger="${targetView}"]`,
            seller: `[data-seller-view-trigger="${targetView}"]`,
            rider: `[data-rider-view-trigger="${targetView}"]`,
            admin: `[data-admin-tab="${targetView}"]`
        };
        const selector = dashboardSelectors[targetRole];
        if (!selector) {
            return;
        }

        const href = link.getAttribute('href') || '';
        const targetUrl = new URL(href, window.location.href);
        const isSamePage = targetUrl.pathname === window.location.pathname;
        const trigger = isSamePage ? document.querySelector(selector) : null;

        if (!trigger) {
            return;
        }

        event.preventDefault();
        trigger.click();
        if (targetView) {
            history.replaceState(null, '', `#${targetView}`);
        }
        document.querySelector('.dashboard-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

let logoutConfirmFocusReturn = null;

function logoutConfirmModalMarkup() {
    return `
        <div class="logout-confirm-backdrop" data-logout-confirm-modal hidden aria-hidden="true">
            <section class="logout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmTitle">
                <button class="logout-confirm-close" type="button" data-logout-cancel aria-label="Cancel logout">
                    <i data-lucide="x" aria-hidden="true"></i>
                </button>
                <div class="logout-confirm-icon" aria-hidden="true">
                    <i data-lucide="log-out"></i>
                </div>
                <h2 id="logoutConfirmTitle">Are you sure you want to log out?</h2>
                <p>Your current account session will end and you will return to the homepage.</p>
                <div class="logout-confirm-actions">
                    <button class="primary-button danger-button" type="button" data-logout-confirm>
                        <i data-lucide="log-out" aria-hidden="true"></i> Yes, log out
                    </button>
                    <button class="ghost-button" type="button" data-logout-cancel>
                        <i data-lucide="x" aria-hidden="true"></i> Stay logged in
                    </button>
                </div>
            </section>
        </div>
    `;
}

function ensureLogoutConfirmModal() {
    let modal = $('[data-logout-confirm-modal]');
    if (modal) {
        return modal;
    }

    document.body.insertAdjacentHTML('beforeend', logoutConfirmModalMarkup());
    modal = $('[data-logout-confirm-modal]');
    refreshIcons();
    return modal;
}

function openLogoutConfirmModal(trigger) {
    const modal = ensureLogoutConfirmModal();
    logoutConfirmFocusReturn = trigger || document.activeElement;
    modal.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body?.classList.add('has-open-logout-confirm');
    closeMoreMenu();
    requestAnimationFrame(() => {
        $('[data-logout-confirm]', modal)?.focus({ preventScroll: true });
    });
}

function closeLogoutConfirmModal({ restoreFocus = true } = {}) {
    const modal = $('[data-logout-confirm-modal]');
    if (!modal) {
        return;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body?.classList.remove('has-open-logout-confirm');
    setTimeout(() => {
        modal.hidden = true;
    }, 180);

    if (restoreFocus && logoutConfirmFocusReturn?.focus) {
        logoutConfirmFocusReturn.focus({ preventScroll: true });
    }
    logoutConfirmFocusReturn = null;
}

async function confirmLogout() {
    closeLogoutConfirmModal({ restoreFocus: false });
    await signOut(firebaseAuth).catch(() => {});
    clearCurrentAccount();
    location.replace('index.html');
}

function initLogout() {
    const modal = ensureLogoutConfirmModal();

    if (modal.dataset.logoutConfirmBound !== 'true') {
        modal.dataset.logoutConfirmBound = 'true';
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-logout-cancel]')) {
                closeLogoutConfirmModal();
                return;
            }

            if (event.target.closest('[data-logout-confirm]')) {
                confirmLogout();
            }
        });
    }

    if (document.documentElement.dataset.logoutEscapeBound !== 'true') {
        document.documentElement.dataset.logoutEscapeBound = 'true';
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && $('[data-logout-confirm-modal].is-open')) {
                closeLogoutConfirmModal();
            }
        });
    }

    $$('[data-logout]').forEach((button) => {
        if (button.dataset.logoutBound === 'true') {
            return;
        }

        button.dataset.logoutBound = 'true';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            openLogoutConfirmModal(button);
        });
    });
}

function initUtilityActions() {
    $$('[data-fill-last-order]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.fillLastOrder);
            const lastOrder = readLocal(storageKeys.lastOrderId);
            if (target && lastOrder) {
                target.value = lastOrder;
            }
        });
    });
}

function initUiMotion() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const revealNodes = $$([
        '.availability-card',
        '.promo-strip',
        '.section-heading',
        '.home-info-card',
        '.home-category-card',
        '.home-area-card',
        '.home-faq-grid details',
        '.delivery-strip',
        '.merchant-masthead',
        '.product-card',
        '.store-card',
        '.deal-card',
        '.logo-tile',
        '.dashboard-hero',
        '.dashboard-card',
        '.form-panel',
        '.settings-card'
    ].join(','));

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealNodes.forEach((node) => node.classList.add('is-visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -8% 0px',
            threshold: 0.08
        });

        revealNodes.forEach((node, index) => {
            node.classList.add('ui-reveal');
            node.style.transitionDelay = `${Math.min(index % 8, 7) * 36}ms`;
            revealObserver.observe(node);
        });
    }

    document.addEventListener('pointerdown', (event) => {
        const button = event.target.closest('button, .primary-button, .ghost-button, .icon-button');
        button?.classList.add('is-pressed');

        const trashButton = event.target.closest('.trash-action-button');
        if (trashButton) {
            window.clearTimeout(Number(trashButton.dataset.deleteSuccessTimer || 0));
            trashButton.classList.add('is-delete-success');
            trashButton.dataset.deleteSuccessTimer = String(window.setTimeout(() => {
                trashButton.classList.remove('is-delete-success');
                delete trashButton.dataset.deleteSuccessTimer;
            }, 3000));
        }
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
        document.addEventListener(eventName, (event) => {
            event.target.closest('button, .primary-button, .ghost-button, .icon-button')?.classList.remove('is-pressed');
        });
    });
}

function initPasswordToggles(root = document) {
    $$('input[type="password"]', root).forEach((input) => {
        if (input.dataset.passwordToggleBound === 'true') {
            return;
        }

        input.dataset.passwordToggleBound = 'true';
        const wrapper = document.createElement('span');
        wrapper.className = 'password-input-wrap';
        input.parentNode?.insertBefore(wrapper, input);
        wrapper.append(input);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'password-toggle';
        button.setAttribute('aria-label', 'Show password');
        button.setAttribute('aria-pressed', 'false');
        button.title = 'Show password';
        button.innerHTML = '<i data-lucide="eye" aria-hidden="true"></i>';
        wrapper.append(button);

        button.addEventListener('click', () => {
            const shouldShow = input.type === 'password';
            input.type = shouldShow ? 'text' : 'password';
            button.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
            button.setAttribute('aria-pressed', String(shouldShow));
            button.title = shouldShow ? 'Hide password' : 'Show password';
            button.innerHTML = `<i data-lucide="${shouldShow ? 'eye-off' : 'eye'}" aria-hidden="true"></i>`;
            refreshIcons();
            input.focus();
        });
    });
}

function initPasswordStrengthMeters(root = document) {
    $$('[data-password-meter]', root).forEach((input) => {
        updatePasswordStrengthMeter(input);
    });
}

function fallbackProductImage(label = 'Product') {
    const safeLabel = escapeHtml(String(label || 'Product').slice(0, 48));
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
            <rect width="900" height="620" fill="#f7f3ea"/>
            <rect x="90" y="80" width="720" height="460" rx="34" fill="#fffdf7" stroke="#1e7a58" stroke-width="8"/>
            <circle cx="450" cy="250" r="92" fill="#1e7a58" opacity=".9"/>
            <text x="450" y="278" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700" fill="#ffffff">HB</text>
            <text x="450" y="390" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#17332b">${safeLabel}</text>
            <text x="450" y="442" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#5c665f">Product image unavailable</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function imageFallbackSource(image) {
    const isProductImage = image.matches('[data-modal-product-image]')
        || Boolean(image.closest('[data-product-card]'));

    return isProductImage
        ? DEFAULT_PRODUCT_IMAGE
        : fallbackProductImage(image.alt || 'Image');
}

function applyImageFallbacks(root = document) {
    $$('img', root).forEach((image) => {
        if (image.dataset.imageFallbackBound === 'true') {
            return;
        }

        image.dataset.imageFallbackBound = 'true';
        image.addEventListener('error', () => {
            const fallback = imageFallbackSource(image);
            if (image.dataset.imageFallbackSrc === fallback) {
                return;
            }

            image.dataset.imageFallbackSrc = fallback;
            image.src = fallback;
        });

        if (image.complete && image.naturalWidth === 0) {
            const fallback = imageFallbackSource(image);
            if (image.dataset.imageFallbackSrc !== fallback) {
                image.dataset.imageFallbackSrc = fallback;
                image.src = fallback;
            }
        }
    });
}

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
    applyImageFallbacks();
}

function runInitializer(name, initializer) {
    try {
        const result = initializer();
        if (result && typeof result.catch === 'function') {
            result.catch((error) => console.error(`${name} failed`, error));
        }
    } catch (error) {
        console.error(`${name} failed`, error);
    }
}

applyThemeMode();
applyHomepagePreferences();
const darkSchemeMedia = window.matchMedia?.('(prefers-color-scheme: dark)');
darkSchemeMedia?.addEventListener?.('change', () => {
    if (preferredThemeMode() === 'system') {
        applyThemeMode('system');
        syncThemeToggles();
    }
});
document.addEventListener('input', (event) => {
    if (event.target.matches('input[type="email"], [data-account-field="email"]')) {
        event.target.setCustomValidity('');
        const typedValue = String(event.target.value || '').trim();
        if (typedValue) {
            event.target.setCustomValidity(emailValidationMessage(typedValue, event.target.validity));
        }
        clearFieldError(event.target);
    }
    if (event.target.matches('input[type="tel"], [data-account-field="phone"]')) {
        normalizePhoneInput(event.target);
        clearFieldError(event.target);
    }
    if (event.target.matches('[data-card-number]')) {
        normalizeCardNumberInput(event.target);
        clearFieldError(event.target);
    }
    if (event.target.matches('[data-card-expiry]')) {
        normalizeCardExpiryInput(event.target);
        clearFieldError(event.target);
    }
    if (event.target.matches('[data-card-cvc]')) {
        normalizeCardCvcInput(event.target);
        clearFieldError(event.target);
    }
    if (event.target.matches('[data-gcash-reference]')) {
        normalizeGcashReferenceInput(event.target);
        clearFieldError(event.target);
    }
    if (event.target.matches('input[type="password"], [data-password-toggle-bound="true"]')) {
        clearFieldError(event.target);
    }
    if (event.target.matches('[data-password-rules]')) {
        updatePasswordRequirementNote(event.target);
    }
    if (event.target.matches('input[name="password"], input[name="confirmPassword"]')) {
        const passwordForm = event.target.closest('[data-customer-signup-form], [data-rider-application-form], [data-seller-registration-form]');
        if (passwordForm && ['password', 'confirmPassword'].includes(event.target.name)) {
            updateCustomerSignupPasswordMatch(passwordForm);
        }
    }
    if (event.target.matches('[data-password-field]')) {
        const settingsCard = event.target.closest('.settings-card');
        clearNotice($('[data-settings-notice]', settingsCard));
        const settingsSection = event.target.closest('[data-settings-section="customer"], [data-settings-section="seller"], [data-settings-section="rider"]');
        if (settingsSection && event.target.matches('[data-password-field="new"], [data-password-field="confirm"]')) {
            updateAccountSettingsPasswordMatch(settingsSection);
        }
    }
});
document.addEventListener('focusout', (event) => {
    const input = event.target;
    if (!input.matches?.([
        '[data-customer-signup-form] input[type="email"][name="email"]',
        '[data-login-form] input[type="email"][name="email"]',
        '[data-settings-section="customer"] [data-account-field="email"]',
        '[data-settings-section="seller"] [data-account-field="email"]',
        '[data-settings-section="rider"] [data-account-field="email"]'
    ].join(', '))) {
        return;
    }

    input.setCustomValidity('');
    const typedValue = String(input.value || '').trim();
    if (!typedValue) {
        clearFieldError(input);
        return;
    }
    const message = emailValidationMessage(typedValue, input.validity) || input.validationMessage;
    input.setCustomValidity(message);

    if (message) {
        showFieldError(input, message, { focus: false });
        return;
    }

    input.value = String(input.value || '').trim().toLowerCase();
    clearFieldError(input);
});
document.addEventListener('change', (event) => {
    if (!event.target.matches?.('[data-image-upload]')) {
        return;
    }

    try {
        validateImageInput(event.target, imageUploadLabel(event.target));
    } catch (error) {
        // Inline validation already explains the issue.
    }
});
document.addEventListener('invalid', (event) => {
    const input = event.target;
    if (!input.matches?.('input[type="email"], [data-account-field="email"]')) {
        return;
    }

    input.setCustomValidity('');
    const typedValue = String(input.value || '').trim();
    if (!typedValue) {
        clearFieldError(input);
        return;
    }
    const message = emailValidationMessage(typedValue, input.validity) || input.validationMessage;
    input.setCustomValidity(message);
    if (message) {
        showFieldError(input, message);
    }
}, true);
const appInitializers = [
    ['initMoreMenu', initMoreMenu],
    ['initAccountModals', initAccountModals],
    ['initThemeToggles', initThemeToggles],
    ['initGuestSettingsDrawer', initGuestSettingsDrawer],
    ['initLocationPicker', initLocationPicker],
    ['initCustomerProfileModal', initCustomerProfileModal],
    ['initCustomerAddressManagers', initCustomerAddressManagers],
    ['initAuthChrome', initAuthChrome],
    ['initBackForwardAuthGuard', initBackForwardAuthGuard],
    ['initStorefront', initStorefront],
    ['initPasswordReset', initPasswordReset],
    ['initLoginPage', initLoginPage],
    ['initCustomerDashboard', initCustomerDashboard],
    ['initRiderApplication', initRiderApplication],
    ['initRiderDashboard', initRiderDashboard],
    ['initSellerRegistration', initSellerRegistration],
    ['initSellerDashboard', initSellerDashboard],
    ['initAdminDashboard', initAdminDashboard],
    ['initApplicationStatus', initApplicationStatus],
    ['initRoleFooterNavigation', initRoleFooterNavigation],
    ['initLogout', initLogout],
    ['initUtilityActions', initUtilityActions],
    ['initPasswordToggles', initPasswordToggles],
    ['initPasswordStrengthMeters', initPasswordStrengthMeters],
    ['initUiMotion', initUiMotion]
];

async function bootstrapHonestbeeApp() {
    await startFirebaseAuthStateSync();
    appInitializers.forEach(([name, initializer]) => runInitializer(name, initializer));
    refreshIcons();
    translatePage();
}

bootstrapHonestbeeApp().catch((error) => console.error('honestbee app failed', error));

// Safety fix: make sure Merchant Profile always shows the Choose Location button beside Merchant Address.
(function ensureMerchantProfileChooseLocationButton() {
    function ensureButton() {
        const merchantAddressInput = document.querySelector('[data-settings-section="seller"] [data-account-field="storeAddress"]');
        if (!merchantAddressInput) {
            return;
        }

        const field = merchantAddressInput.closest('[data-address-picker-field]');
        if (!field || field.querySelector('[data-location-picker-open]')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'ghost-button';
        button.type = 'button';
        button.setAttribute('data-location-picker-open', '');
        button.innerHTML = '<i data-lucide="map-pin" aria-hidden="true"></i> Choose Location';
        const partsInput = field.querySelector('[data-address-parts]');
        field.insertBefore(button, partsInput || null);
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureButton);
    } else {
        ensureButton();
    }
})();
