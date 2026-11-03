import { onAuthReady } from "/src/authentication.js";
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";
import { seedItemsIfEmpty } from "./seedItems.js";

function showName() {
    console.log("test showName")
    onAuthReady(function (user) {
        // console.log(user.displayName);
        if (user) {
            const name = document.getElementById("name-goes-here");
            const nameInFirebase = user.displayName || user.email;
            name.textContent = nameInFirebase;
        } else {
            console.log("user not logged in")
        }
    })
}

showName();

// Show each saved outfit as a shirt + pants pair
async function displayPairs(user) {
    const container = document.getElementById("outfits-go-here");
    if (!container) return;

    // load all items once, keyed by ID
    const itemsSnap = await getDocs(collection(db, "users", user.uid, "items"));
    const itemsById = {};
    itemsSnap.forEach((d) => { itemsById[d.id] = d.data(); });

    const outfitsSnap = await getDocs(collection(db, "users", user.uid, "outfits"));
    container.replaceChildren();

    outfitsSnap.forEach((outfitDoc) => {
        const outfit = outfitDoc.data();
        const pieces = outfit.itemIds.map((id) => itemsById[id]).filter(Boolean);

        const col = document.createElement("div");
        col.className = "col";

        const card = document.createElement("a");
        card.href = `eachClothing.html?docID=${outfitDoc.id}`;
        card.className = "card h-100 text-decoration-none text-dark";

        const pair = document.createElement("div");
        pair.className = "d-flex";
        pieces.forEach((item) => {
            const pic = document.createElement("img");
            pic.src = item.imageUrl;
            pic.alt = item.name;
            pic.className = "w-50";
            pair.appendChild(pic);
        });

        const body = document.createElement("div");
        body.className = "card-body";
        const title = document.createElement("h5");
        title.className = "card-title";
        title.textContent = outfit.name;
        body.appendChild(title);

        card.append(pair, body);
        col.appendChild(card);
        container.appendChild(col);
    });
}

// Seed the preset once, then display the pairs
onAuthReady(async (user) => {
    if (!user) return;
    await seedItemsIfEmpty(user.uid);
    await displayPairs(user);
});