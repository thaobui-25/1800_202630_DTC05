import { db } from "./firebaseConfig.js";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

const img = (text) => `https://placehold.co/300x400?text=${encodeURIComponent(text)}`;

const presetItems = [
    { id: "shirt1", name: "White tee", category: "shirt", color: "white", imageUrl: img("White Tee") },
    { id: "shirt2", name: "Green hoodie", category: "shirt", color: "green", imageUrl: img("Green Hoodie") },
    { id: "shirt3", name: "Black polo", category: "shirt", color: "black", imageUrl: img("Black Polo") },
    { id: "pants1", name: "Blue jeans", category: "pants", color: "blue", imageUrl: img("Blue Jeans") },
    { id: "pants2", name: "Black chinos", category: "pants", color: "black", imageUrl: img("Black Chinos") },
    { id: "pants3", name: "Khaki shorts", category: "pants", color: "khaki", imageUrl: img("Khaki Shorts") },
];

// each outfit = one shirt + one pants (stored as item IDs)
const presetOutfits = [
    { id: "outfit1", name: "Casual day", itemIds: ["shirt1", "pants1"] },
    { id: "outfit2", name: "Cozy evening", itemIds: ["shirt2", "pants2"] },
    { id: "outfit3", name: "Summer walk", itemIds: ["shirt3", "pants3"] },
];

export async function seedItemsIfEmpty(uid) {
    const existing = await getDocs(collection(db, "users", uid, "items"));
    if (!existing.empty) return;

    console.log("Closet is empty, adding preset items...");

    for (const { id, ...data } of presetItems) {
        await setDoc(doc(db, "users", uid, "items", id), {
            ...data,
            last_updated: serverTimestamp()
        });
    }
    for (const { id, ...data } of presetOutfits) {
        await setDoc(doc(db, "users", uid, "outfits", id), {
            ...data,
            createdAt: serverTimestamp()
        });
    }
}