import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";   // CHANGED: addDoc, serverTimestamp

// CHANGED: what the user has picked. Only ONE shirt and ONE pants at a time.
const selected = { shirt: null, pants: null };   // each holds { id, name, card, badge } or null
let currentUser = null;

// CHANGED: updates the button and the status text to match the selection
function updateSelectionUI() {
    const btn = document.getElementById("createOutfitBtn");
    const status = document.getElementById("selectionStatus");

    btn.disabled = !(selected.shirt && selected.pants);

    const shirtText = selected.shirt ? selected.shirt.name : "none";
    const pantsText = selected.pants ? selected.pants.name : "none";
    status.textContent = `Shirt: ${shirtText}  |  Pants: ${pantsText}`;
}

// CHANGED: marks or unmarks a card as selected
function setCardSelected(entry, isSelected) {
    entry.card.style.outline = isSelected ? "3px solid #0d6efd" : "";
    entry.badge.classList.toggle("d-none", !isSelected);
}

// CHANGED: click on a card. Picking a new shirt un-picks the old shirt (same for pants).
function toggleSelect(category, entry) {
    const current = selected[category];

    if (current && current.id === entry.id) {
        // clicked the selected card again, so un-select it
        setCardSelected(current, false);
        selected[category] = null;
    } else {
        // un-select the previous one of this type, then select the new one
        if (current) setCardSelected(current, false);
        setCardSelected(entry, true);
        selected[category] = entry;
    }
    updateSelectionUI();
}

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
        card.className = "card h-100 position-relative";   // CHANGED: position-relative for the badge

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

        // CHANGED: "Selected" badge, hidden until the card is picked
        const badge = document.createElement("span");
        badge.className = "badge bg-primary position-absolute top-0 end-0 m-1 d-none";
        badge.textContent = "Selected";

        card.append(img, body, badge);
        col.appendChild(card);
        container.appendChild(col);

        // CHANGED: only shirt and pants cards can be selected
        const category = item.category;
        if (category === "shirt" || category === "pants") {
            card.style.cursor = "pointer";
            const entry = { id: itemDoc.id, name: item.name, card, badge };
            card.addEventListener("click", () => toggleSelect(category, entry));
        }
    });
}

// CHANGED: save the chosen pair as an outfit, then go see it on the home page
async function createOutfit() {
    if (!currentUser || !selected.shirt || !selected.pants) return;

    const btn = document.getElementById("createOutfitBtn");
    btn.disabled = true;                   // stop double-clicks while saving

    try {
        await addDoc(collection(db, "users", currentUser.uid, "outfits"), {
            name: `${selected.shirt.name} + ${selected.pants.name}`,
            itemIds: [selected.shirt.id, selected.pants.id],
            createdAt: serverTimestamp()
        });
        location.href = "main.html";
    } catch (error) {
        alert(`Error creating outfit:\n${error.code || ""}\n${error.message || error}`);
        btn.disabled = false;
    }
}

document.getElementById("createOutfitBtn").addEventListener("click", createOutfit);

// Wait for Firebase to tell us who is logged in
onAuthReady((user) => {
    if (!user) {
        location.href = "index.html";   // not logged in, go away
        return;
    }
    currentUser = user;
    displayItems(user);
});