import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import { collection, getDocs } from "firebase/firestore";

// Reads users/{uid}/items and draws one card per item
async function displayItems(user) {
    const container = document.getElementById("items-go-here");
    container.replaceChildren();   // clear first, so a re-run can't duplicate cards

    const snap = await getDocs(collection(db, "users", user.uid, "items"));

    // nothing in the closet yet
    if (snap.empty) {
        const msg = document.createElement("p");
        msg.className = "text-muted";
        msg.textContent = "Your closet is empty. Tap Add to put your first item in.";
        container.appendChild(msg);
        return;
    }

    snap.forEach((itemDoc) => {
        const item = itemDoc.data();

        const col = document.createElement("div");
        col.className = "col";

        const card = document.createElement("div");
        card.className = "card h-100";

        // picture from the saved URL
        const img = document.createElement("img");
        img.src = item.imageUrl;
        img.alt = item.name;
        img.className = "card-img-top";
        img.style.aspectRatio = "3 / 4";     // keeps every card the same shape
        img.style.objectFit = "cover";
        // if the URL is broken, show a placeholder instead of a broken-image icon
        img.onerror = () => {
            img.onerror = null;              // avoid an endless loop if the placeholder fails too
            img.src = "https://placehold.co/300x400?text=No+image";
        };

        // name under the picture
        const body = document.createElement("div");
        body.className = "card-body p-2";
        const title = document.createElement("h6");
        title.className = "card-title mb-0 text-center";
        title.textContent = item.name;       // textContent, so odd names can't inject HTML
        body.appendChild(title);

        card.append(img, body);
        col.appendChild(card);
        container.appendChild(col);
    });
}

// Wait for Firebase to tell us who is logged in
onAuthReady((user) => {
    if (!user) {
        location.href = "index.html";   // not logged in, go away
        return;
    }
    displayItems(user);
});