import { onAuthReady } from "/src/authentication.js";

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