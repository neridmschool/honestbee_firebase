import {
    firebaseAddDoc,
    firebaseArrayUnion,
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
    firebaseUpdateDoc,
    firebaseWhere,
    firestoreDb
} from './firebase-config.js';

// Firestore compatibility layer:
// The UI uses a compact data API shaped like Firestore. These helpers normalize
// older field names while all runtime reads and writes go through Cloud Firestore.
export const db = firestoreDb;

export const collections = {
    customer: 'customer',
    customerOrder: 'customer_order',
    delivery: 'delivery',
    merchant: 'merchant',
    orders: 'orders',
    orderItem: 'order_item',
    paymentTransaction: 'payment_transaction',
    products: 'products',
    rating: 'rating',
    refund: 'refund',
    shopper: 'shopper',
    stores: 'stores',
    substitution: 'substitution',
    userAccount: 'USER_ACCOUNT'
};

const firestoreCollectionMap = {
    customer: 'customers',
    customers: 'customers',
    merchant: 'merchants',
    merchants: 'merchants',
    shopper: 'riders',
    rider: 'riders',
    riders: 'riders',
    USER_ACCOUNT: 'users',
    userAccount: 'users',
    users: 'users',
    products: 'products',
    stores: 'merchants',
    orders: 'orders',
    customer_order: 'orders',
    delivery: 'orders',
    order_item: 'order_items',
    payment_transaction: 'payment_transactions',
    rating: 'ratings',
    ratings: 'ratings',
    refund: 'refunds',
    refunds: 'refunds',
    substitution: 'substitutions'
};


const fieldAliases = {
    USER_id: ['USER_id', 'id'],
    USER_email: ['USER_email', 'email', 'ownerEmail', 'SHOP_email', 'MERCH_ownerEmail', 'CUST_email'],
    USER_role: ['USER_role', 'role'],
    USER_status: ['USER_status', 'status', 'approvalStatus'],
    USER_linkedId: ['USER_linkedId', 'id'],
    CUST_id: ['CUST_id', 'customerId', 'id'],
    CUST_email: ['CUST_email', 'email', 'USER_email'],
    CUST_phone: ['CUST_phone', 'phone'],
    MERCH_id: ['MERCH_id', 'merchantId', 'id'],
    MERCH_name: ['MERCH_name', 'storeName', 'name'],
    MERCH_ownerEmail: ['MERCH_ownerEmail', 'ownerEmail', 'email', 'USER_email'],
    MERCH_type: ['MERCH_type', 'merchantType', 'type'],
    SHOP_id: ['SHOP_id', 'RIDER_id', 'riderId', 'id'],
    RIDER_id: ['RIDER_id', 'SHOP_id', 'riderId', 'id'],
    SHOP_email: ['SHOP_email', 'email', 'USER_email'],
    ORDER_id: ['ORDER_id', 'orderId', 'id'],
    CUST_id: ['CUST_id', 'customerId', 'id'],
    RATE_id: ['RATE_id', 'ratingId', 'id'],
    REFUND_id: ['REFUND_id', 'refundId', 'id']
};

function candidateFieldNames(field) {
    return fieldAliases[field] || [field];
}

function valueForField(record, field) {
    for (const name of candidateFieldNames(field)) {
        if (Object.prototype.hasOwnProperty.call(record, name)) {
            return record[name];
        }
    }
    return undefined;
}

function matchesCondition(record, condition) {
    const left = valueForField(record, condition.field);
    const right = condition.value;
    switch (condition.op) {
        case '=':
        case '==':
            return left === right;
        case '!=':
            return left !== right;
        case '<':
            return left < right;
        case '<=':
            return left <= right;
        case '>':
            return left > right;
        case '>=':
            return left >= right;
        case 'array-contains':
            return Array.isArray(left) && left.includes(right);
        default:
            return left === right;
    }
}

function queryConditions(reference) {
    return (reference?.clauses || []).filter((clause) => clause?.kind === 'where');
}

function queryLimit(reference) {
    return (reference?.clauses || []).find((clause) => clause?.kind === 'limit')?.value || 100;
}

function hasLegacyAliasCondition(reference) {
    return queryConditions(reference).some((condition) => (fieldAliases[condition.field] || []).length > 1);
}

function mapCollectionName(name) {
    return firestoreCollectionMap[name] || name;
}

function withId(snapshot) {
    const data = snapshot.data ? snapshot.data() : {};
    return {
        id: snapshot.id,
        ...(data || {})
    };
}

function normalizeReference(input) {
    if (!input) {
        return null;
    }
    if (input.kind === 'query') {
        return input.reference;
    }
    return input;
}

