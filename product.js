
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDoc,
    getDocs,
    doc,
    addDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// =====================================
// FIREBASE CONNECTION
// =====================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// =====================================
// HTML ELEMENTS
// =====================================

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

const orderButton = document.getElementById("addToCart");
const productMessage = document.getElementById("productMessage");

const relatedProducts = document.getElementById("relatedProducts");

const customerName = document.getElementById("customerName");
const customerReview = document.getElementById("customerReview");
const starInput = document.getElementById("starInput");
const submitReview = document.getElementById("submitReview");
const reviewMessage = document.getElementById("reviewMessage");

const averageRating = document.getElementById("averageRating");
const reviewStars = document.getElementById("reviewStars");
const totalReviews = document.getElementById("totalReviews");
const reviewsList = document.getElementById("reviewsList");


// Footer year
document.getElementById("year").textContent =
    new Date().getFullYear();


// =====================================
// VARIABLES
// =====================================

let currentProduct = null;
let quantity = 1;
let selectedSize = "";
let selectedColor = "";
let selectedRating = 0;

const phoneNumber = "9923589198";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");


// =====================================
// LOAD PRODUCT
// =====================================

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

        await Promise.all([
            loadRelatedProducts(),
            loadReviews()
        ]);

    } catch (error) {

        console.error("Product loading error:", error);
        showError("Unable to load product. Please try again.");

    }

}


// =====================================
// DISPLAY PRODUCT
// =====================================

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


    if (currentProduct.image) {

        productImage.src = currentProduct.image;
        productImage.alt = currentProduct.name || "Product";
        productImage.style.display = "block";

        productImage.onerror = () => {
            productImage.style.display = "none";
        };

    } else {

        productImage.style.display = "none";

    }


    displayOptions(
        sizeOptions,
        currentProduct.sizes,
        ["S", "M", "L", "XL"],
        "size"
    );

    displayOptions(
        colorOptions,
        currentProduct.colors,
        ["Default"],
        "color"
    );

}


// =====================================
// SIZE AND COLOUR OPTIONS
// =====================================

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


// =====================================
// QUANTITY CONTROLS
// =====================================

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


// =====================================
// WHATSAPP ORDERING
// =====================================

orderButton.textContent = "ORDER ON WHATSAPP ↗";

orderButton.addEventListener("click", () => {

    if (!currentProduct) return;

    const productLink = window.location.href;

    const totalPrice =
        Number(currentProduct.price || 0) * quantity;

    const message = `
Hello StyleFashion! I want to place an order.

PRODUCT DETAILS

Product: ${currentProduct.name || "Product"}

Category: ${currentProduct.category || "Collection"}

Price: ₹${Number(currentProduct.price || 0).toLocaleString("en-IN")}

Size: ${selectedSize || "Not selected"}

Colour: ${selectedColor || "Not selected"}

Quantity: ${quantity}

Total: ₹${totalPrice.toLocaleString("en-IN")}

Product Link: ${productLink}

Please confirm product availability and delivery details.

Thank you!
`;

    const whatsappURL =
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, "_blank");

});


// =====================================
// STAR RATING SELECTION
// =====================================

starInput.querySelectorAll("button").forEach(button => {

    button.addEventListener("click", () => {

        selectedRating = Number(button.dataset.rating);

        starInput.querySelectorAll("button").forEach(star => {

            const rating = Number(star.dataset.rating);

            star.textContent =
                rating <= selectedRating ? "★" : "☆";

            star.classList.toggle(
                "active",
                rating <= selectedRating
            );

        });

    });

});


// =====================================
// SUBMIT CUSTOMER REVIEW
// =====================================

