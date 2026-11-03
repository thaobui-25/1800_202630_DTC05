import { db } from "./firebaseConfig.js";
import { onAuthReady } from "/src/authentication.js";
import { doc, getDoc } from "firebase/firestore";

// outfit ID from the URL (eachClothing.html?docID=abc123)
const params = new URL(window.location.href).searchParams;
const outfitId = params.get("docID");

function showItem(prefix, item) {
    document.getElementById(prefix + "Name").textContent = item.name;
    const img = document.getElementById(prefix + "Image");
    img.src = item.imageUrl;
    img.alt = item.name;
}

async function displayOutfit(user) {
    try {
        const outfitSnap = await getDoc(doc(db, "users", user.uid, "outfits", outfitId));
        if (!outfitSnap.exists()) throw new Error("Outfit not found");
        const outfit = outfitSnap.data();

        const items = await Promise.all(
            outfit.itemIds.map(async (id) => {
                const snap = await getDoc(doc(db, "users", user.uid, "items", id));
                return snap.data();
            })
        );

        document.getElementById("outfitName").textContent = outfit.name;
        const shirt = items.find(i => i && i.category === "shirt");
        const pants = items.find(i => i && i.category === "pants");
        if (shirt) showItem("shirt", shirt);
        if (pants) showItem("pants", pants);
    } catch (error) {
        console.error("Error loading outfit:", error);
        document.getElementById("outfitName").textContent = "Error loading outfit.";
    }
}

onAuthReady((user) => {
    if (user) displayOutfit(user);
    else console.log("user not logged in");
});