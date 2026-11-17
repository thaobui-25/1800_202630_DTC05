import { db } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// The fields we store in Firestore (email comes from Auth, not from here)
const fields = ["name", "country", "school", "bio"];
let currentUser = null;

onAuthReady(async function (user) {
    if (!user) {
        location.href = "index.html";
    } else {
        currentUser = user;

        // 1. Read the document
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data() || {};

        // 2. Header: avatar initial, name, email
        showHeader(data.name || user.displayName || user.email, user.email);

        // 3. Pre-populate each input (empty string if the field doesn't exist yet)
        fields.forEach(field => {
            document.getElementById(field + "Input").value = data[field] || "";
        });
    }
});

// Fill the header: first letter in the circle, name, email
function showHeader(name, email) {
    document.getElementById("avatar").textContent = name.charAt(0).toUpperCase(); //Get the first letter of the name in uppercase (e.g. "elmo" → "E")
    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmail").textContent = email;
}

// ---- (1) What to do when Edit is clicked ----
function enableEdit() {
    fields.forEach(field => document.getElementById(field + "Input").disabled = false);
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("nameInput").focus();
}

// ---- (2) Connect it to the button ----
document.getElementById("editBtn").addEventListener("click", enableEdit);

// ---- (1) What to do when the profile form is submitted ----
async function saveProfile(event) {
    event.preventDefault();

    // Build an object from the inputs: { name: "...", country: "...", school: "...", bio: "..." }
    const updates = {};
    fields.forEach(field => {
        updates[field] = document.getElementById(field + "Input").value;
    });

    try {
        await updateDoc(doc(db, "users", currentUser.uid), updates);

        // Lock the form again, refresh the header, show a confirmation
        fields.forEach(field => document.getElementById(field + "Input").disabled = true);
        document.getElementById("saveBtn").disabled = true;
        showHeader(updates.name, currentUser.email);
        const alertBox = document.getElementById("profileAlert");
        alertBox.textContent = "Profile saved!";
        alertBox.classList.remove("d-none");
    } catch (error) {
        alert(`Error saving profile:\n${error.code || ""}\n${error.message || error}`);
    }
}

// ---- (2) Connect it to the form ----
document.getElementById("profileForm").addEventListener("submit", saveProfile);
