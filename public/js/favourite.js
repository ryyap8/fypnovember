async function loadFavourites() {

    try {

        const response = await fetch("/favourites");

        const favourites = await response.json();


        const container =
            document.getElementById("favouriteContainer");


        container.innerHTML = "";


        // ==========================
        // No Favourites
        // ==========================

        if (favourites.length === 0) {

            container.innerHTML = `

                <div class="empty-fav-box">

                    <h2>No favourite restaurants yet</h2>

                    <p>
                        Start exploring and add your favourite restaurants
                    </p>

                    <a
                        href="index.html"
                        class="discover-btn"
                    >
                        Discover Restaurants
                    </a>

                </div>

            `;

            return;

        }


        // ==========================
        // Display Favourites
        // ==========================

        favourites.forEach(item => {

            const restaurant = item.restaurantId;


            // Safety check
            if (!restaurant) {
                return;
            }


            container.innerHTML += `

                <a
                    href="restaurant-details.html?id=${restaurant._id}"
                    class="food-card-link"
                >

                    <div class="card">

                        <!-- Restaurant Image -->
                        <img
                            src="${restaurant.image || ""}"
                            alt="${restaurant.restaurantName || "Restaurant"}"
                        >


                        <div class="card-content">

                            <!-- Restaurant Name -->
                            <div class="title-row">

                                <h2>
                                    ${restaurant.restaurantName || ""}
                                    ${restaurant.branch || ""}
                                </h2>

                            </div>


                            <!-- Rating -->
                            <div class="rating">

                                <i class="fa-solid fa-star"></i>

                                ${Number(
                                    restaurant.averageRating || 0
                                ).toFixed(1)}

                                (${restaurant.totalRatings || 0})

                            </div>


                            <!-- Description -->
                            <p class="description">

                                ${
                                    restaurant.restaurantDescription ||
                                    ""
                                }

                            </p>


                            <!-- Location + Cuisine -->
                            <div class="info-row">


                                <div class="location">

                                    <i class="fa-solid fa-location-dot"></i>

                                    ${
                                        restaurant.location ||
                                        ""
                                    }

                                </div>


                                <div
                                    class="tag ${
                                        restaurant.cuisine
                                            ? restaurant.cuisine
                                                .toLowerCase()
                                                .trim()
                                            : ""
                                    }"
                                >

                                    ${
                                        restaurant.cuisine ||
                                        ""
                                    }

                                </div>


                            </div>


                        </div>

                    </div>

                </a>

            `;

        });

    }
    catch (err) {

        console.error(
            "Error loading favourites:",
            err
        );

    }

}


loadFavourites();