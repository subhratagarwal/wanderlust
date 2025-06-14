const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");

// Show all listings, with search and category filter support
module.exports.index = async (req, res) => {
    const { search, category } = req.query;
    let filter = {};

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } }
        ];
    }

    if (category) {
        filter.category = category;
    }

    // --- DEBUG LOGGING ---
    try {
        const listings = await Listing.find(filter);
        console.log("DEBUG: Listings found:", listings.length);
        if (listings.length > 0) {
            listings.forEach((l, i) => {
                console.log(`Listing ${i + 1}:`, {
                    title: l.title,
                    category: l.category,
                    _id: l._id
                });
            });
        } else {
            console.log("DEBUG: No listings matched the filter:", filter);
        }
        res.render("listings/index.ejs", { listings, category, search });
    } catch (err) {
        console.error("ERROR fetching listings:", err);
        res.render("listings/index.ejs", { listings: [], category, search });
    }
};

// Render the form to create a new listing
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// Create a new listing (with detailed logging)
module.exports.createListing = async (req, res, next) => {
    console.log("BODY:", req.body);   // Log request body
    console.log("FILE:", req.file);   // Log uploaded file
    try {
        const newListing = new Listing(req.body.listing);

        // --- PATCH: Add default geometry (e.g., Rajasthan, India) ---
        newListing.geometry = {
            type: "Point",
            coordinates: [74.2179, 27.0238] // [longitude, latitude]
        };
        // ---------------------------------------------------------------

        // Handle uploaded file (Multer + Cloudinary)
        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        } else {
            newListing.image = {
                url: '/images/default.jpg',
                filename: 'default'
            };
        }

        newListing.owner = req.user._id;
        await newListing.save();
        req.flash("success", "New listing created!");
        res.redirect("/listings");
    } catch (err) {
        console.log("MONGOOSE ERROR:", err); // Log Mongoose errors
        next(err);
    }
};

// Show a single listing (POPULATE reviews and authors!)
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

// Render the edit form for a listing
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};

// Update a listing
module.exports.updateListing = async (req, res, next) => {
    const { id } = req.params;
    try {
        const listing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
            await listing.save();
        }
        req.flash("success", "Listing updated!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        console.log("MONGOOSE ERROR:", err);
        next(err);
    }
};

// Delete a listing
module.exports.destroyListing = async (req, res, next) => {
    const { id } = req.params;
    try {
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing deleted!");
        res.redirect("/listings");
    } catch (err) {
        console.log("MONGOOSE ERROR:", err);
        next(err);
    }
};
