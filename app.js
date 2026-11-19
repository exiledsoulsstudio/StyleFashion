
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// Firebase connection
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// HTML elements
const productGrid = document.getElementById("productGrid");
const shopStatus = document.getElementById("shopStatus");
const searchInput = document.getElementById("searchInput");
const categoryFilters = document.getElementById("categoryFilters");

let products = [];
let selectedCategory = "all";

document.getElementById("year").textContent =
    new Date().getFullYear();


// Load products from Firebase
async function loadProducts() {

    shopStatus.textContent = "Loading products...";

    try {

        const snapshot = await getDocs(
            collection(db, "Product")
        );

        products = snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        renderCategories();
        renderProducts();

    } catch (error) {

        console.error("Firebase Error:", error);

        shopStatus.textContent =
            "Unable to load products. Please try again.";

    }
}


// Display categories
function renderCategories() {

    categoryFilters.innerHTML = "";

    const categories = [
        "all",
        ...new Set(
            products.map(product => product.category)
                .filter(Boolean)
        )
    ];

    categories.forEach(category => {

        const button = document.createElement("button");

        button.className =
            "filter-btn" +
            (selectedCategory === category ? " active" : "");

        button.textContent =
            category === "all" ? "All" : category;

        button.addEventListener("click", () => {

            selectedCategory = category;

            renderCategories();
            renderProducts();

        });

        categoryFilters.appendChild(button);

    });

}


// Display products
function renderProducts() {

    productGrid.innerHTML = "";

    const searchTerm =
        searchInput.value.trim().toLowerCase();

    const filteredProducts = products.filter(product => {

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const matchesSearch =
            (product.name || "").toLowerCase().includes(searchTerm);

        return matchesCategory && matchesSearch;

    });


    if (filteredProducts.length === 0) {

        shopStatus.textContent = "No products found.";

        return;

    }


    shopStatus.textContent =
        `${filteredProducts.length} products available`;


    filteredProducts.forEach(product => {

        // Clickable product card
        const card = document.createElement("a");

        card.className = "product-card";

        card.href =
            `product.html?id=${encodeURIComponent(product.id)}`;

        card.setAttribute(
            "aria-label",
            `View details for ${product.name || "product"}`
        );


        // Product image
        if (product.image) {

            const image = document.createElement("img");

            image.src = product.image;
            image.alt = product.name || "Product";
            image.className = "product-image";

            image.onerror = () => {

                const placeholder = createPlaceholder();

                image.replaceWith(placeholder);

            };

            card.appendChild(image);

        } else {

            card.appendChild(createPlaceholder());

        }


        // Product information
        const info = document.createElement("div");

        info.className = "product-info";


        const category = document.createElement("p");

        category.className = "product-category";
        category.textContent = product.category || "Collection";


        const name = document.createElement("h3");

        name.textContent = product.name || "Untitled Product";


        const price = document.createElement("p");

        price.className = "product-price";

        price.textContent =
            "₹" + Number(product.price || 0).toLocaleString("en-IN");


        info.append(category, name, price);

        card.appendChild(info);

        productGrid.appendChild(card);

    });

}


// Placeholder if image is unavailable
function createPlaceholder() {

    const placeholder = document.createElement("div");

    placeholder.className = "product-placeholder";

    placeholder.textContent = "StyleFashion";

    return placeholder;

}


// Search functionality
searchInput.addEventListener("input", renderProducts);


// Start website
loadProducts();
