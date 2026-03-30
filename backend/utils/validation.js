class RequestValidationError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'RequestValidationError';
        this.statusCode = statusCode;
    }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_URL_REGEX = /^(https?:\/\/|\/images\/)/i;
const CARD_EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;
const POSTAL_CODE_REGEX = /^[A-Za-z0-9 -]{3,12}$/;

const toCleanString = (value) => {
    if (typeof value !== 'string') return '';
    return value
        .replace(/\u0000/g, '')
        .replace(/[\u0001-\u001F\u007F]/g, '')
        .trim();
};

const sanitizeString = (value, label, options = {}) => {
    const {
        minLength = 1,
        maxLength = 255,
        allowEmpty = false,
        normalizeWhitespace = true
    } = options;

    let cleaned = toCleanString(value);
    if (normalizeWhitespace) {
        cleaned = cleaned.replace(/\s+/g, ' ');
    }

    if (!allowEmpty && cleaned.length < minLength) {
        throw new RequestValidationError(`${label} is required`);
    }
    if (cleaned.length > maxLength) {
        throw new RequestValidationError(`${label} is too long`);
    }
    return cleaned;
};

const sanitizeEmail = (value, label = 'Email') => {
    const cleaned = sanitizeString(value, label, { minLength: 5, maxLength: 254 }).toLowerCase();
    if (!EMAIL_REGEX.test(cleaned)) {
        throw new RequestValidationError(`${label} is invalid`);
    }
    return cleaned;
};

const sanitizeInteger = (value, label, options = {}) => {
    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true } = options;
    if (!required && (value === undefined || value === null || value === '')) {
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) {
        throw new RequestValidationError(`${label} must be an integer`);
    }
    if (parsed < min || parsed > max) {
        throw new RequestValidationError(`${label} is out of range`);
    }
    return parsed;
};

const sanitizeNumber = (value, label, options = {}) => {
    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true } = options;
    if (!required && (value === undefined || value === null || value === '')) {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new RequestValidationError(`${label} must be a number`);
    }
    if (parsed < min || parsed > max) {
        throw new RequestValidationError(`${label} is out of range`);
    }
    return parsed;
};

const sanitizeBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    return Boolean(value);
};

const sanitizeImageUrl = (value) => {
    const cleaned = sanitizeString(value ?? '', 'Image URL', {
        allowEmpty: true,
        maxLength: 2048,
        minLength: 0
    });
    if (!cleaned) return '';
    if (!IMAGE_URL_REGEX.test(cleaned)) {
        throw new RequestValidationError('Image URL must start with /images/ or http(s)://');
    }
    return cleaned;
};

const sanitizeItemsArray = (itemsValue) => {
    if (!Array.isArray(itemsValue) || itemsValue.length === 0) {
        throw new RequestValidationError('Order items are required');
    }
    if (itemsValue.length > 100) {
        throw new RequestValidationError('Too many order items');
    }

    return itemsValue.map((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new RequestValidationError(`Order item ${index + 1} is invalid`);
        }

        return {
            id: sanitizeInteger(entry.id, `Order item ${index + 1} id`, { min: 1, max: 1_000_000_000 }),
            name: sanitizeString(entry.name, `Order item ${index + 1} name`, { maxLength: 150 }),
            price: sanitizeNumber(entry.price, `Order item ${index + 1} price`, { min: 0.01, max: 1_000_000 }),
            quantity: sanitizeInteger(entry.quantity ?? 1, `Order item ${index + 1} quantity`, { min: 1, max: 100 })
        };
    });
};

const sanitizeRegisterPayload = (body) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new RequestValidationError('Invalid request payload');
    }

    const firstName = sanitizeString(body.firstName ?? '', 'First name', { allowEmpty: true, maxLength: 50 });
    const lastName = sanitizeString(body.lastName ?? '', 'Last name', { allowEmpty: true, maxLength: 50 });
    const combinedName = [firstName, lastName].filter(Boolean).join(' ');

    const name = body.name
        ? sanitizeString(body.name, 'Name', { maxLength: 80 })
        : sanitizeString(combinedName, 'Name', { maxLength: 80 });

    return {
        name,
        email: sanitizeEmail(body.email),
        password: sanitizeString(body.password, 'Password', { minLength: 8, maxLength: 128, normalizeWhitespace: false })
    };
};

const sanitizeLoginPayload = (body) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new RequestValidationError('Invalid request payload');
    }

    return {
        email: sanitizeEmail(body.email),
        password: sanitizeString(body.password, 'Password', { minLength: 1, maxLength: 128, normalizeWhitespace: false })
    };
};

