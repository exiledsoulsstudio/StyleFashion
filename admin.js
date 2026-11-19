
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// =========================
// FIREBASE INITIALIZATION
// =========================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// =========================
// HTML ELEMENTS
// =========================

const loginPanel = document.getElementById("loginPanel");
const dashboardPanel = document.getElementById("dashboardPanel");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");

const productList = document.getElementById("productList");
const totalProducts = document.getElementById("totalProducts");

const formHeading = document.getElementById("formHeading");
const saveProductBtn = document.getElementById("saveProductBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// CUSTOMER REVIEWS ELEMENTS
const adminReviews = document.getElementById("adminReviews");
const reviewAdminMessage = document.getElementById("reviewAdminMessage");

let editingId = null;


// =========================
// AUTHENTICATION
// =========================

onAuthStateChanged(auth, user => {

    if (user) {

        loginPanel.classList.add("hidden");
        dashboardPanel.classList.remove("hidden");

        loadProducts();
        loadReviews();

    } else {

        dashboardPanel.classList.add("hidden");
        loginPanel.classList.remove("hidden");

    }

});


// =========================
// ADMIN LOGIN
// =========================

loginForm.addEventListener("submit", async event => {

    event.preventDefault();

    loginMessage.textContent = "Signing in...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginMessage.textContent = "";

    } catch (error) {

        console.error(error);

        loginMessage.textContent =
            "Login failed. Check your email and password.";

    }

});


// =========================
// ADMIN LOGOUT
// =========================

document.getElementById("logoutBtn").addEventListener("click", async () => {

    try {

        await signOut(auth);

    } catch (error) {

        console.error("Logout error:", error);

    }

});


// =========================
// ADD / UPDATE PRODUCT
// =========================

productForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!auth.currentUser) {

        productMessage.textContent = "Please sign in again.";
        return;

    }

    const name = document.getElementById("productName").value.trim();

    const price = Number(
        document.getElementById("productPrice").value
    );

    const category = document.getElementById("productCategory").value.trim();

    const image = document.getElementById("productImage").value.trim();


    if (!name || !category || !Number.isFinite(price) || price < 0) {

        productMessage.textContent =
            "Please enter valid product details.";

        return;

    }


    const product = {

        name: name,
        price: price,
        category: category,
        image: image,
        updatedAt: new Date().toISOString()

    };


    saveProductBtn.disabled = true;

    productMessage.textContent =
        editingId ? "Updating product..." : "Adding product...";


    try {

        if (editingId) {

            // UPDATE PRODUCT

            await updateDoc(
                doc(db, "Product", editingId),
                product
            );

            productMessage.textContent =
                "Product updated successfully!";

        } else {

            // ADD PRODUCT

            product.createdAt = new Date().toISOString();

            await addDoc(
                collection(db, "Product"),
                product
            );

            productMessage.textContent =
                "Product added successfully!";

        }


        resetForm();

        await loadProducts();


    } catch (error) {

        console.error("Product error:", error);

        productMessage.textContent =
            "Could not save product. Check Firestore rules.";

    } finally {

        saveProductBtn.disabled = false;

    }

});


// =========================
// RESET PRODUCT FORM
// =========================

function resetForm() {

    editingId = null;

    productForm.reset();

    formHeading.textContent = "Add New Product";

    saveProductBtn.textContent = "Add Product";

    cancelEditBtn.classList.add("hidden");

}


cancelEditBtn.addEventListener("click", resetForm);


// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

    productList.textContent = "Loading products...";

    try {

        const snapshot = await getDocs(
            collection(db, "Product")
        );

        totalProducts.textContent = snapshot.size;

        productList.innerHTML = "";


        if (snapshot.empty) {

            productList.textContent =
                "No products found. Add your first product!";

            return;

        }


        snapshot.forEach(item => {

            const product = item.data();

            const row = document.createElement("article");

            row.className = "admin-product";


            // PRODUCT IMAGE

            if (product.image) {

                const img = document.createElement("img");

                img.src = product.image;

                img.alt = product.name || "Product";

                img.onerror = () => {

                    const placeholder = document.createElement("div");

                    placeholder.className = "admin-placeholder";

                    placeholder.textContent = "StyleFashion";

                    img.replaceWith(placeholder);

                };

                row.appendChild(img);

            } else {

                const placeholder = document.createElement("div");

                placeholder.className = "admin-placeholder";

                placeholder.textContent = "StyleFashion";

                row.appendChild(placeholder);

            }


            // PRODUCT DETAILS

            const info = document.createElement("div");

            info.className = "admin-product-info";


            const name = document.createElement("strong");

            name.textContent = product.name || "Untitled Product";


            const details = document.createElement("span");

            details.textContent =
                `${product.category || "Uncategorised"} · ₹${Number(product.price || 0).toLocaleString("en-IN")}`;


            info.append(name, details);


            // ACTION BUTTONS

            const actions = document.createElement("div");

            actions.className = "item-actions";


            // EDIT BUTTON

            const editButton = document.createElement("button");

            editButton.textContent = "Edit";

            editButton.type = "button";


            editButton.addEventListener("click", () => {

                editingId = item.id;

                document.getElementById("productName").value =
                    product.name || "";

                document.getElementById("productPrice").value =
                    product.price ?? "";

                document.getElementById("productCategory").value =
                    product.category || "";

                document.getElementById("productImage").value =
                    product.image || "";


                formHeading.textContent = "Edit Product";

                saveProductBtn.textContent = "Save Changes";

                cancelEditBtn.classList.remove("hidden");

                productMessage.textContent = "";

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            });


            // DELETE PRODUCT BUTTON

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";

            deleteButton.type = "button";

            deleteButton.className = "delete-btn";


            deleteButton.addEventListener("click", async () => {

                const confirmDelete = confirm(
                    `Delete ${product.name || "this product"}?`
                );

                if (!confirmDelete) return;


                try {

                    await deleteDoc(
                        doc(db, "Product", item.id)
                    );

                    if (editingId === item.id) {

                        resetForm();

                    }

                    await loadProducts();

                } catch (error) {

                    console.error(error);

                    productMessage.textContent =
                        "Could not delete product. Check Firestore rules.";

                }

            });


            actions.append(editButton, deleteButton);

            row.append(info, actions);

            productList.appendChild(row);

        });


    } catch (error) {

        console.error("Loading error:", error);

        totalProducts.textContent = "—";

        productList.textContent =
            "Unable to load products. Check Firebase connection and rules.";

    }

}


// =========================
// LOAD CUSTOMER REVIEWS
// =========================

async function loadReviews() {

    adminReviews.textContent = "Loading reviews...";

    reviewAdminMessage.textContent = "";

    try {

        // GET ALL PRODUCTS

        const productSnapshot = await getDocs(
            collection(db, "Product")
        );

        const productNames = {};

        productSnapshot.forEach(item => {

            productNames[item.id] =
                item.data().name || "Unknown Product";

        });


        // GET ALL REVIEWS

        const reviewSnapshot = await getDocs(
            collection(db, "Reviews")
        );

        adminReviews.innerHTML = "";


        if (reviewSnapshot.empty) {

            adminReviews.textContent = "No customer reviews yet.";

            return;

        }


        const reviews = [];

        reviewSnapshot.forEach(item => {

            reviews.push({

                id: item.id,
                ...item.data()

            });

        });


        // LATEST REVIEWS FIRST

        reviews.reverse();


        // DISPLAY REVIEWS

        reviews.forEach(review => {

            const card = document.createElement("article");

            card.className = "admin-review";


            // CUSTOMER NAME

            const customer = document.createElement("strong");

            customer.textContent =
                review.customerName || "Anonymous";


            // PRODUCT NAME

            const product = document.createElement("p");

            product.textContent =
                "Product: " +
                (productNames[review.productId] || "Unknown Product");


            // RATING

            const rating = document.createElement("p");

            const stars = Math.max(
                0,
                Math.min(5, Number(review.rating) || 0)
            );

            rating.textContent =
                "Rating: " + "★".repeat(stars);


            // REVIEW TEXT

            const reviewText = document.createElement("p");

            reviewText.textContent =
                review.review || "No review text";


            // REVIEW DATE

            const date = document.createElement("small");

            if (review.createdAt?.toDate) {

                date.textContent =
                    review.createdAt.toDate().toLocaleDateString("en-IN");

            } else {

                date.textContent = "Date unavailable";

            }


            // DELETE REVIEW BUTTON

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";

            deleteButton.textContent = "Delete Review";

            deleteButton.className = "delete-btn";


            deleteButton.addEventListener("click", async () => {

                const confirmDelete = confirm(
                    "Are you sure you want to delete this review?"
                );

                if (!confirmDelete) return;


                deleteButton.disabled = true;

                deleteButton.textContent = "Deleting...";


                try {

                    await deleteDoc(
                        doc(db, "Reviews", review.id)
                    );


                    // REMOVE REVIEW FROM PAGE

                    card.remove();

                    reviewAdminMessage.textContent =
                        "Review deleted successfully!";


                    // CHECK IF NO REVIEWS LEFT

                    if (!adminReviews.children.length) {

                        adminReviews.textContent =
                            "No customer reviews yet.";

                    }

                } catch (error) {

                    console.error("Review delete error:", error);

                    reviewAdminMessage.textContent =
                        "Could not delete review. Check Firestore rules.";

                    deleteButton.disabled = false;

                    deleteButton.textContent = "Delete Review";

                }

            });


            // ADD ELEMENTS TO CARD

            card.append(
                customer,
                product,
                rating,
                reviewText,
                date,
                deleteButton
            );


            adminReviews.appendChild(card);

        });


    } catch (error) {

        console.error("Review loading error:", error);

        adminReviews.textContent =
            "Unable to load reviews. Check Firebase rules.";

    }

}
