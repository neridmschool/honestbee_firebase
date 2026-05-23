const API_URL = 'includes/mysql_api.php';

export const db = {
    provider: 'mysql'
};

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

async function mysqlApi(payload) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
        throw new Error(data.error || 'MySQL request failed.');
    }

    return data;
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

function documentSnapshot(record, exists = true) {
    return {
        id: record?.id || '',
        exists: () => exists,
        data: () => ({ ...(record || {}) })
    };
}

function querySnapshot(records) {
    return {
        docs: records.map((record) => documentSnapshot(record, true)),
        empty: records.length === 0,
        size: records.length
    };
}

function stableSnapshotValue(value) {
    if (Array.isArray(value)) {
        return value.map(stableSnapshotValue);
    }

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((normalized, key) => {
                normalized[key] = stableSnapshotValue(value[key]);
                return normalized;
            }, {});
    }

    return value;
}

function snapshotSignature(snapshot) {
    if (Array.isArray(snapshot?.docs)) {
        return JSON.stringify(snapshot.docs.map((item) => stableSnapshotValue({
            id: item.id,
            data: item.data()
        })));
    }

    return JSON.stringify(stableSnapshotValue({
        id: snapshot?.id || '',
        exists: snapshot?.exists?.() || false,
        data: snapshot?.exists?.() ? snapshot.data() : null
    }));
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
    return {
        __serverTimestamp: true
    };
}

export function arrayUnion(...values) {
    return {
        __op: 'arrayUnion',
        values
    };
}

function queryPayload(reference) {
    const filters = [];
    let max = 100;

    if (reference?.kind === 'query') {
        for (const clause of reference.clauses || []) {
            if (clause?.kind === 'where') {
                filters.push({
                    field: clause.field,
                    op: clause.op,
                    value: clause.value
                });
            }
            if (clause?.kind === 'limit') {
                max = clause.value;
            }
        }
        reference = reference.reference;
    }

    return {
        collection: reference?.name,
        filters,
        limit: max
    };
}

export async function getDocs(reference) {
    const payload = queryPayload(reference);
    const result = await mysqlApi({
        action: 'list',
        collection: payload.collection,
        filters: payload.filters,
        limit: payload.limit
    });

    return querySnapshot(result.records || []);
}

export async function getDoc(reference) {
    const result = await mysqlApi({
        action: 'get',
        collection: reference.name,
        id: reference.id
    });

    return documentSnapshot(result.record, Boolean(result.exists));
}

export async function addDoc(reference, data) {
    const result = await mysqlApi({
        action: 'add',
        collection: normalizeReference(reference).name,
        data
    });

    return {
        id: result.id
    };
}

export async function nextId(collectionName) {
    const result = await mysqlApi({
        action: 'nextId',
        collection: collectionName
    });

    return result.id;
}

export async function setDoc(reference, data, options = {}) {
    await mysqlApi({
        action: 'set',
        collection: reference.name,
        id: reference.id,
        data,
        merge: Boolean(options.merge)
    });
}

export async function updateDoc(reference, data) {
    await mysqlApi({
        action: 'update',
        collection: reference.name,
        id: reference.id,
        data,
        merge: true
    });
}

export async function deleteDoc(reference) {
    await mysqlApi({
        action: 'delete',
        collection: reference.name,
        id: reference.id
    });
}

export function onSnapshot(reference, onNext, onError) {
    let isClosed = false;
    let timer = null;
    let lastSignature = null;

    async function load() {
        if (isClosed) {
            return;
        }

        try {
            const snapshot = reference.kind === 'document'
                ? await getDoc(reference)
                : await getDocs(reference);

            const signature = snapshotSignature(snapshot);
            if (!isClosed && signature !== lastSignature) {
                onNext(snapshot);
                lastSignature = signature;
            }
        } catch (error) {
            if (onError && !isClosed) {
                onError(error);
            }
        }
    }

    load();
    timer = window.setInterval(load, 3500);

    return () => {
        isClosed = true;
        if (timer) {
            window.clearInterval(timer);
        }
    };
}