submitReview.addEventListener("click", async () => {

    if (!currentProduct) return;

    const name = customerName.value.trim();
    const review = customerReview.value.trim();

    if (!name) {
        reviewMessage.textContent = "Please enter your name.";
        return;
    }

    if (name.length > 50) {
        reviewMessage.textContent = "Name must be under 50 characters.";
        return;
    }

    if (selectedRating === 0) {
        reviewMessage.textContent = "Please select a star rating.";
        return;
    }

    if (!review) {
        reviewMessage.textContent = "Please write a review.";
        return;
    }

    if (review.length > 500) {
        reviewMessage.textContent = "Review must be under 500 characters.";
        return;
    }

    submitReview.disabled = true;
    reviewMessage.textContent = "Submitting your review...";

    try {

        await addDoc(collection(db, "Reviews"), {

            productId: currentProduct.id,
            customerName: name,
            rating: selectedRating,
            review: review,
            createdAt: serverTimestamp()

        });

        reviewMessage.textContent =
            "Thank you! Your review has been submitted.";

        customerName.value = "";
        customerReview.value = "";

        selectedRating = 0;

        starInput.querySelectorAll("button").forEach(star => {

            star.textContent = "☆";
            star.classList.remove("active");

        });

        await loadReviews();

    } catch (error) {

        console.error("Review submission error:", error);

        reviewMessage.textContent =
            "Unable to submit review. Please try again.";

    } finally {

        submitReview.disabled = false;

    }

});


// =====================================
// LOAD CUSTOMER REVIEWS
// =====================================

async function loadReviews() {

    try {

        const reviewQuery = query(
            collection(db, "Reviews"),
            where("productId", "==", currentProduct.id)
        );

        const snapshot = await getDocs(reviewQuery);

        const reviews = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        reviews.sort((a, b) => {

            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;

            return dateB - dateA;

        });

        displayReviews(reviews);

    } catch (error) {

        console.error("Review loading error:", error);

        reviewsList.textContent =
            "Unable to load reviews.";

    }

}


// =====================================
// DISPLAY CUSTOMER REVIEWS
// =====================================

function displayReviews(reviews) {

    reviewsList.innerHTML = "";

    if (reviews.length === 0) {

        averageRating.textContent = "0.0";
        reviewStars.textContent = "☆☆☆☆☆";
        totalReviews.textContent = "No reviews yet";

        const message = document.createElement("p");

        message.textContent =
            "Be the first to review this product!";

        reviewsList.appendChild(message);

        document.getElementById("productRating").textContent =
            "☆☆☆☆☆";

        document.getElementById("reviewCount").textContent =
            "No reviews yet";

        return;

    }


    // Calculate average rating

    const totalRating = reviews.reduce(
        (sum, item) => sum + Number(item.rating || 0),
        0
    );

    const average = totalRating / reviews.length;
    const roundedAverage = Math.round(average);

    const stars =
        "★".repeat(roundedAverage) +
        "☆".repeat(5 - roundedAverage);


    averageRating.textContent = average.toFixed(1);
    reviewStars.textContent = stars;

    totalReviews.textContent =
        `${reviews.length} customer review${reviews.length === 1 ? "" : "s"}`;

    document.getElementById("productRating").textContent = stars;

    document.getElementById("reviewCount").textContent =
        `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;


    // Display individual reviews

    reviews.forEach(item => {

        const card = document.createElement("div");
        card.className = "review-card";

        const name = document.createElement("h4");
        name.textContent = item.customerName || "Customer";

        const rating = document.createElement("p");
        rating.className = "review-stars";

        const validRating = Math.min(
            5,
            Math.max(0, Number(item.rating) || 0)
        );

        rating.textContent =
            "★".repeat(validRating) +
            "☆".repeat(5 - validRating);

        const reviewText = document.createElement("p");
        reviewText.textContent = item.review || "";

        card.append(name, rating, reviewText);

        reviewsList.appendChild(card);

    });

}


// =====================================
// RELATED PRODUCTS
// =====================================

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

                image.onerror = () => {

                    const placeholder = document.createElement("div");

                    placeholder.className = "product-placeholder";
                    placeholder.textContent = "StyleFashion";

                    image.replaceWith(placeholder);

                };

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


// =====================================
// ERROR HANDLING
// =====================================

function showError(message) {

    productName.textContent = message;
    productDescription.textContent = "";
    productPrice.textContent = "";

    orderButton.disabled = true;

}


// =====================================
// START WEBSITE
// =====================================

loadProduct();
