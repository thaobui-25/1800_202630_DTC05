import { onAuthReady } from "/src/authentication.js";
import { db } from "./firebaseConfig.js";
import { collection, getDocs, doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { seedItemsIfEmpty } from "./seedItems.js";

// shared by displayPairs, setupHeart and toggleFavourite
let favourites = [];      // outfit IDs the user has hearted
let currentUid = null;    // logged-in user's id

function showName() {
    console.log("test showName")
    onAuthReady(function (user) {
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

    // read this user's favourites (array of outfit IDs) from Firestore
    currentUid = user.uid;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    favourites = userSnap.exists() ? (userSnap.data().favourites || []) : [];

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

        // heart icon pinned to the top-right of the card
        card.classList.add("position-relative");
        const heartIcon = document.createElement("i");
        heartIcon.className = "bi bi-heart fav-btn text-danger position-absolute top-0 end-0 m-2 fs-4";
        heartIcon.style.cursor = "pointer";
        card.appendChild(heartIcon);
        setupHeart(card, outfitDoc.id);

        col.appendChild(card);
        container.appendChild(col);
    });
}

// Gets ONE card's heart ready: fills it if favourited, wires the click
function setupHeart(card, outfitID) {
    const heart = card.querySelector(".fav-btn");

    if (favourites.includes(outfitID)) {
        heart.classList.replace("bi-heart", "bi-heart-fill");
    }

    heart.addEventListener("click", function (e) {
        e.preventDefault();    // the card is an <a>, so don't follow the link
        e.stopPropagation();
        toggleFavourite(heart, outfitID);
    });
}

// Adds or removes this outfit's ID in the user's favourites array
async function toggleFavourite(heart, outfitID) {
    const userRef = doc(db, "users", currentUid);
    const isFav = heart.classList.contains("bi-heart-fill");

    try {
        await setDoc(
            userRef,
            { favourites: isFav ? arrayRemove(outfitID) : arrayUnion(outfitID) },
            { merge: true }
        );

        if (isFav) {
            heart.classList.replace("bi-heart-fill", "bi-heart");
            favourites = favourites.filter((id) => id !== outfitID);
        } else {
            heart.classList.replace("bi-heart", "bi-heart-fill");
            favourites.push(outfitID);
        }
    } catch (error) {
        console.error("Could not update favourite:", error);
    }
}

// Seed the preset once, then display the pairs
onAuthReady(async (user) => {
    if (!user) return;
    await seedItemsIfEmpty(user.uid);
    await displayPairs(user);
});