function collectionPath(reference) {
    const name = mapCollectionName(reference?.name || reference);
    return firebaseCollection(firestoreDb, name);
}

function documentPath(reference) {
    if (reference?.path) {
        return reference.path;
    }
    const name = mapCollectionName(reference?.name || '');
    const id = String(reference?.id || '').trim();
    if (!id) {
        return firebaseDoc(firebaseCollection(firestoreDb, name));
    }
    return firebaseDoc(firestoreDb, name, id);
}

function documentSnapshot(record, ref = null, exists = true) {
    return {
        id: record?.id || ref?.id || '',
        ref,
        exists: () => exists,
        data: () => ({ ...(record || {}) })
    };
}

function querySnapshot(records) {
    return {
        docs: records.map((record) => documentSnapshot(record.data, record.ref, true)),
        empty: records.length === 0,
        size: records.length
    };
}

export function collection(_db, name) {
    return {
        kind: 'collection',
        name
    };
}

export function doc(_db, name, id) {
    return {
        kind: 'document',
        name,
        id
    };
}

export function where(field, op, value) {
    return {
        kind: 'where',
        field,
        op,
        value
    };
}

export function limit(value) {
    return {
        kind: 'limit',
        value: Number(value) || 100
    };
}

export function query(reference, ...clauses) {
    return {
        kind: 'query',
        reference,
        clauses
    };
}

export function serverTimestamp() {
    return firebaseServerTimestamp();
}

export function arrayUnion(...values) {
    return firebaseArrayUnion(...values);
}

function buildFirestoreQuery(reference) {
    if (reference?.kind !== 'query') {
        return collectionPath(reference);
    }

    const base = collectionPath(reference.reference);
    const firestoreClauses = [];

    for (const clause of reference.clauses || []) {
        if (clause?.kind === 'where') {
            firestoreClauses.push(firebaseWhere(clause.field, clause.op === '=' ? '==' : clause.op, clause.value));
        }
        if (clause?.kind === 'limit') {
            firestoreClauses.push(firebaseLimit(clause.value));
        }
    }

    return firestoreClauses.length ? firebaseQuery(base, ...firestoreClauses) : base;
}

export async function getDocs(reference) {
    let snapshot = await firebaseGetDocs(buildFirestoreQuery(reference));
    let records = snapshot.docs.map((item) => ({
        ref: item.ref,
        data: withId(item)
    }));

    // Compatibility fallback for legacy field names, such as USER_email querying
    // the Firebase users collection that stores email as `email`.
    if (reference?.kind === 'query' && (records.length === 0 || hasLegacyAliasCondition(reference))) {
        const allSnapshot = await firebaseGetDocs(collectionPath(reference.reference));
        const conditions = queryConditions(reference);
        records = allSnapshot.docs
            .map((item) => ({ ref: item.ref, data: withId(item) }))
            .filter((item) => conditions.every((condition) => matchesCondition(item.data, condition)))
            .slice(0, queryLimit(reference));
    }

    return querySnapshot(records);
}

export async function getDoc(reference) {
    const ref = documentPath(reference);
    const snapshot = await firebaseGetDoc(ref);
    return documentSnapshot(snapshot.exists() ? withId(snapshot) : { id: reference?.id || ref.id }, ref, snapshot.exists());
}

export async function addDoc(reference, data) {
    const docRef = await firebaseAddDoc(collectionPath(normalizeReference(reference)), data || {});
    return {
        id: docRef.id,
        ref: docRef
    };
}

export async function nextId(collectionName) {
    const prefix = String(collectionName || 'doc')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'doc';
    const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${random}`;
}

export async function setDoc(reference, data, options = {}) {
    await firebaseSetDoc(documentPath(reference), data || {}, { merge: Boolean(options.merge) });
}

export async function updateDoc(reference, data) {
    await firebaseSetDoc(documentPath(reference), data || {}, { merge: true });
}

export async function deleteDoc(reference) {
    await firebaseDeleteDoc(documentPath(reference));
}

export function onSnapshot(reference, onNext, onError) {
    const ref = reference?.kind === 'document' ? documentPath(reference) : buildFirestoreQuery(reference);
    return firebaseOnSnapshot(
        ref,
        (snapshot) => {
            if (reference?.kind === 'document') {
                onNext(documentSnapshot(snapshot.exists() ? withId(snapshot) : { id: reference?.id || snapshot.id }, snapshot.ref, snapshot.exists()));
                return;
            }

            onNext(querySnapshot(snapshot.docs.map((item) => ({
                ref: item.ref,
                data: withId(item)
            }))));
        },
        onError
    );
}
