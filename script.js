
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDoc,
    getDocs,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// HTML ELEMENTS
const productImage = document.getElementById("productImage");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productCategory = document.getElementById("productCategory");
const productDescription = document.getElementById("productDescription");

const breadcrumbName = document.getElementById("breadcrumbName");

const sizeOptions = document.getElementById("sizeOptions");
const colorOptions = document.getElementById("colorOptions");

const quantityDisplay = document.getElementById("quantity");
const decreaseQty = document.getElementById("decreaseQty");
const increaseQty = document.getElementById("increaseQty");

const addToCart = document.getElementById("addToCart");
const productMessage = document.getElementById("productMessage");

const relatedProducts = document.getElementById("relatedProducts");

document.getElementById("year").textContent =
    new Date().getFullYear();


// PRODUCT VARIABLES
let currentProduct = null;
let quantity = 1;
let selectedSize = "";
let selectedColor = "";


// GET PRODUCT ID FROM URL
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");


// LOAD PRODUCT
async function loadProduct() {

    if (!productId) {
        showError("Product not found.");
        return;
    }

    try {

        const productRef = doc(db, "Product", productId);
        const productSnapshot = await getDoc(productRef);

        if (!productSnapshot.exists()) {
            showError("This product is no longer available.");
            return;
        }

        currentProduct = {
            id: productSnapshot.id,
            ...productSnapshot.data()
        };

        displayProduct();
        loadRelatedProducts();

    } catch (error) {

        console.error("Product loading error:", error);
        showError("Unable to load product. Please try again.");

    }
}


// DISPLAY PRODUCT
function displayProduct() {

    productName.textContent =
        currentProduct.name || "Untitled Product";

    productCategory.textContent =
        currentProduct.category || "Collection";

    productPrice.textContent =
        "₹" + Number(currentProduct.price || 0).toLocaleString("en-IN");

    productDescription.textContent =
        currentProduct.description ||
        "Discover this beautiful piece from our collection.";

    breadcrumbName.textContent =
        currentProduct.name || "Product";

    document.title =
        `${currentProduct.name || "Product"} | StyleFashion`;


    // PRODUCT IMAGE
    if (currentProduct.image) {

        productImage.src = currentProduct.image;
        productImage.alt = currentProduct.name || "Product";

        productImage.onerror = () => {
            productImage.style.display = "none";
        };

    } else {

        productImage.style.display = "none";

    }


    // OPTIONAL SIZES
    displayOptions(
        sizeOptions,
        currentProduct.sizes,
        ["S", "M", "L", "XL"],
        "size"
    );


    // OPTIONAL COLOURS
    displayOptions(
        colorOptions,
        currentProduct.colors,
        ["Default"],
        "color"
    );

}


// DISPLAY SIZE AND COLOUR OPTIONS
function displayOptions(container, savedOptions, fallbackOptions, type) {

    container.innerHTML = "";

    const options =
        Array.isArray(savedOptions) && savedOptions.length
            ? savedOptions
            : fallbackOptions;

    options.forEach(option => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "option-btn";
        button.textContent = option;

        button.addEventListener("click", () => {

            container.querySelectorAll(".option-btn")
                .forEach(item => item.classList.remove("selected"));

            button.classList.add("selected");

            if (type === "size") {
                selectedSize = option;
            }

            if (type === "color") {
                selectedColor = option;
            }

        });

        container.appendChild(button);

    });

}


// QUANTITY CONTROLS
decreaseQty.addEventListener("click", () => {

    if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = quantity;
    }

});

increaseQty.addEventListener("click", () => {

    quantity++;
    quantityDisplay.textContent = quantity;

});


// ADD TO CART
addToCart.addEventListener("click", () => {

    if (!currentProduct) return;

    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name || "Product",
        price: Number(currentProduct.price || 0),
        image: currentProduct.image || "",
        quantity: quantity,
        size: selectedSize,
        color: selectedColor
    };

    try {

        const cart = JSON.parse(
            localStorage.getItem("styleFashionCart") || "[]"
        );

        const existingItem = cart.find(item =>
            item.id === cartItem.id &&
            item.size === cartItem.size &&
            item.color === cartItem.color
        );

        if (existingItem) {

            existingItem.quantity += quantity;

        } else {

            cart.push(cartItem);

        }

        localStorage.setItem(
            "styleFashionCart",
            JSON.stringify(cart)
        );

        productMessage.textContent =
            "Product added to your cart!";

    } catch (error) {

        console.error("Cart error:", error);

        productMessage.textContent =
            "Unable to add product to cart.";

    }

});


// RELATED PRODUCTS
async function loadRelatedProducts() {

    try {

        const snapshot = await getDocs(
            collection(db, "Product")
        );

        const allProducts = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        const related = allProducts
            .filter(item =>
                item.id !== currentProduct.id &&
                item.category === currentProduct.category
            )
            .slice(0, 3);

        relatedProducts.innerHTML = "";

        related.forEach(product => {

            const card = document.createElement("a");

            card.className = "product-card";

            card.href =
                `product.html?id=${encodeURIComponent(product.id)}`;


            if (product.image) {

                const image = document.createElement("img");

                image.src = product.image;
                image.alt = product.name || "Product";
                image.className = "product-image";

                card.appendChild(image);

            } else {

                const placeholder = document.createElement("div");

                placeholder.className = "product-placeholder";
                placeholder.textContent = "StyleFashion";

                card.appendChild(placeholder);

            }


            const info = document.createElement("div");

            info.className = "product-info";

            const category = document.createElement("p");

            category.className = "product-category";
            category.textContent = product.category || "Collection";

            const name = document.createElement("h3");

            name.textContent = product.name || "Product";

            const price = document.createElement("p");

            price.className = "product-price";
            price.textContent =
                "₹" + Number(product.price || 0).toLocaleString("en-IN");

            info.append(category, name, price);

            card.appendChild(info);

            relatedProducts.appendChild(card);

        });

    } catch (error) {

        console.error("Related products error:", error);

    }

}


// ERROR MESSAGE
function showError(message) {

    productName.textContent = message;
    productDescription.textContent = "";
    productPrice.textContent = "";

    addToCart.disabled = true;

}


// START
loadProduct();
