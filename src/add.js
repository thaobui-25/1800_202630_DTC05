import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";   // CHANGED: doc, getDoc, setDoc instead of collection, addDoc

// Remember the logged-in user so we know WHOSE closet to save into
let currentUser = null;

onAuthReady(function (user) {
    if (!user) {
        location.href = "index.html";   // Not logged in → go away
        return;
    }
    currentUser = user;                 // Logged in → remember them
});

// CHANGED: new helper. "Blue Jeans!" → "blue-jeans"
function makeItemId(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")    // anything that isn't a letter or number becomes "-"
        .replace(/^-+|-+$/g, "");       // remove "-" from the start and end
}

// ---- (1) What to do when the form is submitted ----
async function saveItem(event) {
    event.preventDefault();   // Stop the browser from reloading the page

    // Safety: the form could be submitted before Firebase finishes checking login
    if (!currentUser) {
        alert("Still checking your login, try again in a second.");
        return;
    }

    // 1. Collect the form values into ONE object (this becomes the Firestore document)
    const name = document.getElementById("itemNameInput").value.trim();
    const imageUrl = document.getElementById("imageUrlInput").value.trim();

    // CHANGED: the document ID comes from the name
    const itemId = makeItemId(name);
    if (!itemId) {
        alert("Please enter a name that has letters or numbers in it.");
        return;
    }

    const newItem = {
        name: name,
        category: document.getElementById("itemTypeInput").value,     // "shirt" or "pants"
        color: document.getElementById("colorInput").value.trim(),
        // no image yet? use a placeholder with the item's name on it
        imageUrl: imageUrl || `https://placehold.co/300x400?text=${encodeURIComponent(name)}`,
        last_updated: serverTimestamp()                               // WHEN it was added
    };

    try {
        // CHANGED: point at users/{uid}/items/{itemId}
        const itemRef = doc(db, "users", currentUser.uid, "items", itemId);

        // CHANGED: setDoc overwrites, so check whether this name is already taken
        const existing = await getDoc(itemRef);
        if (existing.exists()) {
            const ok = confirm(`"${name}" already exists in your closet. Replace it?`);
            if (!ok) return;
        }

        // CHANGED: setDoc with our own ID instead of addDoc with a random one
        await setDoc(itemRef, newItem);
        location.href = "main.html";    // 3. Go back to the home page
    } catch (error) {
        alert(`Error saving item:\n${error.code || ""}\n${error.message || error}`);
    }
}

// ---- (2) Connect it: "form, when you are submitted, run saveItem" ----
document.getElementById("addItemForm").addEventListener("submit", saveItem);