const sanitizeOrderPayload = (body, authUserId) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new RequestValidationError('Invalid request payload');
    }

    const cardNumberDigits = sanitizeString(body.cardNumber, 'Card number', {
        minLength: 12,
        maxLength: 25,
        normalizeWhitespace: false
    }).replace(/\s+/g, '');

    if (!/^\d{12,19}$/.test(cardNumberDigits)) {
        throw new RequestValidationError('Card number is invalid');
    }

    const cvv = sanitizeString(body.cardCVV ?? body.cardCVC, 'CVV', {
        minLength: 3,
        maxLength: 4,
        normalizeWhitespace: false
    });
    if (!/^\d{3,4}$/.test(cvv)) {
        throw new RequestValidationError('CVV is invalid');
    }

    const cardExpiry = sanitizeString(body.cardExpiry, 'Card expiry', {
        minLength: 5,
        maxLength: 5,
        normalizeWhitespace: false
    });
    if (!CARD_EXPIRY_REGEX.test(cardExpiry)) {
        throw new RequestValidationError('Card expiry must match MM/YY');
    }

    const postalCode = sanitizeString(body.postalCode, 'Postal code', { minLength: 3, maxLength: 12 });
    if (!POSTAL_CODE_REGEX.test(postalCode)) {
        throw new RequestValidationError('Postal code is invalid');
    }

    const cardLast4 = cardNumberDigits.slice(-4);

    return {
        firstName: sanitizeString(body.firstName, 'First name', { maxLength: 50 }),
        lastName: sanitizeString(body.lastName, 'Last name', { maxLength: 50 }),
        userId: sanitizeInteger(authUserId, 'User ID', { min: 1 }),
        email: sanitizeEmail(body.email),
        address: sanitizeString(body.address, 'Address', { maxLength: 200 }),
        city: sanitizeString(body.city, 'City', { maxLength: 80 }),
        postalCode,
        cardName: sanitizeString(body.cardName, 'Card name', { maxLength: 80 }),
        cardNumber: `**** **** **** ${cardLast4}`,
        expiryDate: '',
        cvv: '',
        totalPrice: sanitizeNumber(body.totalPrice, 'Total price', { min: 0.01, max: 1_000_000 }),
        items: sanitizeItemsArray(body.items)
    };
};

const sanitizeItemPayload = (body, options = {}) => {
    const { partial = false } = options;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new RequestValidationError('Invalid request payload');
    }

    const output = {};

    if (!partial || body.name !== undefined) {
        output.name = sanitizeString(body.name, 'Name', { maxLength: 120 });
    }
    if (!partial || body.description !== undefined) {
        output.description = sanitizeString(body.description ?? '', 'Description', {
            allowEmpty: true,
            minLength: 0,
            maxLength: 4000
        });
    }
    if (!partial || body.postedBy !== undefined) {
        output.postedBy = sanitizeString(body.postedBy ?? 'Seller', 'Seller', {
            allowEmpty: true,
            minLength: 0,
            maxLength: 80
        }) || 'Seller';
    }
    if (!partial || body.userId !== undefined) {
        output.userId = sanitizeInteger(body.userId, 'User ID', { min: 1, max: 1_000_000_000 });
    }
    if (!partial || body.price !== undefined) {
        output.price = sanitizeNumber(body.price, 'Price', { min: 0.01, max: 1_000_000 });
    }
    if (!partial || body.hasImage !== undefined) {
        output.hasImage = sanitizeBoolean(body.hasImage);
    }
    if (!partial || body.imageURL !== undefined) {
        output.imageURL = sanitizeImageUrl(body.imageURL);
    }

    return output;
};

const sanitizeItemQuery = (query) => {
    const sanitized = { filter: {}, sortOption: { id: 1 } };

    const minPrice = sanitizeNumber(query.minPrice, 'Minimum price', { min: 0, max: 1_000_000, required: false });
    const maxPrice = sanitizeNumber(query.maxPrice, 'Maximum price', { min: 0, max: 1_000_000, required: false });
    if (minPrice !== null || maxPrice !== null) {
        sanitized.filter.price = {};
        if (minPrice !== null) sanitized.filter.price.$gte = minPrice;
        if (maxPrice !== null) sanitized.filter.price.$lte = maxPrice;
        if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
            throw new RequestValidationError('minPrice cannot be greater than maxPrice');
        }
    }

    if (query.sort === 'price_asc') {
        sanitized.sortOption = { price: 1 };
    } else if (query.sort === 'price_desc') {
        sanitized.sortOption = { price: -1 };
    } else if (query.sort === 'newest') {
        sanitized.sortOption = { createdAt: -1 };
    } else if (query.sort !== undefined && query.sort !== null && query.sort !== '') {
        throw new RequestValidationError('Invalid sort option');
    }

    return sanitized;
};

module.exports = {
    RequestValidationError,
    sanitizeRegisterPayload,
    sanitizeLoginPayload,
    sanitizeOrderPayload,
    sanitizeItemPayload,
    sanitizeItemQuery,
    sanitizeInteger
};

