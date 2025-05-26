const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_PATH = path.join(__dirname, 'explanationCache.json');

// Local in-memory cache
const explanationCache = new Map();

// Utility to hash the code snippet
function getHash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

// Load cache from JSON file into the Map
function loadCacheFromDisk() {
    if (fs.existsSync(CACHE_PATH)) {
        try {
            const raw = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
            for (const key in raw) {
                explanationCache.set(key, raw[key]);
            }
            console.log("[Cache] Loaded from disk.");
        } catch (err) {
            console.warn("[Cache] Failed to parse cache file. Starting with empty cache.");
        }
    }
}

// Save the current Map to JSON file
function saveCacheToDisk() {
    const obj = Object.fromEntries(explanationCache);
    fs.writeFileSync(CACHE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    console.log("[Cache] Saved to disk.");
}

// Retrieve explanation list from cache
function getCachedExplanation(sourceCode) {
    const key = getHash(sourceCode);
    const element = explanationCache.get(key);
    if (element) {
         console.log(`Reading from cache: ${JSON.stringify(element, null, 2)}`);
    }

    return element;
}

// Store explanation list in cache and persist to disk
function storeExplanation(sourceCode, elementList) {
    console.log("£££");
    console.log("Saving in cache...");
    const key = getHash(sourceCode);
    explanationCache.set(key, elementList);
    saveCacheToDisk();
}

// Load cache immediately at module import
loadCacheFromDisk();

module.exports = {
    getCachedExplanation,
    storeExplanation
};